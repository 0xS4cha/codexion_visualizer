import type { LogEntry } from "@/core/parseCodexionLog";
import {
    parseCodexionLog,
    getCoderIds,
} from "@/core/parseCodexionLog";

export interface Segment {
    startTime: number;
    endTime: number;
    action: string;
    realStart: number;
    realEnd: number;
}

export interface DongleSegment {
    startTime: number;
    endTime: number;
    ownerId: number | null;
    status: 'free' | 'taken' | 'cooldown';
    realStart: number;
    realEnd: number;
}

export interface SimulationIssue {
    type: 'warning' | 'error';
    message: string;
    timestamp?: number;
    coderId?: number;
    dongleId?: number;
}

export const ACTION_COLORS: Record<string, string> = {
    "has taken a dongle": "rgba(251, 191, 36, 0.9)",
    "is compiling": "rgba(96, 165, 250, 0.9)",
    "is debugging": "rgba(167, 139, 250, 0.9)",
    "is refactoring": "rgba(52, 211, 153, 0.9)",
    "burned out": "rgba(248, 113, 113, 0.9)",
    "unknow action": "rgba(156, 163, 175, 0.5)",
    "cooldown": "rgba(107, 114, 128, 0.5)"
};

export function getActionName(action: string): string {
    return ACTION_COLORS[action] != undefined ? action : 'unknow action'
}

export function getActionColor(action: string): string {
    return ACTION_COLORS[getActionName(action)];
}

function interpolate(v: number, vKeys: number[], rValues: number[]): number {
    if (vKeys.length === 0) return 0;
    if (v <= vKeys[0]) return rValues[0];
    if (v >= vKeys[vKeys.length - 1]) return rValues[rValues.length - 1];

    let i = 0;
    while (i < vKeys.length - 1 && vKeys[i + 1] <= v) {
        i++;
    }

    const v0 = vKeys[i];
    const v1 = vKeys[i + 1];
    const r0 = rValues[i];
    const r1 = rValues[i + 1];

    if (v1 === v0) return r0;

    const t = (v - v0) / (v1 - v0);
    return Math.round(r0 + t * (r1 - r0));
}



class TimeMapper {
    private visualMap = new Map<number, number>();
    private visualKeys: number[] = [];
    private realValues: number[] = [];
    private currentVisual = 0;

    constructor(
        private sortedTimestamps: number[],
        private countsPerTimeAndCoder: Map<number, Map<number, number>>,
        private instantDuration: number
    ) {}

    public async build(yieldIfNeeded: () => Promise<void>) {
        if (this.sortedTimestamps.length > 0) {
            this.visualMap.set(this.sortedTimestamps[0], 0);
            this.visualKeys.push(0);
            this.realValues.push(this.sortedTimestamps[0]);
        }

        for (let i = 0; i < this.sortedTimestamps.length - 1; i++) {
            await yieldIfNeeded();
            const tCurr = this.sortedTimestamps[i];
            const tNext = this.sortedTimestamps[i + 1];
            const realDelta = tNext - tCurr;

            let maxStack = 0;
            const countsMap = this.countsPerTimeAndCoder.get(tCurr);
            if (countsMap) {
                for (const count of countsMap.values()) {
                    maxStack = Math.max(maxStack, count * this.instantDuration);
                }
            }

            const visualDelta = Math.max(realDelta, maxStack);
            this.currentVisual += visualDelta;
            this.visualMap.set(tNext, this.currentVisual);
            this.visualKeys.push(this.currentVisual);
            this.realValues.push(tNext);
        }
    }

    public getVisualTime(realT: number): number {
        return this.visualMap.get(realT)!;
    }

    public finalize(globalMaxTime: number) {
        if (this.sortedTimestamps.length > 0) {
            this.visualKeys.push(globalMaxTime);
            const lastReal = this.sortedTimestamps[this.sortedTimestamps.length - 1];
            const lastVisual = this.visualMap.get(lastReal)!;
            this.realValues.push(lastReal + (globalMaxTime - lastVisual));
        }
    }

    public getInterpolator() {
        return (v: number) => interpolate(v, this.visualKeys, this.realValues);
    }
}

class CoderSegmentBuilder {
    public segments = new Map<number, Segment[]>();
    public globalMaxTime = 0;

    constructor(
        private byCoder: Map<number, LogEntry[]>,
        private timeMapper: TimeMapper,
        private instantDuration: number,
        private timeToRefactor?: number,
        private lastSegmentDuration: number = 50
    ) {}

    public build() {
        for (const [coderId, evts] of this.byCoder) {
            const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
            const segs: Segment[] = [];
            let currentVisualEnd = 0;

            for (let i = 0; i < sorted.length; i++) {
                const entry = sorted[i];
                const realT = entry.timestamp;
                const visualStartBase = this.timeMapper.getVisualTime(realT);

                let start = visualStartBase;
                if (i > 0 && sorted[i - 1].timestamp === realT) {
                    start = Math.max(start, currentVisualEnd);
                }

                let end;
                let actualRealEnd;

                if (entry.action === "is refactoring" && this.timeToRefactor) {
                    actualRealEnd = realT + this.timeToRefactor;
                    end = this.timeMapper.getVisualTime(actualRealEnd);
                } else if (i + 1 < sorted.length) {
                    const nextEntry = sorted[i + 1];
                    actualRealEnd = nextEntry.timestamp;

                    if (nextEntry.timestamp === realT) {
                        end = start + this.instantDuration;
                    } else {
                        const nextVisualBase = this.timeMapper.getVisualTime(nextEntry.timestamp);
                        end = Math.max(nextVisualBase, start + this.instantDuration);
                    }
                } else {
                    end = start + Math.max(this.lastSegmentDuration, this.instantDuration);
                    actualRealEnd = realT + this.lastSegmentDuration;
                }

                if (end > this.globalMaxTime) {
                    this.globalMaxTime = end;
                }

                segs.push({ startTime: start, endTime: end, action: entry.action, realStart: realT, realEnd: actualRealEnd });
                currentVisualEnd = end;
            }
            this.segments.set(coderId, segs);
        }
    }
}

class DongleSegmentBuilder {
    public dongleSegments = new Map<number, DongleSegment[]>();
    private dongleStatus: { owner: number | null, cooldownEnd: number }[];
    private coderHeldCount = new Map<number, number>();
    private lastCompileStart = new Map<number, number>();

    constructor(
        private numCoders: number,
        private coderIndexById: Map<number, number>,
        private timeMapper: TimeMapper,
        private dongleCooldown: number,
        private timeToBurnout: number,
        private issues: SimulationIssue[]
    ) {
        for (let i = 1; i <= numCoders; i++) this.dongleSegments.set(i, []);
        this.dongleStatus = new Array(numCoders + 1).fill(null).map(() => ({
            owner: null,
            cooldownEnd: 0,
        }));
    }

    public async build(entries: LogEntry[], yieldIfNeeded: () => Promise<void>) {
        const sortedEntries = [...entries].sort((a, b) => {
            if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
            if (a.action.includes("taken") && !b.action.includes("taken")) return -1;
            if (!a.action.includes("taken") && b.action.includes("taken")) return 1;
            return 0;
        });

        for (let index = 0; index < sortedEntries.length; index++) {
            const entry = sortedEntries[index];
            await yieldIfNeeded();
            const coderId = entry.coderId;
            const realT = entry.timestamp;
            const visualT = this.timeMapper.getVisualTime(realT);

            if (entry.action === "has taken a dongle") {
                const coderIndex = this.coderIndexById.get(coderId) ?? 0;
                
                const rightDongleIdx = coderIndex + 1;
                const leftDongleIdx = coderIndex === 0 ? this.numCoders : coderIndex ?? 0;

                let targetDongle = 0;
                const count = this.coderHeldCount.get(coderId) || 0;
                if (count === 0) {
                    const leftOwner = this.dongleStatus[leftDongleIdx].owner;
                    const rightOwner = this.dongleStatus[rightDongleIdx].owner;

                    if (leftOwner === null) {
                        targetDongle = leftDongleIdx;
                    } else if (rightOwner === null) {
                        targetDongle = rightDongleIdx;
                    }
                } else if (count === 1) {
                    if (this.dongleStatus[leftDongleIdx].owner === coderId) targetDongle = rightDongleIdx;
                    else targetDongle = leftDongleIdx;
                }

                if (targetDongle > 0) {
                    const dSegs = this.dongleSegments.get(targetDongle)!;
                    if (dSegs.length > 0) {
                        dSegs[dSegs.length - 1].endTime = visualT;
                        dSegs[dSegs.length - 1].realEnd = realT;
                    }
                    dSegs.push({
                        startTime: visualT,
                        endTime: visualT + 1000000,
                        ownerId: coderId,
                        status: 'taken',
                        realStart: realT,
                        realEnd: realT + 1000000
                    });
                    this.dongleStatus[targetDongle].owner = coderId;
                    this.coderHeldCount.set(coderId, count + 1);
                }
            } else if (entry.action === "is compiling") {
                this.lastCompileStart.set(coderId, realT);
            } else if (entry.action === "is debugging") {
                for (let dIdx = 1; dIdx <= this.numCoders; dIdx++) {
                    if (this.dongleStatus[dIdx].owner === coderId) {
                        const dSegs = this.dongleSegments.get(dIdx)!;
                        if (dSegs.length > 0) {
                            dSegs[dSegs.length - 1].endTime = visualT;
                            dSegs[dSegs.length - 1].realEnd = realT;
                        }
                        const cooldownRealEnd = realT + this.dongleCooldown;
                        dSegs.push({
                            startTime: visualT,
                            endTime: visualT + 1000000,
                            ownerId: null,
                            status: 'cooldown',
                            realStart: realT,
                            realEnd: cooldownRealEnd
                        });

                        this.dongleStatus[dIdx].owner = null;
                        this.dongleStatus[dIdx].cooldownEnd = cooldownRealEnd;
                    }
                }
                this.coderHeldCount.set(coderId, 0);
            } else if (entry.action === "burned out") {
                if (this.timeToBurnout > 0) {
                    const start = this.lastCompileStart.get(coderId);
                    if (start !== undefined) {
                        const deadline = start + this.timeToBurnout;
                        const diff = realT - deadline;
                        if (diff > 10) {
                            this.issues.push({
                                type: 'error',
                                message: `Burnout precision violation: Logged at ${realT}ms, but deadline was ${deadline}ms (+${diff}ms). Subject requires < 10ms.`,
                                timestamp: realT,
                                coderId
                            });
                        }
                    }
                }
            }
        }
    }

    public finalize(globalMaxTime: number) {
        this.dongleSegments.forEach((segs) => {
            if (segs.length > 0) {
                const last = segs[segs.length - 1];
                if (last.endTime > 100000) {
                    last.endTime = globalMaxTime;
                    last.realEnd = last.realStart + (globalMaxTime - last.startTime);
                }
            }
        });
    }
}

export async function buildSegments(
    entries: LogEntry[],
    instantDuration = 10,
    timeToRefactor?: number,
    dongleCooldown = 0,
    timeToBurnout = 0,
    command?: string,
): Promise<{
    segments: Map<number, Segment[]>;
    dongleSegments: Map<number, DongleSegment[]>;
    maxTime: number;
    visualToReal: (v: number) => number;
    coderStats: any;
    issues: SimulationIssue[];
}> {
    let lastYieldTime = performance.now();
    const yieldIfNeeded = async () => {
        const now = performance.now();
        if (now - lastYieldTime > 16) {
            await new Promise(r => setTimeout(r, 0));
            lastYieldTime = performance.now();
        }
    };

    const [coderIds, create] = getCoderIds(entries, command);
    coderIds.sort((a, b) => a - b);
    const n = coderIds.length;
    const coderIndexById = new Map<number, number>();
    coderIds.forEach((id, index) => {
        coderIndexById.set(id, index);
    });
    const issues: SimulationIssue[] = [];
    
    // Group entries
    const byCoder = new Map<number, LogEntry[]>();
    const countsPerTimeAndCoder = new Map<number, Map<number, number>>();
    const timestamps = new Set<number>();
    
    for (const e of entries) {
        if (!byCoder.has(e.coderId)) byCoder.set(e.coderId, []);
        byCoder.get(e.coderId)!.push(e);

        if (!countsPerTimeAndCoder.has(e.timestamp)) countsPerTimeAndCoder.set(e.timestamp, new Map());
        const timeMap = countsPerTimeAndCoder.get(e.timestamp)!;
        timeMap.set(e.coderId, (timeMap.get(e.coderId) || 0) + 1);
        
        timestamps.add(e.timestamp);
    }

    if (timeToRefactor) {
        entries.forEach(e => {
            if (e.action === "is refactoring") {
                timestamps.add(e.timestamp + timeToRefactor);
            }
        });
    }

    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
    
    const timeMapper = new TimeMapper(sortedTimestamps, countsPerTimeAndCoder, instantDuration);
    await timeMapper.build(yieldIfNeeded);
    
    const coderSegmentBuilder = new CoderSegmentBuilder(byCoder, timeMapper, instantDuration, timeToRefactor);
    coderSegmentBuilder.build();
    
    const dongleSegmentBuilder = new DongleSegmentBuilder(n, coderIndexById, timeMapper, dongleCooldown, timeToBurnout, issues);
    await dongleSegmentBuilder.build(entries, yieldIfNeeded);
    
    const globalMaxTime = coderSegmentBuilder.globalMaxTime;
    dongleSegmentBuilder.finalize(globalMaxTime);
    timeMapper.finalize(globalMaxTime);

    const visualToReal = timeMapper.getInterpolator();

    const coderStats: any = {};
    entries.forEach((action) => {
        if (!coderStats[action.coderId]) {
            coderStats[action.coderId] = {};
        }
        const coder = coderStats[action.coderId];
        const actionName = getActionName(action.action);
        if (!coder[actionName]) {
            coder[actionName] = 1;
        } else {
            coder[actionName] += 1;
        }
    });

    if (create.length > 0) {
        create.forEach((id) => {
            issues.push({
                type: 'warning',
                message: `The coder thread did no action.`,
                coderId: id,
            });
        });
    }

    return { 
        segments: coderSegmentBuilder.segments, 
        dongleSegments: dongleSegmentBuilder.dongleSegments, 
        maxTime: globalMaxTime, 
        visualToReal, 
        coderStats, 
        issues 
    };
}


export function getStatusAtTime(
    segments: Segment[] | undefined,
    time: number
): string {
    if (!segments) return "Nothing";

    const seg = segments.find(
        (s) => time >= s.startTime && time < s.endTime
    );

    return seg?.action ?? "Nothing";
}

export function getDongleStatusAtTime(
    segments: DongleSegment[] | undefined,
    time: number,
    realTime: number
): DongleSegment | undefined {
    if (!segments) return undefined;

    const seg = segments.find(
        (s) => time >= s.startTime && time < s.endTime
    );

    if (seg?.status === 'cooldown') {
        if (realTime >= seg.realEnd) return undefined;
    }

    return seg;
}

export async function prepareCodexionSimulation(rawLog: string, padding: number, timeToRefactor?: number, dongleCooldown = 0, timeToBurnout = 0, command?: string) {
    const entries = parseCodexionLog(rawLog);
    const [coderIds] = getCoderIds(entries, command);

    const minTime = 0;

    const { segments, dongleSegments, maxTime, visualToReal, coderStats, issues } = await buildSegments(entries, padding, timeToRefactor, dongleCooldown, timeToBurnout, command);

    return {
        entries,
        coderIds,
        segments,
        dongleSegments,
        minTime,
        maxTime,
        visualToReal,
        coderStats,
        issues
    };
}

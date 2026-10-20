import type { LogEntry, InvalidLine } from "@/core/parseCodexionLog";
import { parseCodexionLines, getCoderIds } from "@/core/parseCodexionLog";
import type { CodexionParams } from "@/core/commandParams";
import { validateCodexionLog, ACTIONS } from "@/core/validateCodexionLog";
import type { SimulationIssue } from "@/core/validateCodexionLog";
import { computeMetrics } from "@/core/metrics";
import type { SimulationMetrics } from "@/core/metrics";

export type { SimulationIssue } from "@/core/validateCodexionLog";

export interface Segment {
    startTime: number;
    endTime: number;
    action: string;
    realStart: number;
    realEnd: number;
    line: number;
}

export interface DongleSegment {
    startTime: number;
    endTime: number;
    ownerId: number | null;
    status: 'free' | 'taken' | 'cooldown';
    realStart: number;
    realEnd: number;
}

export type CoderStats = Record<number, Record<string, number>>;

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

export function interpolate(v: number, keys: number[], values: number[]): number {
    const n = keys.length;
    if (n === 0) return 0;
    if (n === 1) return values[0] + (v - keys[0]);
    if (v <= keys[0]) return values[0] - (keys[0] - v);
    if (v >= keys[n - 1]) return values[n - 1] + (v - keys[n - 1]);

    let lo = 0;
    let hi = n - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (keys[mid] <= v) lo = mid;
        else hi = mid;
    }

    const k0 = keys[lo];
    const k1 = keys[hi];
    if (k1 === k0) return values[lo];
    return values[lo] + ((v - k0) / (k1 - k0)) * (values[hi] - values[lo]);
}

class TimeMapper {
    private visualMap = new Map<number, number>();
    public visualKeys: number[] = [];
    public realValues: number[] = [];
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
        const exact = this.visualMap.get(realT);
        if (exact !== undefined) return exact;
        return interpolate(realT, this.realValues, this.visualKeys);
    }

    public finalize(globalMaxTime: number) {
        if (this.sortedTimestamps.length > 0) {
            const lastReal = this.sortedTimestamps[this.sortedTimestamps.length - 1];
            const lastVisual = this.visualMap.get(lastReal)!;
            if (globalMaxTime > lastVisual) {
                this.visualKeys.push(globalMaxTime);
                this.realValues.push(lastReal + (globalMaxTime - lastVisual));
            }
        }
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
            const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp || a.line - b.line);
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

                if (entry.action === ACTIONS.REFACTOR && this.timeToRefactor) {
                    actualRealEnd = realT + this.timeToRefactor;
                    end = Math.max(this.timeMapper.getVisualTime(actualRealEnd), start + this.instantDuration);
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

                segs.push({ startTime: start, endTime: end, action: entry.action, realStart: realT, realEnd: actualRealEnd, line: entry.line });
                currentVisualEnd = end;
            }
            this.segments.set(coderId, segs);
        }
    }
}

const OPEN_END = 1e12;

class DongleSegmentBuilder {
    public dongleSegments = new Map<number, DongleSegment[]>();
    private dongleStatus: { owner: number | null, cooldownEnd: number }[];
    private coderHeldCount = new Map<number, number>();

    constructor(
        private numCoders: number,
        private coderIndexById: Map<number, number>,
        private timeMapper: TimeMapper,
        private dongleCooldown: number,
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
            const aTake = a.action === ACTIONS.TAKE;
            const bTake = b.action === ACTIONS.TAKE;
            if (aTake && !bTake) return -1;
            if (!aTake && bTake) return 1;
            return a.line - b.line;
        });

        for (let index = 0; index < sortedEntries.length; index++) {
            const entry = sortedEntries[index];
            await yieldIfNeeded();
            const coderId = entry.coderId;
            const realT = entry.timestamp;
            const visualT = this.timeMapper.getVisualTime(realT);
            const coderIndex = this.coderIndexById.get(coderId);
            if (coderIndex === undefined) continue;

            if (entry.action === ACTIONS.TAKE) {
                const rightDongleIdx = coderIndex + 1;
                const leftDongleIdx = coderIndex === 0 ? this.numCoders : coderIndex;

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
                        endTime: OPEN_END,
                        ownerId: coderId,
                        status: 'taken',
                        realStart: realT,
                        realEnd: OPEN_END
                    });
                    this.dongleStatus[targetDongle].owner = coderId;
                    this.coderHeldCount.set(coderId, count + 1);
                }
            } else if (entry.action === ACTIONS.DEBUG) {
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
                            endTime: OPEN_END,
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
            }
        }
    }

    public finalize(globalMaxTime: number) {
        this.dongleSegments.forEach((segs) => {
            if (segs.length > 0) {
                const last = segs[segs.length - 1];
                if (last.endTime >= OPEN_END) {
                    last.endTime = globalMaxTime;
                    if (last.realEnd >= OPEN_END) {
                        last.realEnd = last.realStart + (globalMaxTime - last.startTime);
                    }
                }
            }
        });
    }
}

export interface SimulationResult {
    entries: LogEntry[];
    invalidLines: InvalidLine[];
    coderIds: number[];
    segments: Map<number, Segment[]>;
    dongleSegments: Map<number, DongleSegment[]>;
    minTime: number;
    maxTime: number;
    visualKeys: number[];
    realValues: number[];
    coderStats: CoderStats;
    issues: SimulationIssue[];
    metrics: SimulationMetrics;
    params: CodexionParams;
}

export interface PrepareOptions {
    lines: string[];
    params: CodexionParams;
    command: string;
    padding: number;
    known?: (keyof CodexionParams)[];
}

function createYielder() {
    let lastYieldTime = performance.now();
    return async () => {
        const now = performance.now();
        if (now - lastYieldTime > 16) {
            await new Promise(r => setTimeout(r, 0));
            lastYieldTime = performance.now();
        }
    };
}

export async function prepareSimulation({ lines, params, command, padding, known }: PrepareOptions): Promise<SimulationResult> {
    const yieldIfNeeded = createYielder();
    const { entries, invalidLines } = parseCodexionLines(lines);
    const [coderIds, missingCoders] = getCoderIds(entries, command);
    const n = coderIds.length;
    const coderIndexById = new Map<number, number>();
    coderIds.forEach((id, index) => coderIndexById.set(id, index));

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

    const timeToRefactor = params.timeToRefactor || undefined;
    if (timeToRefactor) {
        for (const e of entries) {
            if (e.action === ACTIONS.REFACTOR) timestamps.add(e.timestamp + timeToRefactor);
        }
    }

    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);

    const timeMapper = new TimeMapper(sortedTimestamps, countsPerTimeAndCoder, padding);
    await timeMapper.build(yieldIfNeeded);

    const coderSegmentBuilder = new CoderSegmentBuilder(byCoder, timeMapper, padding, timeToRefactor);
    coderSegmentBuilder.build();

    const dongleSegmentBuilder = new DongleSegmentBuilder(n, coderIndexById, timeMapper, params.dongleCooldown);
    await dongleSegmentBuilder.build(entries, yieldIfNeeded);

    const globalMaxTime = coderSegmentBuilder.globalMaxTime;
    dongleSegmentBuilder.finalize(globalMaxTime);
    timeMapper.finalize(globalMaxTime);

    const coderStats: CoderStats = {};
    for (const entry of entries) {
        const coder = (coderStats[entry.coderId] ??= {});
        const actionName = getActionName(entry.action);
        coder[actionName] = (coder[actionName] ?? 0) + 1;
    }

    await yieldIfNeeded();
    const issues = validateCodexionLog(entries, invalidLines, params, coderIds, missingCoders, known);
    const metrics = computeMetrics(entries, params, coderIds, !known || known.includes("timeToBurnout"));

    return {
        entries,
        invalidLines,
        coderIds,
        segments: coderSegmentBuilder.segments,
        dongleSegments: dongleSegmentBuilder.dongleSegments,
        minTime: 0,
        maxTime: globalMaxTime,
        visualKeys: timeMapper.visualKeys,
        realValues: timeMapper.realValues,
        coderStats,
        issues,
        metrics,
        params,
    };
}

export function findSegmentIndex<T extends { startTime: number; endTime: number }>(segments: T[], time: number): number {
    let lo = 0;
    let hi = segments.length - 1;
    let found = -1;
    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (segments[mid].startTime <= time) {
            found = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return found;
}

export function findSegmentAt<T extends { startTime: number; endTime: number }>(segments: T[] | undefined, time: number): T | undefined {
    if (!segments || segments.length === 0) return undefined;
    const idx = findSegmentIndex(segments, time);
    if (idx === -1) return undefined;
    const seg = segments[idx];
    return time < seg.endTime ? seg : undefined;
}

export function getStatusAtTime(segments: Segment[] | undefined, time: number): string {
    return findSegmentAt(segments, time)?.action ?? "Nothing";
}

export function getDongleStatusAtTime(
    segments: DongleSegment[] | undefined,
    time: number,
    realTime: number
): DongleSegment | undefined {
    const seg = findSegmentAt(segments, time);
    if (seg?.status === 'cooldown' && realTime >= seg.realEnd) return undefined;
    return seg;
}

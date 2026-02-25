import type { LogEntry } from "@/lib/parseCodexionLog";
import {
    parseCodexionLog,
    getCoderIds,
} from "@/lib/parseCodexionLog";

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
    timestamp: number;
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

export function buildSegments(
    entries: LogEntry[],
    instantDuration = 10,
    timeToRefactor?: number,
    dongleCooldown = 0,
    timeToBurnout = 0,
): {
    segments: Map<number, Segment[]>;
    dongleSegments: Map<number, DongleSegment[]>;
    maxTime: number;
    visualToReal: (v: number) => number;
    coderStats: any;
    issues: SimulationIssue[];
} {
    const coderIds = getCoderIds(entries).sort((a, b) => a - b);
    const n = coderIds.length;
    const coderIndexById = new Map<number, number>();
    coderIds.forEach((id, index) => {
        coderIndexById.set(id, index);
    });
    const issues: SimulationIssue[] = [];
    const byCoder = new Map<number, LogEntry[]>();
    for (const e of entries) {
        if (!byCoder.has(e.coderId)) byCoder.set(e.coderId, []);
        byCoder.get(e.coderId)!.push(e);
    }

    const lastCompileStart = new Map<number, number>();

    const timestamps = new Set<number>();
    for (const e of entries) timestamps.add(e.timestamp);

    if (timeToRefactor) {
        entries.forEach(e => {
            if (e.action === "is refactoring") {
                timestamps.add(e.timestamp + timeToRefactor);
            }
        });
    }

    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
    const visualMap = new Map<number, number>();
    const visualKeys: number[] = [];
    const realValues: number[] = [];

    let currentVisual = 0;
    if (sortedTimestamps.length > 0) {
        visualMap.set(sortedTimestamps[0], 0);
        visualKeys.push(0);
        realValues.push(sortedTimestamps[0]);
    }

    for (let i = 0; i < sortedTimestamps.length - 1; i++) {
        const tCurr = sortedTimestamps[i];
        const tNext = sortedTimestamps[i + 1];
        const realDelta = tNext - tCurr;

        let maxStack = 0;
        for (const evts of byCoder.values()) {
            const count = evts.filter(e => e.timestamp === tCurr).length;
            if (count > 0) {
                maxStack = Math.max(maxStack, count * instantDuration);
            }
        }

        const visualDelta = Math.max(realDelta, maxStack);
        currentVisual += visualDelta;
        visualMap.set(tNext, currentVisual);
        visualKeys.push(currentVisual);
        realValues.push(tNext);
    }

    const segments = new Map<number, Segment[]>();
    let globalMaxTime = 0;
    const lastSegmentDuration = 50;

    for (const [coderId, evts] of byCoder) {
        const sorted = [...evts].sort((a, b) => a.timestamp - b.timestamp);
        const segs: Segment[] = [];
        let currentVisualEnd = 0;

        for (let i = 0; i < sorted.length; i++) {
            const entry = sorted[i];
            const realT = entry.timestamp;
            const visualStartBase = visualMap.get(realT)!;

            let start = visualStartBase;
            if (i > 0 && sorted[i - 1].timestamp === realT) {
                start = Math.max(start, currentVisualEnd);
            }

            let end;
            let actualRealEnd;

            if (entry.action === "is refactoring" && timeToRefactor) {
                actualRealEnd = realT + timeToRefactor;
                end = visualMap.get(actualRealEnd)!;
            } else if (i + 1 < sorted.length) {
                const nextEntry = sorted[i + 1];
                actualRealEnd = nextEntry.timestamp;

                if (nextEntry.timestamp === realT) {
                    end = start + instantDuration;
                } else {
                    const nextVisualBase = visualMap.get(nextEntry.timestamp)!;
                    end = Math.max(nextVisualBase, start + instantDuration);
                }
            } else {
                end = start + Math.max(lastSegmentDuration, instantDuration);
                actualRealEnd = realT + lastSegmentDuration;
            }

            if (end > globalMaxTime) {
                globalMaxTime = end;
            };

            segs.push({ startTime: start, endTime: end, action: entry.action, realStart: realT, realEnd: actualRealEnd });

            currentVisualEnd = end;
        };
        segments.set(coderId, segs);
    }

    const dongleSegments = new Map<number, DongleSegment[]>();
    for (let i = 1; i <= n; i++) dongleSegments.set(i, []);

    const dongleStatus = new Array(n + 1).fill(null).map(() => ({
        owner: null as number | null,
        cooldownEnd: 0,
    }));

    const coderHeldCount = new Map<number, number>();
    const sortedEntries = [...entries].sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
        if (a.action.includes("taken") && !b.action.includes("taken")) return -1;
        if (!a.action.includes("taken") && b.action.includes("taken")) return 1;
        return 0;
    });

    sortedEntries.forEach((entry) => {
        const coderId = entry.coderId;
        const realT = entry.timestamp;
        const visualT = visualMap.get(realT)!;

        if (entry.action === "has taken a dongle") {
            const coderIndex = coderIndexById.get(coderId);
            if (coderIndex === undefined) {
                issues.push({
                    type: 'warning',
                    message: `Unknown coderId ${coderId} encountered while taking a dongle.`,
                    timestamp: realT,
                    coderId
                });
                return;
            }

            const rightDongleIdx = coderIndex + 1;
            const leftDongleIdx = coderIndex === 0 ? n : coderIndex;

            let targetDongle = 0;
            const count = coderHeldCount.get(coderId) || 0;
            if (count === 0) {
                if (dongleStatus[leftDongleIdx].owner === null) targetDongle = leftDongleIdx;
                else if (dongleStatus[rightDongleIdx].owner === null) targetDongle = rightDongleIdx;
                else {
                    issues.push({ type: 'error', message: `Coder ${coderId} tried to take a dongle but both ${leftDongleIdx} and ${rightDongleIdx} are occupied.`, timestamp: realT, coderId });
                }
            } else if (count === 1) {
                if (dongleStatus[leftDongleIdx].owner === coderId) targetDongle = rightDongleIdx;
                else targetDongle = leftDongleIdx;
            }

            if (targetDongle > 0) {
                if (dongleStatus[targetDongle].cooldownEnd > realT) {
                    issues.push({
                        type: 'warning',
                        message: `Cooldown violation: Dongle ${targetDongle} taken ${dongleStatus[targetDongle].cooldownEnd - realT}ms too early.`,
                        timestamp: realT,
                        coderId,
                        dongleId: targetDongle
                    });
                }

                if (dongleStatus[targetDongle].owner !== null && dongleStatus[targetDongle].owner !== coderId) {
                    issues.push({ type: 'error', message: `Conflict: Dongle ${targetDongle} taken by ${coderId} while held by Coder ${dongleStatus[targetDongle].owner}`, timestamp: realT, coderId, dongleId: targetDongle });
                }
                const dSegs = dongleSegments.get(targetDongle)!;
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
                dongleStatus[targetDongle].owner = coderId;
                coderHeldCount.set(coderId, count + 1);
            }
        } else if (entry.action === "is compiling") {
            lastCompileStart.set(coderId, realT);
        } else if (entry.action === "is debugging") {
            for (let dIdx = 1; dIdx <= n; dIdx++) {
                if (dongleStatus[dIdx].owner === coderId) {
                    const dSegs = dongleSegments.get(dIdx)!;
                    if (dSegs.length > 0) {
                        dSegs[dSegs.length - 1].endTime = visualT;
                        dSegs[dSegs.length - 1].realEnd = realT;
                    }
                    const cooldownRealEnd = realT + dongleCooldown;
                    dSegs.push({
                        startTime: visualT,
                        endTime: visualT + 1000000,
                        ownerId: null,
                        status: 'cooldown',
                        realStart: realT,
                        realEnd: cooldownRealEnd
                    });

                    dongleStatus[dIdx].owner = null;
                    dongleStatus[dIdx].cooldownEnd = cooldownRealEnd;
                }
            }
            coderHeldCount.set(coderId, 0);
        } else if (entry.action === "burned out") {
            if (timeToBurnout > 0) {
                const start = lastCompileStart.get(coderId);
                if (start !== undefined) {
                    const deadline = start + timeToBurnout;
                    const diff = realT - deadline;
                    if (diff > 10) {
                        issues.push({
                            type: 'error',
                            message: `Burnout precision violation: Logged at ${realT}ms, but deadline was ${deadline}ms (+${diff}ms). Subject requires < 10ms.`,
                            timestamp: realT,
                            coderId
                        });
                    }
                }
            }
        }
    });

    dongleSegments.forEach((segs) => {
        if (segs.length > 0) {
            const last = segs[segs.length - 1];
            if (last.endTime > 100000) {
                last.endTime = globalMaxTime;
                last.realEnd = last.realStart + (globalMaxTime - last.startTime);
            }
        }
    });

    if (sortedTimestamps.length > 0) {
        visualKeys.push(globalMaxTime);
        const lastReal = sortedTimestamps[sortedTimestamps.length - 1];
        const lastVisual = visualMap.get(lastReal)!;
        realValues.push(lastReal + (globalMaxTime - lastVisual));
    }

    const visualToReal = (v: number) => interpolate(v, visualKeys, realValues);

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

    return { segments, dongleSegments, maxTime: globalMaxTime, visualToReal, coderStats, issues };
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

export function prepareCodexionSimulation(rawLog: string, padding: number, timeToRefactor?: number, dongleCooldown = 0, timeToBurnout = 0) {
    const entries = parseCodexionLog(rawLog);
    const coderIds = getCoderIds(entries);

    const minTime = 0;

    const { segments, dongleSegments, maxTime, visualToReal, coderStats, issues } = buildSegments(entries, padding, timeToRefactor, dongleCooldown, timeToBurnout);

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

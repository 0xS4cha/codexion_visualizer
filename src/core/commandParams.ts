export type Scheduler = "fifo" | "edf";

export interface CodexionParams {
  numCoders: number;
  timeToBurnout: number;
  timeToCompile: number;
  timeToDebug: number;
  timeToRefactor: number;
  numCompilesRequired: number;
  dongleCooldown: number;
  scheduler: Scheduler;
}

export type PartialParams = Partial<CodexionParams>;

export const PARAM_FIELDS: { key: keyof CodexionParams; label: string; min: number; max: number }[] = [
  { key: "numCoders", label: "Coders", min: 1, max: 500 },
  { key: "timeToBurnout", label: "Time to burnout", min: 1, max: 100000 },
  { key: "timeToCompile", label: "Time to compile", min: 0, max: 100000 },
  { key: "timeToDebug", label: "Time to debug", min: 0, max: 100000 },
  { key: "timeToRefactor", label: "Time to refactor", min: 0, max: 100000 },
  { key: "numCompilesRequired", label: "Compiles required", min: 0, max: 10000 },
  { key: "dongleCooldown", label: "Dongle cooldown", min: 0, max: 100000 },
];

export const DEFAULT_PARAMS: CodexionParams = {
  numCoders: 4,
  timeToBurnout: 1000,
  timeToCompile: 200,
  timeToDebug: 100,
  timeToRefactor: 150,
  numCompilesRequired: 5,
  dongleCooldown: 50,
  scheduler: "edf",
};

export const DEFAULT_BINARY = "./codexion";

const NUMERIC_KEYS: (keyof CodexionParams)[] = [
  "numCoders",
  "timeToBurnout",
  "timeToCompile",
  "timeToDebug",
  "timeToRefactor",
  "numCompilesRequired",
  "dongleCooldown",
];

function isBinaryToken(token: string): boolean {
  return /[a-z_/.]/i.test(token) && !/^(fifo|edf)$/i.test(token) && !/^-?\d+$/.test(token);
}

export function splitCommand(command: string): { binary: string | null; args: string[] } {
  const parts = (command ?? "").trim().split(/\s+/).filter((p) => p.length > 0);
  if (parts.length > 0 && isBinaryToken(parts[0])) {
    return { binary: parts[0], args: parts.slice(1) };
  }
  return { binary: null, args: parts };
}

function parseIntStrict(token: string | undefined): number | undefined {
  if (token === undefined || !/^-?\d+$/.test(token)) return undefined;
  return parseInt(token, 10);
}

export function parseCommand(command: string): PartialParams {
  const { args } = splitCommand(command);
  const params: PartialParams = {};
  NUMERIC_KEYS.forEach((key, i) => {
    const value = parseIntStrict(args[i]);
    if (value !== undefined) (params as Record<string, number>)[key] = value;
  });
  const sched = args[7]?.toLowerCase();
  if (sched === "fifo" || sched === "edf") params.scheduler = sched;
  return params;
}

export function knownParams(command: string): (keyof CodexionParams)[] {
  return Object.keys(parseCommand(command)) as (keyof CodexionParams)[];
}

export function resolveParams(command: string, fallback: PartialParams = {}): CodexionParams {
  return { ...DEFAULT_PARAMS, ...fallback, ...parseCommand(command) };
}

export function formatCommand(params: CodexionParams, binary: string = DEFAULT_BINARY): string {
  return [binary, ...NUMERIC_KEYS.map((k) => String(params[k])), params.scheduler].join(" ");
}

export interface ParamError {
  field: keyof CodexionParams | "command";
  message: string;
}

export function validateCommand(command: string): ParamError[] {
  const errors: ParamError[] = [];
  const { args } = splitCommand(command);
  if (args.length === 0) return errors;
  if (args.length !== 8) {
    errors.push({ field: "command", message: `Expected 8 arguments, got ${args.length}.` });
  }
  NUMERIC_KEYS.forEach((key, i) => {
    const token = args[i];
    if (token === undefined) return;
    const field = PARAM_FIELDS.find((f) => f.key === key)!;
    const value = parseIntStrict(token);
    if (value === undefined) {
      errors.push({ field: key, message: `${field.label} must be an integer (got "${token}").` });
    } else if (value < field.min) {
      errors.push({ field: key, message: `${field.label} must be ≥ ${field.min}.` });
    } else if (value > field.max) {
      errors.push({ field: key, message: `${field.label} must be ≤ ${field.max}.` });
    }
  });
  const sched = args[7];
  if (sched !== undefined && !/^(fifo|edf)$/i.test(sched)) {
    errors.push({ field: "scheduler", message: `Scheduler must be "fifo" or "edf" (got "${sched}").` });
  }
  return errors;
}

export interface ParamPreset {
  name: string;
  description: string;
  params: CodexionParams;
}

export const PRESETS: ParamPreset[] = [
  {
    name: "Default",
    description: "Balanced run that should complete.",
    params: DEFAULT_PARAMS,
  },
  {
    name: "Single coder",
    description: "One coder, one dongle: must burn out.",
    params: { numCoders: 1, timeToBurnout: 800, timeToCompile: 200, timeToDebug: 100, timeToRefactor: 100, numCompilesRequired: 3, dongleCooldown: 0, scheduler: "fifo" },
  },
  {
    name: "Tight burnout",
    description: "Barely enough time between compiles.",
    params: { numCoders: 5, timeToBurnout: 610, timeToCompile: 200, timeToDebug: 100, timeToRefactor: 100, numCompilesRequired: 5, dongleCooldown: 0, scheduler: "edf" },
  },
  {
    name: "Impossible",
    description: "Burnout shorter than a full cycle.",
    params: { numCoders: 3, timeToBurnout: 300, timeToCompile: 200, timeToDebug: 100, timeToRefactor: 100, numCompilesRequired: 5, dongleCooldown: 10, scheduler: "fifo" },
  },
  {
    name: "Odd count",
    description: "Odd number of coders stresses fairness.",
    params: { numCoders: 5, timeToBurnout: 800, timeToCompile: 200, timeToDebug: 200, timeToRefactor: 200, numCompilesRequired: 7, dongleCooldown: 0, scheduler: "fifo" },
  },
  {
    name: "Long cooldown",
    description: "Dongles stay unavailable for a long time.",
    params: { numCoders: 4, timeToBurnout: 1000, timeToCompile: 100, timeToDebug: 100, timeToRefactor: 100, numCompilesRequired: 5, dongleCooldown: 400, scheduler: "edf" },
  },
  {
    name: "Many coders",
    description: "200 coders to stress your threads.",
    params: { numCoders: 200, timeToBurnout: 1000, timeToCompile: 100, timeToDebug: 100, timeToRefactor: 100, numCompilesRequired: 3, dongleCooldown: 10, scheduler: "edf" },
  },
];

function randomInt(min: number, max: number, rand: () => number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

export function randomParams(rand: () => number = Math.random): CodexionParams {
  const timeToCompile = randomInt(10, 400, rand);
  const timeToDebug = randomInt(10, 300, rand);
  const timeToRefactor = randomInt(10, 300, rand);
  const cycle = timeToCompile + timeToDebug + timeToRefactor;
  const margin = randomInt(-Math.floor(cycle / 3), cycle, rand);
  return {
    numCoders: rand() < 0.15 ? randomInt(1, 2, rand) : randomInt(2, 12, rand),
    timeToBurnout: Math.max(1, cycle + margin),
    timeToCompile,
    timeToDebug,
    timeToRefactor,
    numCompilesRequired: randomInt(1, 10, rand),
    dongleCooldown: rand() < 0.4 ? 0 : randomInt(1, 200, rand),
    scheduler: rand() < 0.5 ? "fifo" : "edf",
  };
}

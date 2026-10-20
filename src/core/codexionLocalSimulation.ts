import { resolveParams } from "@/core/commandParams";
import type { CodexionParams } from "@/core/commandParams";

export function parseCommandString(command: string): CodexionParams {
  return resolveParams(command);
}

type CoderState = 'idle' | 'waiting_first' | 'waiting_second' | 'compiling' | 'debugging' | 'refactoring' | 'burned_out';

interface SimEvent {
  time: number;
  type: 'action_finished' | 'cooldown_finished' | 'burnout_check';
  coderId?: number;
  dongleId?: number;
}

class SimulationClock {
  public events: SimEvent[] = [];
  public currentTime: number = 0;
  
  constructor(public maxDuration: number = 100000) {}

  public scheduleEvent(time: number, type: SimEvent['type'], extra: Partial<SimEvent> = {}) {
    const event: SimEvent = { time, type, ...extra };
    const priority = { cooldown_finished: 1, action_finished: 2, burnout_check: 3 };
    const before = (a: SimEvent, b: SimEvent) =>
      a.time !== b.time ? a.time < b.time : priority[a.type] < priority[b.type];
    let lo = 0;
    let hi = this.events.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (before(event, this.events[mid])) hi = mid;
      else lo = mid + 1;
    }
    this.events.splice(lo, 0, event);
  }

  public nextEvent(): SimEvent | undefined {
    if (this.events.length === 0 || this.currentTime >= this.maxDuration) return undefined;
    const event = this.events.shift()!;
    this.currentTime = event.time;
    return event;
  }
  
  public hasEvents(): boolean {
    return this.events.length > 0 && this.currentTime < this.maxDuration;
  }
}

class Coder {
  public state: CoderState = 'idle';
  public lastCompileStart: number = 0;
  public compilesCount: number = 0;
  public heldDongles: number[] = [];
  public firstDongle: number;
  public secondDongle: number;

  constructor(public id: number, numCoders: number) {
    const dongleA = this.id;
    const dongleB = this.id === 1 ? numCoders : this.id - 1;
    this.firstDongle = Math.min(dongleA, dongleB);
    this.secondDongle = Math.max(dongleA, dongleB);
  }
}

class Dongle {
  public owner: number | null = null;
  public cooldownUntil: number = 0;
  public queue: { coderId: number; time: number; deadline: number }[] = [];
  constructor(public id: number) {}
}

class CoderManager {
  public coders: Coder[];

  constructor(
    public numCoders: number,
    public numCompilesRequired: number
  ) {
    this.coders = Array.from({ length: numCoders }, (_, i) => new Coder(i + 1, numCoders));
  }

  public getCoder(id: number): Coder {
    return this.coders[id - 1];
  }

  public allDone(): boolean {
    if (this.numCompilesRequired <= 0) return false;
    return this.coders.every(c => c.compilesCount >= this.numCompilesRequired);
  }
}

class DongleManager {
  public dongles: Dongle[];

  constructor(
    public numCoders: number,
    public scheduler: 'fifo' | 'edf'
  ) {
    this.dongles = Array.from({ length: numCoders }, (_, i) => new Dongle(i + 1));
  }

  public getDongle(id: number): Dongle {
    return this.dongles[id - 1];
  }
}

class Simulation {
  private clock: SimulationClock;
  private coderManager: CoderManager;
  private dongleManager: DongleManager;
  private logs: string[] = [];
  private simulationRunning: boolean = true;

  constructor(
    numCoders: number,
    public timeToBurnout: number,
    public timeToCompile: number,
    public timeToDebug: number,
    public timeToRefactor: number,
    numCompilesRequired: number,
    public dongleCooldown: number,
    scheduler: 'fifo' | 'edf'
  ) {
    this.clock = new SimulationClock();
    this.coderManager = new CoderManager(numCoders, numCompilesRequired);
    this.dongleManager = new DongleManager(numCoders, scheduler);
  }

  private addLog(time: number, coderId: number, action: string) {
    this.logs.push(`${time} ${coderId} ${action}`);
  }

  private processQueues(t: number) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const dongle of this.dongleManager.dongles) {
        if (dongle.owner === null && t >= dongle.cooldownUntil && dongle.queue.length > 0) {
          if (this.dongleManager.scheduler === 'edf') {
            dongle.queue.sort((a, b) => a.deadline !== b.deadline ? a.deadline - b.deadline : a.coderId - b.coderId);
          } else {
            dongle.queue.sort((a, b) => a.time !== b.time ? a.time - b.time : a.coderId - b.coderId);
          }

          const req = dongle.queue.shift()!;
          const coder = this.coderManager.getCoder(req.coderId);

          if (coder.state !== 'waiting_first' && coder.state !== 'waiting_second') continue;

          dongle.owner = coder.id;
          coder.heldDongles.push(dongle.id);
          this.addLog(t, coder.id, "has taken a dongle");

          if (coder.heldDongles.length === 2) {
            coder.state = 'compiling';
            coder.lastCompileStart = t;
            this.addLog(t, coder.id, "is compiling");
            this.clock.scheduleEvent(t + this.timeToCompile, 'action_finished', { coderId: coder.id });
            this.clock.scheduleEvent(t + this.timeToBurnout, 'burnout_check', { coderId: coder.id });
          } else {
            coder.state = 'waiting_second';
            const targetDongle = this.dongleManager.getDongle(coder.secondDongle);
            targetDongle.queue.push({
              coderId: coder.id,
              time: t,
              deadline: coder.lastCompileStart + this.timeToBurnout
            });
          }
          changed = true;
        }
      }
    }
  }

  public run(): string {
    for (const coder of this.coderManager.coders) {
      coder.state = 'waiting_first';
      this.dongleManager.getDongle(coder.firstDongle).queue.push({
        coderId: coder.id,
        time: 0,
        deadline: this.timeToBurnout
      });
      this.clock.scheduleEvent(this.timeToBurnout, 'burnout_check', { coderId: coder.id });
    }

    this.processQueues(0);

    while (this.clock.hasEvents() && this.simulationRunning) {
      const event = this.clock.nextEvent()!;
      const t = this.clock.currentTime;

      if (event.type === 'action_finished') {
        const coder = this.coderManager.getCoder(event.coderId!);
        if (coder.state === 'compiling') {
          coder.state = 'debugging';
          coder.compilesCount++;
          this.addLog(t, coder.id, "is debugging");

          const released = [...coder.heldDongles];
          coder.heldDongles = [];

          for (const dId of released) {
            const d = this.dongleManager.getDongle(dId);
            d.owner = null;
            d.cooldownUntil = t + this.dongleCooldown;
            this.clock.scheduleEvent(t + this.dongleCooldown, 'cooldown_finished', { dongleId: dId });
          }

          this.clock.scheduleEvent(t + this.timeToDebug, 'action_finished', { coderId: coder.id });
          this.processQueues(t);
        } else if (coder.state === 'debugging') {
          coder.state = 'refactoring';
          this.addLog(t, coder.id, "is refactoring");
          this.clock.scheduleEvent(t + this.timeToRefactor, 'action_finished', { coderId: coder.id });
        } else if (coder.state === 'refactoring') {
          if (this.coderManager.allDone()) {
            this.simulationRunning = false;
            break;
          }

          coder.state = 'waiting_first';
          this.dongleManager.getDongle(coder.firstDongle).queue.push({
            coderId: coder.id,
            time: t,
            deadline: coder.lastCompileStart + this.timeToBurnout
          });

          this.processQueues(t);
        }
      } else if (event.type === 'cooldown_finished') {
        this.processQueues(t);
      } else if (event.type === 'burnout_check') {
        const coder = this.coderManager.getCoder(event.coderId!);
        if (coder.state !== 'burned_out') {
          const deadline = coder.lastCompileStart + this.timeToBurnout;
          if (t >= deadline) {
            coder.state = 'burned_out';
            this.addLog(t, coder.id, "burned out");
            this.simulationRunning = false;
            break;
          }
        }
      }
    }

    return this.logs.join('\n');
  }
}

export function runCodexionSimulation(command: string): string {
  return runCodexionSimulationWithParams(parseCommandString(command));
}

export function runCodexionSimulationWithParams(config: CodexionParams): string {
  const sim = new Simulation(
    config.numCoders,
    config.timeToBurnout,
    config.timeToCompile,
    config.timeToDebug,
    config.timeToRefactor,
    config.numCompilesRequired,
    config.dongleCooldown,
    config.scheduler
  );
  return sim.run();
}

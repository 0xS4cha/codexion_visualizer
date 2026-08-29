export function parseCommandString(command: string) {
  const parts = command.trim().split(/\s+/).filter(p => p.length > 0);
  let startIndex = 0;
  if (parts[0] && (parts[0].includes('codexion') || parts[0].includes('/') || parts[0].includes('.'))) {
    startIndex = 1;
  }
  return {
    numCoders: parseInt(parts[startIndex], 10) || 4,
    timeToBurnout: parseInt(parts[startIndex + 1], 10) || 1000,
    timeToCompile: parseInt(parts[startIndex + 2], 10) || 200,
    timeToDebug: parseInt(parts[startIndex + 3], 10) || 100,
    timeToRefactor: parseInt(parts[startIndex + 4], 10) || 150,
    numCompilesRequired: parseInt(parts[startIndex + 5], 10) || 5,
    dongleCooldown: parseInt(parts[startIndex + 6], 10) || 50,
    scheduler: ((parts[startIndex + 7] || 'edf').toLowerCase() === 'fifo' ? 'fifo' : 'edf') as 'fifo' | 'edf'
  };
}

type CoderState = 'idle' | 'waiting_first' | 'waiting_second' | 'compiling' | 'debugging' | 'refactoring' | 'burned_out';

interface SimEvent {
  time: number;
  type: 'action_finished' | 'cooldown_finished' | 'burnout_check';
  coderId?: number;
  dongleId?: number;
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

class Simulation {
  private coders: Coder[];
  private dongles: Dongle[];
  private events: SimEvent[] = [];
  private logs: string[] = [];
  private simulationRunning: boolean = true;
  private currentTime: number = 0;
  private maxDuration: number = 100000;

  constructor(
    public numCoders: number,
    public timeToBurnout: number,
    public timeToCompile: number,
    public timeToDebug: number,
    public timeToRefactor: number,
    public numCompilesRequired: number,
    public dongleCooldown: number,
    public scheduler: 'fifo' | 'edf'
  ) {
    this.coders = Array.from({ length: numCoders }, (_, i) => new Coder(i + 1, numCoders));
    this.dongles = Array.from({ length: numCoders }, (_, i) => new Dongle(i + 1));
  }

  private addLog(time: number, coderId: number, action: string) {
    this.logs.push(`${time} ${coderId} ${action}`);
  }

  private scheduleEvent(time: number, type: SimEvent['type'], extra: Partial<SimEvent> = {}) {
    this.events.push({ time, type, ...extra });
    this.events.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      const priority = { cooldown_finished: 1, action_finished: 2, burnout_check: 3 };
      return priority[a.type] - priority[b.type];
    });
  }

  private processQueues(t: number) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const dongle of this.dongles) {
        if (dongle.owner === null && t >= dongle.cooldownUntil && dongle.queue.length > 0) {
          if (this.scheduler === 'edf') {
            dongle.queue.sort((a, b) => a.deadline !== b.deadline ? a.deadline - b.deadline : a.coderId - b.coderId);
          } else {
            dongle.queue.sort((a, b) => a.time !== b.time ? a.time - b.time : a.coderId - b.coderId);
          }

          const req = dongle.queue.shift()!;
          const coder = this.coders[req.coderId - 1];

          if (coder.state !== 'waiting_first' && coder.state !== 'waiting_second') continue;

          dongle.owner = coder.id;
          coder.heldDongles.push(dongle.id);
          this.addLog(t, coder.id, "has taken a dongle");

          if (coder.heldDongles.length === 2) {
            coder.state = 'compiling';
            coder.lastCompileStart = t;
            this.addLog(t, coder.id, "is compiling");
            this.scheduleEvent(t + this.timeToCompile, 'action_finished', { coderId: coder.id });
          } else {
            coder.state = 'waiting_second';
            const targetDongle = this.dongles[coder.secondDongle - 1];
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
    for (const coder of this.coders) {
      coder.state = 'waiting_first';
      this.dongles[coder.firstDongle - 1].queue.push({
        coderId: coder.id,
        time: 0,
        deadline: this.timeToBurnout
      });
      this.scheduleEvent(this.timeToBurnout, 'burnout_check', { coderId: coder.id });
    }

    this.processQueues(0);

    while (this.events.length > 0 && this.simulationRunning && this.currentTime < this.maxDuration) {
      const event = this.events.shift()!;
      this.currentTime = event.time;

      if (event.type === 'action_finished') {
        const coder = this.coders[event.coderId! - 1];
        if (coder.state === 'compiling') {
          coder.state = 'debugging';
          coder.compilesCount++;
          this.addLog(this.currentTime, coder.id, "is debugging");

          const released = [...coder.heldDongles];
          coder.heldDongles = [];

          for (const dId of released) {
            const d = this.dongles[dId - 1];
            d.owner = null;
            d.cooldownUntil = this.currentTime + this.dongleCooldown;
            this.scheduleEvent(this.currentTime + this.dongleCooldown, 'cooldown_finished', { dongleId: dId });
          }

          this.scheduleEvent(this.currentTime + this.timeToDebug, 'action_finished', { coderId: coder.id });
          this.processQueues(this.currentTime);
        } else if (coder.state === 'debugging') {
          coder.state = 'refactoring';
          this.addLog(this.currentTime, coder.id, "is refactoring");
          this.scheduleEvent(this.currentTime + this.timeToRefactor, 'action_finished', { coderId: coder.id });
        } else if (coder.state === 'refactoring') {
          if (this.numCompilesRequired > 0) {
            const allDone = this.coders.every(c => c.compilesCount >= this.numCompilesRequired);
            if (allDone) {
              this.simulationRunning = false;
              break;
            }
          }

          coder.state = 'waiting_first';
          this.dongles[coder.firstDongle - 1].queue.push({
            coderId: coder.id,
            time: this.currentTime,
            deadline: coder.lastCompileStart + this.timeToBurnout
          });

          this.scheduleEvent(coder.lastCompileStart + this.timeToBurnout, 'burnout_check', { coderId: coder.id });
          this.processQueues(this.currentTime);
        }
      } else if (event.type === 'cooldown_finished') {
        this.processQueues(this.currentTime);
      } else if (event.type === 'burnout_check') {
        const coder = this.coders[event.coderId! - 1];
        if (coder.state !== 'compiling' && coder.state !== 'debugging' && coder.state !== 'refactoring') {
          const deadline = coder.lastCompileStart + this.timeToBurnout;
          if (this.currentTime >= deadline) {
            coder.state = 'burned_out';
            this.addLog(this.currentTime, coder.id, "burned out");
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
  const config = parseCommandString(command);
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

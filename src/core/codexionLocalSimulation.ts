export function parseCommandString(command: string) {
  const parts = command.trim().split(/\s+/).filter(p => p.length > 0);
  let startIndex = 0;
  if (parts[0] && (parts[0].includes('codexion') || parts[0].includes('/') || parts[0].includes('.'))) {
    startIndex = 1;
  }

  const numCoders = parseInt(parts[startIndex], 10) || 4;
  const timeToBurnout = parseInt(parts[startIndex + 1], 10) || 1000;
  const timeToCompile = parseInt(parts[startIndex + 2], 10) || 200;
  const timeToDebug = parseInt(parts[startIndex + 3], 10) || 100;
  const timeToRefactor = parseInt(parts[startIndex + 4], 10) || 150;
  const numCompilesRequired = parseInt(parts[startIndex + 5], 10) || 5;
  const dongleCooldown = parseInt(parts[startIndex + 6], 10) || 50;
  const scheduler = ((parts[startIndex + 7] || 'edf').toLowerCase() === 'fifo' ? 'fifo' : 'edf') as 'fifo' | 'edf';

  return {
    numCoders,
    timeToBurnout,
    timeToCompile,
    timeToDebug,
    timeToRefactor,
    numCompilesRequired,
    dongleCooldown,
    scheduler
  };
}

export function runCodexionSimulation(command: string): string {
  const {
    numCoders,
    timeToBurnout,
    timeToCompile,
    timeToDebug,
    timeToRefactor,
    numCompilesRequired,
    dongleCooldown,
    scheduler
  } = parseCommandString(command);

  const coders = Array.from({ length: numCoders }, (_, idx) => ({
    id: idx + 1,
    state: 'idle' as 'idle' | 'waiting_first' | 'waiting_second' | 'compiling' | 'debugging' | 'refactoring' | 'burned_out',
    lastCompileStart: 0,
    compilesCount: 0,
    heldDongles: [] as number[],
    firstDongle: 0,
    secondDongle: 0
  }));

  for (let i = 0; i < numCoders; i++) {
    const coder = coders[i];
    const dongleA = coder.id;
    const dongleB = coder.id === 1 ? numCoders : coder.id - 1;
    coder.firstDongle = Math.min(dongleA, dongleB);
    coder.secondDongle = Math.max(dongleA, dongleB);
  }

  const dongles = Array.from({ length: numCoders }, (_, idx) => ({
    id: idx + 1,
    owner: null as number | null,
    cooldownUntil: 0,
    queue: [] as { coderId: number; time: number; deadline: number }[]
  }));

  const logs: string[] = [];
  const addLog = (time: number, coderId: number, action: string) => {
    logs.push(`${time} ${coderId} ${action}`);
  };

  interface SimEvent {
    time: number;
    type: 'action_finished' | 'cooldown_finished' | 'burnout_check';
    coderId?: number;
    dongleId?: number;
  }
  let events: SimEvent[] = [];
  const scheduleEvent = (time: number, type: SimEvent['type'], extra: Partial<SimEvent> = {}) => {
    events.push({ time, type, ...extra });
    events.sort((a, b) => {
      if (a.time !== b.time) return a.time - b.time;
      const priority = { cooldown_finished: 1, action_finished: 2, burnout_check: 3 };
      return priority[a.type] - priority[b.type];
    });
  };

  const processQueues = (t: number) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const dongle of dongles) {
        if (dongle.owner === null && t >= dongle.cooldownUntil && dongle.queue.length > 0) {
          if (scheduler === 'edf') {
            dongle.queue.sort((a, b) => {
              if (a.deadline !== b.deadline) return a.deadline - b.deadline;
              return a.coderId - b.coderId;
            });
          } else {
            dongle.queue.sort((a, b) => {
              if (a.time !== b.time) return a.time - b.time;
              return a.coderId - b.coderId;
            });
          }

          const req = dongle.queue.shift()!;
          const coder = coders[req.coderId - 1];

          if (coder.state !== 'waiting_first' && coder.state !== 'waiting_second') {
            continue;
          }

          dongle.owner = coder.id;
          coder.heldDongles.push(dongle.id);
          addLog(t, coder.id, "has taken a dongle");

          if (coder.heldDongles.length === 2) {
            coder.state = 'compiling';
            coder.lastCompileStart = t;
            addLog(t, coder.id, "is compiling");
            scheduleEvent(t + timeToCompile, 'action_finished', { coderId: coder.id });
          } else {
            coder.state = 'waiting_second';
            const targetDongle = dongles[coder.secondDongle - 1];
            targetDongle.queue.push({
              coderId: coder.id,
              time: t,
              deadline: coder.lastCompileStart + timeToBurnout
            });
          }
          changed = true;
        }
      }
    }
  };

  for (const coder of coders) {
    coder.state = 'waiting_first';
    const firstD = dongles[coder.firstDongle - 1];
    firstD.queue.push({
      coderId: coder.id,
      time: 0,
      deadline: 0 + timeToBurnout
    });
    scheduleEvent(timeToBurnout, 'burnout_check', { coderId: coder.id });
  }

  processQueues(0);

  let simulationRunning = true;
  const maxDuration = 100000;
  let currentTime = 0;

  while (events.length > 0 && simulationRunning && currentTime < maxDuration) {
    const event = events.shift()!;
    currentTime = event.time;

    if (event.type === 'action_finished') {
      const coder = coders[event.coderId! - 1];
      if (coder.state === 'compiling') {
        coder.state = 'debugging';
        coder.compilesCount++;
        addLog(currentTime, coder.id, "is debugging");

        const released = [...coder.heldDongles];
        coder.heldDongles = [];

        for (const dId of released) {
          const d = dongles[dId - 1];
          d.owner = null;
          d.cooldownUntil = currentTime + dongleCooldown;
          scheduleEvent(currentTime + dongleCooldown, 'cooldown_finished', { dongleId: dId });
        }

        scheduleEvent(currentTime + timeToDebug, 'action_finished', { coderId: coder.id });
        processQueues(currentTime);
      }
      else if (coder.state === 'debugging') {
        coder.state = 'refactoring';
        addLog(currentTime, coder.id, "is refactoring");
        scheduleEvent(currentTime + timeToRefactor, 'action_finished', { coderId: coder.id });
      }
      else if (coder.state === 'refactoring') {
        if (numCompilesRequired > 0) {
          const allDone = coders.every(c => c.compilesCount >= numCompilesRequired);
          if (allDone) {
            simulationRunning = false;
            break;
          }
        }

        coder.state = 'waiting_first';
        const firstD = dongles[coder.firstDongle - 1];
        firstD.queue.push({
          coderId: coder.id,
          time: currentTime,
          deadline: coder.lastCompileStart + timeToBurnout
        });

        scheduleEvent(coder.lastCompileStart + timeToBurnout, 'burnout_check', { coderId: coder.id });
        processQueues(currentTime);
      }
    }
    else if (event.type === 'cooldown_finished') {
      processQueues(currentTime);
    }
    else if (event.type === 'burnout_check') {
      const coder = coders[event.coderId! - 1];
      if (coder.state !== 'compiling' && coder.state !== 'debugging' && coder.state !== 'refactoring') {
        const deadline = coder.lastCompileStart + timeToBurnout;
        if (currentTime >= deadline) {
          coder.state = 'burned_out';
          addLog(currentTime, coder.id, "burned out");
          simulationRunning = false;
          break;
        }
      }
    }
  }

  return logs.join('\n');
}

import { HttpError } from './security.js';

export const EDGECASE_TAGS = [
  'Burnout',
  'Deadlock',
  'Tricky',
  'Stack',
  'Memory',
  'Infinite Loop',
  'Segfault',
  'Leaks',
  'Parsing',
  'Other',
];

export const LIMITS = {
  title: 120,
  description: 2000,
  tags: 5,
  command: 300,
  comment: 1000,
  outputBytes: 800_000,
  outputLines: 100_000,
};

function cleanString(value: unknown, field: string, max: number, required = true): string {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(400, `Missing field: ${field}`);
    return '';
  }
  if (typeof value !== 'string') throw new HttpError(400, `Invalid field: ${field}`);
  const trimmed = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
  if (required && trimmed.length === 0) throw new HttpError(400, `Missing field: ${field}`);
  if (trimmed.length > max) throw new HttpError(400, `${field} is too long (max ${max} characters)`);
  return trimmed;
}

function cleanNumber(value: unknown, min: number, max: number, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

export function cleanCommand(value: unknown): string {
  const command = cleanString(value, 'command', LIMITS.command, false);
  if (command && !/^[\w./ -]+$/.test(command)) {
    throw new HttpError(400, 'Command contains invalid characters');
  }
  return command;
}

export function cleanOutput(value: unknown): string[] {
  if (value === undefined || value === null) return [];
  const lines = typeof value === 'string' ? value.split('\n') : value;
  if (!Array.isArray(lines)) throw new HttpError(400, 'Invalid field: output');
  if (lines.length > LIMITS.outputLines) throw new HttpError(413, 'Output has too many lines');
  let bytes = 0;
  const result: string[] = [];
  for (const line of lines) {
    if (typeof line !== 'string') throw new HttpError(400, 'Invalid field: output');
    bytes += line.length + 1;
    if (bytes > LIMITS.outputBytes) throw new HttpError(413, 'Output is too large');
    result.push(line);
  }
  return result;
}

export function validateEdgecase(body: any) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  const tags = Array.isArray(body.tags) ? body.tags : [];
  if (tags.length > LIMITS.tags) throw new HttpError(400, `Too many tags (max ${LIMITS.tags})`);
  const cleanTags = Array.from(new Set(tags.filter((t: unknown): t is string => typeof t === 'string' && EDGECASE_TAGS.includes(t))));
  return {
    title: cleanString(body.title, 'title', LIMITS.title),
    description: cleanString(body.description, 'description', LIMITS.description),
    tags: cleanTags,
    command: cleanCommand(body.command),
    instantActionPadding: cleanNumber(body.instantActionPadding, 0, 10),
    dongleCooldown: cleanNumber(body.dongleCooldown, 0, 100000),
    output: cleanOutput(body.output),
  };
}

export function validateRun(body: any) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  const output = cleanOutput(body.output);
  if (output.length === 0) throw new HttpError(400, 'Missing field: output');
  return {
    command: cleanCommand(body.command),
    output,
    instantActionPadding: cleanNumber(body.instantActionPadding, 0, 10),
    dongleCooldown: cleanNumber(body.dongleCooldown, 0, 100000),
  };
}

export function validateComment(body: any) {
  if (!body || typeof body !== 'object') throw new HttpError(400, 'Invalid body');
  return {
    id: cleanString(body.id, 'id', 128),
    text: cleanString(body.text, 'text', LIMITS.comment),
  };
}

export function cleanDocId(value: unknown): string {
  const id = typeof value === 'string' ? value : Array.isArray(value) ? value[0] : '';
  if (!id || !/^[A-Za-z0-9_-]{1,128}$/.test(id)) throw new HttpError(400, 'Invalid id');
  return id;
}

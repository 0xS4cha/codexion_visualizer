export interface SharedRun {
  command: string;
  output: string[];
  instantActionPadding?: number;
  dongleCooldown?: number;
}

const COMPRESSED_PREFIX = "z1.";
export const MAX_URL_LENGTH = 8000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(value: string): Uint8Array {
  const b64 = value.replace(/ /g, "+").replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function pipeThrough(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const response = new Response(new Blob([bytes as BlobPart]).stream().pipeThrough(stream));
  return new Uint8Array(await response.arrayBuffer());
}

function sanitize(value: unknown): SharedRun | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;
  const command = typeof v.command === "string" ? v.command : "";
  const rawOutput = Array.isArray(v.output) ? v.output : typeof v.output === "string" ? v.output.split("\n") : [];
  const output = rawOutput.filter((l): l is string => typeof l === "string");
  const run: SharedRun = { command, output };
  if (typeof v.instantActionPadding === "number" && Number.isFinite(v.instantActionPadding)) run.instantActionPadding = v.instantActionPadding;
  if (typeof v.dongleCooldown === "number" && Number.isFinite(v.dongleCooldown)) run.dongleCooldown = v.dongleCooldown;
  return run;
}

export async function encodeShare(run: SharedRun): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(run));
  if (typeof CompressionStream === "undefined") return bytesToBase64Url(json);
  const compressed = await pipeThrough(json, new CompressionStream("deflate-raw"));
  return COMPRESSED_PREFIX + bytesToBase64Url(compressed);
}

export async function decodeShare(value: string): Promise<SharedRun | null> {
  try {
    if (value.startsWith(COMPRESSED_PREFIX)) {
      const bytes = base64UrlToBytes(value.slice(COMPRESSED_PREFIX.length));
      const json = await pipeThrough(bytes, new DecompressionStream("deflate-raw"));
      return sanitize(JSON.parse(new TextDecoder().decode(json)));
    }
    const bytes = base64UrlToBytes(value);
    return sanitize(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}

export async function buildShareUrl(run: SharedRun, origin: string = window.location.origin): Promise<string> {
  try {
    const response = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(run),
    });
    if (response.ok) {
      const { id } = (await response.json()) as { id?: string };
      if (id) return `${origin}/r/${id}`;
    }
  } catch {
    return `${origin}/?share=${await encodeShare(run)}`;
  }
  return `${origin}/?share=${await encodeShare(run)}`;
}

export async function fetchSharedRun(id: string): Promise<SharedRun | null> {
  const response = await fetch(`/api/runs?id=${encodeURIComponent(id)}`);
  if (!response.ok) return null;
  return sanitize(await response.json());
}

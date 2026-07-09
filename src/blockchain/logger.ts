import { keccak256, toUtf8Bytes } from 'ethers';
import { sha256Hex, stableStringify } from './crypto';
import type { AppLogEntry, LogLevel } from './types';

const STORAGE_KEY = 'iotel:blockchain:logs';

export interface CreateLogInput {
  level: LogLevel;
  event: string;
  source: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export function loadStoredLogs(): AppLogEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as AppLogEntry[];
    return parsed.sort((left, right) => right.clientTimestamp - left.clientTimestamp);
  } catch {
    return [];
  }
}

export function persistLogs(entries: AppLogEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export async function createLogEntry(input: CreateLogInput): Promise<AppLogEntry> {
  const createdAt = new Date().toISOString();
  const clientTimestamp = Date.now();
  const metadata = input.metadata ?? {};
  const canonicalLog = {
    createdAt,
    event: input.event,
    level: input.level,
    message: input.message,
    metadata,
    source: input.source,
  };

  const logHash = await sha256Hex(canonicalLog);
  const metadataHash = await sha256Hex(metadata);
  const recordId = keccak256(
    toUtf8Bytes(`${input.source}:${input.event}:${createdAt}:${stableStringify(metadata)}:${logHash}`)
  ) as `0x${string}`;

  return {
    recordId,
    logHash,
    metadataHash,
    createdAt,
    clientTimestamp,
    level: input.level,
    event: input.event,
    source: input.source,
    message: input.message,
    metadata,
    anchorStatus: 'captured',
  };
}

export function upsertLog(entries: AppLogEntry[], nextEntry: AppLogEntry): AppLogEntry[] {
  const map = new Map(entries.map((entry) => [entry.recordId, entry]));
  map.set(nextEntry.recordId, nextEntry);
  return Array.from(map.values()).sort((left, right) => right.clientTimestamp - left.clientTimestamp);
}

export function updateLogStatus(
  entries: AppLogEntry[],
  recordId: string,
  update: Partial<AppLogEntry>
): AppLogEntry[] {
  return entries.map((entry) => (entry.recordId === recordId ? { ...entry, ...update } : entry));
}

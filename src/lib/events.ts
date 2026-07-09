// Pure, DOM-free helpers for shaping Firebase event/state data.
// Extracted from App.tsx so they can be unit-tested with Vitest.
import { AUTH_EVENTS } from '../generated/protocol';

export interface DeviceState {
  valve_pct: number;
  valve_angle: number;
  pump: 'ON' | 'OFF';
  fan: 'ON' | 'OFF';
}

export interface EventItem {
  timestamp: string;
  event: string;
  data?: {
    uid?: string;
    machine?: string;
    cmd?: string;
    position?: number;
    servo_angle?: number;
    reason?: string;
    msg?: string;
  };
}

export interface EventWithKey extends EventItem {
  key: string;
}

export interface StatusTone {
  label: string;
  bg: string;
  fg: string;
  darkFg: string;
}

export function formatTimestamp(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return timestamp || '—';
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

export function formatTimeOnly(timestamp: string): string {
  const d = new Date(timestamp);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

const AUTH_EVENT_SET: ReadonlySet<string> = new Set(AUTH_EVENTS);

export function isAuthEvent(name: string): boolean {
  return AUTH_EVENT_SET.has(name);
}

/** Newest-first list of events with their push-id key attached. */
export function sortEvents(events: Record<string, EventItem> | null | undefined): EventWithKey[] {
  if (!events) return [];
  return Object.entries(events)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** The most recent authentication/session event, or null. */
export function latestAuthEvent(list: EventWithKey[]): EventWithKey | null {
  return list.find((e) => isAuthEvent(e.event)) ?? null;
}

export function getStatusTone(eventName?: string): StatusTone {
  switch (eventName) {
    case 'AUTH_OK':
      return { label: 'Authenticated', bg: 'rgba(52, 211, 153, 0.16)', fg: '#047857', darkFg: '#6ee7b7' };
    case 'AUTH_FAIL':
    case 'AUTH_TIMEOUT':
    case 'SESSION_CLOSED':
      return { label: eventName.replaceAll('_', ' '), bg: 'rgba(244, 114, 182, 0.16)', fg: '#be185d', darkFg: '#f9a8d4' };
    default:
      return { label: 'Unknown', bg: 'rgba(148, 163, 184, 0.16)', fg: '#475569', darkFg: '#cbd5e1' };
  }
}

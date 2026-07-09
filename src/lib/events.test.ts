import { describe, it, expect } from 'vitest';
import {
  sortEvents,
  latestAuthEvent,
  getStatusTone,
  isAuthEvent,
  formatTimestamp,
  formatTimeOnly,
  type EventItem,
} from './events';

const sample: Record<string, EventItem> = {
  a: { timestamp: '2026-06-26T10:30:00.000Z', event: 'AUTH_OK', data: { uid: '81073266' } },
  b: { timestamp: '2026-06-26T10:31:10.000Z', event: 'VALVE_ANGLE_SET', data: { position: 50, servo_angle: 90 } },
  c: { timestamp: '2026-06-26T10:32:00.000Z', event: 'SESSION_CLOSED', data: { uid: '81073266' } },
};

describe('sortEvents', () => {
  it('returns newest-first with keys attached', () => {
    const list = sortEvents(sample);
    expect(list.map((e) => e.key)).toEqual(['c', 'b', 'a']);
    expect(list[0].event).toBe('SESSION_CLOSED');
  });

  it('handles null/empty', () => {
    expect(sortEvents(null)).toEqual([]);
    expect(sortEvents({})).toEqual([]);
  });
});

describe('latestAuthEvent', () => {
  it('finds the most recent auth/session event', () => {
    const list = sortEvents(sample);
    expect(latestAuthEvent(list)?.event).toBe('SESSION_CLOSED');
  });

  it('returns null when no auth events exist', () => {
    const list = sortEvents({ b: sample.b });
    expect(latestAuthEvent(list)).toBeNull();
  });
});

describe('isAuthEvent', () => {
  it('recognizes auth/session events from the generated protocol', () => {
    expect(isAuthEvent('AUTH_OK')).toBe(true);
    expect(isAuthEvent('SESSION_CLOSED')).toBe(true);
    expect(isAuthEvent('VALVE_ANGLE_SET')).toBe(false);
  });
});

describe('getStatusTone', () => {
  it('labels AUTH_OK as Authenticated', () => {
    expect(getStatusTone('AUTH_OK').label).toBe('Authenticated');
  });
  it('humanizes failure events', () => {
    expect(getStatusTone('AUTH_TIMEOUT').label).toBe('AUTH TIMEOUT');
  });
  it('falls back to Unknown', () => {
    expect(getStatusTone(undefined).label).toBe('Unknown');
  });
});

describe('timestamp formatters', () => {
  it('do not throw on invalid input', () => {
    expect(formatTimestamp('not-a-date')).toBe('not-a-date');
    expect(formatTimeOnly('not-a-date')).toBe('—');
  });
});

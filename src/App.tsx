import React, { useState, useEffect } from 'react';
import {
  Fan,
  Droplets,
  Zap,
  Activity,
  Thermometer,
  Shield,
  Sun,
  Moon,
  Database,
  RefreshCw,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Radio,
} from 'lucide-react';
import { Card } from './components/Card';

const BASE_URL = 'https://iotel-ea41a-default-rtdb.firebaseio.com';
const AUTH_EVENTS = ['AUTH_OK', 'AUTH_FAIL', 'AUTH_TIMEOUT', 'SESSION_CLOSED'] as const;

const palette = {
  accent: '#8B5CF6',
  secondary: '#F472B6',
  tertiary: '#FBBF24',
  quaternary: '#34D399',
  ink: 'rgb(var(--color-foreground))',
  softText: 'rgb(var(--color-muted-foreground))',
  muted: 'rgb(var(--color-muted))',
  card: 'rgb(var(--color-card))',
  border: 'rgb(var(--color-border))',
};

interface DeviceState {
  valve_pct: number;
  valve_angle: number;
  pump: 'ON' | 'OFF';
  fan: 'ON' | 'OFF';
}

interface EventItem {
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

interface EventWithKey extends EventItem {
  key: string;
}

function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
}

function formatTimeOnly(timestamp: string) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));
}

function getStatusTone(eventName?: string) {
  switch (eventName) {
    case 'AUTH_OK':
      return {
        label: 'Authenticated',
        bg: 'rgba(52, 211, 153, 0.16)',
        fg: '#047857',
        darkFg: '#6ee7b7',
      };
    case 'AUTH_FAIL':
    case 'AUTH_TIMEOUT':
    case 'SESSION_CLOSED':
      return {
        label: eventName.replaceAll('_', ' '),
        bg: 'rgba(244, 114, 182, 0.16)',
        fg: '#be185d',
        darkFg: '#f9a8d4',
      };
    default:
      return {
        label: 'Unknown',
        bg: 'rgba(148, 163, 184, 0.16)',
        fg: '#475569',
        darkFg: '#cbd5e1',
      };
  }
}

const App = () => {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<Record<string, EventItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('darkMode');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const fetchData = async () => {
    try {
      setError(null);
      const [stateRes, eventsRes] = await Promise.all([
        fetch(`${BASE_URL}/device_state.json`),
        fetch(`${BASE_URL}/events.json?orderBy="$key"&limitToLast=20`),
      ]);

      if (!stateRes.ok || !eventsRes.ok) {
        throw new Error('Could not load live data from Firebase.');
      }

      const stateData = await stateRes.json();
      const eventsData = await eventsRes.json();
      setDeviceState(stateData);
      setEvents(eventsData ?? {});
      setLastUpdated(new Date().toISOString());
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const eventsList: EventWithKey[] = events
    ? Object.entries(events)
        .map(([key, value]) => ({ key, ...value }))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    : [];

  const latestAuthEvent = eventsList.find((event) => AUTH_EVENTS.includes(event.event as (typeof AUTH_EVENTS)[number])) ?? null;
  const latestUid = latestAuthEvent?.data?.uid ?? 'N/A';
  const authTone = getStatusTone(latestAuthEvent?.event);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgb(var(--color-background))',
          color: 'rgb(var(--color-foreground))',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: 'min(440px, 100%)',
            backgroundColor: palette.card,
            border: `2px solid ${palette.ink}`,
            borderRadius: '24px',
            boxShadow: 'var(--shadow-accent)',
            padding: '28px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '999px',
              backgroundColor: 'rgba(139, 92, 246, 0.14)',
              marginBottom: '16px',
              fontWeight: 700,
            }}
          >
            <RefreshCw size={16} strokeWidth={2.5} />
            Syncing test cloud
          </div>
          <h1 style={{ margin: 0, fontSize: '2rem' }}>Preparing the live dashboard</h1>
          <p style={{ margin: '12px 0 0', color: palette.softText }}>
            Pulling `device_state` and the latest 20 `events` from Firebase.
          </p>
        </div>
      </div>
    );
  }

  const statusChipStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '86px',
    padding: '8px 14px',
    borderRadius: '999px',
    border: `2px solid ${palette.ink}`,
    backgroundColor: isActive ? palette.quaternary : palette.muted,
    color: isActive ? '#052e2b' : palette.softText,
    fontWeight: 800,
    letterSpacing: '0.04em',
    fontSize: '0.86rem',
  });

  const dataPills = (event: EventItem) => {
    const entries = [
      ['UID', event.data?.uid],
      ['Machine', event.data?.machine],
      ['Cmd', event.data?.cmd],
      ['Position', event.data?.position?.toString()],
      ['Servo', event.data?.servo_angle != null ? `${event.data.servo_angle}°` : undefined],
      ['Reason', event.data?.reason ?? event.data?.msg],
    ].filter(([, value]) => value);

    if (!entries.length) {
      return null;
    }

    return (
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginTop: '8px',
        }}
      >
        {entries.map(([label, value]) => (
          <span
            key={`${label}-${value}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 10px',
              borderRadius: '999px',
              backgroundColor: palette.muted,
              border: `2px solid ${palette.border}`,
              color: palette.ink,
              fontSize: '0.8rem',
              fontWeight: 700,
            }}
          >
            <span style={{ color: palette.softText }}>{label}</span>
            <span>{value}</span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div
      className="dotted-paper"
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'rgb(var(--color-background))',
        color: 'rgb(var(--color-foreground))',
        transition: 'all 0.3s',
      }}
    >
      <div
        className="confetti-shape"
        style={{
          top: '-90px',
          left: '-80px',
          width: '360px',
          height: '360px',
          backgroundColor: palette.tertiary,
          opacity: 0.24,
          borderRadius: '999px',
        }}
      />
      <div
        className="confetti-shape"
        style={{
          top: '140px',
          right: '-60px',
          width: '280px',
          height: '280px',
          backgroundColor: palette.secondary,
          opacity: 0.18,
          borderRadius: '44% 56% 71% 29% / 40% 42% 58% 60%',
        }}
      />
      <div
        className="confetti-shape"
        style={{
          bottom: '100px',
          left: '40px',
          width: '220px',
          height: '220px',
          backgroundColor: palette.accent,
          opacity: 0.12,
          borderRadius: '999px 999px 0 999px',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: '1200px', margin: '0 auto', padding: '32px 20px 72px' }}>
        <header
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto',
            gap: '20px',
            alignItems: 'start',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              backgroundColor: palette.card,
              border: `2px solid ${palette.ink}`,
              borderRadius: '28px',
              boxShadow: 'var(--shadow-neutral)',
              padding: '28px',
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '18px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(139, 92, 246, 0.14)',
                  border: `2px solid ${palette.ink}`,
                  fontWeight: 800,
                }}
              >
                <Radio size={16} strokeWidth={2.5} />
                Live test cloud
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 14px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(52, 211, 153, 0.14)',
                  border: `2px solid ${palette.ink}`,
                  fontWeight: 800,
                }}
              >
                <RefreshCw size={16} strokeWidth={2.5} />
                Refresh every 5s
              </span>
            </div>
            <div style={{ display: 'flex', gap: '18px', alignItems: 'center' }}>
              <div
                className="pop-shadow"
                style={{
                  width: '76px',
                  height: '76px',
                  flexShrink: 0,
                  backgroundColor: palette.accent,
                  borderRadius: '24px 24px 24px 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `2px solid ${palette.ink}`,
                }}
              >
                <Activity size={34} color="#fff" strokeWidth={2.5} />
              </div>
              <div>
                <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 5vw, 4.4rem)' }}>IoT Control View</h1>
                <p style={{ margin: '10px 0 0', maxWidth: '720px', color: palette.softText, fontSize: '1.02rem' }}>
                  A playful live dashboard for valve position, servo angle, pump and fan state, plus the last 20 Firebase events.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggleDarkMode}
            className="bounce-transition"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '62px',
              height: '62px',
              borderRadius: '999px',
              backgroundColor: palette.accent,
              color: '#fff',
              border: `2px solid ${palette.ink}`,
              boxShadow: 'var(--shadow-pop)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-pop-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = '';
              e.currentTarget.style.boxShadow = 'var(--shadow-pop)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'translate(2px, 2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-pop-active)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'translate(-2px, -2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-pop-hover)';
            }}
          >
            {darkMode ? <Sun size={24} strokeWidth={2.5} /> : <Moon size={24} strokeWidth={2.5} />}
          </button>
        </header>

        {error && (
          <div
            style={{
              marginBottom: '28px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backgroundColor: 'rgba(244, 114, 182, 0.14)',
              border: `2px solid ${palette.ink}`,
              borderRadius: '20px',
              padding: '16px 18px',
              boxShadow: 'var(--shadow-secondary)',
            }}
          >
            <CircleAlert size={20} strokeWidth={2.5} color={palette.secondary} />
            <span style={{ fontWeight: 700 }}>{error}</span>
          </div>
        )}

        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '999px', backgroundColor: palette.accent }} />
            <h2 style={{ margin: 0, fontSize: '1.9rem' }}>Current System Status</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '24px' }}>
            <Card
              title="Authentication"
              icon={<Shield size={24} strokeWidth={2.5} />}
              color="accent"
            >
              <div style={{ display: 'grid', gap: '14px' }}>
                <div className="surface-panel" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', color: palette.softText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                        Session state
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 800 }}>
                        {latestAuthEvent?.event ?? 'No auth event'}
                      </div>
                    </div>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderRadius: '999px',
                        backgroundColor: authTone.bg,
                        color: document.documentElement.classList.contains('dark') ? authTone.darkFg : authTone.fg,
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {authTone.label}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="surface-panel" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: palette.softText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                      Latest UID
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '1.15rem', fontWeight: 800, fontFamily: 'monospace' }}>{latestUid}</div>
                  </div>
                  <div className="surface-panel" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.82rem', color: palette.softText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                      Last refresh
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 800 }}>
                      {lastUpdated ? formatTimeOnly(lastUpdated) : 'Pending'}
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card
              title="Data Source"
              icon={<Database size={24} strokeWidth={2.5} />}
              color="tertiary"
            >
              <div style={{ display: 'grid', gap: '14px' }}>
                <div className="surface-panel" style={{ padding: '16px' }}>
                  <div style={{ fontSize: '0.82rem', color: palette.softText, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                    Firebase RTDB
                  </div>
                  <div style={{ marginTop: '10px', fontWeight: 700, wordBreak: 'break-all' }}>{BASE_URL}</div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  <span style={statusChipStyle(true)}>Read only</span>
                  <span style={statusChipStyle(true)}>Live REST</span>
                  <span style={statusChipStyle(!error)}>{error ? 'Degraded' : 'Healthy'}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '999px', backgroundColor: palette.quaternary }} />
            <h2 style={{ margin: 0, fontSize: '1.9rem' }}>Machine Cards</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            <Card
              title="Fan"
              icon={<Fan size={24} strokeWidth={2.5} />}
              color="accent"
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ fontSize: '0.92rem', color: palette.softText }}>Current fan relay state from `device_state`.</div>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>{deviceState?.fan ?? 'N/A'}</div>
                    <div style={{ marginTop: '8px', color: palette.softText }}>Cooling support</div>
                  </div>
                  <span style={statusChipStyle(deviceState?.fan === 'ON')}>{deviceState?.fan ?? 'N/A'}</span>
                </div>
              </div>
            </Card>
            <Card
              title="Pump"
              icon={<Droplets size={24} strokeWidth={2.5} />}
              color="secondary"
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ fontSize: '0.92rem', color: palette.softText }}>Current pump relay state from `device_state`.</div>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '2.1rem', fontWeight: 800, lineHeight: 1 }}>{deviceState?.pump ?? 'N/A'}</div>
                    <div style={{ marginTop: '8px', color: palette.softText }}>Flow assist</div>
                  </div>
                  <span style={statusChipStyle(deviceState?.pump === 'ON')}>{deviceState?.pump ?? 'N/A'}</span>
                </div>
              </div>
            </Card>
            <Card
              title="Valve %"
              icon={<Zap size={24} strokeWidth={2.5} />}
              color="tertiary"
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '2.35rem', fontWeight: 800, lineHeight: 1 }}>{deviceState?.valve_pct ?? 0}%</div>
                    <div style={{ marginTop: '8px', color: palette.softText }}>Valve opening</div>
                  </div>
                  <CircleCheckBig size={26} strokeWidth={2.5} color={palette.tertiary} />
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '18px',
                    backgroundColor: palette.muted,
                    borderRadius: '999px',
                    border: `2px solid ${palette.ink}`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${deviceState?.valve_pct ?? 0}%`,
                      height: '100%',
                      background:
                        'repeating-linear-gradient(45deg, #fbbf24 0, #fbbf24 10px, #f59e0b 10px, #f59e0b 20px)',
                      transition: 'width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: palette.softText, fontSize: '0.85rem', fontWeight: 700 }}>
                  <span>Closed</span>
                  <span>Open</span>
                </div>
              </div>
            </Card>
            <Card
              title="Valve Angle"
              icon={<Thermometer size={24} strokeWidth={2.5} />}
              color="quaternary"
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ fontSize: '2.35rem', fontWeight: 800, lineHeight: 1 }}>{deviceState?.valve_angle ?? 0}°</div>
                    <div style={{ marginTop: '8px', color: palette.softText }}>Servo angle</div>
                  </div>
                  <div
                    style={{
                      minWidth: '78px',
                      textAlign: 'center',
                      padding: '10px 12px',
                      borderRadius: '18px',
                      backgroundColor: 'rgba(52, 211, 153, 0.15)',
                      border: `2px solid ${palette.ink}`,
                      fontWeight: 800,
                    }}
                  >
                    {Math.round(((deviceState?.valve_angle ?? 0) / 180) * 100)}%
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '999px', backgroundColor: palette.secondary }} />
              <h2 style={{ margin: 0, fontSize: '1.9rem' }}>Recent Activity</h2>
            </div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: palette.softText, fontWeight: 700 }}>
              <Clock3 size={16} strokeWidth={2.5} />
              Showing last {eventsList.length} events
            </div>
          </div>
          <Card color="secondary">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '460px', overflowY: 'auto', paddingRight: '4px' }}>
              {eventsList.map((event) => (
                <div
                  key={event.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    border: `2px solid ${palette.border}`,
                    borderRadius: '18px',
                    transition: 'all 0.3s',
                    backgroundColor: 'rgb(var(--color-card-soft))',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.backgroundColor = palette.muted;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.backgroundColor = 'rgb(var(--color-card-soft))';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '14px',
                          height: '14px',
                          backgroundColor: palette.accent,
                          borderRadius: '999px',
                          marginTop: '4px',
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem' }}>{event.event}</div>
                        <div style={{ fontSize: '0.85rem', color: palette.softText, marginTop: '4px' }}>{event.key}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>{formatTimestamp(event.timestamp)}</div>
                      <div style={{ fontSize: '0.82rem', color: palette.softText, marginTop: '4px' }}>
                        {lastUpdated ? `Refreshed ${formatTimeOnly(lastUpdated)}` : 'Live'}
                      </div>
                    </div>
                  </div>
                  {dataPills(event)}
                </div>
              ))}
              {eventsList.length === 0 && (
                <div style={{ textAlign: 'center', color: palette.softText, padding: '32px' }}>
                  No events found
                </div>
              )}
            </div>
          </Card>
        </section>

        <footer
          style={{
            marginTop: '56px',
            paddingTop: '28px',
            borderTop: `2px dashed ${palette.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            color: palette.softText,
          }}
        >
          <p style={{ margin: 0 }}>Built in the Playful Geometric style for the IoTEL test database.</p>
          <p style={{ margin: 0 }}>Realtime REST endpoints · read-only dashboard</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

import React, { useState, useEffect } from 'react';
import {
  Fan,
  Droplets,
  Zap,
  Activity,
  Thermometer,
  Clock,
  Smartphone,
  Shield,
} from 'lucide-react';
import { Card } from './components/Card';

const BASE_URL = "https://iotel-ea41a-default-rtdb.firebaseio.com";

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

const App = () => {
  const [deviceState, setDeviceState] = useState<DeviceState | null>(null);
  const [events, setEvents] = useState<Record<string, EventItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [stateRes, eventsRes] = await Promise.all([
        fetch(`${BASE_URL}/device_state.json`),
        fetch(`${BASE_URL}/events.json?orderBy="$key"&limitToLast=20`),
      ]);
      const stateData = await stateRes.json();
      const eventsData = await eventsRes.json();
      setDeviceState(stateData);
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (ts: string) => {
    return new Date(ts).toLocaleString();
  };

  const getAuthEvent = () => {
    if (!events) return null;
    const authEvents = Object.values(events).filter((e) =>
      ['AUTH_OK', 'AUTH_FAIL', 'AUTH_TIMEOUT', 'SESSION_CLOSED'].includes(e.event)
    ).reverse();
    return authEvents[0] || null;
  };

  const getLatestUid = () => {
    const authEvent = getAuthEvent();
    return authEvent?.data?.uid || 'N/A';
  };

  const eventsList = events ? Object.entries(events)
    .sort((a, b) => new Date(b[1].timestamp).getTime() - new Date(a[1].timestamp).getTime())
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-tertiary opacity-20 rounded-full" />
      <div className="absolute top-40 -right-20 w-80 h-80 bg-secondary opacity-15 rounded-t-full" />
      <div className="absolute bottom-20 left-20 w-64 h-64 bg-accent opacity-10 rounded-l-full" />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <header className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center border-2 border-foreground pop-shadow">
              <Activity className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-5xl font-extrabold">IoT Dashboard</h1>
              <p className="text-muted-foreground mt-1">Real-time monitoring for iotel</p>
            </div>
          </div>
        </header>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-3 h-3 bg-accent rounded-full" />
            System Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card
              title="Authentication & Session"
              icon={<Shield className="w-6 h-6" strokeWidth={2.5} />}
              color="accent"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-quaternary rounded-full flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-medium">Session Status</span>
                  </div>
                  <span className="text-xl font-bold">
                    {getAuthEvent()?.event || 'N/A'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </div>
                    <span className="font-medium">Latest UID</span>
                  </div>
                  <span className="text-xl font-bold font-mono">{getLatestUid()}</span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-3 h-3 bg-quaternary rounded-full" />
            Machine Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card
              title="Fan"
              icon={<Fan className="w-6 h-6" strokeWidth={2.5} />}
              color="accent"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Current State</span>
                <span
                  className={`text-2xl font-bold ${
                    deviceState?.fan === 'ON' ? 'text-quaternary' : 'text-muted-foreground'
                  }`}
                >
                  {deviceState?.fan || 'N/A'}
                </span>
              </div>
            </Card>

            <Card
              title="Pump"
              icon={<Droplets className="w-6 h-6" strokeWidth={2.5} />}
              color="secondary"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Current State</span>
                <span
                  className={`text-2xl font-bold ${
                    deviceState?.pump === 'ON' ? 'text-quaternary' : 'text-muted-foreground'
                  }`}
                >
                  {deviceState?.pump || 'N/A'}
                </span>
              </div>
            </Card>

            <Card
              title="Valve %"
              icon={<Zap className="w-6 h-6" strokeWidth={2.5} />}
              color="tertiary"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium">Opening</span>
                  <span className="text-2xl font-bold">{deviceState?.valve_pct || 0}%</span>
                </div>
                <div className="w-full h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-tertiary"
                    style={{ width: `${deviceState?.valve_pct || 0}%` }}
                  />
                </div>
              </div>
            </Card>

            <Card
              title="Valve Angle"
              icon={<Thermometer className="w-6 h-6" strokeWidth={2.5} />}
              color="quaternary"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium">Servo</span>
                <span className="text-2xl font-bold">{deviceState?.valve_angle || 0}°</span>
              </div>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="w-3 h-3 bg-secondary rounded-full" />
            Recent Activity
          </h2>
          <Card color="secondary">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {eventsList.map(([key, event]) => (
                <div
                  key={key}
                  className="bounce-transition flex flex-col gap-2 p-4 border-2 border-border rounded-lg hover:bg-muted"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 bg-accent rounded-full" />
                      <span className="font-bold">{event.event}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                  {event.data && Object.keys(event.data).length > 0 && (
                    <div className="text-sm text-muted-foreground font-mono ml-7">
                      {JSON.stringify(event.data, null, 2)}
                    </div>
                  )}
                </div>
              ))}
              {eventsList.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No events found
                </div>
              )}
            </div>
          </Card>
        </section>

        <footer className="mt-24 pt-8 border-t-2 border-border text-center text-muted-foreground">
          <p>Built with the Playful Geometric design system</p>
        </footer>
      </div>
    </div>
  );
};

export default App;

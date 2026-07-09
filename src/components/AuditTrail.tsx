import React, { useEffect, useState } from 'react';
import { ShieldCheck, Link2, CircleCheckBig, CircleAlert, Loader } from 'lucide-react';
import { Card } from './Card';
import type { EventWithKey } from '../lib/events';
import { createLogEntry } from '../blockchain/logger';
import type { AppLogEntry, LogLevel } from '../blockchain/types';
import {
  connectWallet,
  anchorEntry,
  verifyEntry,
  hasWallet,
  switchChain,
  firstDeployedChainId,
  type WalletConnection,
} from '../blockchain/anchor';

const MAX_ROWS = 6;

function levelFor(name: string): LogLevel {
  if (name === 'AUTH_OK') return 'success';
  if (name === 'AUTH_FAIL' || name === 'AUTH_TIMEOUT') return 'warn';
  if (name === 'NACK' || name === 'EMERGENCY_STOP') return 'error';
  return 'info';
}

const short = (hex: string) => (hex.length > 14 ? `${hex.slice(0, 8)}…${hex.slice(-4)}` : hex);

interface Props {
  events: EventWithKey[];
  palette: { softText: string; muted: string; border: string; ink: string };
}

export const AuditTrail = ({ events, palette }: Props) => {
  const [entries, setEntries] = useState<Record<string, AppLogEntry>>({});
  const [status, setStatus] = useState<Record<string, string>>({});
  const [conn, setConn] = useState<WalletConnection | null>(null);
  const [note, setNote] = useState<string>('');
  const [busy, setBusy] = useState(false);

  const rows = events.slice(0, MAX_ROWS);

  // Derive a hashed log entry for each event once (cached by push-id key).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const ev of rows) {
        if (entries[ev.key]) continue;
        const entry = await createLogEntry({
          level: levelFor(ev.event),
          event: ev.event,
          source: 'firebase',
          message: `${ev.event} @ ${ev.timestamp}`,
          metadata: (ev.data ?? {}) as Record<string, unknown>,
        });
        if (cancelled) return;
        setEntries((prev) => (prev[ev.key] ? prev : { ...prev, [ev.key]: entry }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows.map((r) => r.key).join(',')]);

  const onConnect = async () => {
    setBusy(true);
    setNote('');
    try {
      const c = await connectWallet();
      setConn(c);
      setNote(
        c.contractAddress
          ? `Connected ${short(c.address)} · chain ${c.chainId} · contract ${short(c.contractAddress)}`
          : `Connected ${short(c.address)} · chain ${c.chainId} · contract NOT deployed here`,
      );
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Wallet connection failed.');
    } finally {
      setBusy(false);
    }
  };

  const deployedChain = firstDeployedChainId();
  const wrongChain = conn !== null && !conn.contractAddress && deployedChain !== null;

  const onSwitch = async () => {
    if (deployedChain === null) return;
    setBusy(true);
    setNote('');
    try {
      await switchChain(deployedChain);
      await onConnect(); // re-read chain + contract after the switch
    } catch (e) {
      setNote(e instanceof Error ? e.message : 'Network switch failed.');
    } finally {
      setBusy(false);
    }
  };

  const withConn = async (key: string, fn: (c: WalletConnection, e: AppLogEntry) => Promise<string>) => {
    const entry = entries[key];
    if (!entry) return;
    if (!conn) {
      setStatus((p) => ({ ...p, [key]: 'Connect a wallet first.' }));
      return;
    }
    setStatus((p) => ({ ...p, [key]: '…working' }));
    try {
      const result = await fn(conn, entry);
      setStatus((p) => ({ ...p, [key]: result }));
    } catch (e) {
      setStatus((p) => ({ ...p, [key]: e instanceof Error ? e.message : 'Failed.' }));
    }
  };

  const onAnchor = (key: string) =>
    withConn(key, async (c, e) => `Anchored · tx ${short(await anchorEntry(c, e))}`);

  const onVerify = (key: string) =>
    withConn(key, async (c, e) => {
      const r = await verifyEntry(c, e);
      return r.success ? '✓ verified on-chain' : '✗ not anchored / altered';
    });

  const pill: React.CSSProperties = {
    fontFamily: 'monospace',
    fontSize: '0.78rem',
    padding: '3px 8px',
    borderRadius: '8px',
    backgroundColor: palette.muted,
    border: `1px solid ${palette.border}`,
  };
  const btn: React.CSSProperties = {
    fontSize: '0.78rem',
    fontWeight: 800,
    padding: '6px 10px',
    borderRadius: '10px',
    border: `2px solid ${palette.ink}`,
    background: 'transparent',
    color: 'inherit',
    cursor: 'pointer',
  };

  return (
    <Card title="On-chain Audit Trail" icon={<ShieldCheck size={24} strokeWidth={2.5} />} color="quaternary">
      <div style={{ display: 'grid', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button type="button" style={btn} onClick={onConnect} disabled={busy}>
            {busy ? <Loader size={14} /> : <Link2 size={14} />} {conn ? 'Reconnect wallet' : 'Connect wallet'}
          </button>
          {wrongChain && (
            <button
              type="button"
              style={{ ...btn, borderColor: '#be185d', color: '#be185d' }}
              onClick={onSwitch}
              disabled={busy}
            >
              Switch to chain {deployedChain}
            </button>
          )}
          {!hasWallet() && (
            <span style={{ color: palette.softText, fontSize: '0.85rem' }}>
              No wallet detected — install MetaMask to anchor/verify.
            </span>
          )}
          {note && <span style={{ color: palette.softText, fontSize: '0.85rem' }}>{note}</span>}
        </div>

        <div style={{ fontSize: '0.85rem', color: palette.softText }}>
          Each recent event is hashed into a tamper-evident record (SHA-256 log +
          metadata, keccak record id). Anchor stores the hash in{' '}
          <code>LogAnchor.sol</code>; verify re-checks it on-chain.
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {rows.map((ev) => {
            const entry = entries[ev.key];
            const st = status[ev.key];
            const good = st?.startsWith('✓') || st?.startsWith('Anchored');
            const bad = st?.startsWith('✗') || st?.includes('Failed') || st?.includes('not');
            return (
              <div
                key={ev.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  flexWrap: 'wrap',
                  padding: '10px',
                  border: `1px solid ${palette.border}`,
                  borderRadius: '12px',
                }}
              >
                <span style={{ fontWeight: 800, minWidth: '120px' }}>{ev.event}</span>
                <span style={pill}>id {entry ? short(entry.recordId) : '…'}</span>
                <span style={pill}>log {entry ? short(entry.logHash) : '…'}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <button type="button" style={btn} onClick={() => onAnchor(ev.key)} disabled={!entry}>
                    Anchor
                  </button>
                  <button type="button" style={btn} onClick={() => onVerify(ev.key)} disabled={!entry}>
                    Verify
                  </button>
                </div>
                {st && (
                  <span
                    style={{
                      width: '100%',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: good ? '#059669' : bad ? '#be185d' : palette.softText,
                    }}
                  >
                    {good ? <CircleCheckBig size={14} /> : bad ? <CircleAlert size={14} /> : null}
                    {st}
                  </span>
                )}
              </div>
            );
          })}
          {rows.length === 0 && (
            <div style={{ color: palette.softText, padding: '12px' }}>No events to anchor yet.</div>
          )}
        </div>
      </div>
    </Card>
  );
};

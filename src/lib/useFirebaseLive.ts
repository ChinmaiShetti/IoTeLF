import { useEffect, useRef } from 'react';

/**
 * Subscribe to Firebase RTDB REST streaming (Server-Sent Events) so the UI
 * updates the instant device_state or events change, instead of waiting for
 * the next poll. Firebase serves SSE to EventSource clients on any `.json`
 * endpoint, emitting `put`/`patch` messages.
 *
 * This is best-effort: if EventSource is unavailable or errors, the caller's
 * polling interval still keeps the dashboard current. `onChange` is called on
 * every relevant stream message (the caller then re-fetches canonical data).
 */
export function useFirebaseLive(baseUrl: string, paths: string[], onChange: () => void) {
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  const key = `${baseUrl}::${paths.join(',')}`;

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;

    const sources: EventSource[] = [];
    for (const path of paths) {
      let es: EventSource;
      try {
        es = new EventSource(`${baseUrl}${path}`);
      } catch {
        continue;
      }
      const handle = (ev: MessageEvent) => {
        // Firebase sends `keep-alive` (no data) and `cancel`/`auth_revoked`.
        // Only react to actual data mutations (`put`/`patch`).
        if (ev.type === 'put' || ev.type === 'patch') cbRef.current();
      };
      es.addEventListener('put', handle as EventListener);
      es.addEventListener('patch', handle as EventListener);
      sources.push(es);
    }

    return () => sources.forEach((s) => s.close());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

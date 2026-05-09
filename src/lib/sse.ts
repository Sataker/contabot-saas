type Listener = (data: string) => void;

const emitters = new Map<string, Set<Listener>>();

export function broadcast(tenantId: string, event: string, data: unknown) {
  const listeners = emitters.get(tenantId);
  if (!listeners) return;
  const payload = JSON.stringify({ event, data, timestamp: Date.now() });
  listeners.forEach((fn) => fn(payload));
}

export function subscribe(tenantId: string, callback: Listener) {
  if (!emitters.has(tenantId)) emitters.set(tenantId, new Set());
  emitters.get(tenantId)!.add(callback);
  return () => {
    emitters.get(tenantId)?.delete(callback);
  };
}

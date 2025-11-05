type Handler = (...args: any[]) => void;

const listeners: Record<string, Set<Handler>> = {};

export function on(event: string, handler: Handler) {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(handler);
  return () => off(event, handler);
}

export function off(event: string, handler: Handler) {
  listeners[event]?.delete(handler);
}

export function emit(event: string, ...args: any[]) {
  listeners[event]?.forEach((h) => {
    try { h(...args); } catch (e) { console.error('Event handler error', e); }
  });
}

export default { on, off, emit };

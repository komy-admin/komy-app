type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export const navigationEvents = {
  emit(route: string) {
    listeners.get(route)?.forEach((fn) => fn());
  },
  on(route: string, fn: Listener) {
    if (!listeners.has(route)) listeners.set(route, new Set());
    listeners.get(route)!.add(fn);
    return () => { listeners.get(route)?.delete(fn); };
  },
};

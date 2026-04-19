import React, { createContext, useContext, useCallback } from 'react';
import { useSyncExternalStore } from 'react';
import { ToastType, ToastData, ToastStack, DEFAULT_DURATIONS } from './ui/toast';

const MAX_TOASTS = 3;

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/** Simple external store to avoid re-render hack */
function createToastStore() {
  let toasts: ToastData[] = [];
  let idCounter = 0;
  const listeners = new Set<() => void>();

  const notify = () => listeners.forEach((l) => l());

  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => toasts,
    add: (message: string, type: ToastType, duration: number) => {
      // Dedup: if same message + type already visible, increment count & refresh
      const existing = toasts.find((t) => t.message === message && t.type === type);
      if (existing) {
        toasts = toasts.map((t) =>
          t.id === existing.id ? { ...t, count: t.count + 1, duration } : t
        );
        notify();
        return;
      }

      const id = ++idCounter;
      toasts = [...toasts.slice(-(MAX_TOASTS - 1)), { id, message, type, duration, count: 1 }];
      notify();
    },
    remove: (id: number) => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    },
  };
}

/** Singleton — partagé entre le Provider React et l'accès global (API interceptors) */
const toastStore = createToastStore();

/** Accès global au toast depuis l'extérieur de l'arbre React (ex: axios interceptors) */
export const globalToast = {
  show: (message: string, type: ToastType = 'info', duration?: number) => {
    toastStore.add(message, type, duration ?? DEFAULT_DURATIONS[type]);
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const store = toastStore;

  const toasts = useSyncExternalStore(store.subscribe, store.getSnapshot);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration?: number) => {
      store.add(message, type, duration ?? DEFAULT_DURATIONS[type]);
    },
    [store]
  );

  const handleRemove = useCallback((id: number) => store.remove(id), [store]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastStack toasts={toasts} onRemove={handleRemove} />
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

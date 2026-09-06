"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import ToastStack from "@/components/admin/Toast";

const ToastContext = createContext(null);

let nextId = 0;

/**
 * Toasts appear and disappear instantly — no slide-in, no fade (Phase 4 §0.4).
 * Auto-dismiss after 4s; the stack itself is an aria-live region so a screen
 * reader hears the result of a save without moving focus.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (tone, message) => {
      const id = ++nextId;
      setToasts((list) => [...list, { id, tone, message }]);
      setTimeout(() => dismiss(id), 4000);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

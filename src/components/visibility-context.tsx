"use client";

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";

const STORAGE_KEY = "amounts-hidden";
const CHANGE_EVENT = "amounts-hidden-change";

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

// Hidden by default — only an explicit "0" (the user clicked Show) reveals
// amounts. No stored value at all (first visit) still means hidden.
function getSnapshot() {
  return sessionStorage.getItem(STORAGE_KEY) !== "0";
}

function getServerSnapshot() {
  return true;
}

const VisibilityContext = createContext<{
  hidden: boolean;
  toggle: () => void;
} | null>(null);

export function VisibilityProvider({ children }: { children: React.ReactNode }) {
  const hidden = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = useCallback(() => {
    const currentlyHidden = sessionStorage.getItem(STORAGE_KEY) !== "0";
    sessionStorage.setItem(STORAGE_KEY, currentlyHidden ? "0" : "1");
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  return (
    <VisibilityContext.Provider value={{ hidden, toggle }}>
      {children}
    </VisibilityContext.Provider>
  );
}

export function useVisibility() {
  const ctx = useContext(VisibilityContext);
  if (!ctx) throw new Error("useVisibility must be used within a VisibilityProvider");
  return ctx;
}

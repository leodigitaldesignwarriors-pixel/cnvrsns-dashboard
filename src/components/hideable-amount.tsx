"use client";

import { useVisibility } from "./visibility-context";

export function HideableAmount({ children }: { children: React.ReactNode }) {
  const { hidden } = useVisibility();
  return <>{hidden ? "••••••" : children}</>;
}

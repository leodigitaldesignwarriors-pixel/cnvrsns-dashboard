"use client";

import { Eye, EyeOff } from "lucide-react";
import { useVisibility } from "./visibility-context";

export function EyeToggleButton() {
  const { hidden, toggle } = useVisibility();
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      title={hidden ? "Show amounts" : "Hide amounts"}
    >
      {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      {hidden ? "Show" : "Hide"}
    </button>
  );
}

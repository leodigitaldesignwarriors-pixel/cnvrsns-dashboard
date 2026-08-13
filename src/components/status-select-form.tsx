"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";

export function StatusSelectForm<T extends string>({
  action,
  value,
  options,
  name = "status",
  className,
}: {
  action: (formData: FormData) => void;
  value: T;
  options: { value: T; label: string }[];
  name?: string;
  className?: string;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <form action={action}>
      <select
        name={name}
        defaultValue={value}
        disabled={isPending}
        onChange={(e) => startTransition(() => e.currentTarget.form?.requestSubmit())}
        className={cn(
          "rounded-md border border-slate-300 bg-white px-2 py-1 text-sm shadow-sm disabled:opacity-50",
          className,
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}

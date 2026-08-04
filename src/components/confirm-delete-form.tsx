"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDeleteForm({
  action,
  confirmMessage,
  children = "Delete",
}: {
  action: (formData: FormData) => void;
  confirmMessage: string;
  children?: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-red-600 hover:bg-red-50"
      >
        {children}
      </Button>
    </form>
  );
}

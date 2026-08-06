export function getDeadlineStatus(
  deadline: string | null,
): { label: string; tone: "green" | "red" } | null {
  if (!deadline) return null;
  const today = new Date().toISOString().slice(0, 10);
  return deadline < today
    ? { label: "Overdue", tone: "red" }
    : { label: "On track", tone: "green" };
}

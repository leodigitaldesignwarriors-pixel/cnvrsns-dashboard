export function formatHours(hours: number) {
  return `${hours.toFixed(1)}h`;
}

export function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Monday-start week containing `date` (defaults to today), as [start, end] date keys.
export function weekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}

export function clockedHours(clockIn: string, clockOut: string | null) {
  const end = clockOut ? new Date(clockOut) : new Date();
  const ms = end.getTime() - new Date(clockIn).getTime();
  return Math.max(0, ms / 1000 / 60 / 60);
}

export function daysFromToday(dateKey: string) {
  const today = new Date(todayKey() + "T00:00:00");
  const target = new Date(dateKey + "T00:00:00");
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

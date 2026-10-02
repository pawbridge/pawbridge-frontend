export interface AdminDailyCount { date: string; count: number }

export function kstToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const part = (name: string) => parts.find(value => value.type === name)?.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function shiftDay(date: string, offset: number): string {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function validAdminRange(start: string, end: string): boolean {
  const valid = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  return valid(start) && valid(end) && start <= end && (Date.parse(end) - Date.parse(start)) / 86400000 < 366;
}

// Only call after a successful response. An unavailable response is not a zero series.
export function fillAdminDays(rows: AdminDailyCount[], start: string, end: string): AdminDailyCount[] {
  if (!validAdminRange(start, end)) return [];
  const counts = new Map(rows.map(row => [row.date.slice(0, 10), row.count]));
  const result: AdminDailyCount[] = [];
  for (let date = start; date <= end; date = shiftDay(date, 1)) result.push({ date, count: counts.get(date) ?? 0 });
  return result;
}

export function adminDailyChange(current: number, previous: number, unit = '건'): string {
  const change = current - previous;
  if (!change) return '변동 없음';
  const count = `${change > 0 ? '+' : ''}${change.toLocaleString()}${unit}`;
  return previous === 0 ? `${count} · 비율 비교 불가` : `${count} (${change > 0 ? '+' : ''}${(change / previous * 100).toFixed(1)}%)`;
}

// Legacy signup/collection endpoints return the previous date in their array.
// New bounded APIs supply it separately without requesting a 367th public day.
export function separateAdminPreviousDay(rows: AdminDailyCount[], start: string, end: string) {
  return {
    startDate: start, endDate: end,
    daily: rows.filter(row => row.date.slice(0, 10) >= start && row.date.slice(0, 10) <= end),
    previousDayCount: rows.find(row => row.date.slice(0, 10) === shiftDay(start, -1))?.count ?? 0,
  };
}

export function adminTrendChanges(rows: AdminDailyCount[], previousDayCount: number, unit = '건'): Map<string, string> {
  return new Map(rows.map((row, index) => [row.date, adminDailyChange(row.count, index === 0 ? previousDayCount : rows[index - 1].count, unit)]));
}

export function groupAdminDays(rows: AdminDailyCount[]): { date: string; end: string; count: number }[] {
  const size = rows.length > 90 ? 30 : rows.length > 14 ? 7 : 1;
  const result = [];
  for (let index = 0; index < rows.length; index += size) {
    const group = rows.slice(index, index + size);
    result.push({ date: group[0].date, end: group[group.length - 1].date, count: group.reduce((sum, item) => sum + item.count, 0) });
  }
  return result;
}

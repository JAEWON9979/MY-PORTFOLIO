const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function parseDateUTC(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

// "오늘"을 브라우저/서버 타임존과 무관하게 한국 표준시(KST) 기준 YYYY-MM-DD로 반환한다.
// (new Date().toISOString()은 UTC 기준이라 KST 00:00~09:00에 어제 날짜가 나온다)
export function kstToday(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

// 이번 달의 마지막 날짜를 KST 기준 YYYY-MM-DD로 반환한다.
export function kstEndOfMonth(): string {
  const [y, m] = kstToday().split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
}

// 올해의 마지막 날짜(12/31)를 KST 기준 YYYY-MM-DD로 반환한다.
export function kstEndOfYear(): string {
  const [y] = kstToday().split("-");
  return `${y}-12-31`;
}

// YYYY-MM-DD 두 날짜 사이의 일수 (date - base)
export function daysBetween(date: string, base: string): number {
  return Math.round((parseDateUTC(date) - parseDateUTC(base)) / 86_400_000);
}

// 남은 일수(daysBetween(date, today)) → "D-3" / "D-DAY" / "D+2"
export function formatDday(diff: number): string {
  if (diff === 0) return "D-DAY";
  return diff > 0 ? `D-${diff}` : `D+${-diff}`;
}

// YYYY-MM-DD → "9/21(월)"
export function formatMonthDayWeekday(date: string): string {
  const [, m, d] = date.split("-").map(Number);
  const weekday = new Date(parseDateUTC(date)).getUTCDay();
  return `${m}/${d}(${WEEKDAY_LABELS[weekday]})`;
}

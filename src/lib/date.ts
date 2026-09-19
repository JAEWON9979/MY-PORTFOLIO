const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// "오늘"을 브라우저/서버 타임존과 무관하게 한국 표준시(KST) 기준 YYYY-MM-DD로 반환한다.
// (new Date().toISOString()은 UTC 기준이라 KST 00:00~09:00에 어제 날짜가 나온다)
export function kstToday(): string {
  return new Date(Date.now() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

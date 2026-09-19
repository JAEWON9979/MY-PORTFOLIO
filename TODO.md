# TODO

앞으로 할 일 백로그. 우선순위 순으로 정리하고, 완료하면 항목을 지운 뒤 PROGRESS.md에 기록하세요.

- 일정 페이지(`src/app/schedule/page.tsx`) 레이아웃 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- 소개 섹션(`src/components/About.tsx`, 홈의 `#about`) 레이아웃 디자인 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- D-DAY 기능 추가 — 범위(어디에 어떻게 표시할지)는 아직 미정. 날짜 계산은 `src/lib/date.ts`의 `kstToday()`/`daysBetween()`을 재사용하면 됨 (목표 페이지의 "예정된 일목표" D-n 라벨이 같은 함수 사용)
- (보류) DMARC 레코드(`_dmarc` TXT, `v=DMARC1; p=none;`) 아직 미설정. Optional이라 발송엔 지장 없지만, 도메인 사칭 방지용으로 나중에 Vercel DNS Records에 수동 추가 고려
- (보류) 채팅으로 "일정 추가해" 같은 자연어 명령 처리하는 AI 기능 아이디어 논의함: Claude API tool use(비용 발생, 자유로운 문장 이해) vs 규칙 기반 정규식 파싱(무료, 정해진 형식만 인식) 두 방식 검토. 아직 착수 안 함

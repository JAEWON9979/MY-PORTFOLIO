# PROGRESS

완료된 작업과 그 결정 배경을 시간순으로 기록합니다. 최신 항목을 맨 위에 추가하세요.

## 2026-09-13
- 반복 목표(recurring_templates)에 요일 선택 기능 추가: `weekdays` 컬럼(마이그레이션 0008, 기본값 전체 요일) 신설 및 운영 DB 적용 완료, 목표 추가 모달에 일정 반복 설정과 동일한 요일 선택 UI 적용, `spawnTodayInstances`가 선택된 요일에만 오늘 인스턴스를 생성하도록 변경
- GitHub Copilot용 지침 파일 `.github/copilot-instructions.md` 신설 (AGENTS.md 내용 기반, Copilot 표준 위치)
- 일정별 이메일 알림 켜기/끄기 토글 추가: `schedules.reminder_enabled` 컬럼(마이그레이션 0007) 신설 및 운영 DB에 직접 적용 완료, 일정 생성/수정 모달에 체크박스 추가, 리마인더 크론(`/api/schedule-reminders`)에서 꺼진 일정 제외
  - 참고: 이 프로젝트는 `supabase` CLI로 링크되어 있지 않음(마이그레이션 이력 추적 테이블 없음) — `supabase db push`는 0001부터 재적용을 시도해 실패하니, 새 마이그레이션은 `SUPABASE_DB_URL`로 직접 연결해 해당 SQL만 실행할 것
- 프로젝트 지침 체계 정리: AGENTS.md에 배경 섹션 추가, TODO.md/PROGRESS.md 신설 (세션 간 작업 인수인계를 위해)

## 2026-09-10 ~ 2026-09-12
- 일정 하루 전 이메일 리마인더 기능 추가, 크론 실행 시각을 KST 19:00(전날)으로 조정
- 반복 일정(recurring schedules) 기능 추가
- 기본 Next.js 파비콘을 불 이모지 아이콘으로 교체
- 플레이스홀더 콘텐츠 정리, SEO 메타데이터·히어로 CTA·작업물 썸네일 추가
- AGENTS.md에서 실제 동작과 무관한 검증되지 않은 지시문 제거

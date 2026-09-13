# PROGRESS

완료된 작업과 그 결정 배경을 시간순으로 기록합니다. 최신 항목을 맨 위에 추가하세요.

## 2026-09-14
- 일정 리마인더 이메일 스팸함 분류 문제 근본 해결:
  - 조사 과정: Resend 대시보드 로그 확인 결과 발송 자체는 3건 모두 "Delivered"였고, 원인은 수신자(hs.ac.kr) 스팸함 분류였음(코드/크론/env 문제 아님, 발신 도메인이 미인증 공용 주소 `onboarding@resend.dev`였던 게 근본 원인)
  - Resend에서 `jaewon.homes` 도메인 인증 완료 (Vercel 연동 Auto configure로 DKIM/SPF 레코드 자동 추가, DKIM·SPF 모두 Verified). DMARC(`_dmarc` TXT)는 optional이라 아직 미설정 — TODO에 등록
  - `RESEND_FROM_EMAIL`을 `onboarding@resend.dev` → `jay@jaewon.homes`로 변경 (Vercel 환경변수 + 로컬 .env + 재배포 완료)
  - `/api/schedule-reminders`에서 Resend 발송 실패 시 상태코드/응답 본문을 `console.error`로 남기도록 추가 (이전엔 실패해도 조용히 무시됨 — 재발 시 원인 파악 쉽게 하기 위함)
  - 검증: `CRON_SECRET`으로 운영 엔드포인트를 두 차례 수동 호출해 실제 발송 테스트. 도메인 인증 후에도 학교 메일함 자체 스팸 필터에 처음엔 또 걸렸으나, 사용자가 직접 차단 해제하니 정상 수신 확인됨 (새 도메인이라 발신 평판이 아직 쌓이지 않은 영향으로 보임 — 시간 지나면서 개선될 것으로 예상)
  - 참고: 하루에 일정이 여러 개면 사용자당 이메일 한 통에 모아서 보내는 게 원래 설계(의도된 동작, 버그 아님)
  - 테스트 중 만들었던 "Claude 스팸 재테스트", "내일은 학교가는날" 일정은 삭제. 테스트로 리마인더가 이미 발송 처리된(reminder_sent_at 채워진) 기존 일정 2건(취창업스쿨 상담, 스터디 OT)은 삭제 후 동일 내용으로 재생성해 정규 저녁 7시 크론에 다시 발송되도록 초기화

## 2026-09-13
- 지난 일목표 자동 정리 크론 추가: `/api/goals-cleanup`가 매일 KST 03:00에 실행되어 카테고리가 "일목표"이고 마감일이 오늘 이전인 goals를 삭제 (화면에도 다시 안 보이는 데이터라 DB에 계속 쌓이는 걸 방지). 주목표/연목표는 대상 아님. 최초 정리(현재 쌓인 9건)는 수동 실행 없이 오늘 밤 크론이 처리하도록 둠
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

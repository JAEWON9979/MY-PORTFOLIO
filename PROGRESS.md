# PROGRESS

완료된 작업과 그 결정 배경을 시간순으로 기록합니다. 최신 항목을 맨 위에 추가하세요.

## 2026-09-20
- 목표 추가/수정 모달(`GoalModal.tsx`)과 일정 추가/수정 모달(`ScheduleModal.tsx`)의 제목·설명 입력칸에도 맞춤법 검사 밑줄 제거(`spellCheck={false}`): 메모에만 적용했더니 같은 자유 입력 칸인 이 모달들에서도 빨간 줄이 보인다는 요청. 반복 목표 수정 모달·작업물·커뮤니티 등 나머지 입력칸은 요청 범위 밖이라 그대로 둠
- 목표 페이지에 "예정된 일목표" 접이식 섹션 추가: 미래 날짜로 만든 일목표는 그날이 되기 전엔 목록에 안 보여 등록 여부를 확인할 방법이 없었음. 오늘 목록 아래에 개수만 보이는 접힌 섹션(0개면 숨김, 필터가 전체/일목표일 때만)으로 두고, 펼치면 날짜별로 묶어 "내일 · 9/21(월)" / D-n 라벨로 표시. 오늘 화면의 주인공은 오늘 할 일이라 기본은 접힘. 통계는 오늘 기준 그대로라 미리 달성 체크는 비활성(수정·삭제는 허용 — 날짜를 앞당기려면 수정 필요). 반복 일목표는 미래 인스턴스가 생성되지 않는 구조라 이 섹션에 안 나오고 기존 "반복 중인 일목표" 카드가 담당. `GoalCard`에 `upcomingLabel` prop, `src/lib/date.ts`에 `daysBetween`/`formatMonthDayWeekday` 추가
- 일목표가 KST 기준 00:00~24:00 동안 보이도록 수정: 목표 화면의 "오늘"과 반복 목표 인스턴스 생성(`spawnTodayInstances`)이 `new Date().toISOString()`(UTC)을 써서 한국 시간 00:00~09:00엔 어제 날짜로 계산됐고, 그 결과 일목표가 09:00~다음 날 03:00(정리 크론이 삭제)까지만 보였음. 공용 헬퍼 `src/lib/date.ts`의 `kstToday()`로 교체. 정리 크론(KST 03:00)은 마감일이 지난 것만 지우므로 그대로 둠. 일목표는 마감일이 오늘인 것만 보이는 기존 동작(미래 날짜로 만들면 그날이 되어야 보임)은 유지
- 같은 버그를 나머지 입력칸 있는 모달에도 적용: 공용 훅 `src/hooks/useBackdropClose.ts`(mousedown이 배경에서 시작한 클릭일 때만 닫힘)를 만들어 ScheduleModal(아래 임시 로직을 훅으로 교체)·GoalModal·RecurringTemplateModal·WorkModal·성적 페이지 CourseModal에 적용. 성적 CourseModal은 `target === currentTarget` 검사만 있어 여전히 같은 증상이 있었음. 입력칸이 없는 탈퇴 확인 모달(account)·DeleteConfirmDialog는 드래그 선택 상황이 없어 그대로 둠
- 일정 추가/수정 모달이 텍스트 드래그 선택 중 실수로 닫히던 버그 수정 (`ScheduleModal.tsx`): 입력칸에서 mousedown → 모달 밖(배경)에서 mouseup 하면 click 이벤트 대상이 공통 조상인 배경 오버레이가 되어 `onClose`가 실행되던 게 원인. 배경에서 mousedown이 시작됐는지 `useRef`로 추적해 배경에서 시작+끝난 클릭일 때만 닫히게 변경. 대상 체크(`e.target === e.currentTarget`)로 충분해져 안쪽 박스의 `stopPropagation`은 제거
- `npm run lint`가 빌드 산출물(`.next/`)과 `next-env.d.ts`까지 검사해 오류 1007건/경고 7000여 건이 나오던 문제 해결: `eslint.config.mjs`에 `ignores: [".next/**", "next-env.d.ts"]` 추가. `src/`에는 원래 오류가 없었고, 이제 `npm run lint`가 잡음 없이 통과하므로 변경 후 검증 수단으로 실제로 쓸 수 있음
- 일정 페이지 메모 입력창의 브라우저 맞춤법 검사(빨간 밑줄) 비활성화: 메모는 자유 형식이라 오타 표시가 방해가 되어 `spellCheck={false}` 적용 (`src/app/schedule/page.tsx`). 일정/목표 모달의 설명 입력창 등 다른 textarea는 요청 범위 밖이라 그대로 둠

## 2026-09-15
- 일정 메모를 날짜별(schedule_day_memos) → 사용자당 통합 메모(schedule_memo) 하나로 재설계: 처음엔 날짜별로 만들었는데, 사용자 피드백으로 날짜 구분 없이 하나만 있으면 된다고 판단해 즉시 구조 변경
  - 마이그레이션 0010: `schedule_memo`(user_id primary key) 테이블 신설 + RLS 정책, 기존 `schedule_day_memos`에 있던 테스트 메모(사용자당 최신 날짜 것)를 새 테이블로 이관 후 원래 테이블 삭제
  - 운영 DB 적용: 테이블 생성/이관은 `SUPABASE_DB_URL`로 직접 실행해 완료. `drop table schedule_day_memos`는 Claude Code 자동 모드 분류기가 "Cloud Storage Mass Delete"로 차단해서 사용자가 Supabase SQL Editor에서 직접 실행 (완료 확인함, 운영 DB에 `schedule_memo`만 남고 `schedule_day_memos`는 삭제됨)
  - `useDayMemo` → `useScheduleMemo` 훅으로 교체 (date 파라미터 제거, 입력 0.6초 정지 시 자동 저장은 동일)
  - 페이지 UI: 메모 textarea를 날짜 선택 여부와 무관하게 항상 보이도록 day-panel 조건부 블록 밖으로 이동
- 목표(goals) 반복 템플릿을 날짜 무관하게 수정할 수 있도록 개선: 기존엔 반복 일목표가 오늘 날짜 인스턴스로만 화면에 보이고(매일 자정 크론이 지난 날짜분은 삭제), `GoalModal`의 요일/반복 설정 UI도 수정 모드에선 아예 숨겨져 있어서 반복 템플릿 자체(제목/요일)를 고칠 방법이 전혀 없었음
  - 마이그레이션 0011: `recurring_templates`에 `update own` RLS 정책 추가 (기존엔 select/insert/delete만 있고 update 정책이 없어서, UI를 만들어도 업데이트가 RLS에 막혔을 것) — 운영 DB 적용 완료
  - `useRecurringTemplates`에 `updateTemplate(id, title, weekdays)` 추가
  - 목표 페이지 상단 "반복 중인 일목표" 칩에 연필(수정) 버튼 추가 → `RecurringTemplateModal`(제목 + 요일 선택, GoalModal과 동일한 스타일) 오픈. 날짜와 무관하게 항상 보이는 영역이라 이제 아무 때나 반복 템플릿을 고칠 수 있음
  - 템플릿 수정은 이미 생성된 과거 인스턴스에는 소급 적용 안 함(기존 spawn 설계와 동일하게 템플릿과 인스턴스를 독립적으로 유지)

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

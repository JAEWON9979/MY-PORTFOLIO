# PROGRESS

완료된 작업과 그 결정 배경을 시간순으로 기록합니다. 최신 항목을 맨 위에 추가하세요.

## 2026-09-20
- 배포 후 사용자가 좋아요 토글 동작(눌림 표시, 새로고침 후 유지, 취소)을 확인함 — 0014 관련 확인 항목 종료
- 가입 트리거의 `admin@naver.com` 자동 관리자 승격 제거(마이그레이션 `0016_remove_admin_autopromote.sql`, 운영 DB 적용 완료): TODO에 "낮음"으로 적어 뒀지만 Confirm email 확인 중 실제로는 높은 위험임이 드러남 — 공개 `auth/v1/settings`가 `mailer_autoconfirm: true`(이메일 인증 꺼짐)였고, 읽기 전용 조회로 `admin@naver.com`이 가입돼 있지 않으며 실제 관리자는 다른 계정 1명임을 확인. 즉 누구든 그 주소로 가입하면 즉시 관리자가 될 수 있는 상태였음. `handle_new_user`가 항상 `role='user'`로 만들도록 함수만 교체(트리거는 이름으로 연결돼 그대로). 검증: 함수 정의에 승격 로직 없음·트리거 활성, 롤백 보장 테스트에서 `admin@naver.com`으로 가입해도 role이 `user`, 잔여 데이터 없음. 새 프로젝트를 세팅할 땐 첫 관리자를 가입 후 SQL로 직접 승격해야 함(0016 주석에 기재). Confirm email 자체는 켤지 사용자 결정으로 TODO에 남김
- 글·댓글 표시 이름(`author_name`) 사칭 방지 마이그레이션 `0015_enforce_author_name.sql` 작성·운영 DB 적용 완료(권한 모드를 Manual로 바꿔 승인 후 `run-sql.mjs`로 실행): `author_name`을 클라이언트가 보낸 값 그대로 저장해서 로그인한 사용자가 "운영자" 같은 다른 이름으로 글·댓글을 올릴 수 있었고, 앱이 username이 없으면 이메일을 이름으로 보내 이메일이 공개될 수도 있었음. `BEFORE INSERT`(posts·comments)/`UPDATE`(posts) 트리거로 관리자가 아닌 클라이언트 롤은 INSERT 시 본인 `profiles.username`(없으면 '익명')으로 덮어쓰고 UPDATE 시 변경 무시. 관리자·서비스 키·SQL Editor는 통과(0013과 같은 방식, 별도 함수 `enforce_author_name`). 클라이언트 코드는 그대로(insert 후 `.select()`가 트리거 적용 결과를 돌려줌). 적용 전 읽기 전용 조회로 운영 프로필 2개 모두 username이 있음을 확인 — 적용해도 "익명"으로 바뀌는 계정 없음. 적용 후 검증: `pg_trigger`로 `comments`/`posts`의 `enforce_author_name` 활성 확인, 그리고 항상 마지막에 예외를 던져 롤백되는 테스트 SQL로 일반 사용자 권한(`authenticated` 롤, 실제 non-admin 프로필)에서 author_name을 "운영자"로 글·댓글 INSERT, "해커"로 글 UPDATE 했을 때 모두 계정 username으로 저장/유지됨을 확인하고, 테스트 데이터가 남지 않았음도 조회로 확인. 가입 때 정하는 username의 중복·예약어("운영자" 등) 방지는 사용자가 필요 없다고 결정해 하지 않기로 함(글별 이름 사칭만 0015로 막음)
- 정리: `public/`의 미사용 Next 기본 SVG 5개(file/globe/next/vercel/window, 합 2.3KB) 삭제 — `src`·README·설정 어디에서도 참조가 없음을 grep으로 확인, 삭제 후 lint/build 통과. `public/`이 비어 Git 추적 대상이 없어졌지만 Next는 빈/없는 `public/`도 문제없이 빌드함(정적 파일이 필요해지면 다시 만들면 됨). 같은 날 `0001_init.sql` 맨 위에 "새 프로젝트 전용, 운영 DB 실행 금지" 경고 주석 추가(첫 구간이 `drop table ... cascade`라 운영 DB에서 실행하면 전체 데이터가 삭제됨, SQL 동작은 그대로)
- 마이그레이션 파일 정리: 0013이 만들었다가 0014가 다시 지우는 `increment_post_like`를 0013에서 제거하고 헤더 주석을 실제 구조(조회수는 0013, 좋아요 토글은 0014)에 맞춤. 운영 DB에는 옛 버전 0013이 적용됐다가 0014로 함수가 삭제된 상태라 최종 상태는 동일하고, 0014의 `drop function if exists`는 운영 DB용 no-op 안전장치로 유지. 마이그레이션 이력 테이블이 없어 운영 DB에 재실행하지 않음
- 커뮤니티 좋아요를 "글당 계정 1회, 다시 누르면 취소"로 변경(마이그레이션 `0014_post_likes.sql`, 운영 DB 적용 완료 — 자동 모드 분류기가 `SUPABASE_DB_URL` 직접 접속을 계속 차단했고(허용 규칙 `Bash(node *run-sql.mjs *)`나 기존 `Bash(npm install *)`도 자동 모드에선 분류기를 못 이김), 사용자가 권한 모드를 Manual로 바꿔 승인 창에서 허용한 뒤 임시 폴더의 `run-sql.mjs`(SQL 파일을 트랜잭션으로 실행, 실패 시 롤백)로 적용하고 `pg_policies`/`pg_proc`/`pg_trigger` 조회로 정책·함수·트리거·RLS 상태를 확인): 0013에서 좋아요를 실제로 저장되게 고쳤더니 로그인한 누구나 무한히 누를 수 있다는 게 드러나서(원래 코드에 1회 제한이 없었고, 예전엔 저장이 안 돼 안 보였을 뿐) 바로 수정
  - `post_likes(post_id, user_id)` 복합 기본키 테이블 신설(RLS는 본인 행 조회만 허용, 변경은 RPC로만), `toggle_post_like` security definer RPC가 행 추가/삭제와 `posts.like_count` 증감을 한 함수에서 처리하고 최종 상태(true/false)를 반환. 동시에 두 번 눌려도 실제로 행이 바뀐 경우에만 카운트가 변하도록 `found` 검사. 0013의 `increment_post_like`는 삭제. 기존에 쌓인 like_count는 누가 눌렀는지 기록이 없어 그대로 두고 이후부터 새 방식으로 셈
  - UI: 눌렀으면 버튼이 검은 배경 + "♥ 좋아요 취소", 안 눌렀으면 "♡ 좋아요". 비로그인은 안내 알림, 요청 중 중복 클릭 방지. `usePosts`에 `likedPostIds`/`refreshLikes`/`toggleLike` 추가하고 `incrementLikeCount` 제거. lint/build 통과
- 커뮤니티 `posts`의 관리자 전용 컬럼 보호(마이그레이션 `0013_posts_protect_columns.sql`, 사용자가 SQL Editor에서 실행해 운영 DB 적용 완료, `pg_trigger`에서 `protect_post_columns` 활성(`O`)과 `pg_proc`에서 RPC 2개 생성 확인. 이 세션에선 자동 모드 분류기가 `SUPABASE_DB_URL` 직접 접속을 "Production Reads"로 두 번 차단해서 직접 실행하지 못함. 서비스 롤 키 API(PostgREST)는 DDL과 `pg_*` 카탈로그 조회가 불가능해 대안이 안 됨. 화면 동작 확인은 아직 전): `posts update own`이 컬럼 제한이 없어 작성자가 자기 글의 `is_hidden`(관리자 숨김)·`view_count`·`like_count`를 직접 UPDATE할 수 있었고 INSERT로 조작된 카운트를 넣을 수도 있었음. 정책에 with check로 컬럼을 제한할 수는 없어서(정책은 행 단위) `BEFORE INSERT/UPDATE` 트리거로 해결: 클라이언트 롤(anon/authenticated)이고 관리자가 아니면 세 컬럼 변경 시 예외(INSERT는 기본값으로 강제), 서비스 키·SQL Editor·security definer 함수는 통과
  - 조사 중 발견한 기존 버그: 조회수/좋아요는 클라이언트가 `posts`를 직접 UPDATE하는 방식이라 "작성자 또는 관리자만 수정" RLS 때문에 그 외 사용자의 조회/좋아요는 0행 수정(에러 없음)으로 DB에 저장되지 않았고 화면에서만 +1 됐음. 그대로 트리거만 걸면 카운터가 완전히 죽으므로 `increment_post_view`(비로그인 포함)/`increment_post_like`(로그인만) security definer RPC를 추가하고 `usePosts.ts`의 `incrementViewCount`/`incrementLikeCount`가 이를 호출하게 변경. 숨겨진 글은 카운트하지 않음
  - 좋아요는 로그인해야만 저장됨(비로그인은 버튼을 눌러도 변화 없음). 계정당 1회 제한은 없음(TODO에 기록). lint/build 통과
- 관리자 회원 관리(`/admin/users`)에서 역할 변경 버튼을 누르면 "○○의 권한을 admin(으)로 변경하시겠습니까?" 확인창이 뜨도록 변경: 권한 부여는 되돌리기 쉽지만 실수 한 번으로 관리자가 늘어나면 위험해서. 사이트의 다른 삭제 확인(`schedule`·`community`·`works`)과 같은 브라우저 기본 `confirm()` 사용. 아래 0012 적용 후 사용자가 관리자 화면(회원 목록 표시)과 일반 로그인 정상 동작을 확인함
- 보안 항목 중 즉시 조치 가능한 것 처리: (1) 크론 API 두 곳(`goals-cleanup`, `schedule-reminders`)이 `CRON_SECRET`이 비어 있으면 `Bearer undefined` 헤더가 통과하던 문제를 값이 없으면 거부하도록 수정 (2) `scratchpad-tmp/` 삭제(디버깅 스크립트 3개, `.env`를 읽는 코드뿐 키 값 자체는 없었음) (3) `profiles` 잠금 마이그레이션 `0012_profiles_lockdown.sql` 작성: `profiles update self` 삭제 + `profiles select all`을 본인/관리자만 조회로 교체. 이 환경엔 `pg` 드라이버·psql이 없어 사용자가 Supabase SQL Editor에서 직접 조회·실행함: 적용 전 `pg_policies`에서 `profiles update self`(with_check NULL)와 `profiles select all`(true)이 실제로 존재함을 확인했고(운영 DB가 마이그레이션과 일치), 0012 SQL 실행 후 정책이 `insert self` / `select own or admin` / `update admin` 3개만 남은 것을 재조회로 확인 — 운영 DB 적용 완료. 관리자 화면·일반 로그인 동작 확인은 아직 사용자 확인 전(TODO에 남김). 마이그레이션 이력 테이블이 없으니 0012도 수동 적용으로 기록만 남김. lint/build 통과
- 배포 전 보안·불필요 파일 점검 수행(읽기 전용, 코드/설정 변경 없음): 비밀키 노출(추적 파일·git 히스토리 모두 없음, `.env`는 gitignore), 서비스 키 서버 전용 사용, XSS 싱크 없음, 전 테이블 RLS 활성, 저장소 0.5MB로 무거운 파일 없음은 이상 없음 확인. 다만 `profiles` RLS 정책 2건(누구나 자기 role/email 수정 가능, 전체 이메일 공개 조회)과 낮은 위험 항목들을 발견해 수정은 다음 날로 미루고 상세 내용·수정 방향·진행 메모를 TODO.md 맨 위에 기록. 운영 DB 정책은 마이그레이션 SQL 기준으로만 판단했고 실제 운영 DB 조회는 아직 안 함
- 맞춤법 검사 밑줄 제거를 사이트 전체 텍스트 입력칸으로 확대(`spellCheck={false}`): 반복 목표 수정 모달, 작업물 모달(제목·설명·기술 태그), 성적 과목명, 검색창(`SearchBar`), 커뮤니티 글쓰기/수정(제목·내용)·댓글, 회원가입 아이디. 텍스트 입력칸·textarea 17곳 모두 적용 완료. 날짜/숫자/체크박스/파일/이메일/비밀번호 칸은 브라우저가 맞춤법 검사를 하지 않아 제외. 앞으로 텍스트 입력칸을 새로 만들면 같은 속성을 붙일 것
- 목표 추가/수정 모달(`GoalModal.tsx`)과 일정 추가/수정 모달(`ScheduleModal.tsx`)의 제목·설명 입력칸에도 맞춤법 검사 밑줄 제거(`spellCheck={false}`): 메모에만 적용했더니 같은 자유 입력 칸인 이 모달들에서도 빨간 줄이 보인다는 요청. 나머지 입력칸(반복 목표 수정·작업물·커뮤니티 등)은 이 시점엔 그대로 뒀다가 바로 위 항목에서 전부 적용
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

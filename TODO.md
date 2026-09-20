# TODO

앞으로 할 일 백로그. 우선순위 순으로 정리하고, 완료하면 항목을 지운 뒤 PROGRESS.md에 기록하세요.

- [보안·낮음] `handle_new_user` 트리거(`0001_init.sql:47`)가 이메일이 `admin@naver.com`이면 관리자로 승격함 → Supabase 이메일 인증이 꺼져 있고 그 주소가 비어 있으면 누구든 관리자로 가입 가능. Supabase Auth 설정에서 이메일 인증(Confirm email) 여부 확인
- [확인 필요] 0013은 운영 DB 적용·카탈로그 확인 완료. 남은 것은 화면 동작 확인(코드는 push 전이라 로컬 `npm run dev`에서 확인): 로그인한 일반 계정으로 커뮤니티 글 조회수·좋아요가 새로고침 후에도 유지되는지, 관리자의 글 숨김/해제가 되는지, 글 작성·수정이 되는지
- [확인 필요] 0014(좋아요 토글)는 운영 DB 적용·카탈로그 확인 완료. 남은 것은 배포 후 화면 확인: 좋아요 → 버튼 표시 바뀜 → 새로고침해도 유지 → 다시 누르면 취소되고 숫자 -1, 비로그인은 로그인 안내 알림
- 조회수는 새로고침할 때마다 +1 됨(글당 사용자 1회 제한 없음). 필요하면 세션/계정 기준 중복 방지 검토. 보안이라기보다 기능 품질 문제
- [보안·낮음] `npm audit` 취약점 2건(postcss high, next moderate): Next 15.5.25 내부 postcss 이슈이고 자체 CSS만 빌드하는 구조라 실제 위험은 낮음. `npm audit fix --force`는 Next 16으로 올리는 breaking 변경이라 하지 말고, Next 15.x 패치 릴리스가 나오면 그때 업데이트
- 정리: `public/`의 미사용 Next 기본 SVG 5개(file/globe/next/vercel/window, 합 2.3KB) 삭제
- 일정 페이지(`src/app/schedule/page.tsx`) 레이아웃 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- 소개 섹션(`src/components/About.tsx`, 홈의 `#about`) 레이아웃 디자인 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- D-DAY 기능 추가 — 범위(어디에 어떻게 표시할지)는 아직 미정. 날짜 계산은 `src/lib/date.ts`의 `kstToday()`/`daysBetween()`을 재사용하면 됨 (목표 페이지의 "예정된 일목표" D-n 라벨이 같은 함수 사용)
- (보류) DMARC 레코드(`_dmarc` TXT, `v=DMARC1; p=none;`) 아직 미설정. Optional이라 발송엔 지장 없지만, 도메인 사칭 방지용으로 나중에 Vercel DNS Records에 수동 추가 고려
- (보류) 채팅으로 "일정 추가해" 같은 자연어 명령 처리하는 AI 기능 아이디어 논의함: Claude API tool use(비용 발생, 자유로운 문장 이해) vs 규칙 기반 정규식 파싱(무료, 정해진 형식만 인식) 두 방식 검토. 아직 착수 안 함

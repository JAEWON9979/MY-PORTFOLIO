# TODO

앞으로 할 일 백로그. 우선순위 순으로 정리하고, 완료하면 항목을 지운 뒤 PROGRESS.md에 기록하세요.

- [보안·낮음~중간] Supabase **Confirm email이 꺼져 있음**(공개 `auth/v1/settings`의 `mailer_autoconfirm=true`, 2026-09-20 확인, 대시보드 Email 패널에선 토글이 안 보였음): 가입 시 이메일 소유 확인이 없어, 남의 이메일로 가입한 뒤 일정 리마인더를 켜면 크론이 `jay@jaewon.homes` 발신으로 그 주소에 메일을 보내게 할 수 있음(발신 평판 위험, 계정 하나당 소량). 관리자 자동 승격은 0016으로 제거해 그 경로는 이미 막힘. 켤지 사용자 결정 필요: 켜면 신규 가입자는 인증 메일을 눌러야 로그인(기존 계정 영향 없음), Supabase 기본 메일 발송 한도·회원가입 흐름(`auth/register` 안내 문구)도 같이 확인
- 조회수는 새로고침할 때마다 +1 됨(글당 사용자 1회 제한 없음). 필요하면 세션/계정 기준 중복 방지 검토. 보안이라기보다 기능 품질 문제
- [보안·낮음] `npm audit` 취약점 2건(postcss high, next moderate): Next 15.5.25 내부 postcss 이슈이고 자체 CSS만 빌드하는 구조라 실제 위험은 낮음. `npm audit fix --force`는 Next 16으로 올리는 breaking 변경이라 하지 말고, Next 15.x 패치 릴리스가 나오면 그때 업데이트. 2026-09-20 기준 15.x 최신이 15.5.25(현재 버전)라 새 패치 없음, 15.x에 패치가 나온다는 보장도 없음(공식 수정은 Next 16.3.5뿐). 대안: `package.json`에 `"overrides": {"postcss": "^8.5.28"}`로 Next 내부 postcss만 교체(build·로컬 동작 확인 필요, 위험 낮음) 또는 여유 있을 때 Next 16 업그레이드. 진행 상황은 가끔 `npm audit`·`npm view next dist-tags`로 확인하거나 GitHub Dependabot 알림 사용
- 일정 페이지(`src/app/schedule/page.tsx`) 레이아웃 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- 소개 섹션(`src/components/About.tsx`, 홈의 `#about`) 레이아웃 디자인 변경 — 구체적인 방향은 아직 미정, 착수 전 논의 필요
- (보류) DMARC 레코드(`_dmarc` TXT, `v=DMARC1; p=none;`) 아직 미설정. Optional이라 발송엔 지장 없지만, 도메인 사칭 방지용으로 나중에 Vercel DNS Records에 수동 추가 고려
- (보류) 채팅으로 "일정 추가해" 같은 자연어 명령 처리하는 AI 기능 아이디어 논의함: Claude API tool use(비용 발생, 자유로운 문장 이해) vs 규칙 기반 정규식 파싱(무료, 정해진 형식만 인식) 두 방식 검토. 아직 착수 안 함

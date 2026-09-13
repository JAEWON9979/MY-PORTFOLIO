# jaewon.homes — AI 에이전트 안내

이 저장소는 Next.js 15(App Router) + TypeScript + Tailwind CSS v4 + Supabase(auth/db) 기반 개인 포트폴리오·대시보드 사이트입니다. `main` 브랜치는 Vercel과 연동되어 push 시 자동 배포됩니다.

- 라우트: `src/app/*` (account, admin/users, auth/login|register, community, goals, grades, schedule, works 등)
- 컴포넌트: `src/components/*`
- 데이터 훅(Supabase 호출 로직): `src/hooks/*`
- Supabase 클라이언트: `src/lib/supabase/client.ts`(브라우저) / `server.ts`(SSR)
- DB 마이그레이션: `supabase/migrations/*.sql`
- 정적 데이터: `src/data/portfolio.ts`

테스트 스위트가 없으므로, 변경 후에는 항상 `npm run lint`와 `npm run build`로 확인하세요.

## 프로젝트 배경

jaewon.homes는 이력서형 정적 포트폴리오가 아니라 개인 대시보드 성격이 강한 사이트입니다. 목표(goals)·성적(grades)·일정(schedule)·커뮤니티 같은 개인 관리 기능과 작업물(works) 소개를 한 사이트에서 함께 운영합니다.

## 작업 상태 추적

- [TODO.md](TODO.md) — 앞으로 할 일 백로그
- [PROGRESS.md](PROGRESS.md) — 완료한 작업과 그 결정 배경을 시간순으로 기록

작업을 시작하거나 마칠 때 두 파일을 갱신하세요: 새 작업은 TODO.md에 추가하고, 완료하면 TODO.md에서 지우고 PROGRESS.md에 무엇을 왜 했는지 기록합니다.

> 참고: 이 파일에는 한때 실제 Next.js 동작과 무관한 검증되지 않은 지시문이 들어있었습니다(초기 세팅을 도운 AI 도구가 어딘가에서 잘못 주워온 내용으로 추정). 2026-09-10에 정리했습니다.

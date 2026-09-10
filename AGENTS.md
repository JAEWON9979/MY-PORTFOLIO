# jaewon.homes — AI 에이전트 안내

이 저장소는 Next.js 15(App Router) + TypeScript + Tailwind CSS v4 + Supabase(auth/db) 기반 개인 포트폴리오·대시보드 사이트입니다. `main` 브랜치는 Vercel과 연동되어 push 시 자동 배포됩니다.

- 라우트: `src/app/*` (account, admin/users, auth/login|register, community, goals, grades, schedule, works 등)
- 컴포넌트: `src/components/*`
- 데이터 훅(Supabase 호출 로직): `src/hooks/*`
- Supabase 클라이언트: `src/lib/supabase/client.ts`(브라우저) / `server.ts`(SSR)
- DB 마이그레이션: `supabase/migrations/*.sql`
- 정적 데이터: `src/data/portfolio.ts`

테스트 스위트가 없으므로, 변경 후에는 항상 `npm run lint`와 `npm run build`로 확인하세요.

> 참고: 이 파일에는 한때 실제 Next.js 동작과 무관한 검증되지 않은 지시문이 들어있었습니다(초기 세팅을 도운 AI 도구가 어딘가에서 잘못 주워온 내용으로 추정). 2026-09-10에 정리했습니다.

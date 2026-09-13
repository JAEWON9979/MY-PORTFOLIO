# jaewon.homes — GitHub Copilot 지침

이 저장소는 Next.js 15(App Router) + TypeScript + Tailwind CSS v4 + Supabase(auth/db) 기반 개인 포트폴리오·대시보드 사이트입니다. `main` 브랜치는 Vercel과 연동되어 push 시 자동 배포됩니다.

## 프로젝트 배경

이력서형 정적 포트폴리오가 아니라 개인 대시보드 성격이 강한 사이트입니다. 목표(goals)·성적(grades)·일정(schedule)·커뮤니티 같은 개인 관리 기능과 작업물(works) 소개를 한 사이트에서 함께 운영합니다.

## 구조

- 라우트: `src/app/*` (account, admin/users, auth/login|register, community, goals, grades, schedule, works 등)
- 컴포넌트: `src/components/*`
- 데이터 훅(Supabase 호출 로직): `src/hooks/*`
- Supabase 클라이언트: `src/lib/supabase/client.ts`(브라우저) / `server.ts`(SSR, 세션) / `admin.ts`(서비스 롤, API 라우트 전용)
- DB 마이그레이션: `supabase/migrations/*.sql`
- 정적 데이터: `src/data/portfolio.ts`

## 코딩 컨벤션

- 클라이언트 컴포넌트는 `"use client"`로 시작하고, Supabase 호출은 컴포넌트에 직접 넣지 말고 `src/hooks/*`의 훅으로 감싸세요.
- 서버 전용 비밀키(`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`)는 클라이언트 컴포넌트나 `NEXT_PUBLIC_*`로 노출하지 마세요. `src/lib/supabase/admin.ts`는 API 라우트(`src/app/api/*`)에서만 사용합니다.
- DB 스키마를 바꿀 때는 `supabase/migrations/`에 새 번호의 SQL 파일을 추가하세요 (기존 파일 수정 금지).
- 스타일링은 Tailwind 유틸리티 클래스 위주로, 기존 컴포넌트의 톤(zinc 계열 팔레트, rounded-lg/2xl, 절제된 그림자)을 따르세요.

## 빌드/검증

테스트 스위트가 없으므로, 변경 후에는 항상 다음을 실행해 확인하세요.

```
npm run lint
npm run build
```

## 배포 관련 주의

- `main` push = 즉시 프로덕션 배포이므로, 실험적이거나 검증되지 않은 변경은 브랜치에서 작업하세요.
- 새 Supabase 마이그레이션은 CLI로 프로젝트가 링크되어 있지 않아 `supabase db push`가 0001부터 재적용을 시도해 실패합니다. `SUPABASE_DB_URL`로 직접 연결해 신규 마이그레이션 SQL만 실행하세요.

## 작업 상태 추적

- [TODO.md](../TODO.md) — 앞으로 할 일 백로그
- [PROGRESS.md](../PROGRESS.md) — 완료한 작업과 그 결정 배경을 시간순으로 기록

작업을 시작하거나 마칠 때 두 파일을 갱신하세요.

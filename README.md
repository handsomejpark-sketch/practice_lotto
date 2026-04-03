# Lotto RPS

가위바위보에 이기면 로또 티켓을 받는 모바일 이벤트 웹앱입니다.

## Stack

- Next.js App Router
- TypeScript
- Supabase
- Cloudflare Pages

## Current Features

- `닉네임 + 4자리 PIN` 회원가입/로그인
- 서버 쿠키 세션
- 가위바위보 결과 서버 처리
- 승리 시 로또 티켓 발급
- 내 티켓 목록 조회
- 티켓 `issued -> viewed` 상태 변경

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
DATABASE_URL=
```

예시는 [.env.example](C:\Users\jpark\OneDrive\Desktop\practice_lotto\.env.example)에 있습니다.

## Local Checks

```bash
npm run lint
npx tsc --noEmit
```

현재 이 로컬 환경에서는 `next dev`, `next build`가 모두 `spawn EPERM`으로 중단될 수 있습니다.  
대신 실제 Supabase round-trip 검증은 완료했습니다.

## Important Files

- 앱 화면: [page.tsx](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.tsx)
- 인증 유틸: [auth.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\auth.ts)
- Supabase 관리자 클라이언트: [supabase-admin.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\supabase-admin.ts)
- DB 초안: [init.sql](C:\Users\jpark\OneDrive\Desktop\practice_lotto\supabase\init.sql)
- 배포 메모: [deployment-notes.md](C:\Users\jpark\OneDrive\Desktop\practice_lotto\deployment-notes.md)

## Deployment

배포 전 확인 사항은 [deployment-notes.md](C:\Users\jpark\OneDrive\Desktop\practice_lotto\deployment-notes.md)에 정리되어 있습니다.

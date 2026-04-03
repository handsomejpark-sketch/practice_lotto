# Handover Document for Codex: Infrastructure & Connection Layer Setup

이 문서는 모바일 가위바위보 로또 앱(`practice_lotto`)의 기반 인프라(Git, Supabase, Cloudflare) 설정 현황을 Codex에게 전달하기 위해 작성되었습니다. 앱 기능 및 UI 구현 시 아래 환경 정보를 참고하십시오.

---

## 1. Project & Git Structure

Next.js(App Router) 프로젝트가 루트 디렉토리에 평탄화(Flatten)되어 설정 완료되었습니다.

- **프로젝트 루트:** `c:\Users\jpark\OneDrive\Desktop\practice_lotto`
- **프레임워크:** Next.js 14+ (App Router), TypeScript, Vanilla CSS (Tailwind 미사용)
- **Git 원격 저장소 (origin):** `https://github.com/handsomejpark-sketch/practice_lotto.git`
- **배포 기준 브랜치:** `main`

---

## 2. Environment Variables (`.env.local`)

`.env.local` 파일이 로컬 폴더에 설정되어 있습니다. (보안상 Git에는 포함되지 않으며, Cloudflare Pages 배포 시 해당 환경변수를 직접 주입해야 합니다.)

```env
NEXT_PUBLIC_SUPABASE_URL="https://xatbfvbhjacrgwqzeqwe.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_M7q9A5LYCWNQaTFV0eh3bQ_EPcFdVfK"
SUPABASE_SERVICE_ROLE_KEY="..." # (서버 컴포넌트/API 라우트용)
DATABASE_URL="..." # (직접 DB 쿼리용)
SESSION_SECRET="..." # (JWT 세션 관리용)
```
*참고: 브라우저 단위 통신(Client Components)에서는 반드시 `NEXT_PUBLIC_` 접두사가 붙은 변수만 사용해야 합니다.*

---

## 3. Supabase Database Schema

`supabase/init.sql` 파일로 스키마 적용이 완료되었습니다. 제공된 구조에 맞춰 통신 레이어를 구현하십시오.

### 3.1 Tables
모든 테이블은 기본적으로 `id` (uuid)와 `created_at` 필드를 가지고 있습니다.

1. **`users` (커스텀 인증 방식용)**
   - `nickname` (text, UNIQUE): 로그인 ID 역할
   - `pin_hash` (text): 4자리 PIN의 해시값

2. **`sessions`**
   - `user_id` (uuid, FK to users)
   - `token` (text, UNIQUE): 브라우저 세션 관리를 위한 토큰
   - `expires_at` (timestamp)

3. **`game_plays`**
   - `user_id` (uuid, FK to users)
   - `user_choice` (text): 'rock', 'paper', 'scissors'
   - `computer_choice` (text): 'rock', 'paper', 'scissors'
   - `result` (text): 'win', 'lose', 'draw'

4. **`lotto_tickets`**
   - `user_id` (uuid, FK to users)
   - `game_play_id` (uuid, FK to game_plays)
   - `numbers` (integer Array): 6개의 로또 번호
   - `status` (text): 'issued' (발급됨) 또는 'viewed' (확인함)

### 3.2 Row Level Security (RLS)
모든 테이블에 RLS가 활성화되어 있습니다.
다만, 이 앱은 Supabase 기본 Auth(이메일/패스워드)를 사용하지 않는 커스텀 인증(`Nickname+PIN`) 구조입니다. 
따라서 클라이언트 측에서 Supabase JS 라이브러리를 사용할 때 RLS 인증(Auth token) 문제가 발생할 수 있습니다. 

**Codex 개발 유의사항:**
DB 조작(조회/삽입)은 클라이언트 컴포넌트에서 직접 날리지 말고, 가급적 **Next.js Server Actions 또는 API Routes(`/app/api/...`)를 통해서 `SUPABASE_SERVICE_ROLE_KEY` 혹은 우회된 로직을 사용해 통신하도록 설계**하는 것을 권장합니다 (커스텀 인증이므로 Supabase의 `auth.uid()`가 정상 작동하지 않음).

---

## 4. Cloudflare Pages Deployment

- 코드가 `main` 브랜치에 Push되면 Cloudflare Pages가 이를 감지하여 배포를 수행할 예정입니다.
- **빌드 설정 가이드 (Cloudflare UI 입력용):**
  - Framework preset: `Next.js`
  - Build command: `npm run build`
  - Build output directory: `.vercel/output/static` (현재 Next 버전에 맞게 수정될 수 있음)
  - 배포 환경에 로컬 `.env.local`의 `NEXT_PUBLIC_*` 및 서버 변수들을 반드시 입력해주어야 앱이 정상 동작합니다.

---

## 5. Next Steps for Codex

이제 프로젝트 베이스라인을 기반으로 아래 항목을 진행할 수 있습니다.

1. `@supabase/supabase-js`, 등 필요한 라이브러리 `npm install`
2. **커스텀 Auth 로직 구현**: `users` 테이블을 활용한 닉네임/PIN 가입 및 로그인. Cookie 기반 세션 처리 권장.
3. **가위바위보 로직**: 승패 판정 후 `game_plays` 테이블에 기록.
4. **로또 번호 발급기**: 승리 시 6개의 난수 배열을 생성하여 `lotto_tickets`에 삽입.
5. **프론트엔드 UI/UX**: Vanilla CSS를 이용한 렌더링.

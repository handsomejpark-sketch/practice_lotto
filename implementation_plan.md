# External Setup Instruction

이 문서는 앱 구현 지시문이 아니라, 현재 확보된 외부 서비스 정보를 바탕으로 `GitHub`, `Supabase`, `Cloudflare` 세팅을 진행하기 위한 작업 지시문이다.

## 1. Goal

에이전트는 아래에 제공된 실제 서비스 정보를 기준으로 개발 착수 전 외부 인프라 세팅 상태를 확인하고, 자동 처리 가능한 부분은 처리하며, 부족한 항목은 사용자에게 정확히 요청해야 한다.

## 2. Confirmed Inputs

아래 정보는 이미 사용자로부터 제공받았으므로 사실값으로 사용한다.

### 2.1 GitHub

- Repository URL: `https://github.com/handsomejpark-sketch/practice_lotto.git`

### 2.2 Supabase

- Project URL: `https://xatbfvbhjacrgwqzeqwe.supabase.co`
- Publishable Key: `sb_publishable_M7q9A5LYCWNQaTFV0eh3bQ_EPcFdVfK`
- Direct Connection String Template:
  - `postgresql://postgres:[YOUR-PASSWORD]@db.xatbfvbhjacrgwqzeqwe.supabase.co:5432/postgres`

## 3. Validation Result

현재 정보는 다음 용도로는 충분하다.

- GitHub 원격 저장소 연결
- Supabase 클라이언트 연결 준비
- `.env.example` 초안 작성
- Cloudflare 환경변수 목록 정의

현재 정보만으로는 부족한 항목도 있다.

- Supabase 데이터베이스 실제 비밀번호 없음
- `SUPABASE_SERVICE_ROLE_KEY` 없음
- Cloudflare Pages 프로젝트 정보 없음
- 배포 브랜치 정보 없음

따라서 에이전트는 이미 확보된 값으로 세팅 가능한 범위만 진행하고, 나머지는 사용자에게 요청해야 한다.

## 4. GitHub Setup Tasks

에이전트는 아래 작업을 수행한다.

1. 현재 작업 폴더가 Git 저장소인지 확인한다.
2. Git 저장소가 아니면 로컬 Git 초기화를 진행한다.
3. 원격 저장소가 없으면 아래 URL로 `origin`을 연결한다.
   - `https://github.com/handsomejpark-sketch/practice_lotto.git`
4. 기본 브랜치 상태를 확인한다.
5. 배포 브랜치가 아직 정해지지 않았다면, 기본값을 `main`으로 간주하되 사용자 확인 필요 항목으로 남긴다.

## 5. Supabase Setup Tasks

에이전트는 아래 정보를 기준으로 Supabase 연동 준비를 진행한다.

- `NEXT_PUBLIC_SUPABASE_URL=https://xatbfvbhjacrgwqzeqwe.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` 또는 동등 공개 키 값으로 아래 Publishable Key 사용
  - `sb_publishable_M7q9A5LYCWNQaTFV0eh3bQ_EPcFdVfK`

에이전트는 아래 작업을 수행한다.

1. 프로젝트에서 사용할 Supabase 연결 변수 이름을 정리한다.
2. `.env.example`에 공개 가능한 키 항목만 반영한다.
3. 서비스 롤 키가 필요한 서버 작업 목록을 분리한다.
4. 실제 DB 마이그레이션 또는 SQL 적용이 필요하면, 비밀번호 또는 서비스 롤 키가 확보되기 전에는 초안만 작성한다.

## 6. Supabase Missing Inputs

에이전트는 아래 값이 아직 없음을 명시적으로 인식해야 한다.

- 실제 DB 비밀번호
- `SUPABASE_SERVICE_ROLE_KEY`

에이전트가 사용자에게 요청해야 할 문구 기준:

- Supabase DB 비밀번호를 알려주거나 직접 SQL 적용을 진행해달라고 요청
- `SUPABASE_SERVICE_ROLE_KEY`를 안전한 방식으로 제공해달라고 요청

주의:

- `service role key`는 문서나 공개 커밋에 직접 남기지 않는다.
- 실제 비밀번호를 저장소 파일에 기록하지 않는다.

## 7. Cloudflare Setup Tasks

현재 Cloudflare 관련 실제 값은 아직 제공되지 않았다.

에이전트는 아래를 사용자 준비 항목으로 남긴다.

- Cloudflare Pages 프로젝트 생성 여부
- GitHub 저장소 연결 여부
- 배포 브랜치
- 환경변수 등록 위치 확인
- 커스텀 도메인 사용 여부

에이전트는 Cloudflare 관련 자동 작업이 불가능하면 아래를 사용자에게 요청한다.

1. Cloudflare Pages 프로젝트 생성
2. GitHub 저장소 연결
3. 배포 브랜치 전달

## 8. Environment Variable Plan

에이전트는 아래 환경변수 구조를 기준으로 정리한다.

공개 클라이언트용:

- `NEXT_PUBLIC_SUPABASE_URL=https://xatbfvbhjacrgwqzeqwe.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_M7q9A5LYCWNQaTFV0eh3bQ_EPcFdVfK`

서버 전용:

- `SUPABASE_SERVICE_ROLE_KEY`
- 세션용 서버 비밀값

직접 DB 연결이 필요한 경우:

- `DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xatbfvbhjacrgwqzeqwe.supabase.co:5432/postgres`

주의:

- 실제 비밀번호와 서비스 롤 키는 저장소에 하드코딩하지 않는다.
- `.env.example`에는 자리표시자만 넣는다.

## 9. Agent Execution Order

에이전트는 아래 순서로 행동한다.

1. 현재 폴더의 Git 상태를 확인한다.
2. 제공된 GitHub 레포 URL로 원격 저장소 연결 여부를 확인한다.
3. Supabase 공개 연결값을 기준으로 프로젝트 환경변수 구조를 정리한다.
4. `.env.example` 또는 동등 문서에 필요한 키 이름만 정리한다.
5. DB 비밀번호와 `service role key`가 없으므로, 실제 SQL 적용 대신 SQL 초안만 준비 대상으로 둔다.
6. Cloudflare 정보가 없으므로 Pages 생성 및 GitHub 연결은 사용자 후속 작업으로 남긴다.
7. 부족한 항목 목록을 사용자에게 전달한다.

## 10. Explicit Non-Goals

이 문서 단계에서 하지 않는 것:

- 앱 기능 구현
- UI 구현
- 게임 로직 구현
- 인증 API 구현
- 실제 비밀값을 코드나 문서에 기록하는 작업

## 11. Required Follow-up From User

에이전트는 아래 항목을 사용자에게 후속 요청해야 한다.

1. `SUPABASE_SERVICE_ROLE_KEY`
2. Supabase DB 비밀번호
3. Cloudflare Pages 프로젝트 준비 여부
4. 배포 브랜치 이름

## 12. Success Criteria

이 문서 기준 작업이 완료되었다고 볼 수 있는 조건은 아래와 같다.

- 로컬 폴더가 GitHub 원격 저장소와 연결되어 있다
- Supabase 공개 연결값이 프로젝트 환경변수 구조에 반영될 준비가 되어 있다
- 민감한 Supabase 값이 아직 필요하다는 점이 명확히 정리되어 있다
- Cloudflare에서 사용자가 추가로 해야 할 준비가 분리되어 있다

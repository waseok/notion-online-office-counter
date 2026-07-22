# 노션 온라인 교무실 이용 횟수 카운터

노션 온라인 교무실에 한 줄 블록 크기로 삽입하는 페이지 조회 수 카운터입니다. 페이지가 실제로 로딩될 때마다 1회 증가하며, 오늘·이번 주·이번 달·누적 이용 횟수를 한국 시간 기준으로 표시합니다.

## 주요 특징

- 실제 화면 높이 52px, 노션 임베드 권장 높이 65~75px
- 오늘·이번 주(월요일 시작)·이번 달·누적 이용 횟수
- `Asia/Seoul` 기준 날짜 집계
- 새로고침과 재접속은 새로운 이용 1회로 집계
- 같은 페이지 로딩 중 React 이중 실행이나 API 재시도는 중복 집계하지 않음
- 이름, 이메일, IP, 쿠키, 계정 또는 기기 식별정보를 저장하지 않음
- 동시 접속에도 누락되지 않는 PostgreSQL 원자적 증가
- 시스템 밝은 모드와 어두운 모드 자동 대응

## 프로젝트 구조

```text
notion-counter/
├─ scripts/
│  ├─ concurrency-test.mjs
│  └─ timezone-test.mjs
├─ src/
│  ├─ app/
│  │  ├─ api/stats/route.ts
│  │  ├─ api/view/route.ts
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/counter-banner.tsx
│  ├─ lib/
│  │  ├─ counter-service.ts
│  │  ├─ demo-counter.ts
│  │  └─ supabase-admin.ts
│  └─ types/counter.ts
├─ supabase/schema.sql
├─ .env.example
└─ next.config.ts
```

## 로컬에서 화면 확인

1. `.env.example`을 `.env.local`로 복사합니다.
2. `.env.local`에서 `COUNTER_DEMO_MODE=true`로 변경합니다.
3. 다음 명령을 실행합니다.

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다. 시험 모드는 메모리에서만 동작하므로 서버를 다시 시작하면 카운트가 초기화됩니다.

## Supabase 설정

1. 에듀테크 6 계정으로 Supabase에 로그인합니다.
2. 새 프로젝트를 만들고 프로젝트가 준비될 때까지 기다립니다.
3. SQL Editor에서 `supabase/schema.sql` 전체를 실행합니다.
4. Project Settings의 API Keys에서 서버용 Secret key를 확인합니다.
5. Project URL과 Secret key를 안전하게 보관합니다.

테이블은 Data API에 직접 노출되지 않는 `private` 스키마에 생성됩니다. 브라우저가 데이터베이스를 직접 호출하지 않으며, Vercel 서버 API만 Secret key로 제한된 함수를 호출합니다.

## 환경변수

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_REPLACE_ME
COUNTER_PAGE_KEY=online-office-main
COUNTER_INITIAL_TOTAL=0
COUNTER_DEMO_MODE=false
```

기존 Supabase 프로젝트가 Legacy key만 제공하는 경우 `SUPABASE_SERVICE_ROLE_KEY`를 대신 사용할 수 있습니다. 비밀 키에는 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

## Vercel 배포

1. 이 폴더를 GitHub 저장소에 올립니다.
2. 에듀테크 6 계정으로 Vercel에 로그인합니다.
3. Add New → Project에서 GitHub 저장소를 선택합니다.
4. 위 환경변수를 Production, Preview, Development에 등록합니다.
5. `COUNTER_DEMO_MODE`는 `false`로 설정합니다.
6. Deploy를 실행합니다.

## 노션에 삽입

1. Vercel의 HTTPS 배포 주소를 복사합니다.
2. 노션 온라인 교무실에서 `/embed`를 입력합니다.
3. 배포 주소를 붙여 넣습니다.
4. 임베드 블록을 가로로 넓히고 높이를 약 65~75px로 줄입니다.
5. 노션 앱과 공개 페이지에서 각각 열어 카운트가 1회씩 증가하는지 확인합니다.

## 검증

```bash
npm run lint
npm run build
npm run test:timezone
```

개발 서버가 실행 중일 때 동시 요청과 중복 방지 테스트를 실행합니다.

```bash
npm run test:concurrency
```

기본값은 동시에 25개의 서로 다른 접속을 보내고, 같은 요청키를 한 번 더 전송합니다. 총 증가량이 정확히 25인지 확인합니다.

## iframe이 표시되지 않을 때

- Vercel 배포 주소가 HTTPS인지 확인합니다.
- 노션 링크 미리보기가 아니라 `/embed` 블록을 사용했는지 확인합니다.
- `next.config.ts`의 `frame-ancestors`에 현재 노션 도메인이 포함되어 있는지 확인합니다.
- Vercel에 과거 배포가 남아 있다면 최신 커밋을 다시 배포합니다.
- 브라우저 개발자 도구에서 CSP 또는 `X-Frame-Options` 오류가 있는지 확인합니다.

## 운영 데이터 구조

- `private.counter_daily_views`: 한국 날짜별 합산 횟수
- `private.counter_request_keys`: 같은 페이지 로딩 과정의 중복 요청 방지용 임시 UUID

임시 UUID는 사용자를 식별하지 않으며 2일이 지나면 자동 정리됩니다. 사용자 개인정보와 IP 주소는 저장하지 않습니다.

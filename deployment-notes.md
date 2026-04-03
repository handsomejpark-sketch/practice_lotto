# Deployment Notes

## GitHub

- Remote: `https://github.com/handsomejpark-sketch/practice_lotto.git`
- Local default branch: `main`

## Cloudflare Pages

### Framework

- Framework preset: `Next.js`
- Build command: `npm run build`

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `DATABASE_URL`

### Current Notes

- `.env.local` already contains the required local values.
- `.env.example` contains the public URL/key and placeholders for server secrets.
- Cloudflare Pages must receive the real secret values directly in the dashboard.

## Known Local Limitation

- `next build` compiles successfully in this environment but ends with `spawn EPERM`.
- `next dev` also fails with the same local process-spawn limitation.
- Lint and TypeScript checks pass, and direct Supabase round-trip validation succeeded.

## Manual Follow-up

1. Push local changes to GitHub `main`
2. Connect the repository to Cloudflare Pages
3. Register the environment variables in Cloudflare Pages
4. Trigger the first deployment

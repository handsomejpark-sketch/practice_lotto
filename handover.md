# Handover for Next Session

## 1. Project Summary

This repository contains a mobile-first web app where a user plays rock-paper-scissors and receives one lotto ticket when they win.

Current product state:

- Functional login flow exists
- Functional game flow exists
- Functional ticket issuance and ticket status update flow exists
- Production deployment is working
- The next session's primary goal is **design improvement**, not backend rescue

This project is not a plain static Next.js site. It uses a custom combination of:

- `Next.js` App Router
- `OpenNext for Cloudflare`
- `Cloudflare Worker` deployment
- `Supabase` as the backing database
- Custom `nickname + 4-digit PIN` authentication
- Server-side session cookies managed by app code

This context matters because a future agent may otherwise assume:

- Supabase Auth is being used
- Cloudflare Pages env vars are configured in a standard Pages-only flow
- The app is just a local prototype

Those assumptions would be wrong.

---

## 2. Current Primary Objective

The immediate next objective is:

- Improve the visual design and UX of the app

The immediate next objective is **not**:

- rebuilding authentication
- changing database schema
- changing deployment architecture
- replacing Cloudflare deployment flow

Design work should preserve all current working functionality.

---

## 3. Live Deployment

Current deployed worker URL:

- `https://practice-lotto.jpark880219.workers.dev`

Important:

- The app is deployed as a **Cloudflare Worker**, not as a simple static Pages project.
- The Worker name is `practice-lotto`.
- Deployment is handled through OpenNext and Wrangler.

There is also a GitHub Actions deployment workflow in the repo, so deployment is now reproducible in Linux CI rather than relying on Windows local deployment.

---

## 4. Source Control and Deployment Flow

GitHub repository:

- `https://github.com/handsomejpark-sketch/practice_lotto.git`

Default branch:

- `main`

Current deployment flow:

1. Code is pushed to GitHub `main`
2. GitHub Actions runs on `ubuntu-latest`
3. Workflow installs dependencies
4. Workflow runs lint
5. Workflow runs TypeScript check
6. Workflow runs `npm run deploy`
7. `OpenNext` builds and deploys to Cloudflare Worker

Relevant workflow file:

- [deploy.yml](C:\Users\jpark\OneDrive\Desktop\practice_lotto\.github\workflows\deploy.yml)

Important note:

- Earlier in the project, Windows-based local OpenNext deployment caused runtime instability.
- That is why GitHub Actions based Linux deployment was added.
- Future deployment troubleshooting should prefer GitHub Actions logs over local Windows OpenNext behavior.

---

## 5. Runtime Architecture

### 5.1 Frontend

The frontend is a single main mobile landing/game page built in:

- [page.tsx](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.tsx)
- [page.module.css](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.module.css)
- [globals.css](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\globals.css)

Current page responsibilities:

- login/signup UI
- session-based user state bootstrap
- game interaction
- ticket list and viewed-state UI
- user-facing error messages

### 5.2 Backend

Backend logic is implemented using Next.js route handlers under:

- [api/auth/login/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\auth\login\route.ts)
- [api/auth/logout/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\auth\logout\route.ts)
- [api/auth/me/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\auth\me\route.ts)
- [api/auth/signup/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\auth\signup\route.ts)
- [api/game/play/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\game\play\route.ts)
- [api/tickets/[ticketId]/view/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\tickets\[ticketId]\view\route.ts)

### 5.3 Server utilities

Authentication/session/database helper code lives in:

- [auth.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\auth.ts)
- [supabase-admin.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\supabase-admin.ts)
- [game.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\game.ts)
- [types.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\types.ts)

---

## 6. Authentication Model

This app does **not** use Supabase Auth.

It uses:

- user enters `nickname`
- user enters 4-digit `PIN`
- server checks `users` table
- PIN is hashed and compared server-side
- app creates a custom session token
- token is stored in the `sessions` table
- session cookie is stored in browser

Important implementation details:

- PIN hashing uses Node crypto helpers in [auth.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\auth.ts)
- session cookie name is managed in the same file
- session lookup is server-side only
- client does not directly talk to Supabase

This architecture was chosen because:

- Google OAuth was intentionally removed for simplicity
- custom login flow matched the user's preference
- direct client-side Supabase access would not fit the custom auth + RLS situation cleanly

---

## 7. Database Model

The app expects the following Supabase tables:

- `users`
- `sessions`
- `game_plays`
- `lotto_tickets`

Schema draft is documented in:

- [init.sql](C:\Users\jpark\OneDrive\Desktop\practice_lotto\supabase\init.sql)

Important schema notes:

- `users.nickname` is unique
- `users.pin_hash` stores the hashed PIN
- `sessions.token` is the session token hash field currently expected by the app
- `lotto_tickets` uses `issued_at` in actual runtime flow

Important mismatch already discovered and fixed:

- earlier code assumed `lotto_tickets.created_at`
- actual runtime behavior aligned better with `issued_at`

Any future DB refactor must be done carefully and verified against the existing runtime code.

---

## 8. Environment Variables

The app requires the following runtime variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SESSION_SECRET`
- `DATABASE_URL`

Do not hardcode secrets in source files.

Examples and placeholders exist in:

- [.env.example](C:\Users\jpark\OneDrive\Desktop\practice_lotto\.env.example)

Important operational lesson already learned:

- Earlier deployment failures came from missing runtime variables
- Later debugging showed that Cloudflare Worker secrets needed to be uploaded to the Worker itself
- The current deployed setup now has the required secrets uploaded

Do not rotate or overwrite secrets casually unless the user explicitly asks for it.

---

## 9. Cloudflare Deployment Notes

These files were added to stabilize Cloudflare deployment:

- [wrangler.jsonc](C:\Users\jpark\OneDrive\Desktop\practice_lotto\wrangler.jsonc)
- [open-next.config.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\open-next.config.ts)
- [next.config.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\next.config.ts)

Important deployment facts:

- Worker name must stay aligned with self-binding
- Current worker name is `practice-lotto`
- `WORKER_SELF_REFERENCE` also points to `practice-lotto`

This specific mismatch caused a real deployment failure earlier, and it was fixed by explicitly adding the config files above.

Do not rename the worker casually unless all related config is updated together.

---

## 10. Debugging Utilities Added

A debug endpoint exists:

- [api/debug/env/route.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\api\debug\env\route.ts)

Purpose:

- confirm runtime env variable presence
- help distinguish deployment/config failures from app logic failures

This endpoint returns presence info only, not secret values.

It was useful during troubleshooting and may still be useful in future deployment diagnostics.

If the app is moving toward production hardening later, this endpoint may need to be removed or protected.

---

## 11. Current Design State

Current design is functional but still prototype-level.

It already has:

- mobile-first layout
- promo/event style theme
- login card
- game area
- ticket area

However it still needs design refinement in areas like:

- stronger visual hierarchy
- better spacing rhythm
- more polished typography treatment
- cleaner component states
- improved button system
- more deliberate color balance
- more premium feeling result/ticket presentation

The current UI is not broken, but it is not final-quality.

This is the correct target for the next session.

---

## 12. What the Next Session Should Focus On

The next session should focus on:

- UI polish
- design improvement
- mobile interaction quality
- visual hierarchy
- better presentation of game result and ticket issuance
- design consistency across hero, auth, game, and ticket sections

Good next steps:

- refine [page.tsx](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.tsx) structure only if it helps the layout
- primarily improve [page.module.css](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.module.css)
- lightly refine [globals.css](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\globals.css) if necessary

Potential design upgrades:

- improve event hero
- better numbers/ticket chip design
- stronger active/disabled/loading button states
- more polished cards
- better small-screen spacing
- more intentional fonts and letter spacing
- reduce current “prototype dashboard” feel

---

## 13. What the Next Session Should Avoid

Do not casually change these unless there is a real reason:

- auth architecture
- session model
- Supabase schema assumptions
- Cloudflare worker name
- deployment workflow
- route handler signatures
- env variable names

Also avoid:

- switching to Supabase Auth
- removing the debug route unless the user asks
- deleting GitHub Actions deployment
- redesigning by breaking the working API flow

The app is now functionally working. The next task should not reopen solved infrastructure problems.

---

## 14. Verification Status at End of This Session

Known completed:

- GitHub repo connected and in use
- main branch in use
- GitHub Actions deployment workflow added
- Cloudflare worker deployment path established
- environment variables/secrets uploaded to the Worker
- production deployment completed
- runtime env presence confirmed

Important latest state:

- The environment debug endpoint eventually reported all required vars as present
- deployment via GitHub Actions succeeded on Ubuntu
- infrastructure is no longer the primary blocker

If there is any future runtime issue, check the latest deployed behavior first before assuming infra is broken again.

---

## 15. Files Worth Reading First in Next Session

If a future model has limited time, read these first in this order:

1. [handover.md](C:\Users\jpark\OneDrive\Desktop\practice_lotto\handover.md)
2. [page.tsx](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.tsx)
3. [page.module.css](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\app\page.module.css)
4. [auth.ts](C:\Users\jpark\OneDrive\Desktop\practice_lotto\src\lib\auth.ts)
5. [deploy.yml](C:\Users\jpark\OneDrive\Desktop\practice_lotto\.github\workflows\deploy.yml)
6. [wrangler.jsonc](C:\Users\jpark\OneDrive\Desktop\practice_lotto\wrangler.jsonc)
7. [init.sql](C:\Users\jpark\OneDrive\Desktop\practice_lotto\supabase\init.sql)

---

## 16. Suggested Opening Prompt for Next Session

If you want to hand this off cleanly to another AI, use something like:

`Read handover.md first. The app is already functionally working in production. Do not change auth or deployment architecture. Focus only on improving the visual design and UX of the mobile interface while preserving all existing functionality.`

---

## 17. Security Note

During prior troubleshooting, real credentials were temporarily handled in-session to fix deployment issues.

Future agents should:

- avoid reprinting secrets
- avoid writing secrets into markdown handoff docs
- avoid committing secrets

If security hardening becomes a future task, rotating exposed secrets is a sensible follow-up.

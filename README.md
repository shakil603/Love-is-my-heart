# Love Is My Heart (LIMH)

**Less swiping. More something real.**

**LIMH** stands for **Love Is My Heart**. It is a self-hosted, open-source dating app. It started as a single-user visual prototype; this repository is now a working multi-user product: real accounts, real profiles, real likes, real mutual matches and real conversations between people who signed up — all running on a stack you can own and inspect.

No proprietary SaaS is required to run it. No ad trackers. No device-location collection. One command starts a fully working instance.

---

## What is actually real now

| Area | Before | Now |
| --- | --- | --- |
| Accounts | One hard-coded "Alex" | Email + password accounts, httpOnly sessions, password reset, account deletion |
| Profiles | Seed data only | Everyone creates and edits their own profile, photos and preferences |
| Discovery | Local demo deck | Real members filtered by age, distance, intention and shared interests |
| Likes | `likesYou` flags | Mutual likes create a match for both people, privately |
| Messages | Seeded conversation | Persisted conversations between accounts, with unread counts and read receipts |
| Live updates | Page refresh | Server-Sent Events bring new messages and matches in without a reload |
| Distance | Stored fake km | Haversine distance between the actual cities members choose |
| Safety | Informational modal | Block, unmatch, report, and full data export / deletion |
| Photos | Sample portrait URLs | Real uploads processed with Sharp (resized, re-encoded, metadata stripped) |
| Database | In-memory template idea | PostgreSQL, or embedded PGlite (PostgreSQL in WASM) for zero-config installs |

A clearly labelled **sample community** is included for demos. Sample profiles reply using text generated locally from their own profile — never a hidden person and never a third-party AI API. Turn it off with one environment variable.

---

## Open-source stack

| Project | License | Used for |
| --- | --- | --- |
| [Next.js](https://nextjs.org) | MIT | App router, server rendering, route handlers |
| [React](https://react.dev) | MIT | Interface |
| [PostgreSQL](https://www.postgresql.org) | PostgreSQL License | The database |
| [PGlite](https://github.com/electric-sql/pglite) | Apache-2.0 | Embedded PostgreSQL for zero-config local/preview runs |
| [Drizzle ORM](https://orm.drizzle.team) | Apache-2.0 | Typed schema, queries and SQL migrations |
| [Better Auth](https://www.better-auth.com) | MIT | Email/password auth, sessions, rate limiting, password reset |
| [Sharp](https://sharp.pixelplumbing.com) | Apache-2.0 | Validating, rotating, resizing and re-encoding uploads |
| [Zod](https://zod.dev) | MIT | Request validation |
| [Motion](https://motion.dev) | MIT | Interface animation |
| [Lenis](https://github.com/darkroomengineering/lenis) | MIT | Smooth scrolling |
| [Lucide](https://lucide.dev) | ISC | Icons |
| [Nodemailer](https://nodemailer.com) | MIT | Optional SMTP for reset / verification mail |
| [GeoNames](https://www.geonames.org) | CC BY 4.0 | City-centre coordinates for distance calculation |

Typography: Manrope and Instrument Serif via Fontsource (OFL). London sample portraits are served from Pexels; the Bangladesh sample portraits are AI-generated illustrations for the demo community and are labelled as sample profiles.

---

## Quick start

Requirements: **Node.js 20.9+**. Nothing else — no database server, no Docker, no API keys.

```bash
npm install
cp .env.example .env        # sets a development auth secret
npm run dev                 # http://localhost:3000
```

What happens on first request:

1. The app opens **PGlite** at `./.data/limh` (a real PostgreSQL engine compiled to WASM).
2. Drizzle applies the SQL migrations in `./drizzle`.
3. The labelled demo community is seeded (if demo mode is on).
4. You can create an account, or press **Explore the live demo** on `/signin`.

### Bengali quick start

```bash
npm install
cp .env.example .env
npm run dev
```

এরপর `http://localhost:3000` খুলুন। কোনো আলাদা ডাটাবেস সার্ভার লাগবে না — প্রথম রিকোয়েস্টেই `.data/limh`-তে PostgreSQL (PGlite) তৈরি হবে, মাইগ্রেশন চলবে এবং ডেমো কমিউনিটি সিড হবে। চাইলে `/signin` থেকে “Explore the live demo” ক্লিক করে সাথে সাথে পুরো অ্যাপ দেখতে পারবেন।

---

## Demo mode

`LIMH_DEMO_MODE=1` (default) seeds a sample community of seventeen profiles plus a ready-made demo account. Profiles span London, Dhaka, Chattogram, Mymensingh and Sylhet so the experience works near you too.

- Demo profiles are marked **Sample profile** in the interface and in their profile modal.
- Their replies are composed locally from their own prompt answers and interests.
- The demo account credentials are `alex@demo.limh.app` / `limh-demo-2026`.
- For a real, invite-only community set:

```env
LIMH_DEMO_MODE=0
```

The sample data is only inserted when no demo profile exists; existing real accounts are never touched.

### Email in development

Without SMTP configured, password-reset and email-confirmation links are printed to the server console. The whole auth flow still works. Set `SMTP_URL` (or `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASSWORD`) in production.

---

## Database

### Option A — PGlite (default, zero-config)

Data lives in `./.data/limh`. Perfect for local development, previews and small single-instance deployments. Do not run multiple app instances against the same PGlite directory.

### Option B — PostgreSQL (recommended for production)

```env
DATABASE_URL=postgresql://limh:limh@127.0.0.1:5432/limh
```

Works with any PostgreSQL 14+, including managed providers. Migrations are applied automatically on boot from `./drizzle`.

Change the schema in `src/db/schema.ts`, then generate a new migration:

```bash
npm run db:generate     # writes a new SQL migration
npm run db:push         # optional: push the schema directly (development)
npm run db:studio       # optional: Drizzle Studio
```

> **Note:** Better Auth writes to the `user`, `session`, `account` and `verification` tables. They are declared in the same Drizzle schema, so one migration folder covers the entire app.

---

## Production with Docker

You need Docker and a long random `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export BETTER_AUTH_URL="https://limh.example.com"   # your public origin
export POSTGRES_PASSWORD="a-strong-database-password"
docker compose up -d --build
```

This starts:

- `db` — PostgreSQL 16 with a persistent volume.
- `app` — the production Next.js server on port 3000, migrations applied at boot.
- `limh-uploads` — a persistent volume for uploaded photos.

Set `LIMH_DEMO_MODE=0` in the compose environment for a real community.

### Without Docker

```bash
npm ci
npm run build
npm start          # needs DATABASE_URL and BETTER_AUTH_SECRET
```

`npm start` runs the production build. The Docker image uses the same command, so what you test locally is what runs in the container.

### Reverse proxy / preview hosts

- Set `BETTER_AUTH_URL` to the canonical public origin.
- Add any additional origins (www, staging, preview) to `BETTER_AUTH_TRUSTED_ORIGINS`, comma separated.
- The app already trusts `localhost`, `*.e2b.app` and `*.arena.ai` so sandbox previews work; remove those for a hardened deployment if you prefer.
- Security headers (nosniff, referrer policy, permissions policy) are set in `next.config.ts`. `X-Frame-Options` is deliberately not set so the app can run inside a preview iframe.

### Uploads in production

Uploads are written to `public/uploads/` and served by Next.js. In Docker this is a named volume. For multi-instance or serverless deployments, point this at object storage (for example self-hosted MinIO or any S3-compatible service) inside `src/app/api/uploads/route.ts`; the rest of the app only stores URLs.

---

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `BETTER_AUTH_SECRET` | dev fallback | Session signing. **Set a strong value in production.** |
| `BETTER_AUTH_URL` | derived from request | Canonical app origin |
| `BETTER_AUTH_TRUSTED_ORIGINS` | – | Extra origins for auth endpoints |
| `DATABASE_URL` | – | Use PostgreSQL instead of PGlite |
| `DATABASE_POOL_SIZE` | `10` | PostgreSQL pool size |
| `PGLITE_DATA_DIR` | `./.data/limh` | PGlite storage location |
| `LIMH_DEMO_MODE` | `1` | Seed / show the sample community |
| `LIMH_DEMO_AUTOREPLY` | `1` | Let sample profiles reply in demo mode |
| `LIMH_DEMO_EMAIL` / `LIMH_DEMO_PASSWORD` | demo values | Demo account credentials |
| `SMTP_URL` or `SMTP_HOST`… | – | Real email delivery |
| `SMTP_FROM` | `Love Is My Heart <hello@limh.local>` | Sender address |
| `MIGRATIONS_DIR` | `./drizzle` | Custom migrations folder |

See `.env.example` for a documented template.

---

## How it works

### Matching

1. A member likes / passes / sends a spark.
2. The choice is stored in `interactions` with a unique `(from, to)` pair.
3. A like becomes a match only if the other person has already liked them — or, in demo mode, if the sample profile reciprocates based on shared interests.
4. Matches are stored once per pair, with sorted user ids, and both people get a system note and a live update.
5. Undo removes the latest outgoing choice; a discovery match with no conversation is removed too.

Compatibility scores are explainable: shared interests, aligned intentions, real distance, age proximity and verification. They are guidance, never a verdict.

### Realtime

`GET /api/events` streams Server-Sent Events for the signed-in member. Every four seconds the server checks a small fingerprint (number of matches, number of incoming likes, newest message id). When it changes, the client re-fetches `/api/app`. This works across multiple app instances because PostgreSQL is the source of truth — no in-memory pub/sub to lose messages.

### Safety

- **Block** hides the profile in both directions and deletes the match, messages and interactions between the two accounts.
- **Report** stores a private report and blocks by default.
- **Delete account** removes the user and cascades to the profile, preferences, photos references, interactions, matches, messages, blocks and reports.
- **Export** downloads a readable JSON file of exactly what the app knows about you.

Reports are stored in the `reports` table with status `open`. A moderation interface is intentionally left for operators; use SQL or your admin tooling of choice for now.

---

## API

All routes are JSON unless noted and require a session cookie unless marked public.

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/app` | Full state for the signed-in member |
| `POST` | `/api/auth/*` | Better Auth (sign up, sign in, reset, verify…) |
| `POST` | `/api/demo/session` | Demo sign-in (404 when demo mode is off) |
| `POST` | `/api/interactions` | like / pass / superlike / undo |
| `PUT` | `/api/preferences` | Discovery preferences |
| `PUT` | `/api/member` | Create / update a profile (onboarding included) |
| `POST` | `/api/messages` | Send a message |
| `PATCH` | `/api/messages` | Mark a conversation read |
| `POST` | `/api/uploads` | Multipart photo upload (8 MB max) |
| `POST` | `/api/safety/block` | Block / unblock |
| `POST` | `/api/safety/report` | Report (optionally block) |
| `GET` | `/api/export` | Download your data |
| `DELETE` | `/api/account` | Delete everything (`{ "confirm": "DELETE" }`) |
| `GET` | `/api/events` | Server-Sent Events stream |
| `GET` | `/api/health` | Database health check (public) |

---

## Scripts

```bash
npm run dev         # development server on 0.0.0.0:3000
npm run build       # production build
npm start           # production server
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run check       # typecheck + lint + tests
npm test            # Vitest unit tests
npm run db:generate # new SQL migration from the schema
```

---

## Project structure

```
src/
  app/
    page.tsx              marketing landing page
    join/ signin/ reset-password/
    onboarding/           three-step profile builder
    app/                  signed-in experience
    api/                  auth, state, discovery, messages, uploads, safety, SSE
  components/             interface (discovery deck, messenger, settings, auth…)
  db/
    schema.ts             Drizzle schema (auth + dating domain)
    index.ts              PostgreSQL / PGlite driver (lazy)
    setup.ts              migrations + demo seed
  lib/
    auth.ts               Better Auth server config
    auth-client.ts        Better Auth browser client
    server-state.ts       per-member view model
    matching.ts           explainable compatibility
    cities.ts             city coordinates + haversine
    validation.ts         Zod request contracts
    demo.ts               labelled sample community
drizzle/                  generated SQL migrations
tests/                    Vitest unit tests
```

---

## Security & privacy notes

- Passwords are hashed by Better Auth (scrypt); LIMH never stores plaintext.
- Sessions are httpOnly cookies; auth endpoints enforce trusted origins and rate limits.
- Every route re-checks the session and ownership before reading or writing.
- Uploads are validated by decoding them with Sharp (not by trusting MIME headers), capped at 8 MB, rotated, resized and re-encoded to WebP — which strips EXIF metadata.
- External photo URLs are rejected by profile validation; only `/uploads/...` (and seed portraits) are accepted.
- Text fields are length-limited and validated with Zod.
- There is no analytics, advertising or third-party tracking script.
- `BETTER_AUTH_SECRET` must be replaced before deploying. The repository ships a development-only fallback.

---

## Known limitations & next steps

This is a genuinely working app, not a finished consumer product. Honest next steps:

- **Moderation UI** for the reports table, plus admin suspension.
- **Object storage** adapter for uploads (MinIO/S3) for multi-instance deployments.
- **Email delivery** needs SMTP credentials; otherwise links are logged.
- **Push/email notifications** for new matches and messages.
- **Photo verification** currently means: confirmed email plus operator-set `verified`. A liveness/selfie review flow would be the next real step.
- **Demo auto-replies** are scheduled in-process; they are intentionally simple and should stay disabled in production.
- **Age/identity assurance** and jurisdiction-specific compliance are deliberately not faked. Add them before operating publicly.

---

## License

Application code: MIT. Dependencies keep their own licenses (see the table above). London sample portraits remain the property of their Pexels creators; the Bangladesh sample portraits were generated for this demo community. City coordinates are CC BY 4.0 from GeoNames.

Built with open-source tools, for people who would rather have one honest conversation than a hundred empty swipes.

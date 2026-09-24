# Aksis

A homework tracker built to replace a Google Sheet: assignments, quizzes and requirements, sorted by what's due next. Sign in with Google; everyone's tracker is private. Installs as an app (PWA).

## Run it

```bash
npm install
npm run dev
```

Opens at http://localhost:5173. You need a `.env.local`:

```bash
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Only the project URL and the publishable key go in the client. Never put the `service_role` key in this app.

## Supabase setup

1. Apply the migrations in `supabase/migrations/` in order.
2. **Authentication → Sign In / Providers:** enable Google with your OAuth client ID and secret. Disable Email, since the app only signs in with Google.
3. **Authentication → URL Configuration:** Site URL `http://localhost:5173`, and redirect URLs `http://localhost:5173/**` plus your deployed domain (`https://<app>.vercel.app/**`).
4. In Google Cloud, the OAuth client's redirect URI is `https://<project-ref>.supabase.co/auth/v1/callback`, and the consent screen must be **In production**.

## How the data works

- Semesters are stored as **spaces** (`kind = 'semester'`) with **memberships** (owner / editor / viewer), so shared spaces can be added later. Row-level security checks membership on every table.
- `src/lib/store.ts` keeps the same actions the components always used. Changes show up immediately, save in the background one at a time, and roll back with a toast if saving fails. Title and notes edits save after a short pause instead of on every keystroke.
- Due dates are `date` columns. "Today" is worked out in the browser.

## Importing a spreadsheet

A user's existing data can be waiting for them before they ever sign in:

1. Put the data in `private.pending_imports` under their Gmail (lowercase), as JSON shaped `[{ name, classes: [..], tasks: [{ title, class, type, status, priority, due }] }]`, newest semester first.
2. On their first sign-in, `handle_new_user()` creates their profile and turns the JSON into semesters, classes and tasks, then marks the import claimed. A failed import never blocks sign-in.

Real data lives in `seed/`, which is gitignored. Never commit it.

## Limits and security

- Each user can make 120 writes a minute (`private.check_request`, run by the API before every request). Reads aren't counted.
- Caps per account: 50 semesters, 100 classes per semester, 2,000 tasks per semester. Titles, names and notes have length limits in the database and in the inputs.
- `private` isn't exposed through the API. Helpers there are `security definer` with an empty `search_path`.
- Sign-in uses the PKCE flow. `vercel.json` sets a strict Content Security Policy and the usual security headers.

## Stack

Vite, React 19, TypeScript, Tailwind v4, shadcn/ui (Radix), Motion, cmdk, Sonner, react-day-picker, NumberFlow, zustand, TanStack Query, Supabase, vite-plugin-pwa.

## Layout

- `src/lib/`: the store, Supabase client, generated database types and row mappers, date rules, themes, PWA helpers
- `src/components/`: app pieces (header, quick add, task list, calendar, task sheet, search menu, tutorial)
- `src/components/ui/`: shadcn components, added with `npx shadcn@latest add <name>`
- `supabase/migrations/`: the database schema, in order

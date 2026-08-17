# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

`@next-nest-auth/nextauth` is a small npm package that provides cookie-based
JWT authentication for **Next.js App Router** apps that talk to a companion
NestJS backend package, `@next-nest-auth/nestauth`. It is the frontend half
of a matched pair — changes here should stay compatible with the token
response shape and endpoint contract (`/nestauth/login`,
`/nestauth/refresh-token`) that the backend package exposes.

The entire public API is one file: `src/auth.ts`, re-exported via
`src/index.ts`. There is no other source. Read `src/auth.ts` in full before
making changes — it's short enough to hold in context completely.

## Architecture

- **Cookies, not client storage.** Access/refresh tokens are stored as
  `httpOnly` cookies (`access_token`, `refresh_token`), set via
  `next/headers` `cookies()` in Server Actions/Route Handlers (`authenticate`,
  `logout`) or via `NextResponse` cookies in middleware (`refreshToken`).
  These are two different cookie APIs because `next/headers` `cookies()` is
  not available in middleware — `refreshToken(req)` reads from
  `req.cookies` and writes to a `NextResponse` instead. Don't "simplify" this
  by unifying them; it's a Next.js constraint, not an inconsistency.
- **`getUserInfo()` decodes the JWT client-side without verifying its
  signature** (via `jwt-decode`). This is intentional — it's a convenience
  read of claims already trusted because they came from `access_token`,
  which the backend issued and only the backend can read requests with.
  Never use `getUserInfo()`'s output as an authorization check by itself;
  `checkAuth()` (presence of a valid-looking access token) plus server-side
  verification on the NestJS side is the actual trust boundary.
- **`get`/`post` are a thin authenticated Axios wrapper**, not a full HTTP
  client. They attach `Authorization: Bearer <access_token>` when
  `secured` (default `true`), and always send `withCredentials: true` so the
  auth cookies travel on same-site/CORS-configured cross-site requests.
- **`convertToSeconds`** parses backend-supplied `expiresIn` strings like
  `"15m"`, `"7d"`, `"12h"` into a cookie `maxAge`. It does **not** handle a
  bare numeric string or a seconds unit (`"s"`) — if the paired
  `@next-nest-auth/nestauth` backend ever changes its `expiresIn` format,
  this silently returns `0` and cookies expire immediately. Check this
  function first if you're debugging "user gets logged out immediately."

## Environment variables

- `NEXT_AUTH_API_URL` or `NEXT_PUBLIC_AUTH_API_URL` — base URL of the
  NestJS backend. (Renamed from `API_BASE_URL`/`NEXT_PUBLIC_API_URL` in the
  current unreleased changes — see git history / CHANGELOG before assuming
  the old names still work.)
- `NODE_ENV` — gates the cookie `secure` flag (`true` only when exactly
  `"production"`).
- `AUTOEXPIRE_REFRESH_TOKEN` — if set (any truthy value), `refreshToken()`
  skips re-issuing the refresh-token cookie, letting it expire on its
  original schedule instead of sliding forward on every refresh.

## Build & dev

- `npm run build` — `tsc` compile to `dist/` (this is what gets published;
  `main`/`types` point at `dist/src/index.js` / `dist/src/index.d.ts`).
- `npm run dev` — `tsc -w`, incremental watch build.
- There is **no lint script, no test script, and no CI** in this repo today.
  Don't assume `npm test` exists. If you add tests, you'll also need to pick
  and wire up a runner (nothing is configured).
- `tsconfig.json` runs with `strict: true` (`rootDir`/`outDir` are
  `src/` → `dist/`, so build output is `dist/index.js`, not
  `dist/src/index.js` — matches `main`/`types`/`exports` in `package.json`).
- `next` is a `peerDependency` (and a `devDependency`, so local builds still
  resolve `next/headers`/`next/server` types) — it is intentionally **not**
  a regular `dependency`, to avoid consuming apps getting a duplicate copy
  of Next.js.

## Conventions

- Double-quoted strings, 2-space indentation (recently normalized across
  the file — match this style, don't reintroduce single quotes).
- No comments in `dist/` output (`removeComments: true`); comments in
  `src/` should be kept minimal and only where the *why* isn't obvious from
  the code (see general house style — this isn't project-specific).
- Every exported function is public API consumed by downstream Next.js
  apps. Treat any signature change as a breaking change requiring a semver
  major-equivalent bump (this package doesn't strictly follow semver in its
  history — see CHANGELOG — but new changes should).

## Known rough edges

Audited 2026-08-17. The security and packaging issues found that day were
fixed the same day (see CHANGELOG `[Unreleased]`): `authenticate()` no
longer leaks `params`/credentials into thrown error messages, `get`/`post`
now `throw` on failure instead of returning the raw Axios error object,
`next` moved to `peerDependencies`, and the unused `jsonwebtoken`/`js-cookie`
dependencies were removed. `tsconfig.json` now runs with `strict: true`.

Still open (left alone deliberately — behavior changes, not fixed
opportunistically):

- `convertToSeconds` only parses `\d+[mhd]` — a bare numeric `expiresIn`
  string (a common JWT convention) yields `maxAge: 0`, expiring cookies
  immediately. See the note above in Architecture.
- Cookie-option objects are duplicated between `authenticate()` and
  `refreshToken()` — could be extracted into a shared helper.
- `get`/`post`/`authenticate` type their inputs as `any` — no generics for
  typed request/response shapes.
- No request timeout/abort handling on axios calls; no automatic
  refresh-and-retry on 401.
- Cookie names (`access_token`, `refresh_token`) are hardcoded, not
  configurable.
- No tests, no ESLint/Prettier config, no CI workflow, no SECURITY.md or
  CONTRIBUTING.md exist in this repo.

## Companion package

`@next-nest-auth/nestauth` (NestJS) is the backend counterpart and defines
the actual `/nestauth/login` and `/nestauth/refresh-token` endpoint
contracts and `TokenResponse` shape this package assumes. If you're
debugging a mismatch (e.g. `expiresIn` format, response field names), the
backend package is the source of truth — it isn't in this repository.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
This project's early history did not follow semantic versioning strictly
(patch-level bumps sometimes carried behavioral changes); entries below are
reconstructed from git history where no changelog previously existed, so
pre-0.2.6 entries are best-effort summaries rather than author-written notes.

## [0.3.0] - 2026-08-17

### Security
- `authenticate()` no longer includes the raw login `params` (e.g.
  passwords) or the full API response in its thrown error message on
  failure — the previous message could leak credentials into logs or error
  trackers.
- `get`/`post` now `throw` on request failure instead of silently
  `return`-ing the raw Axios error object, so callers can no longer mistake
  a failed request for a successful one with an unusual payload.

### Changed
- Renamed backend URL environment variables for clarity:
  `API_BASE_URL` → `NEXT_AUTH_API_URL`, `NEXT_PUBLIC_API_URL` →
  `NEXT_PUBLIC_AUTH_API_URL`. **Breaking:** update your `.env` if you were
  using the old names.
- `next` moved from `dependencies` to `peerDependencies` (kept as a
  `devDependency` for local builds/types). **Potentially breaking** if your
  install doesn't already have a compatible `next` version installed —
  npm/pnpm/yarn will now warn instead of silently duplicating it.
- Build output moved from `dist/src/index.js` to `dist/index.js`
  (`main`/`types`/`exports` updated to match). No change needed on the
  consumer side — only internal path layout changed.
- Added a package `exports` map, `sideEffects: false`, an `engines.node`
  requirement (`>=18`), and a `prepublishOnly` build guard.
- `files` now ships only `dist/` (previously also shipped raw `src/`),
  shrinking the published tarball.
- `tsconfig.json` now runs with `strict: true` (previously
  `strictNullChecks`/`noImplicitAny` were disabled); removed unused
  `emitDecoratorMetadata`/`experimentalDecorators` options left over from a
  NestJS-style config; scoped compilation to `src/**/*` via `include`.
- Reformatted `src/auth.ts` and `README.md` to consistent double-quote /
  2-space style.
- Bumped `axios` from `1.13.2` to `^1.19.0` to pick up fixes for several
  published advisories (SSRF, prototype pollution, ReDoS) affecting older
  1.x releases.

### Removed
- Removed unused `jsonwebtoken` and `js-cookie` dependencies (neither was
  imported anywhere in `src/`).

## [0.2.6] - 2026-05-12
### Removed
- Removed leftover debugging code from the authentication flow.

## [0.2.5] - 2026-05-06
### Changed
- Internal updates; removed stale `dist/` artifacts from version control
  bookkeeping (build output should not have been tracked between releases).

## [0.2.1] - 2026-05-06
### Changed
- Cookie policy relaxed from `sameSite: "strict"` to `sameSite: "lax"` for
  `access_token` and `refresh_token`, allowing the cookies to be sent on
  top-level cross-site navigations (e.g. redirect flows), not only same-site
  requests.

## [0.2.0] - 2026-03-31
### Fixed
- Resolved a merge conflict affecting the auth flow in `src/auth.ts`.

## [0.1.9] - 2026-03-10
### Changed
- Improved internal debug logging around token refresh.

## [0.1.7] - 2026-02-24
### Changed
- Minor internal updates to `src/auth.ts` and `README.md`.

## [0.1.6] - 2026-01-07
### Changed
- Dependency and internal updates.

## [0.1.4] - 2025-12-08
### Changed
- Refresh token logic updated.

## [0.1.3] - 2025-10-28
### Changed
- Updated dependencies to their latest versions.

## [0.1.2] - 2025-09-05
### Changed
- `authenticate()` now validates that the backend response includes
  `accessToken`, `refreshToken`, `accessTokenExpiresIn`, and
  `refreshTokenExpiresIn` before treating login as successful, instead of
  only checking for a truthy response.

## [0.1.1] - 2025-08-01
### Changed
- Minor internal updates.

## [0.0.9] - 2025-04-29
### Changed
- Build output updates.

## [0.0.8] - 2025-04-29
### Added
- Extended the decoded `User` type with `mobile`, `role`, `pic`, `macId`,
  and an index signature for arbitrary additional JWT claims.

## [0.0.7] - 2025-02-07
### Changed
- README documentation updates.

## [0.0.6] - 2025-02-05
### Added
- Public GitHub repository link and author email added to `package.json`
  and `LICENSE`.

## [0.0.5] - 2025-02-04
### Added
- Initial public release: `authenticate`, `refreshToken`, `getAccessToken`,
  `getRefreshToken`, `checkAuth`, `getUserInfo`, `logout`, and authenticated
  `get`/`post` helper functions.
- `refreshToken()` reworked to accept a `NextRequest` and return a
  `NextResponse` with updated cookies, for use in Next.js middleware
  (`next/headers` `cookies()` isn't available there).
- `AUTOEXPIRE_REFRESH_TOKEN` environment variable to opt out of sliding the
  refresh-token cookie's expiry forward on every refresh.
- MIT License and README added.

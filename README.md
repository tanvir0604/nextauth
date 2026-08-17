# @next-nest-auth/nextauth

**Cookie-based JWT authentication for Next.js apps backed by a NestJS API.**

[![npm version](https://img.shields.io/npm/v/@next-nest-auth/nextauth.svg)](https://www.npmjs.com/package/@next-nest-auth/nextauth)
[![npm downloads](https://img.shields.io/npm/dm/@next-nest-auth/nextauth.svg)](https://www.npmjs.com/package/@next-nest-auth/nextauth)
[![license](https://img.shields.io/npm/l/@next-nest-auth/nextauth.svg)](./LICENSE)
[![types](https://img.shields.io/npm/types/@next-nest-auth/nextauth.svg)](./src/index.ts)

`@next-nest-auth/nextauth` is the **frontend half** of a matched
authentication pair for full-stack TypeScript apps: this package handles
login, session, and token refresh on the **Next.js (App Router)** side, and
[`@next-nest-auth/nestauth`](https://www.npmjs.com/package/@next-nest-auth/nestauth)
handles issuing and validating JWTs on the **NestJS** side. Together they
give you secure, `httpOnly`-cookie-based authentication with automatic
access/refresh token handling, without wiring it up from scratch.

> **Not related to [Auth.js / NextAuth.js](https://authjs.dev/).** This is a
> lightweight, purpose-built package for pairing a Next.js frontend with a
> NestJS backend — it is not a fork of, or drop-in replacement for, the
> popular `next-auth` package.

## Features

- 🔐 **httpOnly cookie sessions** — access and refresh tokens never touch
  client-side JavaScript or `localStorage`.
- 🔄 **Built-in refresh flow** — a middleware-ready `refreshToken()` helper
  for silently renewing expired sessions.
- 🧩 **Drop-in with `@next-nest-auth/nestauth`** — matches its
  `/nestauth/login` and `/nestauth/refresh-token` endpoint contract out of
  the box.
- 🪪 **JWT claim decoding** — read the logged-in user's claims with
  `getUserInfo()`, no extra API call required.
- 📦 **TypeScript-first** — ships its own type declarations, no
  `@types` package needed.
- 🌐 **Authenticated fetch helpers** — `get`/`post` wrappers that attach the
  bearer token automatically.

## Requirements

- Next.js **13.4+** using the **App Router** (this package uses
  `next/headers` and Next.js middleware APIs, which are not available in
  the Pages Router).
- A backend implementing the `@next-nest-auth/nestauth` login/refresh
  contract (or a compatible API — see [Prerequisites](#prerequisites)).

## Installation

```bash
npm install @next-nest-auth/nextauth
# or
yarn add @next-nest-auth/nextauth
# or
pnpm add @next-nest-auth/nextauth
```

## Prerequisites

This package is the client counterpart to
[`@next-nest-auth/nestauth`](https://www.npmjs.com/package/@next-nest-auth/nestauth).
Read that package's documentation first — it defines the backend endpoints
(`/nestauth/login`, `/nestauth/refresh-token`) and token response shape
this package expects.

## Environment variables

Set the following in your Next.js app's `.env`:

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_AUTH_API_URL` or `NEXT_PUBLIC_AUTH_API_URL` | Yes (one of the two) | Base URL of your NestJS backend. |
| `NODE_ENV` | Recommended | `development` or `production`. Controls whether auth cookies are marked `secure` (`production` only). |
| `AUTOEXPIRE_REFRESH_TOKEN` | No | When set, the refresh-token cookie's expiry is **not** extended on each token refresh — it expires on its original schedule. Default: unset (sliding expiry). |
| `BASE_URL` | No | Your Next.js frontend's own URL, for reference in redirect flows. |

```env
NODE_ENV=development
BASE_URL=http://localhost:3000
NEXT_AUTH_API_URL=http://localhost:3001
# or
NEXT_PUBLIC_AUTH_API_URL=http://localhost:3001
```

## Quick start

### 1. Log in and set session cookies

```typescript
import { authenticate } from "@next-nest-auth/nextauth";

const response = await authenticate({
  username: "user",
  password: "password",
});
```

### 2. Protect routes in middleware

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAuth, refreshToken } from "@next-nest-auth/nextauth";

export async function middleware(req: NextRequest) {
  const protectedRoutes = ["/dashboard", "/profile", "/settings"];

  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    const authenticated = await checkAuth();
    if (!authenticated) {
      try {
        return await refreshToken(req);
      } catch (error) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*", "/settings/:path*"],
};
```

### 3. Read the current user and log out

```typescript
import { getUserInfo, logout } from "@next-nest-auth/nextauth";

const user = await getUserInfo();
await logout();
```

## API reference

### `authenticate(params)`

Authenticates the user against your NestJS backend and stores the returned
access and refresh tokens as `httpOnly` cookies.

```typescript
import { authenticate } from "@next-nest-auth/nextauth";

const response = await authenticate({
  username: "user",
  password: "password",
});
```

### `refreshToken(req)`

Renews the access token using the refresh token cookie. Designed for use in
Next.js **middleware** (it reads from `req.cookies` and returns a
`NextResponse`, since `next/headers` `cookies()` is not available there).

```typescript
import { refreshToken } from "@next-nest-auth/nextauth";

const refreshedResponse = await refreshToken(req);
```

### `getUserInfo()`

Decodes the current access token and returns its claims, or `null` if
there is no valid token.

```typescript
import { getUserInfo } from "@next-nest-auth/nextauth";

const userInfo = await getUserInfo();
```

> This reads claims from the JWT locally and does **not** re-verify the
> token's signature. Treat it as a convenience read, not an authorization
> check — your NestJS backend remains the source of truth for whether a
> token is actually valid.

### `getAccessToken()` / `getRefreshToken()`

Read the raw token values from cookies.

```typescript
import { getAccessToken, getRefreshToken } from "@next-nest-auth/nextauth";

const accessToken = await getAccessToken();
const refreshToken = await getRefreshToken();
```

### `checkAuth()`

Returns `true` if an access token cookie is present.

```typescript
import { checkAuth } from "@next-nest-auth/nextauth";

const authenticated = await checkAuth();
```

### `logout()`

Deletes the access and refresh token cookies.

```typescript
import { logout } from "@next-nest-auth/nextauth";

await logout();
```

### `get(url, params?, headers?, secured?)` / `post(url, data?, headers?, secured?)`

Axios-based helpers that automatically attach `Authorization: Bearer
<access_token>` when `secured` is `true` (the default).

```typescript
import { get, post } from "@next-nest-auth/nextauth";

const data = await get("/some-api-endpoint");
const postData = await post("/some-api-endpoint", { someData: "value" });
```

## Security considerations

- Tokens are stored as `httpOnly` cookies, never exposed to client-side
  JavaScript.
- The `secure` cookie flag is enabled automatically when `NODE_ENV` is
  exactly `production` — make sure that's set correctly in your deployment
  environment, or cookies won't be marked `secure` there.
- If your Next.js frontend and NestJS backend are on different origins,
  configure CORS on the backend to allow credentials
  (`Access-Control-Allow-Credentials: true`) from your frontend's specific
  origin — this package sends requests with `withCredentials: true`.
- `getUserInfo()` decodes but does not verify the JWT signature; don't use
  it as your only authorization gate for sensitive actions.

## Related

- [`@next-nest-auth/nestauth`](https://www.npmjs.com/package/@next-nest-auth/nestauth) — the NestJS backend counterpart to this package.

## Contributing

Issues and pull requests are welcome at
[github.com/tanvir0604/nextauth](https://github.com/tanvir0604/nextauth/issues).

## License

This package is licensed under the [MIT License](./LICENSE).

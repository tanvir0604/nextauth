# @next-nest-auth/nextauth

This package provides an authentication solution that integrates a NestJS backend with a Next.js frontend. It allows you to handle authentication, session management, and token refreshing in a seamless way.

## Prerequisites

Before using this package, please make sure to read the documentation of `@next-nest-auth/nestauth` first, as it is required for the backend integration.

## .env Setup

In order to use this package correctly, you need to set up the following environment variables:

```
BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
NODE_ENV=development
```

-   `BASE_URL`: The URL of your Next.js frontend.
-   `API_BASE_URL`: The URL of your NestJS backend.
-   `NODE_ENV`: The environment mode (`development`, `production`).

## Middleware Usage

You can use the `checkAuth` and `refreshToken` functions in your Next.js middleware to manage authentication and session validation for protected routes.

### Example Usage:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkAuth, refreshToken } from "nextauth";

export async function middleware(req: NextRequest) {
    const protectedRoutes = ["/dashboard", "/profile", "/settings"];

    if (
        protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))
    ) {
        const authenticated = await checkAuth();
        if (!authenticated) {
            try {
                const response = await refreshToken(req);
                // Check other logics
                return response;
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

## Functions

### `authenticate`

This function authenticates the user and sets the access and refresh tokens in cookies.

```typescript
import { authenticate } from "nextauth";

const response = await authenticate({
    username: "user",
    password: "password",
});
```

### `refreshToken`

This function is responsible for refreshing the access token using the refresh token stored in cookies.

```typescript
import { refreshToken } from "nextauth";

const refreshedResponse = await refreshToken(req);
```

### `getUserInfo`

This function retrieves the user information from the access token.

```typescript
import { getUserInfo } from "nextauth";

const userInfo = await getUserInfo();
```

### `getAccessToken` / `getRefreshToken`

These functions retrieve the current access token and refresh token from the cookies.

```typescript
import { getAccessToken, getRefreshToken } from "nextauth";

const accessToken = await getAccessToken();
const refreshToken = await getRefreshToken();
```

### `checkAuth`

This function checks if the user is authenticated by verifying the access token.

```typescript
import { checkAuth } from "nextauth";

const authenticated = await checkAuth();
```

### `logout`

This function deletes the access and refresh tokens from cookies.

```typescript
import { logout } from "nextauth";

await logout();
```

### `get` / `post`

These are helper functions to make authenticated HTTP requests using Axios.

```typescript
import { get, post } from "nextauth";

const data = await get("/some-api-endpoint");
const postData = await post("/some-api-endpoint", { someData: "value" });
```

## License

This package is licensed under the MIT License.

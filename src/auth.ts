import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_BASE_URL;

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
    accessTokenExpiresIn: string;
    refreshTokenExpiresIn: string;
}

interface User {
    id: string;
    name: string;
    email: string;
    mobile: string;
    role: string;
    pic: string;
    macId: string;
    [key: string]: any;
}

const convertToSeconds = (expiresIn: string) => {
    const match = expiresIn.match(/(\d+)([mhd])/);
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case "m":
            return value * 60;
        case "h":
            return value * 60 * 60;
        case "d":
            return value * 60 * 60 * 24;
        default:
            return 0;
    }
};

export async function refreshToken(req: NextRequest) {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;
        if (!refreshToken) {
            throw new Error("Token refresh failed, no refresh token");
        }
        const response: TokenResponse = await post(
            `${API_URL}/nestauth/refresh-token`,
            {
                refresh_token: refreshToken,
            },
            {},
            false
        );

        if (!response || !response.accessToken || !response.refreshToken) {
            throw new Error("Token refresh failed, no response from api");
        }

        const res = NextResponse.next();
        res.cookies.set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn ?? ""),
        });

        if (!process.env.AUTOEXPIRE_REFRESH_TOKEN) {
            if (process.env.NODE_ENV === "development") {
                console.log(
                    "refresh token is not expired and updating expires in"
                );
            }
            res.cookies.set("refresh_token", response.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                path: "/",
                maxAge: convertToSeconds(response.refreshTokenExpiresIn ?? ""),
            });
        }

        return res;
    } catch (error) {
        throw new Error(error);
    }
}

export async function authenticate(params: any) {
    try {
        const response: TokenResponse = await post(
            `${API_URL}/nestauth/login`,
            params,
            {},
            false
        );
        if (
            !response ||
            !response.accessToken ||
            !response.refreshToken ||
            !response.accessTokenExpiresIn ||
            !response.refreshTokenExpiresIn
        ) {
            throw new Error("Login failed");
        }
        const cookieStore = await cookies();
        cookieStore.set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn ?? ""),
        });

        cookieStore.set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn ?? ""),
        });

        return response;
    } catch (error) {
        // console.log(error);
        throw new Error(error);
    }
}

export async function getAccessToken() {
    const cookieStore = await cookies();
    const access_token = cookieStore.get("access_token")?.value;
    return access_token ?? null;
}

export async function getRefreshToken() {
    const cookieStore = await cookies();
    const refresh_token = cookieStore.get("refresh_token")?.value;
    return refresh_token ?? null;
}

export async function checkAuth() {
    const accessToken = await getAccessToken();
    return !!accessToken;
}

export async function getUserInfo() {
    const accessToken = await getAccessToken();
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = jwtDecode(accessToken) as User;
        return decoded;
    } catch (error) {
        return null;
    }
}

export async function logout() {
    (await cookies()).delete("access_token");
    (await cookies()).delete("refresh_token");
}

export async function get(
    url: string,
    params: any = {},
    headers: any = {},
    secured = true
) {
    const headerData: Record<string, string> = {
        Authorization: "",
        ...headers,
    };
    if (secured) {
        const accessToken = await getAccessToken();
        headerData.Authorization = "Bearer " + accessToken;
    }

    try {
        const response = await axios.get(url, {
            headers: headerData,
            params: params,
            withCredentials: true,
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    } catch (error) {
        return error;
    }
}

export async function post(
    url: string,
    data: any = {},
    headers: any = {},
    secured = true
) {
    const headerData: Record<string, string> = {
        Authorization: "",
        ...headers,
    };
    if (secured) {
        const accessToken = await getAccessToken();
        headerData.Authorization = "Bearer " + accessToken;
    }
    try {
        const response = await axios.post(url, data, {
            headers: headerData,
            withCredentials: true,
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    } catch (error) {
        return error;
    }
}

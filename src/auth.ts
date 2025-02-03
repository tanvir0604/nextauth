import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

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
}

const convertToSeconds = (expiresIn: string) => {
    const match = expiresIn.match(/(\d+)([mhd])/); // Match "15m", "7d", etc.
    if (!match) return 0;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
        case "m": // minutes
            return value * 60;
        case "h": // hours
            return value * 60 * 60;
        case "d": // days
            return value * 60 * 60 * 24;
        default:
            return 0;
    }
};

export async function refreshToken() {
    try {
        const response: TokenResponse = await post(
            `${API_URL}/nestauth/refresh-token`,
            {
                refresh_token: await getRefreshToken(),
            },
            {},
            false
        );

        console.log("response from nestauth api", response);

        if (!response) {
            throw new Error("Token refresh failed, no response from api");
        }

        if (!response.accessToken || !response.refreshToken) {
            throw new Error(
                "Token refresh failed, no access and refresh token"
            );
        }

        (await cookies()).set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });

        (await cookies()).set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });

        return response;
    } catch (error) {
        console.error("Token refresh failed", error);
        throw new Error("Token refresh failed");
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

        console.log("response", response);
        if (!response) {
            throw new Error("Login failed");
        }

        (await cookies()).set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });

        (await cookies()).set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });

        return response;
    } catch (error) {
        console.error("Login failed", error);
        throw new Error("Login failed");
    }
}

export async function getAccessToken() {
    const refresh_token = await getRefreshToken();
    if (!refresh_token) {
        return null;
    }
    const cookieStore = await cookies();
    const access_token = cookieStore.get("access_token")?.value;
    if (!access_token) {
        const response = await get(
            process.env.BASE_URL + `/api/auth/refresh`,
            {},
            {},
            false
        );
        return response.accessToken ?? null;
    }
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
    console.log("accessToken", accessToken);
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = jwtDecode(accessToken) as User;
        console.log("decoded", decoded);
        return decoded;
    } catch (error) {
        console.error("Invalid token", error);
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
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    } catch (error) {
        console.log(error);
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
        });
        console.log("post response", response);
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    } catch (error) {
        console.log(error);
        return error;
    }
}

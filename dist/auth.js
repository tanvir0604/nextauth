"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = refreshToken;
exports.authenticate = authenticate;
exports.getAccessToken = getAccessToken;
exports.getRefreshToken = getRefreshToken;
exports.checkAuth = checkAuth;
exports.getUserInfo = getUserInfo;
exports.logout = logout;
exports.get = get;
exports.post = post;
const axios_1 = require("axios");
const jwt_decode_1 = require("jwt-decode");
const headers_1 = require("next/headers");
const API_URL = process.env.API_BASE_URL;
const convertToSeconds = (expiresIn) => {
    const match = expiresIn.match(/(\d+)([mhd])/);
    if (!match)
        return 0;
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
async function refreshToken() {
    try {
        const response = await post(`${API_URL}/nestauth/refresh-token`, {
            refresh_token: await getRefreshToken(),
        }, {}, false);
        console.log("response from nestauth api", response);
        if (!response) {
            throw new Error("Token refresh failed, no response from api");
        }
        if (!response.accessToken || !response.refreshToken) {
            throw new Error("Token refresh failed, no access and refresh token");
        }
        (await (0, headers_1.cookies)()).set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });
        (await (0, headers_1.cookies)()).set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });
        return response;
    }
    catch (error) {
        console.error("Token refresh failed", error);
        throw new Error("Token refresh failed");
    }
}
async function authenticate(params) {
    try {
        const response = await post(`${API_URL}/nestauth/login`, params, {}, false);
        console.log("response", response);
        if (!response) {
            throw new Error("Login failed");
        }
        (await (0, headers_1.cookies)()).set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });
        (await (0, headers_1.cookies)()).set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });
        return response;
    }
    catch (error) {
        console.error("Login failed", error);
        throw new Error("Login failed");
    }
}
async function getAccessToken() {
    const refresh_token = await getRefreshToken();
    if (!refresh_token) {
        return null;
    }
    const cookieStore = await (0, headers_1.cookies)();
    const access_token = cookieStore.get("access_token")?.value;
    if (!access_token) {
        const response = await get(process.env.BASE_URL + `/api/auth/refresh`, {}, {}, false);
        return response.accessToken ?? null;
    }
    return access_token ?? null;
}
async function getRefreshToken() {
    const cookieStore = await (0, headers_1.cookies)();
    const refresh_token = cookieStore.get("refresh_token")?.value;
    return refresh_token ?? null;
}
async function checkAuth() {
    const accessToken = await getAccessToken();
    return !!accessToken;
}
async function getUserInfo() {
    const accessToken = await getAccessToken();
    console.log("accessToken", accessToken);
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(accessToken);
        console.log("decoded", decoded);
        return decoded;
    }
    catch (error) {
        console.error("Invalid token", error);
        return null;
    }
}
async function logout() {
    (await (0, headers_1.cookies)()).delete("access_token");
    (await (0, headers_1.cookies)()).delete("refresh_token");
}
async function get(url, params = {}, headers = {}, secured = true) {
    const headerData = {
        Authorization: "",
        ...headers,
    };
    if (secured) {
        const accessToken = await getAccessToken();
        headerData.Authorization = "Bearer " + accessToken;
    }
    try {
        const response = await axios_1.default.get(url, {
            headers: headerData,
            params: params,
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    }
    catch (error) {
        console.log(error);
        return error;
    }
}
async function post(url, data = {}, headers = {}, secured = true) {
    const headerData = {
        Authorization: "",
        ...headers,
    };
    if (secured) {
        const accessToken = await getAccessToken();
        headerData.Authorization = "Bearer " + accessToken;
    }
    try {
        const response = await axios_1.default.post(url, data, {
            headers: headerData,
        });
        console.log("post response", response);
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    }
    catch (error) {
        console.log(error);
        return error;
    }
}
//# sourceMappingURL=auth.js.map
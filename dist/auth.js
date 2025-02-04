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
const server_1 = require("next/server");
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
async function refreshToken(req) {
    try {
        const refreshToken = req.cookies.get("refresh_token")?.value;
        if (!refreshToken) {
            throw new Error("Token refresh failed, no refresh token");
        }
        const response = await post(`${API_URL}/nestauth/refresh-token`, {
            refresh_token: refreshToken,
        }, {}, false);
        if (!response || !response.accessToken || !response.refreshToken) {
            throw new Error("Token refresh failed, no response from api");
        }
        const res = server_1.NextResponse.next();
        res.cookies.set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });
        res.cookies.set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });
        return res;
    }
    catch (error) {
        throw new Error("Token refresh failed");
    }
}
async function authenticate(params) {
    try {
        const response = await post(`${API_URL}/nestauth/login`, params, {}, false);
        if (!response) {
            throw new Error("Login failed");
        }
        const cookieStore = await (0, headers_1.cookies)();
        cookieStore.set("access_token", response.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.accessTokenExpiresIn),
        });
        cookieStore.set("refresh_token", response.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/",
            maxAge: convertToSeconds(response.refreshTokenExpiresIn),
        });
        return response;
    }
    catch (error) {
        console.log(error);
        throw new Error("Login failed");
    }
}
async function getAccessToken() {
    const cookieStore = await (0, headers_1.cookies)();
    const access_token = cookieStore.get("access_token")?.value;
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
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(accessToken);
        return decoded;
    }
    catch (error) {
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
            withCredentials: true,
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    }
    catch (error) {
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
            withCredentials: true,
        });
        if (response.status === 200 || response.status === 201) {
            return response.data;
        }
        return null;
    }
    catch (error) {
        return error;
    }
}
//# sourceMappingURL=auth.js.map
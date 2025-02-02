"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.checkAuth = checkAuth;
exports.getUserInfo = getUserInfo;
exports.logout = logout;
const axios_1 = require("axios");
const jwt_decode_1 = require("jwt-decode");
const js_cookie_1 = require("js-cookie");
const API_URL = "http://localhost:3001";
async function authenticate(username, password) {
    try {
        const response = await axios_1.default.post(`${API_URL}/nestauth/login`, {
            username,
            password,
        });
        js_cookie_1.default.set("access_token", response.data.accessToken, { expires: 1 });
        js_cookie_1.default.set("refresh_token", response.data.refreshToken, {
            expires: 7,
        });
        return response.data;
    }
    catch (error) {
        console.error("Login failed", error);
        throw new Error("Login failed");
    }
}
function checkAuth() {
    const accessToken = js_cookie_1.default.get("access_token");
    return !!accessToken;
}
function getUserInfo() {
    const accessToken = js_cookie_1.default.get("access_token");
    if (!accessToken) {
        return null;
    }
    try {
        const decoded = (0, jwt_decode_1.jwtDecode)(accessToken);
        return decoded;
    }
    catch (error) {
        console.error("Invalid token", error);
        return null;
    }
}
async function logout() {
    js_cookie_1.default.remove("access_token");
    js_cookie_1.default.remove("refresh_token");
    window.location.href = "/login";
}
//# sourceMappingURL=auth.js.map
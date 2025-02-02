import axios from "axios";
import { jwtDecode } from "jwt-decode";
// import Cookies from "js-cookie";
import { cookies } from "next/headers";

const API_URL = "http://localhost:3001";

interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

interface User {
    id: string;
    name: string;
    email: string;
}

export async function authenticate(username: string, password: string) {
    try {
        const response: { statusCode: number; data: TokenResponse } =
            await axios.post(`${API_URL}/nestauth/login`, {
                username,
                password,
            });

        console.log("response", response);
        // if (!response || response.statusCode !== 200) {
        //     throw new Error("Login failed");
        // }

        // const data = response.data;

        // (await cookies()).set("access_token", data.accessToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     path: "/",
        //     maxAge: 60 * 60 * 24 * 7,
        // });

        // (await cookies()).set("refresh_token", data.refreshToken, {
        //     httpOnly: true,
        //     secure: process.env.NODE_ENV === "production",
        //     sameSite: "strict",
        //     path: "/",
        //     maxAge: 60 * 60 * 24 * 7,
        // });

        // return data;
    } catch (error) {
        console.error("Login failed", error);
        throw new Error("Login failed");
    }
}

export function checkAuth() {
    // Check if the access token exists
    // const accessToken = Cookies.get("access_token");
    // return !!accessToken;
}

export function getUserInfo() {
    // const accessToken = Cookies.get("access_token");
    // if (!accessToken) {
    //     return null;
    // }
    // try {
    //     const decoded = jwtDecode(accessToken) as User;
    //     return decoded;
    // } catch (error) {
    //     console.error("Invalid token", error);
    //     return null;
    // }
}

export async function logout() {
    // Clear cookies and redirect to login page
    // Cookies.remove("access_token");
    // Cookies.remove("refresh_token");

    // Redirect to login page
    window.location.href = "/login"; // Change this to your login route
}

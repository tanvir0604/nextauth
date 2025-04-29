import { NextRequest, NextResponse } from "next/server";
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
export declare function refreshToken(req: NextRequest): Promise<NextResponse<unknown>>;
export declare function authenticate(params: any): Promise<TokenResponse>;
export declare function getAccessToken(): Promise<string>;
export declare function getRefreshToken(): Promise<string>;
export declare function checkAuth(): Promise<boolean>;
export declare function getUserInfo(): Promise<User>;
export declare function logout(): Promise<void>;
export declare function get(url: string, params?: any, headers?: any, secured?: boolean): Promise<any>;
export declare function post(url: string, data?: any, headers?: any, secured?: boolean): Promise<any>;
export {};

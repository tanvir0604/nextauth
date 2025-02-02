interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}
interface User {
    id: string;
    name: string;
    email: string;
}
export declare function authenticate(username: string, password: string): Promise<TokenResponse>;
export declare function checkAuth(): boolean;
export declare function getUserInfo(): User;
export declare function logout(): Promise<void>;
export {};

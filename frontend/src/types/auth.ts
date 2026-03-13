export interface User {
    id: number;
    email: string;
    username: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    username: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
}

import api from './client';
import type { RegisterRequest, TokenResponse, User } from '@/types';

export async function loginUser(username: string, password: string): Promise<TokenResponse> {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);

    const { data } = await api.post<TokenResponse>('/auth/login', params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
}

export async function registerUser(payload: RegisterRequest): Promise<User> {
    const { data } = await api.post<User>('/auth/register', payload);
    return data;
}

export async function getMe(): Promise<User> {
    const { data } = await api.get<User>('/auth/me');
    return data;
}

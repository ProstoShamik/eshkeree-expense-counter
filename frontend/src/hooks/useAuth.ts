import { useMutation, useQueryClient } from '@tanstack/react-query';
import { loginUser, registerUser } from '@/api/auth';
import { useAuth } from '@/store/auth';
import type { RegisterRequest } from '@/types';

export function useLogin() {
    const { login } = useAuth();

    return useMutation({
        mutationFn: ({ username, password }: { username: string; password: string }) =>
            loginUser(username, password),
        onSuccess: async (data) => {
            await login(data.access_token);
        },
    });
}

export function useRegister() {
    return useMutation({
        mutationFn: (payload: RegisterRequest) => registerUser(payload),
    });
}

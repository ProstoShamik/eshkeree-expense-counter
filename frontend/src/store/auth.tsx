import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { User } from '@/types';
import { getMe } from '@/api/auth';

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('access_token'));
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        try {
            const userData = await getMe();
            setUser(userData);
        } catch {
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (token && !user) {
            fetchUser();
        } else {
            setIsLoading(false);
        }
    }, [token, user, fetchUser]);

    const login = useCallback(async (accessToken: string) => {
        localStorage.setItem('access_token', accessToken);
        setIsLoading(true);
        try {
            const userData = await getMe();
            setUser(userData);
            setToken(accessToken);
        } catch (error) {
            localStorage.removeItem('access_token');
            setToken(null);
            setUser(null);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('access_token');
        setToken(null);
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

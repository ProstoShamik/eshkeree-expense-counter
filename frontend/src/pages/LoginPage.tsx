import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useLogin } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/api/errors';

const loginSchema = z.object({
    username: z.string().min(1, 'Введите имя пользователя'),
    password: z.string().min(1, 'Введите пароль'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const navigate = useNavigate();
    const loginMutation = useLogin();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setServerError('');
        try {
            await loginMutation.mutateAsync(data);
            navigate('/expenses', { replace: true });
        } catch (err) {
            setServerError(getApiErrorMessage(err, 'Ошибка авторизации'));
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="bg-gradient-to-r from-accent-500 to-accent-300 bg-clip-text text-3xl font-bold text-transparent">
                        Eshkeree
                    </h1>
                    <p className="mt-2 text-sm text-dark-300">Войдите в свой аккаунт</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {serverError && (
                        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-200">
                            Имя пользователя
                        </label>
                        <input
                            {...register('username')}
                            type="text"
                            autoComplete="username"
                            className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-2.5 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
                            placeholder="username"
                        />
                        {errors.username && (
                            <p className="mt-1 text-xs text-danger-500">{errors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-200">Пароль</label>
                        <input
                            {...register('password')}
                            type="password"
                            autoComplete="current-password"
                            className="w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-2.5 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30"
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-400 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Вход...' : 'Войти'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-dark-300">
                    Нет аккаунта?{' '}
                    <Link to="/register" className="font-medium text-accent-400 hover:text-accent-300">
                        Зарегистрироваться
                    </Link>
                </p>
            </div>
        </div>
    );
}

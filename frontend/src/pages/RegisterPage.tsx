import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useRegister, useLogin } from '@/hooks/useAuth';
import { AxiosError } from 'axios';

const registerSchema = z
    .object({
        email: z.string().email('Некорректный email'),
        username: z.string().min(3, 'Минимум 3 символа'),
        password: z.string().min(6, 'Минимум 6 символов'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, {
        message: 'Пароли не совпадают',
        path: ['confirmPassword'],
    });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const navigate = useNavigate();
    const registerMutation = useRegister();
    const loginMutation = useLogin();
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setServerError('');
        try {
            await registerMutation.mutateAsync({
                email: data.email,
                username: data.username,
                password: data.password,
            });
            await loginMutation.mutateAsync({
                username: data.username,
                password: data.password,
            });
            navigate('/expenses', { replace: true });
        } catch (err) {
            if (err instanceof AxiosError) {
                setServerError(err.response?.data?.detail || 'Ошибка регистрации');
            } else {
                setServerError('Произошла ошибка');
            }
        }
    };

    const inputClass =
        'w-full rounded-xl border border-dark-500 bg-dark-700 px-4 py-2.5 text-sm text-dark-100 outline-none transition-colors placeholder:text-dark-400 focus:border-accent-500 focus:ring-1 focus:ring-accent-500/30';

    return (
        <div className="flex min-h-screen items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="mb-8 text-center">
                    <h1 className="bg-gradient-to-r from-accent-500 to-accent-300 bg-clip-text text-3xl font-bold text-transparent">
                        Eshkeree
                    </h1>
                    <p className="mt-2 text-sm text-dark-300">Создайте аккаунт</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {serverError && (
                        <div className="rounded-xl border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-400">
                            {serverError}
                        </div>
                    )}

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-200">Email</label>
                        <input
                            {...register('email')}
                            type="email"
                            autoComplete="email"
                            className={inputClass}
                            placeholder="you@example.com"
                        />
                        {errors.email && (
                            <p className="mt-1 text-xs text-danger-500">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-200">
                            Имя пользователя
                        </label>
                        <input
                            {...register('username')}
                            type="text"
                            autoComplete="username"
                            className={inputClass}
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
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="••••••••"
                        />
                        {errors.password && (
                            <p className="mt-1 text-xs text-danger-500">{errors.password.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-dark-200">
                            Подтвердите пароль
                        </label>
                        <input
                            {...register('confirmPassword')}
                            type="password"
                            autoComplete="new-password"
                            className={inputClass}
                            placeholder="••••••••"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-xs text-danger-500">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-xl bg-accent-500 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-400 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Регистрация...' : 'Зарегистрироваться'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-dark-300">
                    Уже есть аккаунт?{' '}
                    <Link to="/login" className="font-medium text-accent-400 hover:text-accent-300">
                        Войти
                    </Link>
                </p>
            </div>
        </div>
    );
}

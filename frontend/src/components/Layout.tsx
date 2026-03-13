import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';

export default function Layout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const linkClass = ({ isActive }: { isActive: boolean }) =>
        `px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
            ? 'bg-accent-500/20 text-accent-300'
            : 'text-dark-200 hover:text-dark-100 hover:bg-dark-600'
        }`;

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-50 border-b border-dark-600 bg-dark-800/80 backdrop-blur-xl">
                <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <span className="bg-gradient-to-r from-accent-500 to-accent-300 bg-clip-text text-xl font-bold text-transparent">
                            Eshkeree
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-dark-300">{user?.username}</span>
                        <button
                            onClick={handleLogout}
                            className="rounded-lg px-3 py-1.5 text-sm text-dark-300 transition-colors hover:bg-dark-600 hover:text-dark-100"
                        >
                            Выйти
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
                <Outlet />
            </main>
        </div>
    );
}

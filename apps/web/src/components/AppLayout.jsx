import React, { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePlan } from '@/contexts/PlanContext';
import { cn } from '@/lib/utils';

// A navegação é montada a partir do registro central de módulos
// (apps/web/src/lib/modules.js), filtrada pelo plano do usuário
// (apps/web/src/contexts/PlanContext.jsx). Hoje o plano padrão é
// `complete`, então todos os módulos permanecem visíveis.
const AppLayout = () => {
    const { user, logout } = useAuth();
    const { visibleModules } = usePlan();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const doLogout = () => {
        logout();
        navigate('/');
    };

    const links = (
        <nav className="flex flex-col gap-1">
            {visibleModules.map((item) => (
                <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                        cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                            isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                        )
                    }
                >
                    <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                    {item.label}
                </NavLink>
            ))}
        </nav>
    );

    return (
        <div className="min-h-screen bg-background lg:flex">
            <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
                <Link to="/" className="mb-6 flex items-center gap-2 px-2 font-display text-lg font-extrabold">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">H</span> HubFlow
                </Link>
                {links}
                <div className="mt-auto border-t border-border pt-4">
                    <p className="px-3 text-sm font-semibold">{user?.business_name || user?.name || 'Meu negócio'}</p>
                    <p className="truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
                    <button onClick={doLogout} className="mt-3 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <LogOut className="h-[18px] w-[18px]" /> Sair
                    </button>
                </div>
            </aside>

            <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:hidden">
                <Link to="/app" className="flex items-center gap-2 font-display text-lg font-extrabold">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">H</span> HubFlow
                </Link>
                <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menu" className="grid h-11 w-11 place-items-center rounded-xl border border-border">
                    {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </header>

            {open && (
                <div className="border-b border-border bg-card p-4 lg:hidden">
                    {links}
                    <button onClick={doLogout} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary">
                        <LogOut className="h-[18px] w-[18px]" /> Sair
                    </button>
                </div>
            )}

            <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 sm:py-8">
                <Outlet />
            </main>
        </div>
    );
};

export default AppLayout;

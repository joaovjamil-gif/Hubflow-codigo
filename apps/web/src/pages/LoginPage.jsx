import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/AuthShell';

const LoginPage = () => {
    const { login, isAuthed } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthed) return <Navigate to="/app" replace />;

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(form.email, form.password);
            navigate('/app');
        } catch (err) {
            setError('E-mail ou senha inválidos.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell title="Bem-vindo de volta" subtitle="Acesse o painel do seu negócio.">
            <Helmet>
                <title>Entrar — HubFlow</title>
                <meta name="description" content="Acesse sua conta HubFlow e gerencie clientes, orçamentos, ordens de serviço e financeiro." />
            </Helmet>
            <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-2">
                    <label htmlFor="email" className="text-sm font-semibold">E-mail</label>
                    <input id="email" type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        className="min-h-[46px] rounded-xl border border-input bg-background px-4 outline-none focus:border-primary" />
                </div>
                <div className="grid gap-2">
                    <label htmlFor="password" className="text-sm font-semibold">Senha</label>
                    <input id="password" type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                        className="min-h-[46px] rounded-xl border border-input bg-background px-4 outline-none focus:border-primary" />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={loading}
                    className="min-h-[48px] w-full rounded-full bg-accent font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110 disabled:opacity-60">
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Não tem conta? <Link to="/cadastro" className="font-semibold text-primary">Criar conta</Link>
            </p>
        </AuthShell>
    );
};

export default LoginPage;

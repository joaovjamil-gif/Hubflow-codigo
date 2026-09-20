import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import AuthShell from '@/components/AuthShell';

const SignupPage = () => {
    const { signup, isAuthed } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', business_name: '', email: '', phone: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    if (isAuthed) return <Navigate to="/app" replace />;

    const submit = async (e) => {
        e.preventDefault();
        if (form.password.length < 8) {
            setError('A senha precisa ter pelo menos 8 caracteres.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await signup(form.email, form.password, {
                name: form.name,
                business_name: form.business_name,
                phone: form.phone,
            });
            navigate('/app');
        } catch (err) {
            setError(err?.message || 'Não foi possível criar a conta.');
        } finally {
            setLoading(false);
        }
    };

    const field = (id, label, type = 'text', required = true) => (
        <div className="grid gap-2">
            <label htmlFor={id} className="text-sm font-semibold">{label}</label>
            <input id={id} type={type} required={required} value={form[id]}
                onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                className="min-h-[46px] rounded-xl border border-input bg-background px-4 outline-none focus:border-primary" />
        </div>
    );

    return (
        <AuthShell title="Criar sua conta" subtitle="Leva menos de um minuto para começar a organizar.">
            <Helmet>
                <title>Criar conta — HubFlow</title>
                <meta name="description" content="Crie sua conta HubFlow e organize clientes, orçamentos, serviços e financeiro do seu negócio." />
            </Helmet>
            <form onSubmit={submit} className="space-y-4">
                {field('name', 'Seu nome')}
                {field('business_name', 'Nome do negócio')}
                {field('email', 'E-mail', 'email')}
                {field('phone', 'Telefone / WhatsApp', 'text', false)}
                {field('password', 'Senha', 'password')}
                {error && <p className="text-sm text-destructive">{error}</p>}
                <button type="submit" disabled={loading}
                    className="min-h-[48px] w-full rounded-full bg-accent font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110 disabled:opacity-60">
                    {loading ? 'Criando conta...' : 'Começar agora'}
                </button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                Já tem conta? <Link to="/login" className="font-semibold text-primary">Entrar</Link>
            </p>
        </AuthShell>
    );
};

export default SignupPage;

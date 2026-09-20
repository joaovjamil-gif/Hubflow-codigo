import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { PRICING, brl } from '@/lib/hubflow';
import { PageHeader } from '@/components/CrudPanel';

const SettingsPage = () => {
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '',
        business_name: user?.business_name || '',
        phone: user?.phone || '',
    });
    const [status, setStatus] = useState('');
    const [saving, setSaving] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setStatus('');
        try {
            await pb.collection('users').update(user.id, form);
            setStatus('Dados atualizados.');
        } catch (err) {
            setStatus('Não foi possível salvar agora.');
        } finally {
            setSaving(false);
        }
    };

    const field = (id, label) => (
        <div className="grid gap-2">
            <label htmlFor={id} className="text-sm font-semibold">{label}</label>
            <input id={id} value={form[id]} onChange={(e) => setForm({ ...form, [id]: e.target.value })}
                className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
    );

    return (
        <div>
            <Helmet>
                <title>Configurações — HubFlow</title>
                <meta name="description" content="Perfil do usuário, nome do negócio e informações do plano HubFlow." />
            </Helmet>
            <PageHeader title="Configurações" description="Perfil, negócio e plano." />
            <div className="grid gap-5 lg:grid-cols-2">
                <form onSubmit={submit} className="hf-card grid gap-4 p-5">
                    <h2 className="font-display text-lg font-bold">Perfil</h2>
                    {field('name', 'Seu nome')}
                    {field('business_name', 'Nome do negócio')}
                    {field('phone', 'Telefone / WhatsApp')}
                    <p className="text-sm text-muted-foreground">E-mail: {user?.email}</p>
                    {status && <p className="text-sm text-accent">{status}</p>}
                    <button type="submit" disabled={saving}
                        className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                        {saving ? 'Salvando...' : 'Salvar alterações'}
                    </button>
                </form>

                <div className="hf-card p-5">
                    <h2 className="font-display text-lg font-bold">Plano</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Mensal {brl(PRICING.monthly.price)}{PRICING.monthly.suffix} · Anual {brl(PRICING.yearly.price)}{PRICING.yearly.suffix}
                        {' '}({brl(PRICING.yearly.monthlyEquivalent)}/mês)
                    </p>
                    <p className="mt-4 rounded-xl bg-secondary/60 p-4 text-sm text-muted-foreground">
                        Pagamento online, assinaturas, WhatsApp, automações e IA já estão previstos na arquitetura e serão ativados nas próximas etapas.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SettingsPage;

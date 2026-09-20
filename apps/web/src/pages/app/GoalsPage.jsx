import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Target, Plus, Trash2, Pencil } from 'lucide-react';
import { useCollection, brl } from '@/lib/hubflow';
import {
    GOAL_TYPES, GOAL_PERIOD_TYPES, currentPeriodRef, goalUnit,
} from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';

const fields = [
    {
        name: 'type', label: 'Tipo de meta', type: 'select', required: true,
        options: GOAL_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    {
        name: 'period_type', label: 'Tipo de período', type: 'select', required: true,
        options: GOAL_PERIOD_TYPES.map((t) => ({ value: t.value, label: t.label })),
    },
    { name: 'period_ref', label: 'Referência do período', required: true, placeholder: 'Ex.: 2026-08 (mensal), 2026-T3 (trimestral), 2026 (anual)' },
    { name: 'target', label: 'Valor da meta', type: 'number', required: true },
];

const emptyFrom = () => ({
    type: 'faturamento',
    period_type: 'mensal',
    period_ref: currentPeriodRef('mensal'),
    target: '',
});

const GoalsPage = () => {
    const collection = useCollection('goals', { sort: '-created' });
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const { items, loading, error, create, update, remove, removingId } = collection;

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                type: form.type,
                period_type: form.period_type,
                period_ref: form.period_ref,
                target: Number(form.target) || 0,
            };
            if (form.id) await update(form.id, payload);
            else await create(payload);
            setForm(null);
            toast({ title: 'Meta salva' });
        } catch (err) {
            window.alert('Não foi possível salvar. Verifique os campos obrigatórios.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (item) => {
        if (removingId) return;
        if (!window.confirm('Excluir esta meta? Ela será movida para a lixeira.')) return;
        try {
            await remove(item.id);
            toast({ title: 'Meta movida para a lixeira' });
        } catch (err) {
            toast({ title: 'Não foi possível excluir', variant: 'destructive' });
        }
    };

    const typeLabel = (v) => GOAL_TYPES.find((t) => t.value === v)?.label || v;
    const periodLabel = (v) => GOAL_PERIOD_TYPES.find((t) => t.value === v)?.label || v;
    const isCurrency = (v) => goalUnit(v) === 'brl';

    return (
        <div>
            <Helmet>
                <title>Metas — HubFlow</title>
                <meta name="description" content="Defina metas de faturamento, novos clientes, orçamentos e serviços concluídos por período." />
            </Helmet>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Metas</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Acompanhe metas empresariais por período. O realizado é calculado a partir dos dados reais do sistema no Dashboard.
                    </p>
                </div>
                <button onClick={() => setForm(emptyFrom())}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110">
                    <Plus className="h-4 w-4" /> Nova meta
                </button>
            </div>

            {form && (
                <form onSubmit={submit} className="hf-card mb-6 grid gap-4 p-5 sm:grid-cols-2">
                    {fields.map((f) => (
                        <div key={f.name} className="grid gap-2">
                            <label htmlFor={f.name} className="text-sm font-semibold">{f.label}</label>
                            {f.type === 'select' ? (
                                <select id={f.name} value={form[f.name] || ''} onChange={(e) => {
                                    const v = e.target.value;
                                    setForm({ ...form, [f.name]: v, ...(f.name === 'period_type' ? { period_ref: currentPeriodRef(v) } : {}) });
                                }}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                                    {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : (
                                <input id={f.name} type={f.type || 'text'} required={f.required} placeholder={f.placeholder} value={form[f.name] || ''}
                                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            )}
                        </div>
                    ))}
                    <div className="flex gap-3 sm:col-span-2">
                        <button type="submit" disabled={saving}
                            className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                        <button type="button" onClick={() => setForm(null)}
                            className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold">Cancelar</button>
                    </div>
                </form>
            )}

            {loading && <div className="hf-card h-24 animate-pulse bg-muted/40" />}
            {error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
            {!loading && !error && items.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">
                    <Target className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" strokeWidth={1.6} />
                    Nenhuma meta definida ainda.
                </div>
            )}

            <div className="grid gap-3">
                {items.map((g) => (
                    <div key={g.id} className="hf-card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div>
                            <p className="font-display font-bold">{typeLabel(g.type)}</p>
                            <p className="text-sm text-muted-foreground">
                                {periodLabel(g.period_type)} • {g.period_ref} • Meta: {isCurrency(g.type) ? brl(g.target) : g.target}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setForm({ ...g })} aria-label="Editar"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(g)} aria-label="Excluir" disabled={removingId === g.id}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive disabled:opacity-50">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalsPage;

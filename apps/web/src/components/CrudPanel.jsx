import React, { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { statusTone } from '@/lib/hubflow';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export const PageHeader = ({ title, description, action }) => (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action}
    </div>
);

export const StatusBadge = ({ status }) => (
    <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', statusTone(status))}>
        {status || '—'}
    </span>
);

export const FlowButton = ({ icon: Icon, label, onClick, tone = 'accent', disabled, title }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        title={title || label}
        className={cn(
            'inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50',
            tone === 'accent' && 'border-accent/30 bg-accent/10 text-accent hover:bg-accent/20',
            tone === 'primary' && 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20',
            tone === 'muted' && 'border-border bg-muted text-muted-foreground hover:bg-secondary',
        )}
    >
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
    </button>
);

const emptyFrom = (fields) =>
    fields.reduce((acc, f) => {
        if (f.type === 'select') {
            const first = f.options?.[0];
            acc[f.name] = first ? (typeof first === 'string' ? first : first.value) : '';
        } else {
            acc[f.name] = '';
        }
        return acc;
    }, {});

/**
 * Generic CRUD surface: search, form dialog, list rendering.
 * fields: [{ name, label, type: 'text'|'number'|'date'|'time'|'textarea'|'select', options?, required? }]
 */
const CrudPanel = ({
    title,
    description,
    collection,
    fields,
    searchKeys = ['name'],
    renderItem,
    extraActions,
    filter,
    emptyLabel = 'Nenhum registro ainda.',
    addLabel = 'Novo registro',
    onSaved,
    initialValues,
}) => {
    const [query, setQuery] = useState('');
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);
    const { items, loading, error, create, update, remove, removingId } = collection;

    const handleDelete = async (item) => {
        if (removingId) return;
        if (!window.confirm('Excluir este registro? Ele será movido para a lixeira e poderá ser restaurado depois.')) return;
        try {
            await remove(item.id);
            toast({ title: 'Registro movido para a lixeira' });
        } catch (err) {
            toast({ title: 'Não foi possível excluir', variant: 'destructive' });
        }
    };

    const filtered = useMemo(() => {
        let list = items;
        if (filter) list = list.filter(filter);
        const q = query.trim().toLowerCase();
        if (!q) return list;
        return list.filter((i) => searchKeys.some((k) => String(i[k] || '').toLowerCase().includes(q)));
    }, [items, query, searchKeys, filter]);

    const submit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = fields.reduce((acc, f) => {
                const v = form[f.name];
                if (f.type === 'number') acc[f.name] = Number(v) || 0;
                else if (f.type === 'relation') acc[f.name] = v && v !== '' ? v : null;
                else acc[f.name] = v || '';
                return acc;
            }, {});
            if (form.id) { await update(form.id, payload); if (onSaved) await onSaved({ ...form, ...payload }, true); }
            else { const rec = await create(payload); if (onSaved) await onSaved(rec, false); }
            setForm(null);
        } catch (err) {
            window.alert('Não foi possível salvar. Verifique os campos obrigatórios.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <PageHeader
                title={title}
                description={description}
                action={
                    <button onClick={() => setForm({ ...emptyFrom(fields), ...initialValues })}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110">
                        <Plus className="h-4 w-4" /> {addLabel}
                    </button>
                }
            />

            <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="mb-5 min-h-[44px] w-full max-w-sm rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary"
            />

            {form && (
                <form onSubmit={submit} className="hf-card mb-6 grid gap-4 p-5 sm:grid-cols-2">
                    {fields.map((f) => {
                        if (f.show && !f.show(form)) return null;
                        return (
                        <div key={f.name} className={cn('grid gap-2', f.type === 'textarea' && 'sm:col-span-2')}>
                            <label htmlFor={f.name} className="text-sm font-semibold">{f.label}</label>
                            {f.type === 'select' ? (
                                <select id={f.name} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                                    {f.allowEmpty && <option value="">— nenhum —</option>}
                                    {(typeof f.options === 'function' ? f.options(form) : f.options).map((o) => {
                                        const val = typeof o === 'string' ? o : o.value;
                                        const lbl = typeof o === 'string' ? o : o.label;
                                        return <option key={val} value={val}>{lbl}</option>;
                                    })}
                                </select>
                            ) : f.type === 'relation' ? (
                                <select id={f.name} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                                    <option value="">{f.placeholder || '— nenhum —'}</option>
                                    {(f.options || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                </select>
                            ) : f.type === 'textarea' ? (
                                <textarea id={f.name} rows={3} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" />
                            ) : (
                                <input id={f.name} type={f.type || 'text'} required={f.required} value={form[f.name] || ''}
                                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            )}
                        </div>
                        );
                    })}
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
            {!loading && !error && filtered.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">{emptyLabel}</div>
            )}

            <div className="grid gap-3">
                {filtered.map((item) => (
                    <div key={item.id} className="hf-card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">{renderItem(item)}</div>
                        <div className="flex gap-2">
                            {extraActions && extraActions(item)}
                            <button onClick={() => setForm({ ...item })} aria-label="Editar"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(item)} aria-label="Excluir" disabled={removingId === item.id}
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

export default CrudPanel;

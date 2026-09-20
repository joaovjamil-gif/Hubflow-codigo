import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Wrench, CheckCircle2, Plus, Pencil, Trash2, X, Layers } from 'lucide-react';
import { PageHeader, StatusBadge, FlowButton } from '@/components/CrudPanel';
import ItemBuilder from '@/components/ItemBuilder';
import { QUOTE_STATUS, brl, useCollection, generateOrderFromQuote } from '@/lib/hubflow';
import { loadCatalog, normalizeItems, computeTotals, itemsFromModel } from '@/lib/catalog';
import pb from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const empty = { number: '', client_name: '', title: '', date: '', status: 'Rascunho', description: '' };

const QuotesPage = () => {
    const [searchParams] = useSearchParams();
    const presetClient = searchParams.get('cliente') || '';
    const collection = useCollection('quotes');
    const orders = useCollection('service_orders');
    const [catalog, setCatalog] = useState({ services: [], products: [], equipment: [], epis: [], tools: [], models: [] });
    const [form, setForm] = useState(null);
    const [items, setItems] = useState([]);
    const [globalDiscount, setGlobalDiscount] = useState(0);
    const [saving, setSaving] = useState(false);
    const [busy, setBusy] = useState(null);
    const [query, setQuery] = useState('');

    useEffect(() => { loadCatalog().then(setCatalog); }, []);

    const orderForQuote = useMemo(() => {
        const map = {};
        orders.items.forEach((o) => { if (o.quote_id) map[o.quote_id] = o; });
        return map;
    }, [orders.items]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return collection.items;
        return collection.items.filter((i) =>
            ['client_name', 'number', 'title'].some((k) => String(i[k] || '').toLowerCase().includes(q)),
        );
    }, [collection.items, query]);

    const totals = useMemo(() => computeTotals(items, globalDiscount), [items, globalDiscount]);

    const openNew = () => { setForm({ ...empty, client_name: presetClient }); setItems([]); setGlobalDiscount(0); };
    const openEdit = (q) => {
        setForm({ id: q.id, number: q.number || '', client_name: q.client_name || '', title: q.title || '', date: q.date || '', status: q.status || 'Rascunho', description: q.description || '' });
        setItems(normalizeItems(q.items));
        setGlobalDiscount(Number(q.discount) || 0);
    };
    const close = () => { setForm(null); setItems([]); setGlobalDiscount(0); };

    const applyModel = (model) => {
        const modelItems = itemsFromModel(model);
        setItems((prev) => [...prev, ...modelItems]);
        toast({ title: `Modelo "${model.name}" aplicado`, description: 'Itens adicionados — edite livremente antes de enviar.' });
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.client_name.trim()) { window.alert('Informe o cliente.'); return; }
        setSaving(true);
        try {
            const payload = {
                number: form.number || '',
                client_name: form.client_name.trim(),
                title: form.title || '',
                date: form.date || '',
                status: form.status || 'Rascunho',
                description: form.description || '',
                items: items.map((it) => ({
                    kind: it.kind, ref: it.ref, name: it.name, category: it.category, unit: it.unit,
                    qty: Number(it.qty) || 0, price: Number(it.price) || 0, discount: Number(it.discount) || 0,
                    ...(it.kind === 'product' ? { cost: Number(it.cost) || 0 } : {}),
                })),
                discount: Number(globalDiscount) || 0,
                amount: computeTotals(items, globalDiscount).total,
                owner: pb.authStore.record?.id,
            };
            if (form.id) await collection.update(form.id, payload);
            else await collection.create(payload);
            toast({ title: form.id ? 'Orçamento atualizado' : 'Orçamento criado' });
            close();
        } catch (err) {
            window.alert('Não foi possível salvar o orçamento.');
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateOrder = async (quote) => {
        setBusy(quote.id);
        try {
            const order = await generateOrderFromQuote(quote);
            await orders.reload();
            toast({
                title: order && order.quote_id ? 'OS gerada a partir do orçamento' : 'OS já existia',
                description: `OS ${order?.number || '—'} vinculada ao orçamento. Itens previstos foram repassados.`,
            });
        } catch (err) {
            toast({ title: 'Não foi possível gerar a OS', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const handleDelete = async (quote) => {
        if (collection.removingId) return;
        if (!window.confirm(`Excluir o orçamento de ${quote.client_name}? Esta ação não pode ser desfeita.`)) return;
        try {
            await collection.remove(quote.id);
            toast({ title: 'Orçamento excluído' });
        } catch (err) {
            toast({ title: 'Não foi possível excluir o orçamento', variant: 'destructive' });
        }
    };

    const extraActions = (q) => {
        if (q.status !== 'Aprovado') return null;
        const linked = orderForQuote[q.id];
        if (linked) {
            return <FlowButton icon={CheckCircle2} label={`OS ${linked.number || '—'}`} tone="muted" disabled title="OS já gerada" />;
        }
        return (
            <FlowButton icon={Wrench} label={busy === q.id ? 'Gerando...' : 'Gerar OS'} tone="accent"
                onClick={() => handleGenerateOrder(q)} disabled={busy === q.id} />
        );
    };

    const itemCount = (q) => normalizeItems(q.items).length;

    return (
        <div>
            <Helmet>
                <title>Orçamentos — HubFlow</title>
                <meta name="description" content="Monte orçamentos com serviços, materiais e modelos. Cálculo automático de subtotal, desconto e total." />
            </Helmet>
            <PageHeader
                title="Orçamentos"
                description="Do rascunho à aprovação. Use o catálogo e modelos para montar orçamentos rapidamente."
                action={
                    <button onClick={openNew}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110">
                        <Plus className="h-4 w-4" /> Novo orçamento
                    </button>
                }
            />

            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar..."
                className="mb-5 min-h-[44px] w-full max-w-sm rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary" />

            {collection.loading && <div className="hf-card h-24 animate-pulse bg-muted/40" />}
            {collection.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{collection.error}</p>}
            {!collection.loading && !collection.error && filtered.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">Nenhum orçamento criado ainda.</div>
            )}

            <div className="grid gap-3">
                {filtered.map((q) => (
                    <div key={q.id} className="hf-card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="font-mono text-xs text-muted-foreground">{q.number || '—'}</span>
                                <p className="font-display font-bold">{q.client_name}</p>
                                <span className="font-semibold">{brl(q.amount)}</span>
                                <StatusBadge status={q.status} />
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {q.title || 'Sem título'} • {q.date || 'sem data'}
                                {itemCount(q) > 0 && ` • ${itemCount(q)} itens`}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            {extraActions(q)}
                            <button onClick={() => openEdit(q)} aria-label="Editar"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(q)} aria-label="Excluir" disabled={collection.removingId === q.id}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive disabled:opacity-50">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor de orçamento */}
            {form && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 sm:p-8">
                    <form onSubmit={submit} className="hf-card w-full max-w-3xl p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-xl font-extrabold">{form.id ? 'Editar orçamento' : 'Novo orçamento'}</h2>
                            <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Número</label>
                                <input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Cliente *</label>
                                <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Título</label>
                                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Data</label>
                                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Status</label>
                                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary">
                                    {QUOTE_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <label className="text-sm font-semibold">Descrição</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" />
                            </div>
                        </div>

                        {/* Modelos de serviço */}
                        {catalog.models.length > 0 && (
                            <div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-primary">
                                    <Layers className="h-4 w-4" /> Aplicar modelo de serviço
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {catalog.models.map((m) => (
                                        <button key={m.id} type="button" onClick={() => applyModel(m)}
                                            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-primary/30 bg-card px-3 text-xs font-semibold text-primary transition hover:bg-primary/10">
                                            <Layers className="h-3.5 w-3.5" /> {m.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                            <h3 className="mb-3 font-display text-lg font-bold">Itens do orçamento</h3>
                            <ItemBuilder
                                catalog={catalog}
                                items={items}
                                setItems={setItems}
                                globalDiscount={globalDiscount}
                                setGlobalDiscount={setGlobalDiscount}
                                showCost
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                {saving ? 'Salvando...' : 'Salvar orçamento'}
                            </button>
                            <button type="button" onClick={close}
                                className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default QuotesPage;

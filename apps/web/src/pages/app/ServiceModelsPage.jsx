import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Plus, Pencil, Trash2, Layers, X } from 'lucide-react';
import { PageHeader } from '@/components/CrudPanel';
import ItemBuilder from '@/components/ItemBuilder';
import { useCollection, brl } from '@/lib/hubflow';
import { loadCatalog, normalizeItems, computeTotals } from '@/lib/catalog';
import pb from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';

const empty = { name: '', category: '', description: '', items: [] };

const ServiceModelsPage = () => {
    const collection = useCollection('service_models');
    const [catalog, setCatalog] = useState({ services: [], products: [], equipment: [], epis: [], tools: [] });
    const [form, setForm] = useState(null);
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);

    useEffect(() => { loadCatalog().then(setCatalog); }, []);

    const openNew = () => { setForm({ ...empty }); setItems([]); };
    const openEdit = (m) => {
        setForm({ id: m.id, name: m.name || '', category: m.category || '', description: m.description || '' });
        setItems(normalizeItems(m.items));
    };
    const close = () => { setForm(null); setItems([]); };

    const submit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) { window.alert('Informe o nome do modelo.'); return; }
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category || '',
                description: form.description || '',
                items: items.map((it) => ({
                    kind: it.kind, ref: it.ref, name: it.name, category: it.category, unit: it.unit,
                    qty: Number(it.qty) || 0, price: Number(it.price) || 0, discount: Number(it.discount) || 0,
                    ...(it.kind === 'product' ? { cost: Number(it.cost) || 0 } : {}),
                })),
                owner: pb.authStore.record?.id,
            };
            if (form.id) await collection.update(form.id, payload);
            else await collection.create(payload);
            toast({ title: form.id ? 'Modelo atualizado' : 'Modelo criado' });
            close();
        } catch (err) {
            window.alert('Não foi possível salvar o modelo.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (m) => {
        if (collection.removingId) return;
        if (!window.confirm(`Excluir o modelo "${m.name}"? Esta ação não pode ser desfeita.`)) return;
        try {
            await collection.remove(m.id);
            toast({ title: 'Modelo excluído' });
        } catch (err) {
            toast({ title: 'Não foi possível excluir o modelo', variant: 'destructive' });
        }
    };

    const total = (m) => computeTotals(normalizeItems(m.items)).total;

    return (
        <div>
            <Helmet>
                <title>Modelos de Serviço — HubFlow</title>
                <meta name="description" content="Crie modelos reutilizáveis com serviços, materiais, equipamentos, EPIs e ferramentas para preencher orçamentos automaticamente." />
            </Helmet>
            <PageHeader
                title="Modelos de Serviço"
                description="Estruturas reutilizáveis que preenchem orçamentos automaticamente — editáveis antes de enviar."
                action={
                    <button onClick={openNew}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110">
                        <Plus className="h-4 w-4" /> Novo modelo
                    </button>
                }
            />

            {collection.loading && <div className="hf-card h-24 animate-pulse bg-muted/40" />}
            {collection.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{collection.error}</p>}
            {!collection.loading && !collection.error && collection.items.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">Nenhum modelo criado ainda.</div>
            )}

            <div className="grid gap-3">
                {collection.items.map((m) => (
                    <div key={m.id} className="hf-card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0 flex-1">
                            <p className="font-display font-bold">
                                <Layers className="mr-1 inline h-4 w-4 text-primary" /> {m.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {m.category ? `${m.category} • ` : ''}{normalizeItems(m.items).length} itens • {brl(total(m))}
                            </p>
                            {m.description && <p className="mt-1 text-sm text-muted-foreground">{m.description}</p>}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openEdit(m)} aria-label="Editar"
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-primary">
                                <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(m)} aria-label="Excluir" disabled={collection.removingId === m.id}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive disabled:opacity-50">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Editor */}
            {form && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 sm:p-8">
                    <form onSubmit={submit} className="hf-card w-full max-w-3xl p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-xl font-extrabold">{form.id ? 'Editar modelo' : 'Novo modelo de serviço'}</h2>
                            <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Nome</label>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2">
                                <label className="text-sm font-semibold">Categoria</label>
                                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="grid gap-2 sm:col-span-2">
                                <label className="text-sm font-semibold">Descrição</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" />
                            </div>
                        </div>

                        <div className="mt-6">
                            <h3 className="mb-3 font-display text-lg font-bold">Itens do modelo</h3>
                            <ItemBuilder catalog={catalog} items={items} setItems={setItems} showCost />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button type="submit" disabled={saving}
                                className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                {saving ? 'Salvando...' : 'Salvar modelo'}
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

export default ServiceModelsPage;

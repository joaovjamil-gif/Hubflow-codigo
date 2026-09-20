import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Trash2, RotateCcw, Search } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { restoreFromTrash, permanentDelete } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const COLLECTION_LABELS = {
    clients: 'Cliente',
    quotes: 'Orçamento',
    service_orders: 'Ordem de Serviço',
    appointments: 'Agendamento',
    finance_entries: 'Lançamento financeiro',
    services: 'Serviço (catálogo)',
    products: 'Produto (catálogo)',
    suppliers: 'Fornecedor',
    equipment: 'Equipamento',
    epis: 'EPI',
    tools: 'Ferramenta',
    service_models: 'Modelo de serviço',
    stock_movements: 'Movimentação de estoque',
    goals: 'Meta',
};

const TrashPage = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [query, setQuery] = useState('');
    const [busy, setBusy] = useState(null);

    const load = async () => {
        try {
            setLoading(true);
            const records = await pb.collection('trash').getFullList({ sort: '-created' });
            setItems(records);
            setError(null);
        } catch (err) {
            if (err?.status !== 0) setError(err?.message || 'Erro ao carregar lixeira');
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => { load(); }, []);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;
        return items.filter((i) =>
            String(i.collection_name || '').toLowerCase().includes(q) ||
            String(i.summary || '').toLowerCase().includes(q),
        );
    }, [items, query]);

    const handleRestore = async (item) => {
        if (busy) return;
        setBusy(item.id);
        try {
            await restoreFromTrash(item);
            toast({ title: 'Registro restaurado' });
            setItems((prev) => prev.filter((i) => i.id !== item.id));
        } catch (err) {
            toast({ title: 'Não foi possível restaurar', description: err?.message, variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const handlePermanentDelete = async (item) => {
        if (busy) return;
        if (!window.confirm('Excluir definitivamente? Esta ação NÃO pode ser desfeita.')) return;
        setBusy(item.id);
        try {
            await permanentDelete(item);
            toast({ title: 'Registro excluído definitivamente' });
            setItems((prev) => prev.filter((i) => i.id !== item.id));
        } catch (err) {
            toast({ title: 'Não foi possível excluir', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const fmtDate = (v) => {
        if (!v) return '—';
        const d = new Date(v);
        return Number.isNaN(d.getTime()) ? String(v).slice(0, 19) : d.toLocaleString('pt-BR');
    };

    return (
        <div>
            <Helmet>
                <title>Lixeira — HubFlow</title>
                <meta name="description" content="Restaure ou exclua definitivamente registros removidos do HubFlow." />
            </Helmet>

            <div className="mb-6">
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Lixeira</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Registros excluídos são guardados aqui. Itens na lixeira não são contabilizados nos indicadores.
                </p>
            </div>

            <div className="relative mb-5 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar na lixeira..."
                    className="min-h-[44px] w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm outline-none focus:border-primary"
                />
            </div>

            {loading && <div className="hf-card h-24 animate-pulse bg-muted/40" />}
            {error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}
            {!loading && !error && filtered.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">
                    <Trash2 className="mx-auto mb-2 h-7 w-7 text-muted-foreground/60" strokeWidth={1.6} />
                    A lixeira está vazia.
                </div>
            )}

            <div className="grid gap-3">
                {filtered.map((item) => (
                    <div key={item.id} className="hf-card flex flex-wrap items-center justify-between gap-4 p-5">
                        <div className="min-w-0">
                            <p className="font-display font-bold">
                                {item.summary || 'Sem título'}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {COLLECTION_LABELS[item.collection_name] || item.collection_name} • excluído em {fmtDate(item.created)}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleRestore(item)}
                                disabled={busy === item.id}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 text-xs font-semibold text-accent transition hover:bg-accent/20 disabled:opacity-50"
                            >
                                <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                            </button>
                            <button
                                onClick={() => handlePermanentDelete(item)}
                                disabled={busy === item.id}
                                aria-label="Excluir definitivamente"
                                className={cn(
                                    'grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-destructive disabled:opacity-50',
                                )}
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TrashPage;

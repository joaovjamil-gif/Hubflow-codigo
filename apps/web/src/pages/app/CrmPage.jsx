import React, { Component, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
    ClipboardList, Wrench, CheckCircle2, Users, Wallet, Clock,
    Network, ArrowRight, Activity, UserPlus,
} from 'lucide-react';
import { useCollection, brl } from '@/lib/hubflow';
import {
    productivityMetrics, clientActivity, lastInteraction, ACTIVITY_LABELS,
} from '@/lib/crm';
import { cn } from '@/lib/utils';

// Error boundary: uma falha isolada não derruba a página.
class SafeSection extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn('CRM section falhou:', err);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="hf-card p-6 text-sm text-muted-foreground">
                    Não foi possível carregar esta seção agora.
                </div>
            );
        }
        return this.props.children;
    }
}

const ProdCard = ({ label, value, icon: Icon, tone }) => (
    <div className="hf-card p-5">
        <div className="flex items-center justify-between">
            <Icon className={cn('h-5 w-5', tone)} strokeWidth={1.8} />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
);

const FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'ativo', label: 'Ativos' },
    { value: 'novo', label: 'Novos' },
    { value: 'inativo', label: 'Sem movimentação' },
];

const CrmPage = () => {
    const clients = useCollection('clients');
    const quotes = useCollection('quotes');
    const orders = useCollection('service_orders');
    const finance = useCollection('finance_entries');
    const notes = useCollection('client_notes', { sort: '-created' });
    const [filter, setFilter] = useState('all');
    const [query, setQuery] = useState('');

    const loading = clients.loading || quotes.loading || orders.loading || finance.loading;

    const metrics = useMemo(
        () => productivityMetrics({
            quotes: quotes.items,
            orders: orders.items,
            clients: clients.items,
            finance: finance.items,
        }),
        [quotes.items, orders.items, clients.items, finance.items],
    );

    // Mapas por cliente (client_name) para relacionamento.
    const byClient = useMemo(() => {
        const map = {};
        clients.items.forEach((c) => {
            map[c.id] = { quotes: [], orders: [], finance: [], notes: [] };
        });
        const findId = (name) => {
            const c = clients.items.find((x) => x.name === name);
            return c ? c.id : null;
        };
        quotes.items.forEach((q) => {
            const id = findId(q.client_name);
            if (id && map[id]) map[id].quotes.push(q);
        });
        orders.items.forEach((o) => {
            const id = findId(o.client_name);
            if (id && map[id]) map[id].orders.push(o);
        });
        finance.items.forEach((f) => {
            const id = findId(f.client_name);
            if (id && map[id]) map[id].finance.push(f);
        });
        notes.items.forEach((n) => {
            if (n.client_id && map[n.client_id]) map[n.client_id].notes.push(n);
        });
        return map;
    }, [clients.items, quotes.items, orders.items, finance.items, notes.items]);

    const enriched = useMemo(() => {
        return clients.items.map((c) => {
            const ctx = byClient[c.id] || { quotes: [], orders: [], finance: [], notes: [] };
            const activity = clientActivity(c, ctx);
            const last = lastInteraction(c, ctx);
            return { client: c, activity, last, ctx };
        });
    }, [clients.items, byClient]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return enriched.filter((e) => {
            if (filter !== 'all' && e.activity !== filter) return false;
            if (q) {
                const c = e.client;
                return ['name', 'phone', 'email', 'document'].some((k) =>
                    String(c[k] || '').toLowerCase().includes(q),
                );
            }
            return true;
        });
    }, [enriched, filter, query]);

    const counts = useMemo(() => {
        const c = { ativo: 0, novo: 0, inativo: 0 };
        enriched.forEach((e) => { c[e.activity] = (c[e.activity] || 0) + 1; });
        return c;
    }, [enriched]);

    return (
        <div>
            <Helmet>
                <title>CRM — HubFlow</title>
                <meta name="description" content="Relacionamento com clientes: produtividade da operação, clientes ativos, novos e sem movimentação, última interação e histórico." />
            </Helmet>

            <div className="mb-6">
                <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">CRM</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Acompanhe sua operação e o relacionamento com cada cliente.
                </p>
            </div>

            {/* Produtividade */}
            <SafeSection>
                <section className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-lg font-bold">Produtividade da operação</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
                        <ProdCard label="Serviços pendentes" value={metrics.servicosPendentes} icon={Clock} tone="text-primary" />
                        <ProdCard label="OS em andamento" value={metrics.osEmAndamento} icon={Wrench} tone="text-primary" />
                        <ProdCard label="OS concluídas" value={metrics.osConcluidas} icon={CheckCircle2} tone="text-accent" />
                        <ProdCard label="Orçamentos pendentes" value={metrics.orcamentosPendentes} icon={ClipboardList} tone="text-foreground" />
                        <ProdCard label="Orçamentos aprovados" value={metrics.orcamentosAprovados} icon={CheckCircle2} tone="text-accent" />
                        <ProdCard label="Clientes novos (30d)" value={metrics.clientesNovos} icon={UserPlus} tone="text-primary" />
                        <ProdCard label="Pagamentos pendentes" value={metrics.pagamentosPendentes} icon={Wallet} tone="text-destructive" />
                    </div>
                </section>
            </SafeSection>

            {/* Clientes — relacionamento */}
            <SafeSection>
                <section>
                    <div className="mb-3 flex items-center gap-2">
                        <Network className="h-4 w-4 text-primary" />
                        <h2 className="font-display text-lg font-bold">Clientes</h2>
                        <span className="text-sm text-muted-foreground">
                            ({enriched.length})
                        </span>
                    </div>

                    <div className="mb-4 flex flex-wrap items-center gap-3">
                        <div className="flex flex-wrap gap-2">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => setFilter(f.value)}
                                    className={cn(
                                        'rounded-full px-4 py-2 text-sm font-semibold transition',
                                        filter === f.value
                                            ? 'bg-primary text-primary-foreground'
                                            : 'border border-border bg-card text-muted-foreground hover:text-foreground',
                                    )}
                                >
                                    {f.label}
                                    {f.value !== 'all' && counts[f.value] !== undefined && (
                                        <span className="ml-1.5 text-xs opacity-80">{counts[f.value]}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar cliente..."
                            className="min-h-[44px] w-full max-w-xs rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary"
                        />
                    </div>

                    {loading ? (
                        <div className="hf-card h-24 animate-pulse bg-muted/40" />
                    ) : filtered.length === 0 ? (
                        <div className="hf-card p-10 text-center text-sm text-muted-foreground">
                            {enriched.length === 0
                                ? 'Nenhum cliente cadastrado ainda.'
                                : 'Nenhum cliente encontrado com este filtro.'}
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {filtered.map(({ client, activity, last }) => {
                                const act = ACTIVITY_LABELS[activity];
                                return (
                                    <Link
                                        key={client.id}
                                        to={`/app/clientes/${client.id}`}
                                        className="hf-card flex flex-wrap items-center justify-between gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-16px_rgba(29,78,216,0.4)]"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <p className="font-display font-bold text-foreground">{client.name}</p>
                                                <span className={cn('inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', act.tone)}>
                                                    {act.label}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {[client.phone, client.email].filter(Boolean).join(' • ') || 'Sem contato registrado'}
                                            </p>
                                            {last ? (
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    Último contato: {last.date}
                                                    {last.reason ? ` • Motivo: ${last.reason}` : ''}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-xs text-muted-foreground">Sem histórico de interação.</p>
                                            )}
                                        </div>
                                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>
            </SafeSection>
        </div>
    );
};

export default CrmPage;

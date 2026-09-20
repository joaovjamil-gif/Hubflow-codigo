import React, { Component, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import {
    AlertTriangle, CalendarClock, CalendarPlus, CheckCircle2, FileText,
    Plus, Wallet, Wrench, ArrowRight, Clock, TrendingUp, TrendingDown,
    Scale, Target, ArrowUpRight, ArrowDownRight, Minus,
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    ComposedChart, Line, Legend, Cell,
} from 'recharts';
import { useAuth } from '@/contexts/AuthContext';
import { brl, todayStr, useCollection } from '@/lib/hubflow';
import { StatusBadge } from '@/components/CrudPanel';
import {
    PERIOD_OPTIONS, periodRange, financeMetrics, operationalMetrics,
    buildSeries, deltaPct, goalProgress, goalUnit, currentPeriodRef, GOAL_TYPES,
} from '@/lib/analytics';
import { cn } from '@/lib/utils';

// --- Error boundary: impede que uma falha de gráfico derrube o dashboard ---
class SafeChart extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn('Chart render falhou:', err);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="grid h-64 place-items-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
                    Não foi possível exibir este gráfico.
                </div>
            );
        }
        return this.props.children;
    }
}

const EmptyHint = ({ icon: Icon, title, hint, to, cta }) => (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Icon className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.6} />
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="max-w-xs text-xs text-muted-foreground">{hint}</p>
        {to && (
            <Link to={to} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                <Plus className="h-3 w-3" /> {cta}
            </Link>
        )}
    </div>
);

const MetricCard = ({ label, value, icon: Icon, tone, sub }) => (
    <div className="hf-card p-5">
        <div className="flex items-center justify-between">
            <Icon className={`h-5 w-5 ${tone}`} strokeWidth={1.8} />
            {sub && <span className="text-xs font-semibold text-muted-foreground">{sub}</span>}
        </div>
        <p className="mt-3 text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
);

const Delta = ({ pct }) => {
    if (pct === null || pct === undefined) {
        return <span className="text-xs text-muted-foreground">sem base</span>;
    }
    const up = pct > 0;
    const flat = pct === 0;
    const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
    const tone = flat ? 'text-muted-foreground' : up ? 'text-accent' : 'text-destructive';
    return (
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', tone)}>
            <Icon className="h-3 w-3" />
            {flat ? '0%' : `${up ? '+' : ''}${pct.toFixed(1)}%`}
        </span>
    );
};

const CompareRow = ({ label, current, previous, isCurrency }) => {
    const pct = deltaPct(current, previous);
    return (
        <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <div className="flex items-center gap-3">
                <span className="font-display font-bold">{isCurrency ? brl(current) : current}</span>
                <span className="text-xs text-muted-foreground">vs {isCurrency ? brl(previous) : previous}</span>
                <Delta pct={pct} />
            </div>
        </div>
    );
};

const actions = [
    { label: 'Novo cliente', to: '/app/clientes' },
    { label: 'Novo orçamento', to: '/app/orcamentos' },
    { label: 'Nova OS', to: '/app/ordens' },
    { label: 'Novo agendamento', to: '/app/agenda' },
    { label: 'Registrar pagamento', to: '/app/financeiro' },
];

const DashboardPage = () => {
    const { user } = useAuth();
    const clients = useCollection('clients');
    const quotes = useCollection('quotes');
    const orders = useCollection('service_orders');
    const agenda = useCollection('appointments', { sort: 'date' });
    const finance = useCollection('finance_entries');
    const goals = useCollection('goals');

    const today = todayStr();
    const [period, setPeriod] = useState('this_month');
    const [customStart, setCustomStart] = useState(today);
    const [customEnd, setCustomEnd] = useState(today);

    const range = useMemo(
        () => periodRange(period, customStart, customEnd),
        [period, customStart, customEnd],
    );

    const fm = useMemo(() => financeMetrics(finance.items, range), [finance.items, range]);
    const om = useMemo(
        () => operationalMetrics(clients.items, quotes.items, orders.items, range),
        [clients.items, quotes.items, orders.items, range],
    );
    const series = useMemo(() => buildSeries(finance.items, range), [finance.items, range]);

    // Metas do período atual (mensal/trimestral/anual) do seu tipo.
    const currentGoals = useMemo(() => {
        return goals.items.filter((g) => g.period_ref === currentPeriodRef(g.period_type));
    }, [goals.items]);

    const goalCtx = {
        receita: fm.receita,
        clientsCount: om.clientsCount,
        quotesCount: om.quotesCount,
        osDone: om.osDone,
    };

    const activities = useMemo(() => {
        const mk = (rec, text, type) => ({ id: rec.id, created: rec.created, text, type });
        const all = [
            ...clients.items.map((r) => mk(r, `Novo cliente cadastrado: ${r.name}`, 'client')),
            ...quotes.items.map((r) => mk(r, `Orçamento ${r.number || ''} para ${r.client_name || 'cliente'}`, 'quote')),
            ...orders.items.map((r) => mk(r, `OS ${r.number || ''} criada para ${r.client_name || 'cliente'}`, 'order')),
            ...agenda.items.map((r) => mk(r, `Agendamento: ${r.title}${r.date ? ` (${r.date})` : ''}`, 'agenda')),
            ...finance.items
                .filter((r) => r.status === 'Pago')
                .map((r) => mk(r, `Pagamento registrado: ${r.description} — ${brl(r.amount)}`, 'payment')),
        ];
        return all
            .sort((x, y) => String(y.created || '').localeCompare(String(x.created || '')))
            .slice(0, 6);
    }, [clients.items, quotes.items, orders.items, agenda.items, finance.items]);

    const loading = clients.loading || quotes.loading || orders.loading || agenda.loading || finance.loading;

    const recentQuotes = useMemo(
        () => [...quotes.items].sort((x, y) => String(y.created || '').localeCompare(String(x.created || ''))).slice(0, 4),
        [quotes.items],
    );
    const recentOrders = useMemo(
        () => [...orders.items].sort((x, y) => String(y.created || '').localeCompare(String(x.created || ''))).slice(0, 4),
        [orders.items],
    );

    const hasSeries = series.length > 0 && series.some((s) => s.receita !== 0 || s.despesa !== 0);

    return (
        <div>
            <Helmet>
                <title>Dashboard — HubFlow</title>
                <meta name="description" content="Painel analítico do seu negócio: receita, despesas, resultado, comparação de períodos, gráficos e metas." />
            </Helmet>

            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                        Olá, {user?.name || 'tudo certo'}
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Resumo de {user?.business_name || 'seu negócio'} • {range.label}
                    </p>
                </div>

                {/* Seletor de período */}
                <div className="flex flex-wrap items-center gap-2">
                    <select
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="min-h-[44px] rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary"
                    >
                        {PERIOD_OPTIONS.map((p) => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                    {period === 'custom' && (
                        <>
                            <input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)}
                                className="min-h-[44px] rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary" />
                            <span className="text-sm text-muted-foreground">até</span>
                            <input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)}
                                className="min-h-[44px] rounded-xl border border-input bg-card px-3 text-sm outline-none focus:border-primary" />
                        </>
                    )}
                </div>
            </div>

            {/* Indicadores principais do período (mais importantes primeiro) */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Receita do período" value={brl(fm.receita)} icon={TrendingUp} tone="text-accent" />
                <MetricCard label="Despesas do período" value={brl(fm.despesa)} icon={TrendingDown} tone="text-primary" />
                <MetricCard label="Resultado do período" value={brl(fm.resultado)} icon={Scale} tone={fm.resultado >= 0 ? 'text-accent' : 'text-destructive'} />
                <MetricCard label="Saldo do período" value={brl(fm.saldo)} icon={Wallet} tone={fm.saldo >= 0 ? 'text-accent' : 'text-destructive'} />
            </div>

            {/* Snapshot em aberto (estado atual) */}
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                <MetricCard label="A receber em aberto" value={brl(fm.toReceive)} icon={Wallet} tone="text-accent" />
                <MetricCard label="Total recebido" value={brl(fm.received)} icon={CheckCircle2} tone="text-accent" />
                <MetricCard label="A pagar em aberto" value={brl(fm.toPay)} icon={Wallet} tone="text-primary" />
                <MetricCard label="Total pago" value={brl(fm.paid)} icon={CheckCircle2} tone="text-primary" />
                <MetricCard label="Valores vencidos" value={brl(fm.overdue)} icon={AlertTriangle} tone="text-destructive" />
            </div>

            {/* Comparação com período anterior */}
            <section className="hf-card mt-6 p-5">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Comparação com período anterior</h2>
                    <Link to="/app/financeiro" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        Ver financeiro <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {range.label} vs. período anterior equivalente.
                </p>
                <div className="mt-3 divide-y divide-border">
                    <CompareRow label="Receita" current={fm.receita} previous={fm.prevReceita} isCurrency />
                    <CompareRow label="Despesas" current={fm.despesa} previous={fm.prevDespesa} isCurrency />
                    <CompareRow label="Resultado" current={fm.resultado} previous={fm.prevResultado} isCurrency />
                    <CompareRow label="Clientes novos" current={om.clientsCount} previous={om.prevClients} />
                    <CompareRow label="Orçamentos" current={om.quotesCount} previous={om.prevQuotes} />
                    <CompareRow label="OS concluídas" current={om.osDone} previous={om.prevOsDone} />
                </div>
            </section>

            {/* Gráficos */}
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
                <section className="hf-card p-5">
                    <h2 className="font-display text-lg font-bold">Receita vs. Despesas</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Evolução do realizado no período.</p>
                    {loading ? (
                        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/40" />
                    ) : !hasSeries ? (
                        <div className="mt-4 grid h-64 place-items-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
                            Sem receita ou despesa registrada no período.
                        </div>
                    ) : (
                        <SafeChart>
                            <ResponsiveContainer width="100%" height={260}>
                                <ComposedChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={16} />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={48} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                                    <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="receita" name="Receita" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="despesa" name="Despesas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    <Line dataKey="resultado" name="Resultado" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </SafeChart>
                    )}
                </section>

                <section className="hf-card p-5">
                    <h2 className="font-display text-lg font-bold">Resultado do período</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Receita menos despesas por intervalo.</p>
                    {loading ? (
                        <div className="mt-4 h-64 animate-pulse rounded-xl bg-muted/40" />
                    ) : !hasSeries ? (
                        <div className="mt-4 grid h-64 place-items-center rounded-xl bg-muted/30 text-sm text-muted-foreground">
                            Sem dados suficientes para o gráfico.
                        </div>
                    ) : (
                        <SafeChart>
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={series} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" interval="preserveStartEnd" minTickGap={16} />
                                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={48} tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)} />
                                    <Tooltip formatter={(v) => brl(v)} contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                                    <Bar dataKey="resultado" name="Resultado" radius={[4, 4, 0, 0]}>
                                        {series.map((s, i) => (
                                            <Cell key={i} fill={s.resultado >= 0 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </SafeChart>
                    )}
                </section>
            </div>

            {/* Metas */}
            <section className="hf-card mt-6 p-5">
                <div className="flex items-center justify-between">
                    <h2 className="font-display text-lg font-bold">Metas do período</h2>
                    <Link to="/app/metas" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        Gerenciar metas <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
                {goals.loading ? (
                    <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted/40" />
                ) : currentGoals.length === 0 ? (
                    <EmptyHint
                        icon={Target}
                        title="Nenhuma meta para o período atual"
                        hint="Defina metas de faturamento, clientes, orçamentos ou serviços concluídos."
                        to="/app/metas"
                        cta="Criar meta"
                    />
                ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        {currentGoals.map((g) => {
                            const realized = goalProgress(g, goalCtx);
                            const target = Number(g.target) || 0;
                            const pct = target > 0 ? Math.min(100, (realized / target) * 100) : 0;
                            const unit = goalUnit(g.type);
                            const typeLabel = GOAL_TYPES.find((t) => t.value === g.type)?.label || g.type;
                            const isCurrency = unit === 'brl';
                            return (
                                <div key={g.id} className="rounded-xl border border-border bg-secondary/30 p-4">
                                    <div className="flex items-center justify-between">
                                        <p className="font-display text-sm font-bold">{typeLabel}</p>
                                        <span className="text-xs text-muted-foreground">{g.period_type}</span>
                                    </div>
                                    <div className="mt-2 flex items-end justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            Realizado: <span className="font-bold text-foreground">{isCurrency ? brl(realized) : realized}</span>
                                        </span>
                                        <span className="text-muted-foreground">
                                            Meta: <span className="font-bold text-foreground">{isCurrency ? brl(target) : target}</span>
                                        </span>
                                    </div>
                                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-accent transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <p className="mt-1.5 text-right text-xs font-semibold text-accent">
                                        {pct.toFixed(1)}% concluído
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            {/* Ações rápidas */}
            <div className="mt-6 flex flex-wrap gap-3">
                {actions.map((a) => (
                    <Link key={a.label} to={a.to}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-5 text-sm font-semibold text-primary transition hover:bg-primary/10">
                        <Plus className="h-4 w-4" /> {a.label}
                    </Link>
                ))}
            </div>

            <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {/* Agenda do dia */}
                <section className="hf-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">Agenda de hoje</h2>
                        <Link to="/app/agenda" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Ver agenda <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted/40" />
                    ) : !agenda.items.some((i) => i.date === today) ? (
                        <EmptyHint
                            icon={CalendarClock}
                            title="Nenhum serviço para hoje"
                            hint="Agende um compromisso para vê-lo aqui no dia."
                            to="/app/agenda"
                            cta="Novo agendamento"
                        />
                    ) : (
                        <ul className="mt-4 divide-y divide-border">
                            {agenda.items
                                .filter((i) => i.date === today)
                                .sort((x, y) => (x.time || '').localeCompare(y.time || ''))
                                .map((a) => (
                                    <li key={a.id} className="flex items-center gap-4 py-3 text-sm">
                                        <span className="font-mono text-xs text-muted-foreground">{a.time || '--:--'}</span>
                                        <span className="font-medium">{a.title}</span>
                                        <span className="ml-auto text-muted-foreground">{a.client_name || 'Sem cliente'}</span>
                                    </li>
                                ))}
                        </ul>
                    )}
                </section>

                {/* Próximos serviços */}
                <section className="hf-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">Próximos serviços</h2>
                        <Link to="/app/agenda" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Ver agenda <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted/40" />
                    ) : (
                        <ul className="mt-4 divide-y divide-border">
                            {agenda.items
                                .filter((i) => i.date && i.date >= today && i.date !== today)
                                .sort((x, y) => (x.date + (x.time || '')).localeCompare(y.date + (y.time || '')))
                                .slice(0, 5)
                                .map((a) => a.id ? (
                                    <li key={a.id} className="flex items-center gap-4 py-3 text-sm">
                                        <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">{a.date}</span>
                                        <span className="font-medium">{a.title}</span>
                                        <span className="ml-auto text-muted-foreground">{a.client_name || 'Sem cliente'}</span>
                                    </li>
                                ) : null)}
                            {!loading && agenda.items.filter((i) => i.date && i.date >= today && i.date !== today).length === 0 && (
                                <EmptyHint
                                    icon={CalendarPlus}
                                    title="Nenhum serviço futuro agendado"
                                    hint="Os próximos compromissos aparecerão aqui automaticamente."
                                    to="/app/agenda"
                                    cta="Novo agendamento"
                                />
                            )}
                        </ul>
                    )}
                </section>

                {/* Últimos orçamentos */}
                <section className="hf-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">Últimos orçamentos</h2>
                        <Link to="/app/orcamentos" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Ver todos <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted/40" />
                    ) : recentQuotes.length === 0 ? (
                        <EmptyHint icon={FileText} title="Você ainda não possui orçamentos" hint="Crie seu primeiro orçamento para acompanhar o status aqui." to="/app/orcamentos" cta="Novo orçamento" />
                    ) : (
                        <ul className="mt-4 divide-y divide-border">
                            {recentQuotes.map((q) => (
                                <li key={q.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                    <span className="font-mono text-xs text-muted-foreground">{q.number || '—'}</span>
                                    <span className="font-medium">{q.client_name || 'Sem cliente'}</span>
                                    <span className="ml-auto font-semibold">{brl(q.amount)}</span>
                                    <StatusBadge status={q.status} />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Últimas OS */}
                <section className="hf-card p-5">
                    <div className="flex items-center justify-between">
                        <h2 className="font-display text-lg font-bold">Últimas Ordens de Serviço</h2>
                        <Link to="/app/ordens" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                            Ver todas <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {loading ? (
                        <div className="mt-4 h-20 animate-pulse rounded-xl bg-muted/40" />
                    ) : recentOrders.length === 0 ? (
                        <EmptyHint icon={Wrench} title="Nenhuma ordem de serviço criada" hint="Crie sua primeira OS para acompanhar o andamento aqui." to="/app/ordens" cta="Nova OS" />
                    ) : (
                        <ul className="mt-4 divide-y divide-border">
                            {recentOrders.map((o) => (
                                <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                    <span className="font-mono text-xs text-muted-foreground">{o.number || '—'}</span>
                                    <span className="font-medium">{o.service || 'Serviço'}</span>
                                    <span className="text-muted-foreground">{o.client_name}</span>
                                    <span className="ml-auto"><StatusBadge status={o.status} /></span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Atividades recentes */}
                <section className="hf-card p-5 lg:col-span-2">
                    <h2 className="font-display text-lg font-bold">Atividades recentes</h2>
                    {loading ? (
                        <div className="mt-4 h-24 animate-pulse rounded-xl bg-muted/40" />
                    ) : activities.length === 0 ? (
                        <EmptyHint icon={Clock} title="Nenhuma atividade ainda" hint="Cadastros, orçamentos, OS, agendamentos e pagamentos aparecerão aqui conforme você usar o HubFlow." />
                    ) : (
                        <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
                            {activities.map((a) => (
                                <li key={`${a.id}-${a.type}`} className="flex gap-3">
                                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                                    <span>{a.text}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
};

export default DashboardPage;

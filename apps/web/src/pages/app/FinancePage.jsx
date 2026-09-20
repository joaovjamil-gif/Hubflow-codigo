import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { Link2, CheckCircle2, Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import CrudPanel, { StatusBadge, FlowButton } from '@/components/CrudPanel';
import { FINANCE_STATUS_OPTIONS, brl, effectiveFinanceStatus, todayStr, useCollection } from '@/lib/hubflow';
import { categoriesFor } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const fields = [
    { name: 'description', label: 'Descrição', required: true },
    { name: 'client_name', label: 'Cliente / Fornecedor' },
    { name: 'amount', label: 'Valor (R$)', type: 'number', required: true },
    { name: 'due_date', label: 'Vencimento', type: 'date', required: true },
    {
        name: 'kind', label: 'Tipo', type: 'select',
        options: [
            { value: 'receber', label: 'A receber (receita)' },
            { value: 'pagar', label: 'A pagar (despesa)' },
        ],
    },
    { name: 'status', label: 'Status', type: 'select', options: FINANCE_STATUS_OPTIONS },
    {
        name: 'category', label: 'Categoria', type: 'select', allowEmpty: true,
        options: (form) => categoriesFor(form.kind || 'receber'),
    },
    { name: 'payment_date', label: 'Data de recebimento/pagamento', type: 'date', show: (form) => form.status === 'Pago' },
    { name: 'notes', label: 'Observação', type: 'textarea' },
];

const FinancePage = () => {
    const [searchParams] = useSearchParams();
    const presetClient = searchParams.get('cliente') || '';
    const collection = useCollection('finance_entries', { sort: 'due_date' });
    const orders = useCollection('service_orders');
    const [busy, setBusy] = useState(null);
    const [tab, setTab] = useState('receber'); // 'receber' | 'pagar' | 'all'

    const today = todayStr();

    const orderForFinance = useMemo(() => {
        const map = {};
        orders.items.forEach((o) => { map[o.id] = o; });
        return map;
    }, [orders.items]);

    const open = (i) => {
        const s = effectiveFinanceStatus(i, today);
        return s === 'Pendente' || s === 'Vencido';
    };

    const toReceive = useMemo(
        () => collection.items.filter((i) => i.kind === 'receber' && open(i)).reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [collection.items, today],
    );
    const toPay = useMemo(
        () => collection.items.filter((i) => i.kind === 'pagar' && open(i)).reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [collection.items, today],
    );
    const received = useMemo(
        () => collection.items.filter((i) => i.kind === 'receber' && i.status === 'Pago').reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [collection.items],
    );
    const paid = useMemo(
        () => collection.items.filter((i) => i.kind === 'pagar' && i.status === 'Pago').reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [collection.items],
    );
    const overdue = useMemo(
        () => collection.items.filter((i) => effectiveFinanceStatus(i, today) === 'Vencido').reduce((s, i) => s + (Number(i.amount) || 0), 0),
        [collection.items, today],
    );
    const saldo = received - paid;

    const handleReceive = async (entry) => {
        setBusy(entry.id);
        try {
            const patch = { status: 'Pago' };
            // Registra a data de recebimento/pagamento como hoje, se ainda não houver.
            if (!entry.payment_date) patch.payment_date = today;
            await collection.update(entry.id, patch);
            toast({
                title: entry.kind === 'pagar' ? 'Pagamento registrado' : 'Recebimento registrado',
                description: `${entry.description} marcado como ${entry.kind === 'pagar' ? 'Pago' : 'Recebido'}.`,
            });
        } catch (err) {
            toast({ title: 'Não foi possível registrar.', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const extraActions = (f) => {
        const s = effectiveFinanceStatus(f, today);
        if (s === 'Pago' || s === 'Cancelado') return null;
        const isPayable = f.kind === 'pagar';
        return (
            <FlowButton
                icon={CheckCircle2}
                label={busy === f.id ? 'Registrando...' : (isPayable ? 'Registrar pagamento' : 'Registrar recebimento')}
                tone="accent"
                onClick={() => handleReceive(f)}
                disabled={busy === f.id}
            />
        );
    };

    const totals = [
        { label: 'A receber em aberto', value: toReceive, tone: 'text-accent', icon: TrendingUp },
        { label: 'Total recebido', value: received, tone: 'text-accent', icon: CheckCircle2 },
        { label: 'A pagar em aberto', value: toPay, tone: 'text-primary', icon: TrendingDown },
        { label: 'Total pago', value: paid, tone: 'text-primary', icon: Wallet },
        { label: 'Valores vencidos', value: overdue, tone: 'text-destructive', icon: Wallet },
        { label: 'Saldo (recebido - pago)', value: saldo, tone: saldo >= 0 ? 'text-accent' : 'text-destructive', icon: Scale },
    ];

    const tabs = [
        { value: 'receber', label: 'Contas a receber' },
        { value: 'pagar', label: 'Contas a pagar' },
        { value: 'all', label: 'Tudo' },
    ];

    return (
        <>
            <Helmet>
                <title>Financeiro — HubFlow</title>
                <meta name="description" content="Contas a receber, contas a pagar, categorias, pagamentos e vencimentos do seu negócio, com vínculo às ordens de serviço." />
            </Helmet>

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {totals.map((t) => (
                    <div key={t.label} className="hf-card p-5">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">{t.label}</p>
                            <t.icon className={`h-4 w-4 ${t.tone}`} strokeWidth={1.8} />
                        </div>
                        <p className={`mt-1 font-display text-xl font-extrabold ${t.tone}`}>{brl(t.value)}</p>
                    </div>
                ))}
            </div>

            <div className="mb-5 flex flex-wrap gap-2">
                {tabs.map((t) => (
                    <button
                        key={t.value}
                        onClick={() => setTab(t.value)}
                        className={cn(
                            'rounded-full px-4 py-2 text-sm font-semibold transition',
                            tab === t.value
                                ? 'bg-primary text-primary-foreground'
                                : 'border border-border bg-card text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <CrudPanel
                title="Financeiro"
                description="Contas a receber e a pagar com categoria, vencimento e data de recebimento. Uma conta pendente com data vencida aparece automaticamente como 'Vencido'."
                addLabel="Novo lançamento"
                collection={collection}
                fields={fields}
                searchKeys={['description', 'client_name', 'category']}
                emptyLabel="Nenhum lançamento registrado."
                extraActions={extraActions}
                filter={(f) => tab === 'all' || f.kind === tab}
                initialValues={{ client_name: presetClient }}
                renderItem={(f) => {
                    const linkedOrder = f.order_id ? orderForFinance[f.order_id] : null;
                    const effStatus = effectiveFinanceStatus(f, today);
                    return (
                        <div className="flex flex-wrap items-center gap-3">
                            <div>
                                <p className="font-display font-bold">{f.description}</p>
                                <p className="text-sm text-muted-foreground">
                                    {f.kind === 'pagar' ? 'A pagar' : 'A receber'} • {f.client_name || 'sem contato'} • vence {f.due_date || '—'}
                                    {f.category ? ` • ${f.category}` : ''}
                                </p>
                                {f.payment_date && (
                                    <p className="text-xs text-accent">
                                        {f.kind === 'pagar' ? 'Pago em' : 'Recebido em'} {f.payment_date}
                                    </p>
                                )}
                                {f.notes && <p className="mt-0.5 text-xs text-muted-foreground">{f.notes}</p>}
                                {linkedOrder && (
                                    <span className="mt-1 inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-[11px] text-accent">
                                        <Link2 className="h-3 w-3" /> OS {linkedOrder.number || '—'} • {linkedOrder.service || 'Serviço'}
                                    </span>
                                )}
                            </div>
                            <span className="font-semibold">{brl(f.amount)}</span>
                            <StatusBadge status={effStatus} />
                        </div>
                    );
                }}
            />
        </>
    );
};

export default FinancePage;

import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Package, AlertTriangle, Plus, ArrowDownCircle, ArrowUpCircle, SlidersHorizontal, X, History } from 'lucide-react';
import { PageHeader } from '@/components/CrudPanel';
import { useCollection, brl } from '@/lib/hubflow';
import {
    productUnit, unitLabel, formatStock, stockStatus, isLowStock,
    movementDelta, loadProductMovements, registerMovement,
} from '@/lib/catalog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MOVEMENT_TYPES = [
    { value: 'Entrada', label: 'Entrada', icon: ArrowDownCircle, tone: 'text-accent' },
    { value: 'Saída', label: 'Saída', icon: ArrowUpCircle, tone: 'text-destructive' },
    { value: 'Ajuste', label: 'Ajuste', icon: SlidersHorizontal, tone: 'text-primary' },
];

const StockPage = () => {
    const products = useCollection('products');
    const [query, setQuery] = useState('');
    const [onlyLow, setOnlyLow] = useState(false);
    const [selected, setSelected] = useState(null); // produto em detalhe

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return products.items.filter((p) => {
            if (onlyLow && !isLowStock(p)) return false;
            if (!q) return true;
            return String(p.name || '').toLowerCase().includes(q)
                || String(p.category || '').toLowerCase().includes(q);
        });
    }, [products.items, query, onlyLow]);

    const lowCount = useMemo(
        () => products.items.filter(isLowStock).length,
        [products.items],
    );

    return (
        <div>
            <Helmet>
                <title>Estoque — HubFlow</title>
                <meta name="description" content="Controle de estoque de materiais: saldo atual, mínimo, movimentações de entrada/saída/ajuste e alerta de estoque baixo." />
            </Helmet>
            <PageHeader
                title="Estoque"
                description="Acompanhe o saldo de materiais, registre entradas, saídas e ajustes, e identifique itens em falta."
            />

            {/* Filtros */}
            <div className="mb-5 flex flex-wrap items-center gap-3">
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar produto ou material..."
                    className="min-h-[44px] w-full max-w-sm rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary"
                />
                <button
                    onClick={() => setOnlyLow((v) => !v)}
                    className={cn(
                        'inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.98]',
                        onlyLow
                            ? 'border-destructive bg-destructive/10 text-destructive'
                            : 'border-border bg-card text-muted-foreground hover:text-foreground',
                    )}
                >
                    <AlertTriangle className="h-4 w-4" />
                    Estoque baixo {lowCount > 0 && `(${lowCount})`}
                </button>
            </div>

            {products.loading && <div className="hf-card h-24 animate-pulse bg-muted/40" />}
            {products.error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{products.error}</p>}
            {!products.loading && !products.error && filtered.length === 0 && (
                <div className="hf-card p-10 text-center text-sm text-muted-foreground">
                    {onlyLow
                        ? 'Nenhum produto com estoque baixo no momento.'
                        : 'Nenhum produto cadastrado. Adicione materiais no Catálogo para controlar o estoque.'}
                </div>
            )}

            {/* Tabela principal */}
            {filtered.length > 0 && (
                <div className="hf-card overflow-hidden">
                    <div className="hidden grid-cols-12 gap-3 border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:grid">
                        <div className="col-span-5">Produto</div>
                        <div className="col-span-2">Unidade</div>
                        <div className="col-span-2 text-right">Estoque atual</div>
                        <div className="col-span-2 text-right">Estoque mínimo</div>
                        <div className="col-span-1 text-right">Status</div>
                    </div>
                    <div className="divide-y divide-border">
                        {filtered.map((p) => {
                            const unit = productUnit(p);
                            const low = isLowStock(p);
                            return (
                                <button
                                    key={p.id}
                                    onClick={() => setSelected(p)}
                                    className="grid w-full grid-cols-2 gap-2 px-5 py-4 text-left transition hover:bg-secondary/60 sm:grid-cols-12 sm:items-center sm:gap-3"
                                >
                                    <div className="col-span-2 sm:col-span-5">
                                        <p className="font-display font-bold">{p.name}</p>
                                        <p className="text-xs text-muted-foreground">{p.category || 'Sem categoria'}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground sm:col-span-2">
                                        <span className="sm:hidden font-semibold text-foreground">Unidade: </span>{unit || '—'}
                                    </div>
                                    <div className="text-sm sm:col-span-2 sm:text-right">
                                        <span className="sm:hidden text-muted-foreground">Atual: </span>
                                        <span className={cn('font-semibold', low ? 'text-destructive' : 'text-foreground')}>
                                            {formatStock(p.stock, unit)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-muted-foreground sm:col-span-2 sm:text-right">
                                        <span className="sm:hidden">Mínimo: </span>{formatStock(p.min_stock, unit)}
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 sm:text-right">
                                        <span className={cn(
                                            'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                            low ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-accent/30 bg-accent/10 text-accent',
                                        )}>
                                            {low ? 'Baixo' : 'Normal'}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {selected && (
                <ProductDetail
                    product={selected}
                    onClose={() => setSelected(null)}
                    onChanged={() => { products.reload(); setSelected((prev) => prev ? { ...prev } : prev); }}
                />
            )}
        </div>
    );
};

/* ------------------------- Detalhe do produto ------------------------- */

const ProductDetail = ({ product, onClose, onChanged }) => {
    const [movements, setMovements] = useState([]);
    const [loadingMov, setLoadingMov] = useState(true);
    const [form, setForm] = useState({ type: 'Entrada', quantity: '', date: '', responsible: '', notes: '' });
    const [saving, setSaving] = useState(false);

    const unit = productUnit(product);
    const low = isLowStock(product);

    const loadMovements = async () => {
        setLoadingMov(true);
        const list = await loadProductMovements(product.id);
        setMovements(list);
        setLoadingMov(false);
    };

    useEffect(() => { loadMovements(); }, [product.id]);

    // Histórico com saldo acumulado (do mais recente para o mais antigo).
    const history = useMemo(() => {
        const chronological = [...movements].sort((a, b) => (a.created || '').localeCompare(b.created || ''));
        let balance = 0;
        const withBalance = chronological.map((m) => {
            balance += movementDelta(m);
            return { ...m, balanceAfter: balance };
        });
        return withBalance.reverse(); // mais recente primeiro
    }, [movements]);

    const submit = async (e) => {
        e.preventDefault();
        const qty = Number(form.quantity);
        if (!qty || (form.type === 'Ajuste' && qty === 0)) {
            toast({ title: 'Informe uma quantidade válida.', variant: 'destructive' });
            return;
        }
        if (form.type !== 'Ajuste' && qty < 0) {
            toast({ title: 'Use valores positivos. O sinal é aplicado pelo tipo de movimentação.', variant: 'destructive' });
            return;
        }
        setSaving(true);
        try {
            await registerMovement({
                product,
                type: form.type,
                quantity: qty,
                date: form.date,
                responsible: form.responsible,
                notes: form.notes,
            });
            toast({ title: `${form.type} registrada`, description: `${formatStock(Math.abs(qty), unit)} • novo saldo atualizado.` });
            setForm({ type: form.type, quantity: '', date: '', responsible: '', notes: '' });
            await loadMovements();
            onChanged();
        } catch (err) {
            toast({ title: 'Não foi possível registrar', description: err?.message || 'Verifique os dados.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 sm:p-8">
            <div className="hf-card w-full max-w-2xl p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-xl font-extrabold">{product.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {[product.category, unitLabel(product.unit_measure)].filter(Boolean).join(' • ') || 'Sem categoria'}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-muted-foreground">
                                Saldo atual: <span className={cn('font-bold', low ? 'text-destructive' : 'text-foreground')}>{formatStock(product.stock, unit)}</span>
                            </span>
                            <span className="text-muted-foreground">Mínimo: <span className="font-semibold text-foreground">{formatStock(product.min_stock, unit)}</span></span>
                            <span className={cn(
                                'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold',
                                low ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-accent/30 bg-accent/10 text-accent',
                            )}>
                                {stockStatus(product)}
                            </span>
                        </div>
                    </div>
                    <button type="button" onClick={onClose}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Custo/venda — apenas referência, não alterados por movimentações */}
                <div className="mb-5 flex flex-wrap gap-x-6 gap-y-1 rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                    <span>Custo: <span className="font-semibold text-foreground">{brl(product.cost)}</span></span>
                    <span>Venda: <span className="font-semibold text-foreground">{brl(product.price)}</span></span>
                    <span className="text-muted-foreground/70">Não alterados por movimentações de estoque.</span>
                </div>

                {/* Formulário de movimentação */}
                <form onSubmit={submit} className="mb-6 rounded-xl border border-border p-4">
                    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        <Plus className="h-4 w-4" /> Registrar movimentação
                    </h3>

                    <div className="mb-4 flex flex-wrap gap-2">
                        {MOVEMENT_TYPES.map((t) => {
                            const active = form.type === t.value;
                            return (
                                <button key={t.value} type="button" onClick={() => setForm({ ...form, type: t.value })}
                                    className={cn(
                                        'inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.98]',
                                        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-muted-foreground hover:text-foreground',
                                    )}>
                                    <t.icon className={cn('h-4 w-4', !active && t.tone)} /> {t.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">
                                Quantidade {form.type === 'Ajuste' ? '(use sinal: + ou −)' : `(${unit || 'un'})`}
                            </label>
                            <input type="number" step="any" value={form.quantity}
                                onChange={(e) => setForm({ ...form, quantity: e.target.value })} required
                                placeholder={form.type === 'Ajuste' ? 'ex.: -2' : 'ex.: 10'}
                                className="min-h-[40px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Data</label>
                            <input type="date" value={form.date}
                                onChange={(e) => setForm({ ...form, date: e.target.value })}
                                className="min-h-[40px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Responsável (opcional)</label>
                            <input value={form.responsible}
                                onChange={(e) => setForm({ ...form, responsible: e.target.value })}
                                className="min-h-[40px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-xs font-semibold text-muted-foreground">Observação / motivo (opcional)</label>
                            <input value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                className="min-h-[40px] rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                        </div>
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button type="submit" disabled={saving}
                            className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                            {saving ? 'Registrando...' : 'Registrar'}
                        </button>
                    </div>
                </form>

                {/* Histórico */}
                <div>
                    <h3 className="mb-3 flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide text-muted-foreground">
                        <History className="h-4 w-4" /> Histórico de movimentações
                    </h3>
                    {loadingMov && <div className="h-16 animate-pulse rounded-xl bg-muted/40" />}
                    {!loadingMov && history.length === 0 && (
                        <p className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-center text-sm text-muted-foreground">
                            Nenhuma movimentação registrada ainda.
                        </p>
                    )}
                    {history.length > 0 && (
                        <div className="divide-y divide-border rounded-xl border border-border">
                            {history.map((m) => {
                                const delta = movementDelta(m);
                                const prevBalance = m.balanceAfter - delta;
                                const TypeIcon = MOVEMENT_TYPES.find((t) => t.value === m.type)?.icon || Package;
                                return (
                                    <div key={m.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                                        <TypeIcon className={cn(
                                            'h-4 w-4 shrink-0',
                                            m.type === 'Entrada' && 'text-accent',
                                            m.type === 'Saída' && 'text-destructive',
                                            m.type === 'Ajuste' && 'text-primary',
                                        )} />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold">
                                                {m.type} de {formatStock(Math.abs(m.quantity), m.unit || unit)}
                                                {m.source === 'os' && <span className="ml-1 text-xs font-normal text-muted-foreground">(via OS)</span>}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {m.date || 'sem data'}
                                                {m.responsible ? ` • ${m.responsible}` : ''}
                                                {m.notes ? ` • ${m.notes}` : ''}
                                            </p>
                                        </div>
                                        <div className="shrink-0 text-right font-mono text-xs">
                                            <span className="text-muted-foreground">{formatStock(prevBalance, m.unit || unit)}</span>
                                            <span className="mx-1 text-muted-foreground">→</span>
                                            <span className={cn('font-bold', m.balanceAfter < 0 ? 'text-destructive' : 'text-foreground')}>
                                                {formatStock(m.balanceAfter, m.unit || unit)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockPage;

import React, { useMemo, useState } from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { brl } from '@/lib/hubflow';
import { ITEM_KINDS, kindLabel, lineItemFrom, computeTotals } from '@/lib/catalog';
import { cn } from '@/lib/utils';

/**
 * Editor de line-items compartilhado entre Modelos, Orçamentos e OS.
 * props:
 *  - catalog: { services, products, equipment, epis, tools }
 *  - items, setItems
 *  - globalDiscount, setGlobalDiscount (opcional)
 *  - showCost (mostra coluna de custo — produtos)
 *  - locked (somente leitura — ex.: itens previstos na OS)
 */
const ItemBuilder = ({ catalog, items, setItems, globalDiscount = 0, setGlobalDiscount, showCost = false, locked = false }) => {
    const [pickerKind, setPickerKind] = useState(null);

    const totals = useMemo(() => computeTotals(items, globalDiscount), [items, globalDiscount]);

    const update = (idx, patch) => {
        setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
    };
    const remove = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));
    const move = (idx, dir) => {
        setItems((prev) => {
            const next = [...prev];
            const j = idx + dir;
            if (j < 0 || j >= next.length) return prev;
            [next[idx], next[j]] = [next[j], next[idx]];
            return next;
        });
    };

    const addFromCatalog = (kind, rec) => {
        setItems((prev) => [...prev, lineItemFrom(kind, rec)]);
        setPickerKind(null);
    };

    const addManual = (kind) => {
        setItems((prev) => [
            ...prev,
            { kind, ref: '', name: '', category: '', unit: '', qty: 1, price: 0, discount: 0, ...(kind === 'product' ? { cost: 0 } : {}) },
        ]);
        setPickerKind(null);
    };

    const listFor = (kind) => {
        if (kind === 'service') return catalog?.services || [];
        if (kind === 'product') return catalog?.products || [];
        if (kind === 'equipment') return catalog?.equipment || [];
        if (kind === 'epi') return catalog?.epis || [];
        if (kind === 'tool') return catalog?.tools || [];
        return [];
    };

    const kinds = ['service', 'product', 'equipment', 'epi', 'tool'];

    return (
        <div className="grid gap-3">
            {/* Lista de itens */}
            {items.length === 0 && (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
                    Nenhum item adicionado. Use os botões abaixo para incluir serviços, materiais, equipamentos, EPIs ou ferramentas do catálogo.
                </div>
            )}

            {items.map((it, idx) => (
                <div key={idx} className="hf-card grid gap-3 p-4 sm:grid-cols-12 sm:items-end">
                    <div className="sm:col-span-3">
                        <label className="text-xs font-semibold text-muted-foreground">Tipo</label>
                        <p className={cn('mt-1 text-sm font-semibold', ITEM_KINDS[it.kind]?.tone || 'text-foreground')}>
                            {kindLabel(it.kind)}
                        </p>
                    </div>
                    <div className="sm:col-span-5">
                        <label className="text-xs font-semibold text-muted-foreground">Descrição</label>
                        <input
                            value={it.name || ''}
                            onChange={(e) => update(idx, { name: e.target.value })}
                            disabled={locked}
                            placeholder="Nome do item"
                            className="mt-1 min-h-[40px] w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-70"
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground">Qtd</label>
                        <input
                            type="number" min="0" step="any"
                            value={it.qty}
                            onChange={(e) => update(idx, { qty: e.target.value })}
                            disabled={locked}
                            className="mt-1 min-h-[40px] w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-70"
                        />
                    </div>
                    <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-muted-foreground">Preço unit.</label>
                        <input
                            type="number" min="0" step="any"
                            value={it.price}
                            onChange={(e) => update(idx, { price: e.target.value })}
                            disabled={locked}
                            className="mt-1 min-h-[40px] w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-70"
                        />
                    </div>
                    <div className="sm:col-span-1">
                        <label className="text-xs font-semibold text-muted-foreground">Desc.</label>
                        <input
                            type="number" min="0" step="any"
                            value={it.discount}
                            onChange={(e) => update(idx, { discount: e.target.value })}
                            disabled={locked}
                            className="mt-1 min-h-[40px] w-full rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-primary disabled:opacity-70"
                        />
                    </div>

                    <div className="flex items-center justify-between gap-2 sm:col-span-12">
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                            <span>Linha: <span className="font-semibold text-foreground">{brl((Number(it.qty) || 0) * (Number(it.price) || 0) - (Number(it.discount) || 0))}</span></span>
                            {it.kind === 'product' && showCost && Number(it.cost) > 0 && (
                                <span>Custo: <span className="font-semibold text-foreground">{brl((Number(it.qty) || 0) * (Number(it.cost) || 0))}</span></span>
                            )}
                            {it.category && <span>Cat: {it.category}</span>}
                            {it.unit && <span>Un: {it.unit}</span>}
                        </div>
                        {!locked && (
                            <div className="flex gap-1">
                                <button type="button" onClick={() => move(idx, -1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary" aria-label="Subir">
                                    <ChevronUp className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => move(idx, 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-primary" aria-label="Descer">
                                    <ChevronDown className="h-3.5 w-3.5" />
                                </button>
                                <button type="button" onClick={() => remove(idx)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:text-destructive" aria-label="Remover">
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}

            {/* Adicionar itens */}
            {!locked && (
                <div className="flex flex-wrap gap-2">
                    {kinds.map((k) => (
                        <div key={k} className="relative">
                            <button
                                type="button"
                                onClick={() => setPickerKind(pickerKind === k ? null : k)}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                            >
                                <Plus className="h-3.5 w-3.5" /> {kindLabel(k)}
                            </button>
                            {pickerKind === k && (
                                <div className="absolute z-20 mt-1 w-72 rounded-xl border border-border bg-popover p-2 shadow-lg">
                                    <div className="max-h-56 overflow-auto">
                                        {listFor(k).length === 0 && (
                                            <p className="px-2 py-3 text-xs text-muted-foreground">Nada cadastrado no catálogo.</p>
                                        )}
                                        {listFor(k).map((rec) => (
                                            <button
                                                key={rec.id}
                                                type="button"
                                                onClick={() => addFromCatalog(k, rec)}
                                                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-secondary"
                                            >
                                                <span className="min-w-0">
                                                    <span className="block truncate font-medium">{rec.name}</span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {[rec.category, rec.unit].filter(Boolean).join(' • ')}
                                                    </span>
                                                </span>
                                                <span className="shrink-0 text-xs font-semibold text-accent">
                                                    {brl(k === 'product' ? rec.price : rec.base_price)}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => addManual(k)}
                                        className="mt-1 flex w-full items-center gap-1.5 rounded-lg border border-dashed border-border px-2 py-2 text-xs font-semibold text-primary hover:bg-primary/5"
                                    >
                                        <Copy className="h-3.5 w-3.5" /> Adicionar manual
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Totais */}
            <div className="hf-card mt-2 grid gap-2 p-4 text-sm sm:ml-auto sm:w-80">
                <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span className="font-semibold text-foreground">{brl(totals.subtotal)}</span>
                </div>
                {setGlobalDiscount && (
                    <div className="flex items-center justify-between gap-2 text-muted-foreground">
                        <span>Desconto global</span>
                        <input
                            type="number" min="0" step="any"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(e.target.value)}
                            className="min-h-[36px] w-28 rounded-lg border border-input bg-background px-2 text-right text-sm outline-none focus:border-primary"
                        />
                    </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                    <span>Descontos</span><span className="font-semibold text-foreground">− {brl(totals.discountTotal)}</span>
                </div>
                {showCost && totals.cost > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                        <span>Custo estimado</span><span className="font-semibold text-foreground">{brl(totals.cost)}</span>
                    </div>
                )}
                <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-extrabold">
                    <span>Total</span><span className="text-accent">{brl(totals.total)}</span>
                </div>
            </div>
        </div>
    );
};

export default ItemBuilder;

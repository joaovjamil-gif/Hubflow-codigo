import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useSearchParams } from 'react-router-dom';
import { CalendarPlus, Wallet, Link2, CheckCircle2, MapPin, Navigation, ClipboardCheck, X, PackageCheck } from 'lucide-react';
import CrudPanel, { StatusBadge, FlowButton } from '@/components/CrudPanel';
import ItemBuilder from '@/components/ItemBuilder';
import { OS_STATUS, brl, useCollection, syncAppointmentFromOrder, generateReceivableFromOrder, findAppointmentByOrder } from '@/lib/hubflow';
import { loadCatalog, normalizeItems, generateStockExitFromOrder } from '@/lib/catalog';
import pb from '@/lib/pocketbaseClient';
import { toast } from '@/hooks/use-toast';

const fields = [
    { name: 'number', label: 'Número' },
    { name: 'client_name', label: 'Cliente', required: true },
    { name: 'service', label: 'Serviço' },
    { name: 'date', label: 'Data', type: 'date' },
    { name: 'time', label: 'Horário', type: 'time' },
    { name: 'assignee', label: 'Responsável' },
    { name: 'amount', label: 'Valor (R$)', type: 'number' },
    { name: 'status', label: 'Status', type: 'select', options: OS_STATUS },
    { name: 'service_address', label: 'Endereço do serviço', type: 'textarea' },
    { name: 'description', label: 'Descrição', type: 'textarea' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
];

const mapLinks = (address) => {
    const q = encodeURIComponent(address);
    return {
        view: `https://www.google.com/maps/search/?api=1&query=${q}`,
        route: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    };
};

const OrdersPage = () => {
    const [searchParams] = useSearchParams();
    const presetClient = searchParams.get('cliente') || '';
    const collection = useCollection('service_orders');
    const agenda = useCollection('appointments');
    const finance = useCollection('finance_entries');
    const movements = useCollection('stock_movements');
    const [busy, setBusy] = useState(null);

    // Catálogo + editor de "realmente utilizado"
    const [catalog, setCatalog] = useState({ services: [], products: [], equipment: [], epis: [], tools: [] });
    const [usedEditor, setUsedEditor] = useState(null); // { order, items }
    const [savingUsed, setSavingUsed] = useState(false);

    useEffect(() => { loadCatalog().then((c) => setCatalog(c)); }, []);

    // Mapas de vínculo: order_id -> agendamento / financeiro
    const appointmentForOrder = useMemo(() => {
        const map = {};
        agenda.items.forEach((a) => { if (a.order_id) map[a.order_id] = a; });
        return map;
    }, [agenda.items]);

    const financeForOrder = useMemo(() => {
        const map = {};
        finance.items.forEach((f) => { if (f.order_id) map[f.order_id] = f; });
        return map;
    }, [finance.items]);

    // Mapa: order_id -> true se já houve baixa de estoque vinculada (Saída via OS).
    const stockExitForOrder = useMemo(() => {
        const map = {};
        movements.items.forEach((m) => {
            if (m.order_id && m.type === 'Saída' && m.source === 'os') map[m.order_id] = true;
        });
        return map;
    }, [movements.items]);

    const handleSyncAppointment = async (order) => {
        if (!order.date || !order.time) {
            toast({ title: 'Defina data e horário na OS antes de agendar.', variant: 'destructive' });
            return;
        }
        setBusy(`ap-${order.id}`);
        try {
            const existed = !!appointmentForOrder[order.id];
            await syncAppointmentFromOrder(order);
            await agenda.reload();
            toast({
                title: existed ? 'Agendamento atualizado' : 'Agendamento criado',
                description: existed
                    ? 'O compromisso vinculado foi atualizado (sem duplicidade).'
                    : 'Compromisso criado na Agenda e vinculado à OS.',
            });
        } catch (err) {
            toast({ title: 'Não foi possível agendar.', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    // Após salvar uma OS, sincroniza o endereço no agendamento vinculado
    // (mantém OS → Agenda com o endereço sempre atualizado).
    const handleSaved = async (rec, isUpdate) => {
        if (!isUpdate) return;
        try {
            const ap = await findAppointmentByOrder(rec.id);
            if (ap) {
                await syncAppointmentFromOrder(rec);
                await agenda.reload();
            }
        } catch (_) { /* silencioso: não bloqueia o fluxo principal */ }
    };

    const handleGenerateReceivable = async (order) => {
        setBusy(`fin-${order.id}`);
        try {
            const rec = await generateReceivableFromOrder(order);
            await finance.reload();
            const existed = !!rec && financeForOrder[order.id];
            toast({
                title: existed ? 'Conta a receber já existia' : 'Conta a receber gerada',
                description: existed
                    ? 'Já havia um lançamento vinculado a esta OS.'
                    : 'Lançamento Pendente criado no Financeiro. Registre o recebimento depois.',
            });
        } catch (err) {
            toast({ title: 'Não foi possível gerar a conta a receber.', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const openUsedEditor = (order) => {
        const used = normalizeItems(order.used_items);
        // Se ainda não há utilização registrada, pré-carrega com o previsto (editável).
        const seed = used.length > 0 ? used : normalizeItems(order.items).map((it) => ({ ...it, qty: 0 }));
        setUsedEditor({ order, items: seed });
    };

    // OS → Estoque: gera saídas de estoque a partir dos materiais realmente utilizados.
    const handleStockExit = async (order) => {
        const usedProducts = normalizeItems(order.used_items)
            .filter((it) => it.kind === 'product' && it.ref && Number(it.qty) > 0);
        if (usedProducts.length === 0) {
            toast({ title: 'Nenhum material utilizado registrado.', description: 'Registre a utilização real na OS antes de baixar o estoque.', variant: 'destructive' });
            return;
        }
        if (!window.confirm(`Baixar ${usedProducts.length} material(is) do estoque com base na utilização real da OS?`)) return;
        setBusy(`stk-${order.id}`);
        try {
            const result = await generateStockExitFromOrder(order);
            await movements.reload();
            const parts = [];
            if (result.created) parts.push(`${result.created} saída(s) criada(s)`);
            if (result.skipped) parts.push(`${result.skipped} já baixado(s)`);
            if (result.errors.length) {
                toast({
                    title: 'Baixa parcial',
                    description: `${parts.join(', ')}. Falhas: ${result.errors.join('; ')}`,
                    variant: 'destructive',
                });
            } else {
                toast({ title: 'Estoque atualizado', description: parts.join(', ') || 'Nada a baixar.' });
            }
        } catch (err) {
            toast({ title: 'Não foi possível baixar o estoque.', variant: 'destructive' });
        } finally {
            setBusy(null);
        }
    };

    const saveUsedItems = async () => {
        const order = usedEditor?.order;
        if (!order) return;
        setSavingUsed(true);
        try {
            const payload = usedEditor.items.map((it) => ({
                kind: it.kind, ref: it.ref, name: it.name, category: it.category, unit: it.unit,
                qty: Number(it.qty) || 0, price: Number(it.price) || 0, discount: Number(it.discount) || 0,
                ...(it.kind === 'product' ? { cost: Number(it.cost) || 0 } : {}),
            }));
            await pb.collection('service_orders').update(order.id, { used_items: payload });
            await collection.reload();
            toast({ title: 'Utilização registrada', description: 'Itens realmente utilizados foram salvos na OS.' });
            setUsedEditor(null);
        } catch (err) {
            window.alert('Não foi possível salvar a utilização.');
        } finally {
            setSavingUsed(false);
        }
    };

    const extraActions = (o) => {
        const actions = [];
        const hasSchedule = !!appointmentForOrder[o.id];
        const hasFinance = !!financeForOrder[o.id];

        // OS → Agenda (quando tem data e horário)
        if (o.date && o.time && o.status !== 'Cancelada') {
            actions.push(
                <FlowButton
                    key="ap"
                    icon={hasSchedule ? CheckCircle2 : CalendarPlus}
                    label={busy === `ap-${o.id}` ? 'Agendando...' : hasSchedule ? 'Atualizar agenda' : 'Agendar'}
                    tone="primary"
                    onClick={() => handleSyncAppointment(o)}
                    disabled={busy === `ap-${o.id}`}
                    title={hasSchedule ? 'Atualizar o agendamento vinculado (sem duplicar)' : 'Criar agendamento vinculado à OS'}
                />,
            );
        }

        // OS → Financeiro (quando concluída)
        if (o.status === 'Concluída') {
            actions.push(
                <FlowButton
                    key="fin"
                    icon={hasFinance ? CheckCircle2 : Wallet}
                    label={busy === `fin-${o.id}` ? 'Gerando...' : hasFinance ? 'Conta gerada' : 'Gerar conta a receber'}
                    tone={hasFinance ? 'muted' : 'accent'}
                    onClick={() => handleGenerateReceivable(o)}
                    disabled={busy === `fin-${o.id}` || hasFinance}
                    title={hasFinance ? 'Conta a receber já vinculada a esta OS' : 'Gerar conta a receber Pendente vinculada à OS'}
                />,
            );
        }
        // Registrar utilização real (previsto vs utilizado)
        const hasItems = normalizeItems(o.items).length > 0 || normalizeItems(o.used_items).length > 0;
        if (hasItems && o.status !== 'Cancelada') {
            const usedCount = normalizeItems(o.used_items).filter((it) => Number(it.qty) > 0).length;
            actions.push(
                <FlowButton
                    key="used"
                    icon={ClipboardCheck}
                    label={usedCount > 0 ? 'Utilização' : 'Registrar utilização'}
                    tone={usedCount > 0 ? 'muted' : 'primary'}
                    onClick={() => openUsedEditor(o)}
                    title="Registrar quais materiais/equipamentos/EPIs/ferramentas foram realmente utilizados"
                />,
            );
        }
        // OS → Estoque: baixar materiais realmente utilizados (apenas produtos com ref)
        const usedProducts = normalizeItems(o.used_items)
            .filter((it) => it.kind === 'product' && it.ref && Number(it.qty) > 0);
        if (usedProducts.length > 0 && o.status !== 'Cancelada') {
            const hasExit = !!stockExitForOrder[o.id];
            actions.push(
                <FlowButton
                    key="stk"
                    icon={hasExit ? CheckCircle2 : PackageCheck}
                    label={busy === `stk-${o.id}` ? 'Baixando...' : hasExit ? 'Estoque baixado' : 'Baixar estoque'}
                    tone={hasExit ? 'muted' : 'accent'}
                    onClick={() => handleStockExit(o)}
                    disabled={busy === `stk-${o.id}` || hasExit}
                    title={hasExit ? 'Saídas de estoque já geradas para esta OS' : 'Gerar saídas de estoque com base nos materiais realmente utilizados'}
                />,
            );
        }
        return actions.length ? actions : null;
    };

    return (
        <>
            <Helmet>
                <title>Ordens de Serviço — HubFlow</title>
                <meta name="description" content="Gerencie ordens de serviço com cliente, responsável, data, valor e status. Agende e gere contas a receber com um clique." />
            </Helmet>
            <CrudPanel
                title="Ordens de Serviço"
                description="Fluxo: orçamento aprovado → OS → agendamento → conclusão → financeiro."
                addLabel="Nova OS"
                collection={collection}
                fields={fields}
                searchKeys={['client_name', 'number', 'service', 'assignee']}
                emptyLabel="Nenhuma ordem de serviço criada ainda."
                extraActions={extraActions}
                onSaved={handleSaved}
                initialValues={{ client_name: presetClient }}
                renderItem={(o) => {
                    const linkedAp = appointmentForOrder[o.id];
                    const linkedFin = financeForOrder[o.id];
                    const address = (o.service_address || '').trim();
                    const links = address ? mapLinks(address) : null;
                    return (
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs text-muted-foreground">{o.number || '—'}</span>
                            <div className="min-w-0">
                                <p className="font-display font-bold">{o.service || 'Serviço'}</p>
                                <p className="text-sm text-muted-foreground">
                                    {o.client_name} • {o.date || 'sem data'} {o.time} {o.assignee ? `• ${o.assignee}` : ''}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                                    {o.quote_id && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                                            <Link2 className="h-3 w-3" /> Origem: orçamento
                                        </span>
                                    )}
                                    {linkedAp && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                                            <Link2 className="h-3 w-3" /> Agenda: {linkedAp.date} {linkedAp.time}
                                        </span>
                                    )}
                                    {linkedFin && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent">
                                            <Link2 className="h-3 w-3" /> Financeiro: {linkedFin.status}
                                        </span>
                                    )}
                                    {normalizeItems(o.items).length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5">
                                            <ClipboardCheck className="h-3 w-3" /> Previsto: {normalizeItems(o.items).length} itens
                                        </span>
                                    )}
                                    {normalizeItems(o.used_items).filter((it) => Number(it.qty) > 0).length > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-primary">
                                            <ClipboardCheck className="h-3 w-3" /> Utilizado: {normalizeItems(o.used_items).filter((it) => Number(it.qty) > 0).length} itens
                                        </span>
                                    )}
                                </div>
                                {address ? (
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 text-primary" /> {address}
                                        </span>
                                        <a href={links.view} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition hover:bg-primary/20">
                                            <MapPin className="h-3 w-3" /> Ver local
                                        </a>
                                        <a href={links.route} target="_blank" rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 rounded-lg border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent transition hover:bg-accent/20">
                                            <Navigation className="h-3 w-3" /> Traçar rota
                                        </a>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-xs text-muted-foreground">Endereço do serviço não informado.</p>
                                )}
                            </div>
                            <span className="font-semibold">{brl(o.amount)}</span>
                            <StatusBadge status={o.status} />
                        </div>
                    );
                }}
            />

            {/* Editor: previsto vs realmente utilizado */}
            {usedEditor && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 sm:p-8">
                    <div className="hf-card w-full max-w-3xl p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="font-display text-xl font-extrabold">Previsto × Utilizado</h2>
                                <p className="text-sm text-muted-foreground">
                                    OS {usedEditor.order.number || '—'} — {usedEditor.order.client_name}
                                </p>
                            </div>
                            <button type="button" onClick={() => setUsedEditor(null)}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">Previsto no orçamento</h3>
                            <ItemBuilder catalog={catalog} items={normalizeItems(usedEditor.order.items)} setItems={() => {}} locked showCost />
                        </div>

                        <div>
                            <h3 className="mb-1 text-sm font-bold uppercase tracking-wide text-primary">Realmente utilizado na execução</h3>
                            <p className="mb-3 text-xs text-muted-foreground">
                                Ajuste as quantidades para refletir o que foi efetivamente usado. Itens com quantidade 0 são ignorados.
                            </p>
                            <ItemBuilder
                                catalog={catalog}
                                items={usedEditor.items}
                                setItems={(updater) => setUsedEditor((prev) => ({
                                    ...prev,
                                    items: typeof updater === 'function' ? updater(prev.items) : updater,
                                }))}
                                showCost
                            />
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button type="button" onClick={saveUsedItems} disabled={savingUsed}
                                className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                {savingUsed ? 'Salvando...' : 'Salvar utilização'}
                            </button>
                            <button type="button" onClick={() => setUsedEditor(null)}
                                className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrdersPage;

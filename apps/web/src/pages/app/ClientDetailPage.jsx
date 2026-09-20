import React, { Component, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import {
    ArrowLeft, Pencil, ClipboardList, Wrench, Wallet, Clock,
    Plus, TrendingUp, History, CheckCircle2,
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { brl } from '@/lib/hubflow';
import { StatusBadge } from '@/components/CrudPanel';
import {
    buildClientTimeline, clientFinancials, lastInteraction, clientActivity,
    ACTIVITY_LABELS,
} from '@/lib/crm';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// Error boundary: isola falhas para não derrubar a página inteira.
class SafeBlock extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() {
        return { hasError: true };
    }
    componentDidCatch(err) {
        console.warn('ClientDetail block falhou:', err);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="hf-card p-5 text-sm text-muted-foreground">
                    Não foi possível carregar esta seção agora.
                </div>
            );
        }
        return this.props.children;
    }
}

const NOTE_KINDS = ['Geral', 'Preferência', 'Atendimento', 'Comercial', 'Importante'];

const StatCard = ({ label, value, icon: Icon, tone }) => (
    <div className="hf-card p-4">
        <div className="flex items-center justify-between">
            <Icon className={cn('h-4 w-4', tone)} strokeWidth={1.8} />
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{label}</p>
        <p className={cn('mt-0.5 font-display text-lg font-extrabold', tone)}>{value}</p>
    </div>
);

const ClientDetailPage = () => {
    const { id } = useParams();
    const [client, setClient] = useState(null);
    const [quotes, setQuotes] = useState([]);
    const [orders, setOrders] = useState([]);
    const [finance, setFinance] = useState([]);
    const [notes, setNotes] = useState([]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);

    // Form de observação
    const [noteText, setNoteText] = useState('');
    const [noteKind, setNoteKind] = useState('Geral');
    const [savingNote, setSavingNote] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);

    const loadAll = async () => {
        try {
            const c = await pb.collection('clients').getOne(id);
            setClient(c);
            const filter = pb.filter('client_name = {:n}', { n: c.name });
            const [q, o, f] = await Promise.all([
                pb.collection('quotes').getFullList({ filter, requestKey: 'cdq' }),
                pb.collection('service_orders').getFullList({ filter, requestKey: 'cdo' }),
                pb.collection('finance_entries').getFullList({ filter, requestKey: 'cdf' }),
            ]);
            setQuotes(q);
            setOrders(o);
            setFinance(f);
            try {
                const nFilter = pb.filter('client_id = {:cid}', { cid: c.id });
                const n = await pb.collection('client_notes').getFullList({
                    filter: nFilter, sort: '-created', requestKey: 'cdn',
                });
                setNotes(n);
            } catch (_) { setNotes([]); }
        } catch (err) {
            setError('Cliente não encontrado.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        setError('');
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const ctx = useMemo(
        () => ({ quotes, orders, finance, notes }),
        [quotes, orders, finance, notes],
    );

    const fin = useMemo(() => clientFinancials(client, ctx), [client, ctx]);
    const timeline = useMemo(() => client ? buildClientTimeline(client, ctx) : [], [client, ctx]);
    const last = useMemo(() => client ? lastInteraction(client, ctx) : null, [client, ctx]);
    const activity = useMemo(() => client ? clientActivity(client, ctx) : 'ativo', [client, ctx]);

    const completedOrders = useMemo(() => orders.filter((o) => o.status === 'Concluída'), [orders]);

    const addNote = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;
        setSavingNote(true);
        try {
            const rec = await pb.collection('client_notes').create({
                client_id: client.id,
                text: noteText.trim(),
                kind: noteKind,
                owner: pb.authStore.record?.id,
            }, { requestKey: `note-add-${client.id}-${Date.now()}` });
            setNotes((prev) => [rec, ...prev]);
            setNoteText('');
            setNoteKind('Geral');
            toast({ title: 'Observação registrada' });
        } catch (err) {
            toast({ title: 'Não foi possível salvar a observação', variant: 'destructive' });
        } finally {
            setSavingNote(false);
        }
    };

    const deleteNote = async (noteId) => {
        if (!window.confirm('Excluir esta observação?')) return;
        try {
            await pb.collection('client_notes').delete(noteId);
            setNotes((prev) => prev.filter((n) => n.id !== noteId));
            toast({ title: 'Observação excluída' });
        } catch (err) {
            toast({ title: 'Não foi possível excluir', variant: 'destructive' });
        }
    };

    const startEdit = () => {
        setEditForm({
            name: client.name || '',
            phone: client.phone || '',
            whatsapp: client.whatsapp || '',
            email: client.email || '',
            document: client.document || '',
            address: client.address || '',
            notes: client.notes || '',
        });
        setEditMode(true);
    };

    const saveEdit = async (e) => {
        e.preventDefault();
        if (!editForm.name.trim()) return;
        setSavingEdit(true);
        try {
            const rec = await pb.collection('clients').update(client.id, editForm);
            setClient(rec);
            setEditMode(false);
            // Se o nome mudou, recarrega vínculos para manter histórico consistente.
            if (editForm.name !== client.name) {
                setLoading(true);
                loadAll();
            }
            toast({ title: 'Cliente atualizado' });
        } catch (err) {
            toast({ title: 'Não foi possível salvar', variant: 'destructive' });
        } finally {
            setSavingEdit(false);
        }
    };

    if (loading) return <div className="hf-card h-40 animate-pulse bg-muted/40" />;
    if (error) return <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>;
    if (!client) return null;

    const info = [
        ['Telefone', client.phone], ['WhatsApp', client.whatsapp], ['E-mail', client.email],
        ['CPF/CNPJ', client.document], ['Endereço', client.address],
    ];

    const act = ACTIVITY_LABELS[activity];
    const clienteParam = encodeURIComponent(client.name);

    const shortcuts = [
        { label: 'Novo orçamento', icon: ClipboardList, to: `/app/orcamentos?cliente=${clienteParam}` },
        { label: 'Nova OS', icon: Wrench, to: `/app/ordens?cliente=${clienteParam}` },
        { label: 'Novo lançamento', icon: Wallet, to: `/app/financeiro?cliente=${clienteParam}` },
    ];

    return (
        <div>
            <Helmet>
                <title>{`${client.name} — HubFlow`}</title>
                <meta name="description" content="Ficha do cliente: dados, histórico de orçamentos e OS, valores, última interação, observações e linha do tempo do relacionamento." />
            </Helmet>

            <Link to="/app/clientes" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <ArrowLeft className="h-4 w-4" /> Clientes
            </Link>

            {/* Cabeçalho: nome + situação + ações */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{client.name}</h1>
                        <span className={cn('inline-flex rounded-full border px-3 py-1 text-xs font-semibold', act.tone)}>
                            {act.label}
                        </span>
                    </div>
                    {last ? (
                        <p className="mt-1.5 text-sm text-muted-foreground">
                            Último contato: <span className="font-medium text-foreground">{last.date}</span>
                            {last.reason ? ` • Motivo: ${last.reason}` : ''}
                        </p>
                    ) : (
                        <p className="mt-1.5 text-sm text-muted-foreground">Sem histórico de interação registrado.</p>
                    )}
                </div>
                <button
                    onClick={startEdit}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-semibold transition hover:border-primary/40 hover:text-primary"
                >
                    <Pencil className="h-4 w-4" /> Editar cliente
                </button>
            </div>

            {/* Atalhos de ação */}
            <div className="mt-5 flex flex-wrap gap-3">
                {shortcuts.map((s) => (
                    <Link
                        key={s.label}
                        to={s.to}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98]"
                    >
                        <s.icon className="h-4 w-4" /> {s.label}
                    </Link>
                ))}
            </div>

            {/* Resumo financeiro */}
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Faturado" value={brl(fin.faturado)} icon={TrendingUp} tone="text-primary" />
                <StatCard label="Recebido" value={brl(fin.recebido)} icon={CheckCircle2} tone="text-accent" />
                <StatCard label="Pendente" value={brl(fin.pendente)} icon={Clock} tone="text-destructive" />
                <StatCard label="Serviços realizados" value={fin.servicosRealizados} icon={Wrench} tone="text-foreground" />
            </div>

            <div className="mt-6 grid gap-5 lg:grid-cols-3">
                {/* Coluna esquerda: dados + observações */}
                <div className="grid gap-5 lg:col-span-1">
                    <SafeBlock>
                        <section className="hf-card p-5">
                            <h2 className="font-display text-lg font-bold">Dados cadastrais</h2>
                            <dl className="mt-4 space-y-3 text-sm">
                                {info.map(([k, v]) => (
                                    <div key={k}>
                                        <dt className="text-muted-foreground">{k}</dt>
                                        <dd className="font-medium">{v || '—'}</dd>
                                    </div>
                                ))}
                            </dl>
                            {client.notes && (
                                <p className="mt-4 rounded-xl bg-secondary/60 p-3 text-sm">{client.notes}</p>
                            )}
                        </section>
                    </SafeBlock>

                    <SafeBlock>
                        <section className="hf-card p-5">
                            <h2 className="font-display text-lg font-bold">Observações internas</h2>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Preferências, anotações de atendimento e informações para futuros serviços.
                            </p>
                            <form onSubmit={addNote} className="mt-4 grid gap-3">
                                <select
                                    value={noteKind}
                                    onChange={(e) => setNoteKind(e.target.value)}
                                    className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                                >
                                    {NOTE_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                                <textarea
                                    rows={2}
                                    value={noteText}
                                    onChange={(e) => setNoteText(e.target.value)}
                                    placeholder="Escreva uma observação..."
                                    className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={savingNote || !noteText.trim()}
                                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                                >
                                    <Plus className="h-4 w-4" /> {savingNote ? 'Salvando...' : 'Adicionar observação'}
                                </button>
                            </form>

                            <ul className="mt-4 space-y-3">
                                {notes.length === 0 ? (
                                    <li className="text-sm text-muted-foreground">Nenhuma observação registrada.</li>
                                ) : notes.map((n) => (
                                    <li key={n.id} className="rounded-xl border border-border bg-secondary/30 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                                                {n.kind || 'Geral'}
                                            </span>
                                            <button
                                                onClick={() => deleteNote(n.id)}
                                                className="text-xs text-muted-foreground hover:text-destructive"
                                            >
                                                Excluir
                                            </button>
                                        </div>
                                        <p className="mt-2 text-sm">{n.text}</p>
                                        <p className="mt-1.5 text-[11px] text-muted-foreground">
                                            {n.created ? new Date(n.created).toLocaleDateString('pt-BR') : ''}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    </SafeBlock>
                </div>

                {/* Coluna direita: histórico + timeline */}
                <div className="grid gap-5 lg:col-span-2">
                    <SafeBlock>
                        <section className="hf-card p-5">
                            <h2 className="font-display text-lg font-bold">Orçamentos</h2>
                            {quotes.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhum orçamento para este cliente.</p> : (
                                <ul className="mt-3 divide-y divide-border">
                                    {quotes.map((q) => (
                                        <li key={q.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                            <span className="font-mono text-xs text-muted-foreground">{q.number || '—'}</span>
                                            <span className="font-medium">{q.title || 'Sem título'}</span>
                                            <span className="ml-auto font-semibold">{brl(q.amount)}</span>
                                            <StatusBadge status={q.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </SafeBlock>

                    <SafeBlock>
                        <section className="hf-card p-5">
                            <h2 className="font-display text-lg font-bold">Ordens de Serviço</h2>
                            {orders.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma OS para este cliente.</p> : (
                                <ul className="mt-3 divide-y divide-border">
                                    {orders.map((o) => (
                                        <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                            <span className="font-mono text-xs text-muted-foreground">{o.number || '—'}</span>
                                            <span className="font-medium">{o.service || 'Serviço'}</span>
                                            <span className="ml-auto font-semibold">{brl(o.amount)}</span>
                                            <StatusBadge status={o.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </SafeBlock>

                    <SafeBlock>
                        <section className="hf-card p-5">
                            <h2 className="font-display text-lg font-bold">Serviços realizados</h2>
                            {completedOrders.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">Nenhum serviço concluído ainda.</p>
                            ) : (
                                <ul className="mt-3 divide-y divide-border">
                                    {completedOrders.map((o) => (
                                        <li key={o.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                                            <CheckCircle2 className="h-4 w-4 text-accent" />
                                            <span className="font-medium">{o.service || 'Serviço'}</span>
                                            <span className="text-muted-foreground">{o.date || 'sem data'}</span>
                                            <span className="ml-auto font-semibold">{brl(o.amount)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </SafeBlock>

                    <SafeBlock>
                        <section className="hf-card p-5">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <h2 className="font-display text-lg font-bold">Histórico de relacionamento</h2>
                            </div>
                            {timeline.length === 0 ? (
                                <p className="mt-3 text-sm text-muted-foreground">Sem eventos registrados.</p>
                            ) : (
                                <ol className="mt-4 space-y-4">
                                    {timeline.map((e, i) => (
                                        <li key={e.id} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <span className={cn(
                                                    'mt-1 h-2.5 w-2.5 rounded-full',
                                                    e.type === 'payment' && 'bg-accent',
                                                    e.type === 'order' && 'bg-primary',
                                                    e.type === 'quote' && 'bg-primary/60',
                                                    e.type === 'note' && 'bg-amber-500',
                                                    e.type === 'client' && 'bg-muted-foreground',
                                                )} />
                                                {i < timeline.length - 1 && <span className="mt-1 h-full w-px flex-1 bg-border" />}
                                            </div>
                                            <div className="min-w-0 pb-1">
                                                <p className="text-sm font-semibold">{e.label}</p>
                                                {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
                                                {e.date && (
                                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                                        {new Date(e.date).toLocaleDateString('pt-BR')}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                            )}
                        </section>
                    </SafeBlock>
                </div>
            </div>

            {/* Modal de edição do cliente */}
            {editMode && editForm && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/40 p-4 sm:p-8">
                    <form onSubmit={saveEdit} className="hf-card w-full max-w-xl p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="font-display text-xl font-extrabold">Editar cliente</h2>
                            <button type="button" onClick={() => setEditMode(false)}
                                className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                                ✕
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[
                                ['name', 'Nome', true], ['phone', 'Telefone', false],
                                ['whatsapp', 'WhatsApp', false], ['email', 'E-mail', false],
                                ['document', 'CPF/CNPJ', false], ['address', 'Endereço', false],
                            ].map(([k, label, req]) => (
                                <div key={k} className="grid gap-2">
                                    <label className="text-sm font-semibold">{label}{req ? ' *' : ''}</label>
                                    <input
                                        required={req}
                                        value={editForm[k]}
                                        onChange={(e) => setEditForm({ ...editForm, [k]: e.target.value })}
                                        className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                                    />
                                </div>
                            ))}
                            <div className="grid gap-2 sm:col-span-2">
                                <label className="text-sm font-semibold">Observações</label>
                                <textarea
                                    rows={3}
                                    value={editForm.notes}
                                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                    className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <button type="submit" disabled={savingEdit}
                                className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                                {savingEdit ? 'Salvando...' : 'Salvar alterações'}
                            </button>
                            <button type="button" onClick={() => setEditMode(false)}
                                className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold">Cancelar</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ClientDetailPage;

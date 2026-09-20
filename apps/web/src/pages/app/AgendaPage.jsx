import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link2, MapPin, Navigation, Plus, ChevronLeft, ChevronRight, CalendarDays, Clock, User, X } from 'lucide-react';
import { useCollection } from '@/lib/hubflow';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/CrudPanel';

/* ----------------------------- helpers de data ---------------------------- */

const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DOW = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DOW_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
const todayStr = () => ymd(new Date());

// semana (domingo = 0)
const startOfWeek = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - x.getDay()); return x; };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

const parseTime = (t) => {
    if (!t) return null;
    const m = String(t).match(/^(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return { h: Number(m[1]), m: Number(m[2]), mins: Number(m[1]) * 60 + Number(m[2]) };
};

const mapLinks = (address) => {
    const q = encodeURIComponent(address);
    return {
        view: `https://www.google.com/maps/search/?api=1&query=${q}`,
        route: `https://www.google.com/maps/dir/?api=1&destination=${q}`,
    };
};

const fmtDate = (s) => {
    if (!s) return '—';
    const [y, m, d] = s.split('-');
    if (!y || !m || !d) return s;
    return `${d}/${m}/${y}`;
};

/* ------------------------------- componentes ------------------------------ */

const ViewSwitch = ({ view, setView }) => (
    <div className="inline-flex rounded-xl border border-border bg-card p-1">
        {['month', 'week', 'day'].map((v) => (
            <button key={v} onClick={() => setView(v)}
                className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    view === v ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
                )}>
                {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : 'Dia'}
            </button>
        ))}
    </div>
);

const EventChip = ({ ap, order, onClick, compact }) => {
    const time = ap.time || '--:--';
    const osNum = order?.number;
    return (
        <button
            onClick={() => onClick(ap)}
            className={cn(
                'group flex w-full items-start gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 py-1.5 text-left transition hover:bg-primary/20',
                compact && 'px-1.5 py-1',
            )}
        >
            <span className="mt-0.5 shrink-0 font-mono text-[10px] font-semibold text-primary">{time}</span>
            <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-semibold text-foreground">{ap.title}</span>
                <span className="block truncate text-[10px] text-muted-foreground">
                    {ap.client_name || 'Sem cliente'}{osNum ? ` • OS ${osNum}` : ''}
                </span>
            </span>
        </button>
    );
};

const EventDetail = ({ ap, order, onClose, onEdit, onDelete }) => {
    if (!ap) return null;
    // Endereço: prioriza o endereço atual da OS vinculada (sempre sincronizado).
    const address = ((order?.service_address || '').trim() || (ap.address || '').trim());
    const links = address ? mapLinks(address) : null;
    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" onClick={onClose}>
            <div className="hf-card w-full max-w-md p-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between gap-3 border-b border-border p-5">
                    <div className="min-w-0">
                        <h3 className="font-display text-lg font-extrabold leading-tight">{ap.title}</h3>
                        {order && <p className="mt-0.5 text-xs text-muted-foreground">Vinculado à OS {order.number || '—'}</p>}
                    </div>
                    <button onClick={onClose} aria-label="Fechar"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="grid gap-3 p-5 text-sm">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Cliente:</span>
                        <span className="font-semibold">{ap.client_name || 'Não informado'}</span>
                    </div>
                    {order?.service && (
                        <div className="flex items-center gap-2">
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Serviço:</span>
                            <span className="font-semibold">{order.service}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Data:</span>
                        <span className="font-semibold">{fmtDate(ap.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Horário:</span>
                        <span className="font-semibold">{ap.time || '—'}</span>
                    </div>
                    {order && (
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="h-4 w-4 text-center text-[10px] font-bold text-muted-foreground">#</span>
                            <span className="text-muted-foreground">OS:</span>
                            <span className="font-mono font-semibold">{order.number || '—'}</span>
                            <StatusBadge status={order.status} />
                        </div>
                    )}
                    <div className="border-t border-border pt-3">
                        <div className="mb-2 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-muted-foreground">Endereço do serviço:</span>
                        </div>
                        {address ? (
                            <div className="grid gap-2">
                                <p className="rounded-xl bg-muted px-3 py-2 text-sm">{address}</p>
                                <div className="flex flex-wrap gap-2">
                                    <a href={links.view} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-semibold text-primary transition hover:bg-primary/20">
                                        <MapPin className="h-3.5 w-3.5" /> Ver local
                                    </a>
                                    <a href={links.route} target="_blank" rel="noopener noreferrer"
                                        className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-accent/30 bg-accent/10 px-3 text-xs font-semibold text-accent transition hover:bg-accent/20">
                                        <Navigation className="h-3.5 w-3.5" /> Traçar rota
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="rounded-xl bg-muted px-3 py-2 text-sm text-muted-foreground">Endereço do serviço não informado.</p>
                        )}
                    </div>
                    {ap.notes && (
                        <div className="border-t border-border pt-3">
                            <p className="text-xs text-muted-foreground">Observações</p>
                            <p className="mt-1 text-sm">{ap.notes}</p>
                        </div>
                    )}
                </div>

                {!ap.order_id && (
                    <div className="flex gap-3 border-t border-border p-5">
                        <button onClick={() => onEdit(ap)}
                            className="min-h-[44px] flex-1 rounded-full border border-border px-4 text-sm font-semibold transition hover:border-primary hover:text-primary">
                            Editar
                        </button>
                        <button onClick={() => onDelete(ap)}
                            className="min-h-[44px] flex-1 rounded-full border border-destructive/30 bg-destructive/10 px-4 text-sm font-semibold text-destructive transition hover:bg-destructive/20">
                            Excluir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

/* ------------------------------ visão mensal ------------------------------ */

const MonthView = ({ cursor, appointments, orderMap, onSelect }) => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const start = startOfWeek(first);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byDate = useMemo(() => {
        const map = {};
        appointments.forEach((a) => {
            if (!a.date) return;
            (map[a.date] = map[a.date] || []).push(a);
        });
        // ordena por horário
        Object.values(map).forEach((list) => list.sort((a, b) => (parseTime(a.time)?.mins ?? 9999) - (parseTime(b.time)?.mins ?? 9999)));
        return map;
    }, [appointments]);

    const weeks = [];
    let day = new Date(start);
    for (let w = 0; w < 6; w++) {
        const row = [];
        for (let i = 0; i < 7; i++) { row.push(new Date(day)); day = addDays(day, 1); }
        weeks.push(row);
        // para se já passou do mês (evita linha vazia extra)
        if (day.getMonth() !== month && w >= 3 && row[6].getMonth() !== month) break;
    }

    return (
        <div className="hf-card overflow-hidden p-0">
            <div className="grid grid-cols-7 border-b border-border bg-muted/40">
                {DOW.map((d) => (
                    <div key={d} className="px-2 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {weeks.flat().map((d) => {
                    const inMonth = d.getMonth() === month;
                    const isToday = sameDay(d, today);
                    const key = ymd(d);
                    const events = byDate[key] || [];
                    return (
                        <div key={key} className={cn(
                            'min-h-[92px] border-b border-r border-border p-1.5 sm:min-h-[120px] sm:p-2',
                            !inMonth && 'bg-muted/30',
                        )}>
                            <div className="mb-1 flex justify-end">
                                <span className={cn(
                                    'grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold',
                                    isToday ? 'bg-primary text-primary-foreground' : inMonth ? 'text-foreground' : 'text-muted-foreground/60',
                                )}>{d.getDate()}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                {events.slice(0, 3).map((ap) => (
                                    <EventChip key={ap.id} ap={ap} order={ap.order_id ? orderMap[ap.order_id] : null} onClick={onSelect} compact />
                                ))}
                                {events.length > 3 && (
                                    <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{events.length - 3} mais</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

/* ------------------------------ visão semanal ----------------------------- */

const HOURS = Array.from({ length: 24 }, (_, i) => i);

const WeekView = ({ cursor, appointments, orderMap, onSelect }) => {
    const start = startOfWeek(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const byDate = useMemo(() => {
        const map = {};
        appointments.forEach((a) => {
            if (!a.date) return;
            (map[a.date] = map[a.date] || []).push(a);
        });
        Object.values(map).forEach((list) => list.sort((a, b) => (parseTime(a.time)?.mins ?? 9999) - (parseTime(b.time)?.mins ?? 9999)));
        return map;
    }, [appointments]);

    return (
        <div className="hf-card overflow-x-auto p-0">
            <div className="min-w-[640px]">
                <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/40">
                    <div className="px-1 py-2 text-center text-[10px] font-semibold text-muted-foreground">h</div>
                    {days.map((d) => {
                        const isToday = sameDay(d, today);
                        return (
                            <div key={ymd(d)} className="px-2 py-2 text-center">
                                <div className="text-[10px] font-semibold uppercase text-muted-foreground">{DOW[d.getDay()]}</div>
                                <div className={cn(
                                    'mx-auto mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold',
                                    isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                                )}>{d.getDate()}</div>
                            </div>
                        );
                    })}
                </div>
                <div className="relative grid grid-cols-[56px_repeat(7,1fr)]">
                    {HOURS.map((h) => (
                        <React.Fragment key={h}>
                            <div className="border-b border-r border-border px-1 py-1 text-right text-[10px] text-muted-foreground">{pad(h)}:00</div>
                            {days.map((d) => {
                                const key = ymd(d);
                                const events = (byDate[key] || []).filter((a) => parseTime(a.time)?.h === h);
                                return (
                                    <div key={key + '-' + h} className="min-h-[44px] border-b border-r border-border p-1">
                                        <div className="flex flex-col gap-1">
                                            {events.map((ap) => (
                                                <EventChip key={ap.id} ap={ap} order={ap.order_id ? orderMap[ap.order_id] : null} onClick={onSelect} compact />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

/* ------------------------------- visão diária ----------------------------- */

const DayView = ({ cursor, appointments, orderMap, onSelect }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isToday = sameDay(cursor, today);
    const key = ymd(cursor);
    const events = useMemo(() => {
        const list = (appointments.filter((a) => a.date === key));
        // eventos sem horário ficam no topo
        return list.sort((a, b) => (parseTime(a.time)?.mins ?? 9999) - (parseTime(b.time)?.mins ?? 9999));
    }, [appointments, key]);

    const untimed = events.filter((a) => !parseTime(a.time));
    const timed = events.filter((a) => parseTime(a.time));

    return (
        <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <div className="hf-card max-h-[70vh] overflow-y-auto p-0">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
                    <div>
                        <p className="font-display font-bold">{DOW_FULL[cursor.getDay()]}, {cursor.getDate()} de {MONTHS[cursor.getMonth()]}</p>
                        <p className="text-xs text-muted-foreground">{isToday ? 'Hoje' : fmtDate(key)}</p>
                    </div>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">{events.length} compromisso(s)</span>
                </div>
                {untimed.length > 0 && (
                    <div className="border-b border-border p-3">
                        <p className="mb-2 text-[10px] font-semibold uppercase text-muted-foreground">Sem horário definido</p>
                        <div className="flex flex-col gap-1.5">{untimed.map((ap) => (
                            <EventChip key={ap.id} ap={ap} order={ap.order_id ? orderMap[ap.order_id] : null} onClick={onSelect} />
                        ))}</div>
                    </div>
                )}
                <div className="divide-y divide-border">
                    {HOURS.map((h) => {
                        const hourEvents = timed.filter((a) => parseTime(a.time)?.h === h);
                        return (
                            <div key={h} className="flex gap-3 px-4 py-2">
                                <div className="w-14 shrink-0 pt-1 text-right font-mono text-[11px] text-muted-foreground">{pad(h)}:00</div>
                                <div className="flex flex-1 flex-col gap-1.5">
                                    {hourEvents.map((ap) => (
                                        <EventChip key={ap.id} ap={ap} order={ap.order_id ? orderMap[ap.order_id] : null} onClick={onSelect} />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="hf-card h-fit p-4">
                <p className="mb-2 text-xs font-semibold text-muted-foreground">Resumo do dia</p>
                {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhum compromisto neste dia.</p>
                ) : (
                    <div className="flex flex-col gap-2">
                        {events.map((ap) => {
                            const order = ap.order_id ? orderMap[ap.order_id] : null;
                            return (
                                <button key={ap.id} onClick={() => onSelect(ap)} className="rounded-xl border border-border p-3 text-left transition hover:border-primary/40">
                                    <p className="font-mono text-[11px] font-semibold text-primary">{ap.time || 's/h'}</p>
                                    <p className="truncate text-sm font-semibold">{ap.title}</p>
                                    <p className="truncate text-xs text-muted-foreground">{ap.client_name}{order?.number ? ` • OS ${order.number}` : ''}</p>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

/* ------------------------------ formulário -------------------------------- */

const emptyForm = { title: '', client_name: '', date: '', time: '', notes: '' };

const AppointmentForm = ({ form, setForm, onSave, onCancel, saving }) => (
    <div className="hf-card mb-6 grid gap-4 p-5 sm:grid-cols-2">
        <div className="grid gap-2">
            <label className="text-sm font-semibold">Compromisso</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required
                className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-2">
            <label className="text-sm font-semibold">Cliente</label>
            <input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })}
                className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-2">
            <label className="text-sm font-semibold">Data</label>
            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-2">
            <label className="text-sm font-semibold">Horário</label>
            <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="min-h-[44px] rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="grid gap-2 sm:col-span-2">
            <label className="text-sm font-semibold">Observações</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-3 sm:col-span-2">
            <button onClick={onSave} disabled={saving}
                className="min-h-[44px] rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={onCancel}
                className="min-h-[44px] rounded-full border border-border px-6 text-sm font-semibold">Cancelar</button>
        </div>
    </div>
);

/* --------------------------------- página --------------------------------- */

const AgendaPage = () => {
    const collection = useCollection('appointments', { sort: 'date' });
    const orders = useCollection('service_orders');
    const [view, setView] = useState('month');
    const [cursor, setCursor] = useState(new Date());
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState(null);
    const [saving, setSaving] = useState(false);

    const orderMap = useMemo(() => {
        const map = {};
        orders.items.forEach((o) => { map[o.id] = o; });
        return map;
    }, [orders.items]);

    const periodLabel = useMemo(() => {
        if (view === 'month') return `${MONTHS[cursor.getMonth()]} de ${cursor.getFullYear()}`;
        if (view === 'week') {
            const s = startOfWeek(cursor);
            const e = addDays(s, 6);
            return `${s.getDate()}–${e.getDate()} ${MONTHS[e.getMonth()].slice(0, 3)} ${e.getFullYear()}`;
        }
        return `${DOW_FULL[cursor.getDay()]}, ${cursor.getDate()} de ${MONTHS[cursor.getMonth()]}`;
    }, [view, cursor]);

    const goPrev = () => setCursor((c) => (view === 'month' ? addMonths(c, -1) : view === 'week' ? addDays(c, -7) : addDays(c, -1)));
    const goNext = () => setCursor((c) => (view === 'month' ? addMonths(c, 1) : view === 'week' ? addDays(c, 7) : addDays(c, 1)));
    const goToday = () => setCursor(new Date());

    const save = async () => {
        setSaving(true);
        try {
            const payload = { title: form.title, client_name: form.client_name, date: form.date, time: form.time, notes: form.notes };
            if (form.id) await collection.update(form.id, payload);
            else await collection.create(payload);
            setForm(null);
        } catch (err) {
            window.alert('Não foi possível salvar. Verifique os campos obrigatórios.');
        } finally {
            setSaving(false);
        }
    };

    const editFromDetail = (ap) => {
        setSelected(null);
        setForm({ id: ap.id, title: ap.title, client_name: ap.client_name, date: ap.date, time: ap.time, notes: ap.notes });
    };

    const deleteFromDetail = async (ap) => {
        if (!window.confirm('Excluir este compromisso?')) return;
        try {
            await collection.remove(ap.id);
            setSelected(null);
        } catch (_) {
            window.alert('Não foi possível excluir.');
        }
    };

    const { items, loading, error } = collection;
    const hasItems = items.length > 0;

    return (
        <>
            <Helmet>
                <title>Agenda — HubFlow</title>
                <meta name="description" content="Agenda profissional com visão mensal, semanal e diária. Compromissos vinculados às ordens de serviço, com endereço e rota até o local." />
            </Helmet>

            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Agenda</h1>
                    <p className="mt-1 text-sm text-muted-foreground">Calendário de serviços e compromissos, vinculado às ordens de serviço.</p>
                </div>
                <button onClick={() => setForm({ ...emptyForm })}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition active:scale-[0.98] hover:brightness-110">
                    <Plus className="h-4 w-4" /> Novo compromisso
                </button>
            </div>

            {form && (
                <AppointmentForm form={form} setForm={setForm} onSave={save} onCancel={() => setForm(null)} saving={saving} />
            )}

            {/* Barra de navegação do calendário */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <button onClick={goPrev} aria-label="Período anterior"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:text-primary">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={goNext} aria-label="Próximo período"
                        className="grid h-10 w-10 place-items-center rounded-xl border border-border text-muted-foreground transition hover:text-primary">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                    <button onClick={goToday}
                        className="min-h-[40px] rounded-xl border border-border px-4 text-xs font-semibold transition hover:border-primary hover:text-primary">
                        Hoje
                    </button>
                    <h2 className="ml-1 font-display text-base font-bold sm:text-lg">{periodLabel}</h2>
                </div>
                <ViewSwitch view={view} setView={setView} />
            </div>

            {loading && <div className="hf-card h-40 animate-pulse bg-muted/40" />}
            {error && <p className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive">{error}</p>}

            {!loading && !error && !hasItems && (
                <div className="hf-card p-12 text-center">
                    <CalendarDays className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
                    <p className="text-sm text-muted-foreground">Você ainda não possui serviços agendados.</p>
                    <button onClick={() => setForm({ ...emptyForm })}
                        className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition hover:brightness-110">
                        <Plus className="h-4 w-4" /> Criar compromisso
                    </button>
                </div>
            )}

            {!loading && !error && hasItems && (
                <>
                    {view === 'month' && <MonthView cursor={cursor} appointments={items} orderMap={orderMap} onSelect={setSelected} />}
                    {view === 'week' && <WeekView cursor={cursor} appointments={items} orderMap={orderMap} onSelect={setSelected} />}
                    {view === 'day' && <DayView cursor={cursor} appointments={items} orderMap={orderMap} onSelect={setSelected} />}
                </>
            )}

            {selected && (
                <EventDetail
                    ap={selected}
                    order={selected.order_id ? orderMap[selected.order_id] : null}
                    onClose={() => setSelected(null)}
                    onEdit={editFromDetail}
                    onDelete={deleteFromDetail}
                />
            )}
        </>
    );
};

export default AgendaPage;

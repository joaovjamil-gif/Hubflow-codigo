import { useCallback, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { moveToTrash } from '@/lib/analytics';

export const PRICING = {
    monthly: { label: 'Mensal', price: 59, suffix: '/mês' },
    yearly: { label: 'Anual', price: 468, suffix: '/ano', monthlyEquivalent: 39 },
};

export const QUOTE_STATUS = ['Rascunho', 'Enviado', 'Aguardando resposta', 'Aprovado', 'Recusado'];
export const OS_STATUS = ['Aberta', 'Agendada', 'Em andamento', 'Concluída', 'Cancelada'];
export const FINANCE_STATUS = ['Pendente', 'Pago', 'Vencido', 'Cancelado'];
// Opções selecionáveis manualmente no formulário ("Vencido" é automático).
export const FINANCE_STATUS_OPTIONS = ['Pendente', 'Pago', 'Cancelado'];

// Data local no formato YYYY-MM-DD (usada para comparar vencimentos).
export const todayStr = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
};

// Estado efetivo de um lançamento financeiro.
// Uma conta "Pendente" cujo vencimento já passou é considerada "Vencido"
// automaticamente. "Vencido" nunca é "Recebido/Pago".
export const effectiveFinanceStatus = (entry, today = todayStr()) => {
    const status = entry?.status;
    if (status === 'Pago') return 'Pago';
    if (status === 'Cancelado') return 'Cancelado';
    if (status === 'Pendente' || status === 'Vencido') {
        if (entry?.due_date && String(entry.due_date) < today) return 'Vencido';
        return 'Pendente';
    }
    return status || 'Pendente';
};

export const brl = (value) =>
    (Number(value) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const statusTone = (status) => {
    switch (status) {
        case 'Aprovado':
        case 'Concluída':
        case 'Pago':
            return 'bg-accent/10 text-accent border-accent/30';
        case 'Recusado':
        case 'Cancelada':
        case 'Atrasado':
        case 'Vencido':
        case 'Cancelado':
            return 'bg-destructive/10 text-destructive border-destructive/30';
        case 'Em andamento':
        case 'Enviado':
        case 'Agendada':
            return 'bg-primary/10 text-primary border-primary/30';
        default:
            return 'bg-muted text-muted-foreground border-border';
    }
};

export const useCollection = (name, options = {}) => {
    const { sort = '-created' } = options;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingId, setRemovingId] = useState(null);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            const records = await pb.collection(name).getFullList({ sort });
            setItems(records);
            setError(null);
        } catch (err) {
            if (err?.status !== 0) setError(err?.message || 'Erro ao carregar dados');
        } finally {
            setLoading(false);
        }
    }, [name, sort]);

    useEffect(() => {
        load();
    }, [load]);

    const create = async (data) => {
        const rec = await pb.collection(name).create({ ...data, owner: pb.authStore.record?.id });
        setItems((prev) => [rec, ...prev]);
        return rec;
    };

    const update = async (id, data) => {
        const rec = await pb.collection(name).update(id, data);
        setItems((prev) => prev.map((i) => (i.id === id ? rec : i)));
        return rec;
    };

    const remove = async (id) => {
        // Block concurrent deletes (e.g. double-click) — only one in flight.
        if (removingId) return;
        setRemovingId(id);
        try {
            // Copia para a lixeira antes de excluir (best-effort).
            const record = items.find((i) => i.id === id);
            if (record) {
                try { await moveToTrash(name, record); } catch (_) { /* não bloqueia */ }
            }
            try {
                await pb.collection(name).delete(id);
            } catch (err) {
                // 404 = record already gone on the server;
                // status 0 = auto-cancelled by a duplicate click.
                // Both are safe — fall through and sync local state.
                if (err?.status !== 404 && err?.status !== 0) throw err;
            }
            setItems((prev) => prev.filter((i) => i.id !== id));
        } finally {
            setRemovingId(null);
        }
    };

    return { items, loading, error, reload: load, create, update, remove, removingId };
};

export const DEMO = {
    metrics: { receivable: 1240, pendingQuotes: 2, todayServices: 3, latePayments: 1 },
    agenda: [
        { time: '09:00', title: 'Instalação elétrica', client: 'Padaria Pão Novo' },
        { time: '13:30', title: 'Manutenção preventiva', client: 'Studio Bela Face' },
        { time: '16:00', title: 'Visita técnica', client: 'Marcenaria Cedro' },
    ],
    quotes: [
        { number: 'ORC-018', client: 'Padaria Pão Novo', amount: 780, status: 'Aguardando resposta' },
        { number: 'ORC-017', client: 'Studio Bela Face', amount: 460, status: 'Enviado' },
        { number: 'ORC-016', client: 'Marcenaria Cedro', amount: 1290, status: 'Aprovado' },
    ],
    orders: [
        { number: 'OS-042', client: 'Marcenaria Cedro', service: 'Troca de quadro', status: 'Em andamento' },
        { number: 'OS-041', client: 'Padaria Pão Novo', service: 'Instalação elétrica', status: 'Agendada' },
        { number: 'OS-040', client: 'Studio Bela Face', service: 'Manutenção', status: 'Concluída' },
    ],
    activities: [
        'Orçamento ORC-018 enviado para Padaria Pão Novo',
        'OS-041 agendada para amanhã às 09:00',
        'Pagamento de R$ 320,00 registrado (Studio Bela Face)',
        'Novo cliente cadastrado: Marcenaria Cedro',
    ],
};

/* =========================================================================
   ETAPA 3 — Automação do fluxo principal
   Cliente → Orçamento → Aprovação → OS → Agendamento → Conclusão → Financeiro
   ========================================================================= */

const ownerId = () => pb.authStore.record?.id;

// 1. ORÇAMENTO APROVADO → gerar OS vinculada
export const generateOrderFromQuote = async (quote) => {
    const existing = await pb.collection('service_orders').getFullList({
        filter: pb.filter('quote_id = {:qid}', { qid: quote.id }),
    });
    if (existing.length > 0) return existing[0]; // não duplicar

    // Repassa os itens do orçamento para a OS como "previsto".
    // O prestador registra depois o que foi "realmente utilizado".
    const quoteItems = quote.items
        ? (Array.isArray(quote.items) ? quote.items : (() => { try { return JSON.parse(quote.items); } catch (_) { return []; } })())
        : [];

    const rec = await pb.collection('service_orders').create({
        number: '',
        client_name: quote.client_name || '',
        service: quote.title || '',
        description: quote.description || '',
        amount: Number(quote.amount) || 0,
        date: '',
        time: '',
        assignee: '',
        notes: '',
        status: 'Aberta',
        quote_id: quote.id,
        items: quoteItems,
        used_items: [],
        owner: ownerId(),
    });
    return rec;
};

// 2. OS com data/horário → criar ou atualizar agendamento vinculado
export const syncAppointmentFromOrder = async (order) => {
    const existing = await pb.collection('appointments').getFullList({
        filter: pb.filter('order_id = {:oid}', { oid: order.id }),
    });

    const payload = {
        title: order.service || `OS ${order.number || ''}`.trim() || 'Serviço',
        client_name: order.client_name || '',
        date: order.date || '',
        time: order.time || '',
        notes: order.notes || '',
        address: order.service_address || '',
        order_id: order.id,
        owner: ownerId(),
    };

    if (existing.length > 0) {
        return pb.collection('appointments').update(existing[0].id, payload);
    }
    return pb.collection('appointments').create(payload);
};

// Verifica se já existe agendamento vinculado à OS
export const findAppointmentByOrder = async (orderId) => {
    const list = await pb.collection('appointments').getFullList({
        filter: pb.filter('order_id = {:oid}', { oid: orderId }),
    });
    return list[0] || null;
};

// 3. OS concluída → gerar conta a receber vinculada (não registra como recebido)
export const generateReceivableFromOrder = async (order) => {
    const existing = await pb.collection('finance_entries').getFullList({
        filter: pb.filter('order_id = {:oid}', { oid: order.id }),
    });
    if (existing.length > 0) return existing[0]; // não duplicar

    const rec = await pb.collection('finance_entries').create({
        description: `Recebimento OS ${order.number || ''} — ${order.service || order.client_name || ''}`.trim(),
        client_name: order.client_name || '',
        amount: Number(order.amount) || 0,
        due_date: order.date || todayStr(),
        kind: 'receber',
        status: 'Pendente',
        order_id: order.id,
        owner: ownerId(),
    });
    return rec;
};

// Verifica se já existe lançamento financeiro vinculado à OS
export const findFinanceByOrder = async (orderId) => {
    const list = await pb.collection('finance_entries').getFullList({
        filter: pb.filter('order_id = {:oid}', { oid: orderId }),
    });
    return list[0] || null;
};

// Verifica se já existe OS vinculada ao orçamento
export const findOrderByQuote = async (quoteId) => {
    const list = await pb.collection('service_orders').getFullList({
        filter: pb.filter('quote_id = {:qid}', { qid: quoteId }),
    });
    return list[0] || null;
};

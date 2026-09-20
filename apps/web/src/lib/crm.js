import { effectiveFinanceStatus, todayStr } from '@/lib/hubflow';
import { toDateStr } from '@/lib/analytics';

/* =========================================================================
   ETAPA 8 — CRM: Relacionamento com Clientes e Produtividade
   Cálculos derivados dos dados reais (clientes, orçamentos, OS, financeiro,
   notas). Nada é inventado; quando não há histórico, retorna vazio.
   ========================================================================= */

// Data local YYYY-MM-DD
const ymd = (d) => {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
};

const asDate = (v) => {
    if (!v) return '';
    const s = toDateStr(v);
    return s;
};

// Reúne todos os eventos de relacionamento de um cliente em uma linha do tempo.
// Cada evento: { id, date, label, type, detail }
// type: 'client' | 'quote' | 'order' | 'payment' | 'note'
export const buildClientTimeline = (client, ctx) => {
    const { quotes = [], orders = [], finance = [], notes = [] } = ctx || {};
    const name = client?.name || '';
    const events = [];

    // Cadastro do cliente
    events.push({
        id: `client-${client.id}`,
        date: asDate(client.created) || '',
        label: 'Cliente cadastrado',
        type: 'client',
        detail: name,
    });

    // Orçamentos
    quotes.forEach((q) => {
        events.push({
            id: `quote-${q.id}`,
            date: asDate(q.date || q.created) || '',
            label: `Orçamento ${q.number || ''} criado`.trim(),
            type: 'quote',
            detail: `${q.title || ''}${q.status ? ` • ${q.status}` : ''}`.trim(),
        });
        if (q.status === 'Aprovado') {
            events.push({
                id: `quote-ap-${q.id}`,
                date: asDate(q.updated || q.date || q.created) || '',
                label: `Orçamento ${q.number || ''} aprovado`.trim(),
                type: 'quote',
                detail: q.title || '',
            });
        }
    });

    // Ordens de serviço
    orders.forEach((o) => {
        events.push({
            id: `order-${o.id}`,
            date: asDate(o.date || o.created) || '',
            label: `OS ${o.number || ''} criada`.trim(),
            type: 'order',
            detail: `${o.service || ''}${o.status ? ` • ${o.status}` : ''}`.trim(),
        });
        if (o.status === 'Concluída') {
            events.push({
                id: `order-done-${o.id}`,
                date: asDate(o.updated || o.date || o.created) || '',
                label: `Serviço concluído (OS ${o.number || ''})`.trim(),
                type: 'order',
                detail: o.service || '',
            });
        }
    });

    // Pagamentos recebidos (finance kind=receber, status Pago, vinculado ao cliente)
    finance.forEach((f) => {
        if (f.kind === 'receber' && f.status === 'Pago') {
            events.push({
                id: `pay-${f.id}`,
                date: asDate(f.payment_date || f.updated || f.created) || '',
                label: 'Pagamento recebido',
                type: 'payment',
                detail: `${f.description || ''}`.trim(),
            });
        }
    });

    // Observações internas
    notes.forEach((n) => {
        events.push({
            id: `note-${n.id}`,
            date: asDate(n.created) || '',
            label: 'Observação registrada',
            type: 'note',
            detail: (n.text || '').slice(0, 80),
        });
    });

    // Ordena do mais recente ao mais antigo; sem data vai para o fim.
    return events
        .filter((e) => e.label)
        .sort((a, b) => {
            const da = a.date || '';
            const db = b.date || '';
            if (!da && !db) return 0;
            if (!da) return 1;
            if (!db) return -1;
            return db.localeCompare(da);
        });
};

// Resumo financeiro do cliente a partir dos dados reais.
// faturado = soma de OS concluídas + orçamentos aprovados (não duplica: usa OS quando houver)
// recebido = soma de finance_entries (receber, Pago) do cliente
// pendente = soma de finance_entries (receber, Pendente/Vencido) do cliente
export const clientFinancials = (client, ctx) => {
    const { quotes = [], orders = [], finance = [] } = ctx || {};
    const today = todayStr();

    const clientQuotes = quotes;
    const clientOrders = orders;
    const clientFinance = finance;

    // Faturado: prioriza OS (valor da OS); se não há OS, usa orçamentos aprovados.
    const ordersTotal = clientOrders.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const approvedQuotesTotal = clientQuotes
        .filter((q) => q.status === 'Aprovado')
        .reduce((s, q) => s + (Number(q.amount) || 0), 0);
    const faturado = clientOrders.length > 0 ? ordersTotal : approvedQuotesTotal;

    const servicosRealizados = clientOrders.filter((o) => o.status === 'Concluída').length;

    const recebido = clientFinance
        .filter((f) => f.kind === 'receber' && f.status === 'Pago')
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);

    const pendente = clientFinance
        .filter((f) => {
            const s = effectiveFinanceStatus(f, today);
            return f.kind === 'receber' && (s === 'Pendente' || s === 'Vencido');
        })
        .reduce((s, f) => s + (Number(f.amount) || 0), 0);

    return { faturado, recebido, pendente, servicosRealizados };
};

// Última interação relevante com o cliente.
// Retorna { date, reason } ou null quando não há histórico.
export const lastInteraction = (client, ctx) => {
    const timeline = buildClientTimeline(client, ctx);
    // Ignora o evento "Cliente cadastrado" para o motivo, mas usa sua data como fallback.
    const meaningful = timeline.filter((e) => e.type !== 'client');
    if (meaningful.length === 0) {
        // Sem histórico além do cadastro.
        const created = asDate(client?.created);
        if (created) return { date: created, reason: 'cadastro' };
        return null;
    }
    const latest = meaningful[0];
    const reasonMap = {
        quote: 'orçamento',
        order: 'serviço',
        payment: 'pagamento',
        note: 'atendimento',
    };
    return { date: latest.date, reason: reasonMap[latest.type] || 'atendimento' };
};

// Classificação de atividade do cliente.
// 'novo'    = cadastrado nos últimos 30 dias
// 'ativo'   = possui evento (orçamento/OS/pagamento) nos últimos 90 dias
// 'inativo' = sem movimentação nos últimos 90 dias
export const clientActivity = (client, ctx) => {
    const today = new Date();
    const created = asDate(client?.created);
    const daysSinceCreated = created
        ? Math.floor((today - new Date(created)) / 86400000)
        : null;

    if (daysSinceCreated !== null && daysSinceCreated <= 30) {
        // Novo: mas se já tem movimentação recente, conta como ativo.
        const tl = buildClientTimeline(client, ctx).filter((e) => e.type !== 'client');
        const hasRecent = tl.some((e) => {
            if (!e.date) return false;
            const days = Math.floor((today - new Date(e.date)) / 86400000);
            return days <= 90;
        });
        if (hasRecent) return 'ativo';
        return 'novo';
    }

    const timeline = buildClientTimeline(client, ctx).filter((e) => e.type !== 'client');
    const hasRecent = timeline.some((e) => {
        if (!e.date) return false;
        const days = Math.floor((today - new Date(e.date)) / 86400000);
        return days <= 90;
    });
    return hasRecent ? 'ativo' : 'inativo';
};

export const ACTIVITY_LABELS = {
    ativo: { label: 'Ativo', tone: 'bg-accent/10 text-accent border-accent/30' },
    inativo: { label: 'Sem movimentação', tone: 'bg-muted text-muted-foreground border-border' },
    novo: { label: 'Novo cliente', tone: 'bg-primary/10 text-primary border-primary/30' },
};

// --- Produtividade (visão da operação) -----------------------------------
// Calcula indicadores a partir dos dados reais dos módulos existentes.
export const productivityMetrics = (data) => {
    const { quotes = [], orders = [], clients = [], finance = [] } = data || {};
    const today = todayStr();

    const servicosPendentes = orders.filter(
        (o) => o.status === 'Aberta' || o.status === 'Agendada',
    ).length;
    const osEmAndamento = orders.filter((o) => o.status === 'Em andamento').length;
    const osConcluidas = orders.filter((o) => o.status === 'Concluída').length;
    const orcamentosPendentes = quotes.filter(
        (q) => q.status === 'Rascunho' || q.status === 'Enviado' || q.status === 'Aguardando resposta',
    ).length;
    const orcamentosAprovados = quotes.filter((q) => q.status === 'Aprovado').length;

    // Clientes novos nos últimos 30 dias.
    const now = new Date();
    const clientesNovos = clients.filter((c) => {
        const d = asDate(c.created);
        if (!d) return false;
        const days = Math.floor((now - new Date(d)) / 86400000);
        return days <= 30;
    }).length;

    const pagamentosPendentes = finance.filter((f) => {
        const s = effectiveFinanceStatus(f, today);
        return f.kind === 'receber' && (s === 'Pendente' || s === 'Vencido');
    }).length;

    return {
        servicosPendentes,
        osEmAndamento,
        osConcluidas,
        orcamentosPendentes,
        orcamentosAprovados,
        clientesNovos,
        pagamentosPendentes,
    };
};

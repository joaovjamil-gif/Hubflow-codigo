import pb from '@/lib/pocketbaseClient';
import { effectiveFinanceStatus, todayStr } from '@/lib/hubflow';

/* =========================================================================
   ETAPA 7 — Financeiro Avançado e Dashboard Analítico
   Períodos, categorias, metas, lixeira e séries para gráficos.
   ========================================================================= */

// --- Categorias financeiras ----------------------------------------------

export const REVENUE_CATEGORIES = [
    'Serviços',
    'Produtos',
    'Outros recebimentos',
];

export const EXPENSE_CATEGORIES = [
    'Fornecedores',
    'Funcionários',
    'Aluguel',
    'Materiais',
    'Equipamentos',
    'Ferramentas',
    'Marketing',
    'Outros',
];

export const categoriesFor = (kind) =>
    kind === 'pagar' ? EXPENSE_CATEGORIES : REVENUE_CATEGORIES;

// --- Datas ----------------------------------------------------------------

const ymd = (d) => {
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
};
const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
};
const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
};
const startOfWeek = (d) => {
    const x = startOfDay(d);
    const day = x.getDay(); // 0 dom .. 6 sáb
    x.setDate(x.getDate() - day); // semana começa no domingo
    return x;
};
const startOfMonth = (d) => {
    const x = startOfDay(d);
    x.setDate(1);
    return x;
};
const startOfQuarter = (d) => {
    const x = startOfMonth(d);
    const q = Math.floor(x.getMonth() / 3);
    x.setMonth(q * 3);
    return x;
};
const startOfYear = (d) => {
    const x = startOfDay(d);
    x.setMonth(0, 1);
    return x;
};

// Normaliza qualquer valor de data para 'YYYY-MM-DD' (ou '').
export const toDateStr = (v) => {
    if (!v) return '';
    const s = String(v);
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return '';
    return ymd(d);
};

// --- Opções de período ----------------------------------------------------

export const PERIOD_OPTIONS = [
    { value: 'today', label: 'Hoje' },
    { value: 'this_week', label: 'Esta semana' },
    { value: 'this_month', label: 'Este mês' },
    { value: 'last_month', label: 'Mês anterior' },
    { value: 'this_quarter', label: 'Este trimestre' },
    { value: 'this_year', label: 'Este ano' },
    { value: 'last_7', label: 'Últimos 7 dias' },
    { value: 'last_30', label: 'Últimos 30 dias' },
    { value: 'last_90', label: 'Últimos 90 dias' },
    { value: 'last_12m', label: 'Últimos 12 meses' },
    { value: 'last_5y', label: 'Últimos 5 anos' },
    { value: 'last_10y', label: 'Últimos 10 anos' },
    { value: 'last_30y', label: 'Últimos 30 anos' },
    { value: 'custom', label: 'Período personalizado' },
];

// Retorna { start, end, prevStart, prevEnd, label } em 'YYYY-MM-DD'.
// start/end = período atual; prev* = período anterior equivalente.
export const periodRange = (option, customStart = '', customEnd = '') => {
    const now = new Date();
    const today = ymd(now);

    const mk = (s, e) => ({ start: ymd(s), end: ymd(e) });
    const prevFrom = (cur, days) => mk(addDays(cur, -days), addDays(cur, -1));

    let cur, prev, label;

    switch (option) {
        case 'today':
            cur = mk(now, now);
            prev = mk(addDays(now, -1), addDays(now, -1));
            label = 'Hoje';
            break;
        case 'this_week': {
            const s = startOfWeek(now);
            cur = mk(s, addDays(s, 6));
            prev = mk(addDays(s, -7), addDays(s, -1));
            label = 'Esta semana';
            break;
        }
        case 'this_month': {
            const s = startOfMonth(now);
            const e = addDays(addDays(startOfMonth(addDays(now, 32)), -1), 0);
            cur = mk(s, new Date(now.getFullYear(), now.getMonth() + 1, 0));
            const ps = startOfMonth(addDays(s, -1));
            prev = mk(ps, addDays(s, -1));
            label = 'Este mês';
            break;
        }
        case 'last_month': {
            const s = startOfMonth(addDays(startOfMonth(now), -1));
            const e = addDays(startOfMonth(now), -1);
            cur = mk(s, e);
            const ps = startOfMonth(addDays(s, -1));
            prev = mk(ps, addDays(s, -1));
            label = 'Mês anterior';
            break;
        }
        case 'this_quarter': {
            const s = startOfQuarter(now);
            cur = mk(s, addDays(addDays(startOfQuarter(addDays(now, 95)), -1), 0));
            const ps = startOfQuarter(addDays(s, -1));
            prev = mk(ps, addDays(s, -1));
            label = 'Este trimestre';
            break;
        }
        case 'this_year': {
            const s = startOfYear(now);
            cur = mk(s, now);
            const ps = startOfYear(addDays(s, -1));
            prev = mk(ps, addDays(s, -1));
            label = 'Este ano';
            break;
        }
        case 'last_7':
            cur = mk(addDays(now, -6), now);
            prev = mk(addDays(now, -13), addDays(now, -7));
            label = 'Últimos 7 dias';
            break;
        case 'last_30':
            cur = mk(addDays(now, -29), now);
            prev = mk(addDays(now, -59), addDays(now, -30));
            label = 'Últimos 30 dias';
            break;
        case 'last_90':
            cur = mk(addDays(now, -89), now);
            prev = mk(addDays(now, -179), addDays(now, -90));
            label = 'Últimos 90 dias';
            break;
        case 'last_12m':
            cur = mk(addDays(now, -364), now);
            prev = mk(addDays(now, -729), addDays(now, -365));
            label = 'Últimos 12 meses';
            break;
        case 'last_5y':
            cur = mk(addDays(now, -1825), now);
            prev = mk(addDays(now, -3650), addDays(now, -1826));
            label = 'Últimos 5 anos';
            break;
        case 'last_10y':
            cur = mk(addDays(now, -3652), now);
            prev = mk(addDays(now, -7305), addDays(now, -3653));
            label = 'Últimos 10 anos';
            break;
        case 'last_30y':
            cur = mk(addDays(now, -10957), now);
            prev = mk(addDays(now, -21914), addDays(now, -10958));
            label = 'Últimos 30 anos';
            break;
        case 'custom': {
            const s = customStart || today;
            const e = customEnd || today;
            const days = Math.max(
                1,
                Math.round(
                    (new Date(e) - new Date(s)) / 86400000,
                ) + 1,
            );
            cur = mk(s, e);
            prev = mk(addDays(new Date(s), -days), addDays(new Date(s), -1));
            label = `${s} a ${e}`;
            break;
        }
        default: {
            const s = startOfMonth(now);
            cur = mk(s, now);
            prev = mk(addDays(s, -1), addDays(s, -1));
            label = 'Este mês';
        }
    }

    return { ...cur, ...prev, label };
};

// Verifica se uma data (YYYY-MM-DD) está dentro de [start, end].
export const inPeriod = (dateStr, start, end) => {
    const d = toDateStr(dateStr);
    if (!d) return false;
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
};

// --- Data efetiva de um lançamento para fins de período -------------------
// Receita/Despesa realizada usa payment_date; fallback para due_date; depois created.
export const effectiveDate = (entry) => {
    if (entry.status === 'Pago' && entry.payment_date) return toDateStr(entry.payment_date);
    if (entry.due_date) return toDateStr(entry.due_date);
    return toDateStr(entry.created);
};

// --- Métricas financeiras de um período -----------------------------------
export const financeMetrics = (entries, range) => {
    const { start, end, prevStart, prevEnd } = range;
    const today = todayStr();

    const periodEntries = entries.filter((e) => inPeriod(effectiveDate(e), start, end));
    const prevEntries = entries.filter((e) => inPeriod(effectiveDate(e), prevStart, prevEnd));

    const sum = (list, pred) => list.filter(pred).reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // Realizado no período (status Pago).
    const receita = sum(periodEntries, (e) => e.kind === 'receber' && e.status === 'Pago');
    const despesa = sum(periodEntries, (e) => e.kind === 'pagar' && e.status === 'Pago');
    const resultado = receita - despesa;

    const prevReceita = sum(prevEntries, (e) => e.kind === 'receber' && e.status === 'Pago');
    const prevDespesa = sum(prevEntries, (e) => e.kind === 'pagar' && e.status === 'Pago');
    const prevResultado = prevReceita - prevDespesa;

    // Em aberto (snapshot atual — Pendente/Vencido), independente de período.
    const open = (e) => {
        const s = effectiveFinanceStatus(e, today);
        return s === 'Pendente' || s === 'Vencido';
    };
    const toReceive = sum(entries, (e) => e.kind === 'receber' && open(e));
    const toPay = sum(entries, (e) => e.kind === 'pagar' && open(e));
    const received = sum(entries, (e) => e.kind === 'receber' && e.status === 'Pago');
    const paid = sum(entries, (e) => e.kind === 'pagar' && e.status === 'Pago');
    const overdue = sum(entries, (e) => effectiveFinanceStatus(e, today) === 'Vencido');

    // Saldo financeiro do período = receita - despesa (realizado).
    const saldo = resultado;

    return {
        receita, despesa, resultado, saldo,
        prevReceita, prevDespesa, prevResultado,
        toReceive, toPay, received, paid, overdue,
    };
};

// --- Métricas operacionais de um período ---------------------------------
export const operationalMetrics = (clients, quotes, orders, range) => {
    const { start, end, prevStart, prevEnd } = range;
    const inP = (r, a, b) => inPeriod(r.created, a, b);

    const clientsCount = clients.filter((r) => inP(r, start, end)).length;
    const quotesCount = quotes.filter((r) => inP(r, start, end)).length;
    const osDone = orders.filter(
        (r) => r.status === 'Concluída' && inP(r, start, end),
    ).length;

    const prevClients = clients.filter((r) => inP(r, prevStart, prevEnd)).length;
    const prevQuotes = quotes.filter((r) => inP(r, prevStart, prevEnd)).length;
    const prevOsDone = orders.filter(
        (r) => r.status === 'Concluída' && inP(r, prevStart, prevEnd),
    ).length;

    return { clientsCount, quotesCount, osDone, prevClients, prevQuotes, prevOsDone };
};

// --- Séries para gráficos -------------------------------------------------
// Agrupa por mês (períodos longos) ou por dia (períodos curtos), com teto de buckets.
export const buildSeries = (entries, range) => {
    const { start, end } = range;
    if (!start || !end) return [];

    const s = new Date(start);
    const e = new Date(end);
    const days = Math.round((e - s) / 86400000) + 1;

    let bucketKey; // fn(date) -> key string
    let bucketLabel; // fn(key) -> label
    let step; // fn(date, n) -> next date
    let n = 0;
    const buckets = [];

    if (days > 120) {
        // Agrupar por mês (ou ano, se período muito longo).
        const byYear = days > 365 * 2;
        bucketKey = (d) =>
            byYear
                ? `${d.getFullYear()}`
                : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        bucketLabel = (k) => {
            if (byYear) return k;
            const [yy, mm] = k.split('-');
            const names = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
            return `${names[Number(mm) - 1] || mm}/${yy.slice(2)}`;
        };
        step = (d) => {
            const x = new Date(d);
            if (byYear) x.setFullYear(x.getFullYear() + 1);
            else x.setMonth(x.getMonth() + 1);
            return x;
        };
    } else {
        // Agrupar por dia.
        bucketKey = (d) => ymd(d);
        bucketLabel = (k) => k.slice(8) + '/' + k.slice(5, 7);
        step = (d) => addDays(d, 1);
    }

    let cursor = new Date(s);
    // teto de segurança para não gerar série infinita
    let guard = 0;
    while (cursor <= e && guard < 600) {
        const key = bucketKey(cursor);
        buckets.push({ key, label: bucketLabel(key), receita: 0, despesa: 0, resultado: 0 });
        cursor = step(cursor);
        n += 1;
        guard += 1;
    }

    const index = new Map(buckets.map((b, i) => [b.key, i]));
    entries.forEach((e) => {
        if (e.status !== 'Pago') return;
        const d = effectiveDate(e);
        if (!inPeriod(d, start, end)) return;
        // chave do bucket da data
        const dd = new Date(d);
        const key = bucketKey(dd);
        const i = index.get(key);
        if (i === undefined) return;
        if (e.kind === 'receber') buckets[i].receita += Number(e.amount) || 0;
        else if (e.kind === 'pagar') buckets[i].despesa += Number(e.amount) || 0;
    });
    buckets.forEach((b) => (b.resultado = b.receita - b.despesa));
    return buckets;
};

// --- Variação percentual --------------------------------------------------
export const deltaPct = (curr, prev) => {
    if (!prev || prev === 0) return curr === 0 ? 0 : null; // null = sem base
    return ((curr - prev) / Math.abs(prev)) * 100;
};

// --- Metas ----------------------------------------------------------------
export const GOAL_TYPES = [
    { value: 'faturamento', label: 'Faturamento', unit: 'brl' },
    { value: 'novos_clientes', label: 'Novos clientes', unit: 'count' },
    { value: 'orcamentos', label: 'Orçamentos', unit: 'count' },
    { value: 'servicos_concluidos', label: 'Serviços concluídos', unit: 'count' },
];

export const GOAL_PERIOD_TYPES = [
    { value: 'mensal', label: 'Mensal' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'anual', label: 'Anual' },
];

// Referência do período atual para uma meta (ex.: "2026-08", "2026-T3", "2026").
export const currentPeriodRef = (periodType) => {
    const d = new Date();
    if (periodType === 'anual') return String(d.getFullYear());
    if (periodType === 'trimestral') {
        const q = Math.floor(d.getMonth() / 3) + 1;
        return `${d.getFullYear()}-T${q}`;
    }
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

// Calcula o realizado de uma meta com base nos dados reais.
export const goalProgress = (goal, ctx) => {
    const { receita, clientsCount, quotesCount, osDone } = ctx;
    switch (goal.type) {
        case 'faturamento':
            return receita;
        case 'novos_clientes':
            return clientsCount;
        case 'orcamentos':
            return quotesCount;
        case 'servicos_concluidos':
            return osDone;
        default:
            return 0;
    }
};

export const goalUnit = (type) =>
    GOAL_TYPES.find((g) => g.value === type)?.unit || 'count';

// --- Lixeira --------------------------------------------------------------

// Copia um registro para a lixeira antes da exclusão definitiva.
// Retorna true se copiou com sucesso (a exclusão real pode prosseguir).
export const moveToTrash = async (collectionName, record) => {
    try {
        const owner = pb.authStore.record?.id;
        // Resumo amigável para listagem.
        const summary =
            record.name || record.title || record.description || record.client_name || record.number || '';
        const data = { ...record };
        // remove campos de sistema que não fazem sentido restaurar
        delete data.collectionId;
        delete data.collectionName;

        await pb.collection('trash').create(
            {
                collection_name: collectionName,
                record_id: record.id,
                summary: String(summary).slice(0, 300),
                data: JSON.stringify(data),
                owner,
            },
            { requestKey: `trash-${collectionName}-${record.id}-${Date.now()}` },
        );
        return true;
    } catch (err) {
        // Se a lixeira não existir ou falhar, não bloqueamos a exclusão.
        console.warn('moveToTrash falhou (continuando exclusão direta):', err?.message);
        return false;
    }
};

// Restaura um registro da lixeira: recria na coleção original e remove o item da lixeira.
export const restoreFromTrash = async (trashItem) => {
    const owner = pb.authStore.record?.id;
    let parsed = {};
    try {
        parsed = typeof trashItem.data === 'string' ? JSON.parse(trashItem.data) : (trashItem.data || {});
    } catch (_) {
        parsed = {};
    }
    // Limpa campos de sistema/identidade para recriar como novo registro.
    const payload = { ...parsed };
    delete payload.id;
    delete payload.created;
    delete payload.updated;
    delete payload.tokenKey;
    payload.owner = owner;

    const rec = await pb.collection(trashItem.collection_name).create(payload, {
        requestKey: `restore-${trashItem.id}-${Date.now()}`,
    });
    await pb.collection('trash').delete(trashItem.id);
    return rec;
};

// Exclusão definitiva: remove apenas o item da lixeira.
export const permanentDelete = async (trashItem) => {
    await pb.collection('trash').delete(trashItem.id);
};

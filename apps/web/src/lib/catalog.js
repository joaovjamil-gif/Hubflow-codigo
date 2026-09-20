import pb from '@/lib/pocketbaseClient';

/* =========================================================================
   ETAPA 5 — Catálogo inteligente: serviços, produtos, fornecedores,
   equipamentos, EPIs, ferramentas e modelos de serviço.
   Estrutura de line-items compartilhada entre orçamentos, modelos e OS.
   ========================================================================= */

// Tipos de item do catálogo.
export const ITEM_KINDS = {
    service: { label: 'Serviço', collection: 'services', tone: 'text-primary' },
    product: { label: 'Material / Produto', collection: 'products', tone: 'text-accent' },
    equipment: { label: 'Equipamento', collection: 'equipment', tone: 'text-foreground' },
    epi: { label: 'EPI', collection: 'products', tone: 'text-foreground' },
    tool: { label: 'Ferramenta', collection: 'tools', tone: 'text-foreground' },
};

export const kindLabel = (k) => ITEM_KINDS[k]?.label || k;

// Cria um line-item a partir de um registro do catálogo.
export const lineItemFrom = (kind, rec) => {
    const base = {
        kind,
        ref: rec.id,
        name: rec.name || '',
        category: rec.category || '',
        unit: kind === 'product' ? productUnit(rec) : (rec.unit || ''),
        qty: 1,
        price: Number(kind === 'product' ? rec.price : rec.base_price) || 0,
        discount: 0,
    };
    if (kind === 'product') base.cost = Number(rec.cost) || 0;
    return base;
};

// Totais de um conjunto de itens.
// subtotal = soma(qty * price)
// discountTotal = soma(discount por linha) + desconto global
// total = subtotal - discountTotal
export const computeTotals = (items = [], globalDiscount = 0) => {
    const list = Array.isArray(items) ? items : [];
    let subtotal = 0;
    let lineDiscount = 0;
    let cost = 0;
    list.forEach((it) => {
        const qty = Number(it.qty) || 0;
        const price = Number(it.price) || 0;
        const disc = Number(it.discount) || 0;
        subtotal += qty * price;
        lineDiscount += disc;
        if (it.kind === 'product' && Number(it.cost) > 0) cost += qty * (Number(it.cost) || 0);
    });
    const g = Number(globalDiscount) || 0;
    const discountTotal = lineDiscount + g;
    const total = subtotal - discountTotal;
    return { subtotal, lineDiscount, discountTotal, total, cost };
};

// Aplica um modelo de serviço: retorna lista de itens prontos para o orçamento.
// Os itens vem como cópia editável (não bloqueia alterações manuais).
export const itemsFromModel = (model) => {
    const raw = model?.items;
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === 'string') {
        try { list = JSON.parse(raw); } catch (_) { list = []; }
    }
    // Clona e garante campos numéricos.
    return list.map((it) => ({
        kind: it.kind || 'service',
        ref: it.ref || '',
        name: it.name || '',
        category: it.category || '',
        unit: it.unit || '',
        qty: Number(it.qty) || 1,
        price: Number(it.price) || 0,
        discount: Number(it.discount) || 0,
        ...(it.kind === 'product' ? { cost: Number(it.cost) || 0 } : {}),
    }));
};

// Normaliza itens vindos do PocketBase (que podem vir como string JSON).
export const normalizeItems = (raw) => {
    let list = [];
    if (Array.isArray(raw)) list = raw;
    else if (raw && typeof raw === 'string') {
        try { list = JSON.parse(raw); } catch (_) { list = []; }
    }
    return list.map((it) => ({
        kind: it.kind || 'service',
        ref: it.ref || '',
        name: it.name || '',
        category: it.category || '',
        unit: it.unit || '',
        qty: Number(it.qty) || 0,
        price: Number(it.price) || 0,
        discount: Number(it.discount) || 0,
        ...(it.kind === 'product' ? { cost: Number(it.cost) || 0 } : {}),
    }));
};

// Carrega todos os catálogos de uma vez (para seleção rápida no orçamento).
export const loadCatalog = async () => {
    const safe = async (name) => {
        try { return await pb.collection(name).getFullList({ sort: 'name' }); }
        catch (_) { return []; }
    };
    const [services, products, equipment, epis, tools, models] = await Promise.all([
        safe('services'), safe('products'), safe('equipment'), safe('epis'), safe('tools'), safe('service_models'),
    ]);
    return { services, products, equipment, epis, tools, models };
};

// Catálogo de fornecedores (usado no cadastro de produtos).
export const loadSuppliers = async () => {
    try { return await pb.collection('suppliers').getFullList({ sort: 'name' }); }
    catch (_) { return []; }
};

/* =========================================================================
   ETAPA 6 — Estoque e Gestão de Materiais
   ========================================================================= */

// Data local no formato YYYY-MM-DD (para movimentações de estoque).
const todayStrLocal = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 10);
};

// Opções de Unidade de medida (valor abreviado + rótulo completo).
export const UNIT_MEASURES = [
    { value: 'un', label: 'Unidade (un)' },
    { value: 'm', label: 'Metro (m)' },
    { value: 'cm', label: 'Centímetro (cm)' },
    { value: 'kg', label: 'Quilograma (kg)' },
    { value: 'g', label: 'Grama (g)' },
    { value: 'L', label: 'Litro (L)' },
    { value: 'ml', label: 'Mililitro (ml)' },
    { value: 'caixa', label: 'Caixa' },
    { value: 'pacote', label: 'Pacote' },
    { value: 'par', label: 'Par' },
    { value: 'rolo', label: 'Rolo' },
    { value: 'kit', label: 'Kit' },
    { value: 'outro', label: 'Outro' },
];

// Rótulo completo a partir do valor abreviado.
export const unitLabel = (value) => {
    const found = UNIT_MEASURES.find((u) => u.value === value);
    return found ? found.label : value || '';
};

// Unidade efetiva de um produto (acompanha o produto em todo o sistema).
// - Se unit_measure === 'outro', usa a unidade personalizada (unit_custom).
// - Caso contrário usa unit_measure.
// - Fallback para o campo livre `unit` (produtos criados antes desta etapa).
export const productUnit = (p) => {
    if (!p) return '';
    if (p.unit_measure === 'outro') return (p.unit_custom || '').trim() || 'outro';
    if (p.unit_measure) return p.unit_measure;
    return (p.unit || '').trim();
};

// Formata "quantidade + unidade" para exibição (ex.: "20 m").
export const formatStock = (qty, unit) => {
    const n = Number(qty) || 0;
    const u = unit ? ` ${unit}` : '';
    return `${n}${u}`;
};

// Status de estoque de um produto.
export const stockStatus = (p) => {
    const current = Number(p?.stock) || 0;
    const min = Number(p?.min_stock) || 0;
    if (min > 0 && current <= min) return 'Estoque baixo';
    return 'Estoque normal';
};

export const isLowStock = (p) => stockStatus(p) === 'Estoque baixo';

// Delta (com sinal) de uma movimentação em relação ao saldo.
// Entrada soma; Saída subtrai; Ajuste usa o valor informado (pode ser negativo).
export const movementDelta = (m) => {
    const qty = Number(m?.quantity) || 0;
    if (m?.type === 'Entrada') return Math.abs(qty);
    if (m?.type === 'Saída') return -Math.abs(qty);
    return qty; // Ajuste: valor informado (com sinal)
};

// Carrega o histórico de movimentações de um produto, em ordem cronológica.
export const loadProductMovements = async (productId) => {
    try {
        return await pb.collection('stock_movements').getFullList({
            filter: pb.filter('product_id = {:pid}', { pid: productId }),
            sort: 'created',
        });
    } catch (_) {
        return [];
    }
};

// Carrega todas as movimentações (para mapas e totais).
export const loadAllMovements = async () => {
    try {
        return await pb.collection('stock_movements').getFullList({ sort: '-created' });
    } catch (_) {
        return [];
    }
};

// Registra uma movimentação de estoque e atualiza o saldo do produto.
// Regra explícita: NÃO permite saldo negativo — lança erro antes de gravar.
// Não altera custo de aquisição nem preço de venda.
export const registerMovement = async ({ product, type, quantity, date, responsible, notes, source = 'manual', orderId = '' }) => {
    const delta = type === 'Entrada'
        ? Math.abs(Number(quantity) || 0)
        : type === 'Saída'
            ? -Math.abs(Number(quantity) || 0)
            : Number(quantity) || 0; // Ajuste: valor informado (com sinal)

    const current = Number(product?.stock) || 0;
    const newStock = current + delta;

    if (newStock < 0) {
        const unit = productUnit(product);
        throw new Error(
            `Saldo insuficiente. Atual: ${formatStock(current, unit)}. ` +
            `A movimentação resultaria em ${formatStock(newStock, unit)}.`,
        );
    }

    const unit = productUnit(product);
    const owner = pb.authStore.record?.id;

    // 1. Cria a movimentação (histórico).
    // quantity: magnitude para Entrada/Saída; valor com sinal para Ajuste.
    const storedQty = type === 'Ajuste'
        ? (Number(quantity) || 0)
        : Math.abs(Number(quantity) || 0);

    const movement = await pb.collection('stock_movements').create({
        product_id: product.id,
        type,
        quantity: storedQty,
        unit,
        date: date || todayStrLocal(),
        responsible: responsible || '',
        notes: notes || '',
        source,
        order_id: orderId || null,
        owner,
    }, { requestKey: `stock-create-${product.id}-${Date.now()}` });

    // 2. Atualiza apenas o saldo do produto (custo/preço permanecem intactos).
    await pb.collection('products').update(product.id, { stock: newStock }, { requestKey: `stock-update-${product.id}-${Date.now()}` });

    return { movement, newStock };
};

// Gera saídas de estoque a partir dos itens "realmente utilizados" na OS.
// Apenas itens do tipo produto (kind === 'product') com ref preenchido e qty > 0.
// Não duplica: ignora produtos que já possuem saída vinculada à OS.
export const generateStockExitFromOrder = async (order) => {
    const used = normalizeItems(order.used_items);
    const productItems = used.filter((it) => it.kind === 'product' && it.ref && Number(it.qty) > 0);
    if (productItems.length === 0) return { created: 0, skipped: 0, errors: [] };

    // Movimentações já vinculadas a esta OS (evita duplicar saídas).
    const existing = await pb.collection('stock_movements').getFullList({
        filter: pb.filter('order_id = {:oid} && type = "Saída"', { oid: order.id }),
    });
    const doneRefs = new Set(existing.map((m) => m.product_id).filter(Boolean));

    let created = 0;
    let skipped = 0;
    const errors = [];

    for (const it of productItems) {
        if (doneRefs.has(it.ref)) { skipped += 1; continue; }
        try {
            const product = await pb.collection('products').getOne(it.ref);
            const qty = Number(it.qty) || 0;
            const current = Number(product.stock) || 0;
            const newStock = current - qty;
            if (newStock < 0) {
                errors.push(`${product.name}: saldo insuficiente (${formatStock(current, productUnit(product))}).`);
                continue;
            }
            await pb.collection('stock_movements').create({
                product_id: product.id,
                type: 'Saída',
                quantity: qty,
                unit: productUnit(product),
                date: order.date || todayStrLocal(),
                responsible: order.assignee || '',
                notes: `Utilização OS ${order.number || ''} — ${order.client_name || ''}`.trim(),
                source: 'os',
                order_id: order.id,
                owner: pb.authStore.record?.id,
            }, { requestKey: `os-stock-${order.id}-${product.id}-${Date.now()}` });
            await pb.collection('products').update(product.id, { stock: newStock }, { requestKey: `os-stock-upd-${order.id}-${product.id}-${Date.now()}` });
            created += 1;
        } catch (err) {
            errors.push(`${it.name || it.ref}: ${err?.message || 'erro ao baixar estoque.'}`);
        }
    }

    return { created, skipped, errors };
};

// Verifica se já houve baixa de estoque para a OS.
export const orderHasStockExit = async (orderId) => {
    try {
        const list = await pb.collection('stock_movements').getFullList({
            filter: pb.filter('order_id = {:oid} && type = "Saída"', { oid: orderId }),
        });
        return list.length > 0;
    } catch (_) {
        return false;
    }
};


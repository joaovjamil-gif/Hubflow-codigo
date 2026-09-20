import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet';
import {
    Boxes, Wrench, HardHat, Hammer, Truck, Package,
} from 'lucide-react';
import CrudPanel, { PageHeader } from '@/components/CrudPanel';
import { useCollection, brl } from '@/lib/hubflow';
import { loadSuppliers, UNIT_MEASURES, productUnit, unitLabel, formatStock, stockStatus, isLowStock } from '@/lib/catalog';
import { cn } from '@/lib/utils';

const EQUIPMENT_STATUS = ['Disponível', 'Em uso', 'Em manutenção', 'Indisponível'];

const TABS = [
    { id: 'services', label: 'Serviços', icon: Wrench },
    { id: 'products', label: 'Produtos e Materiais', icon: Package },
    { id: 'suppliers', label: 'Fornecedores', icon: Truck },
    { id: 'equipment', label: 'Equipamentos', icon: Boxes },
    { id: 'epis', label: 'EPIs', icon: HardHat },
    { id: 'tools', label: 'Ferramentas', icon: Hammer },
];

const ServicesTab = () => {
    const collection = useCollection('services');
    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'unit', label: 'Unidade de cobrança', placeholder: 'ex.: hora, m², serviço' },
        { name: 'base_price', label: 'Preço base (R$)', type: 'number' },
        { name: 'description', label: 'Descrição', type: 'textarea' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];
    return (
        <CrudPanel
            title="Serviços"
            description="Cadastre os serviços que você presta para reutilizá-los em orçamentos e modelos."
            addLabel="Novo serviço"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category', 'unit']}
            emptyLabel="Nenhum serviço cadastrado ainda."
            renderItem={(s) => (
                <div>
                    <p className="font-display font-bold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {[s.category, s.unit].filter(Boolean).join(' • ') || 'Sem categoria'}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-accent">{brl(s.base_price)}</p>
                </div>
            )}
        />
    );
};

const ProductsTab = () => {
    const collection = useCollection('products');
    const [suppliers, setSuppliers] = useState([]);
    useEffect(() => { loadSuppliers().then(setSuppliers); }, []);

    const supplierOptions = useMemo(
        () => suppliers.map((s) => ({ value: s.id, label: s.name })),
        [suppliers],
    );

    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'unit_measure', label: 'Unidade de medida', type: 'select', options: UNIT_MEASURES },
        { name: 'unit_custom', label: 'Unidade personalizada', placeholder: 'ex.: saco, bobina', show: (f) => f.unit_measure === 'outro' },
        { name: 'cost', label: 'Custo de aquisição (R$)', type: 'number' },
        { name: 'price', label: 'Preço de venda (R$)', type: 'number' },
        { name: 'supplier_id', label: 'Fornecedor', type: 'relation', options: supplierOptions, placeholder: '— nenhum fornecedor —' },
        { name: 'stock', label: 'Estoque atual', type: 'number' },
        { name: 'min_stock', label: 'Estoque mínimo', type: 'number' },
        { name: 'description', label: 'Descrição', type: 'textarea' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];

    const supplierName = (id) => suppliers.find((s) => s.id === id)?.name;

    return (
        <CrudPanel
            title="Produtos e Materiais"
            description="Custo e preço de venda separados — base para margem e estoque futuro."
            addLabel="Novo produto / material"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category']}
            emptyLabel="Nenhum produto ou material cadastrado ainda."
            renderItem={(p) => {
                const margin = Number(p.price) - Number(p.cost);
                const unit = productUnit(p);
                const low = isLowStock(p);
                return (
                    <div>
                        <p className="font-display font-bold">{p.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {[p.category, unitLabel(p.unit_measure)].filter(Boolean).join(' • ') || 'Sem categoria'}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm">
                            <span className="text-muted-foreground">Custo: <span className="font-semibold text-foreground">{brl(p.cost)}</span></span>
                            <span className="text-muted-foreground">Venda: <span className="font-semibold text-accent">{brl(p.price)}</span></span>
                            <span className="text-muted-foreground">Margem: <span className="font-semibold text-foreground">{brl(margin)}</span></span>
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                            <span className="text-muted-foreground">
                                Estoque: <span className={cn('font-semibold', low ? 'text-destructive' : 'text-foreground')}>{formatStock(p.stock, unit)}</span>
                                {' • '}Mínimo: <span className="font-semibold text-foreground">{formatStock(p.min_stock, unit)}</span>
                            </span>
                            <span className={cn(
                                'inline-flex rounded-full border px-2 py-0.5 font-semibold',
                                low ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-accent/30 bg-accent/10 text-accent',
                            )}>
                                {stockStatus(p)}
                            </span>
                        </div>
                        {p.supplier_id && (
                            <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                                <Truck className="h-3 w-3" /> {supplierName(p.supplier_id) || 'Fornecedor'}
                            </p>
                        )}
                    </div>
                );
            }}
        />
    );
};

const SuppliersTab = () => {
    const collection = useCollection('suppliers');
    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'contact', label: 'Contato' },
        { name: 'phone', label: 'Telefone' },
        { name: 'email', label: 'E-mail' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];
    return (
        <CrudPanel
            title="Fornecedores"
            description="Vincule fornecedores aos produtos e materiais. Base para compras futuras."
            addLabel="Novo fornecedor"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category', 'contact', 'phone', 'email']}
            emptyLabel="Nenhum fornecedor cadastrado ainda."
            renderItem={(s) => (
                <div>
                    <p className="font-display font-bold">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {[s.category, s.contact, s.phone, s.email].filter(Boolean).join(' • ') || 'Sem contato registrado'}
                    </p>
                </div>
            )}
        />
    );
};

const EquipmentTab = () => {
    const collection = useCollection('equipment');
    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'status', label: 'Status', type: 'select', options: EQUIPMENT_STATUS },
        { name: 'description', label: 'Descrição', type: 'textarea' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];
    return (
        <CrudPanel
            title="Equipamentos"
            description="Equipamentos usados na execução dos serviços. Não são tratados como produtos financeiros."
            addLabel="Novo equipamento"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category', 'status']}
            emptyLabel="Nenhum equipamento cadastrado ainda."
            renderItem={(e) => (
                <div>
                    <p className="font-display font-bold">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {[e.category, e.status].filter(Boolean).join(' • ') || 'Sem categoria'}
                    </p>
                </div>
            )}
        />
    );
};

const EpisTab = () => {
    const collection = useCollection('epis');
    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'unit', label: 'Unidade' },
        { name: 'quantity', label: 'Quantidade', type: 'number' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];
    return (
        <CrudPanel
            title="EPIs"
            description="Equipamentos de proteção individual utilizados na execução."
            addLabel="Novo EPI"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category', 'unit']}
            emptyLabel="Nenhum EPI cadastrado ainda."
            renderItem={(e) => (
                <div>
                    <p className="font-display font-bold">{e.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {[e.category, e.unit, e.quantity != null ? `qtd: ${e.quantity}` : null].filter(Boolean).join(' • ') || 'Sem categoria'}
                    </p>
                </div>
            )}
        />
    );
};

const ToolsTab = () => {
    const collection = useCollection('tools');
    const fields = [
        { name: 'name', label: 'Nome', required: true },
        { name: 'category', label: 'Categoria' },
        { name: 'unit', label: 'Unidade' },
        { name: 'quantity', label: 'Quantidade', type: 'number' },
        { name: 'notes', label: 'Observações', type: 'textarea' },
    ];
    return (
        <CrudPanel
            title="Ferramentas"
            description="Ferramentas utilizadas na execução dos serviços."
            addLabel="Nova ferramenta"
            collection={collection}
            fields={fields}
            searchKeys={['name', 'category', 'unit']}
            emptyLabel="Nenhuma ferramenta cadastrada ainda."
            renderItem={(t) => (
                <div>
                    <p className="font-display font-bold">{t.name}</p>
                    <p className="text-sm text-muted-foreground">
                        {[t.category, t.unit, t.quantity != null ? `qtd: ${t.quantity}` : null].filter(Boolean).join(' • ') || 'Sem categoria'}
                    </p>
                </div>
            )}
        />
    );
};

const CatalogPage = () => {
    const [tab, setTab] = useState('services');
    return (
        <div>
            <Helmet>
                <title>Catálogo — HubFlow</title>
                <meta name="description" content="Catálogo inteligente: serviços, produtos, fornecedores, equipamentos, EPIs e ferramentas para montar orçamentos rapidamente." />
            </Helmet>
            <PageHeader
                title="Catálogo"
                description="Monte orçamentos e OS rapidamente reutilizando serviços, produtos, equipamentos, EPIs e ferramentas."
            />

            <div className="mb-6 flex flex-wrap gap-2">
                {TABS.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={cn(
                            'inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold transition active:scale-[0.98]',
                            tab === t.id
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border bg-card text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <t.icon className="h-4 w-4" /> {t.label}
                    </button>
                ))}
            </div>

            {tab === 'services' && <ServicesTab />}
            {tab === 'products' && <ProductsTab />}
            {tab === 'suppliers' && <SuppliersTab />}
            {tab === 'equipment' && <EquipmentTab />}
            {tab === 'epis' && <EpisTab />}
            {tab === 'tools' && <ToolsTab />}
        </div>
    );
};

export default CatalogPage;

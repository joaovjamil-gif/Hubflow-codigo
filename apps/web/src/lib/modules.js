// =========================================================================
// HubFlow — Registro central de módulos
// -------------------------------------------------------------------------
// Cada módulo da plataforma é descrito aqui UMA vez, de forma idempotente.
// O sidebar (AppLayout) e futuros guardas de rota consomem esta lista,
// filtrada pelo plano do usuário (ver @/contexts/PlanContext).
//
// Para adicionar um novo módulo no futuro:
//   1. Inclua um objeto aqui (id único, label, rota, ícone).
//   2. Referencie seu id em PLANS (apps/web/src/lib/plans.js).
//   3. Cadastre a rota em App.jsx (já existente para os módulos atuais).
//
// `plans` lista os planos que incluem o módulo.
// `base` = disponível em qualquer plano (ex.: Configurações, Lixeira).
// =========================================================================

import {
    CalendarDays, ClipboardList, LayoutDashboard, Settings, Sparkles,
    Users, Wallet, Wrench, Network, BookOpen, Layers, Package, Target, Trash2,
} from 'lucide-react';

export const MODULES = [
    { id: 'dashboard', label: 'Dashboard', to: '/app', icon: LayoutDashboard, end: true, plans: ['professional', 'complete'] },
    { id: 'clients', label: 'Clientes', to: '/app/clientes', icon: Users, plans: ['essential', 'professional', 'complete'] },
    { id: 'crm', label: 'CRM', to: '/app/crm', icon: Network, plans: ['professional', 'complete'] },
    { id: 'catalog', label: 'Catálogo', to: '/app/catalogo', icon: BookOpen, plans: ['complete'] },
    { id: 'models', label: 'Modelos de Serviço', to: '/app/modelos', icon: Layers, plans: ['complete'] },
    { id: 'stock', label: 'Estoque', to: '/app/estoque', icon: Package, plans: ['complete'] },
    { id: 'quotes', label: 'Orçamentos', to: '/app/orcamentos', icon: ClipboardList, plans: ['essential', 'professional', 'complete'] },
    { id: 'orders', label: 'Ordens de Serviço', to: '/app/ordens', icon: Wrench, plans: ['essential', 'professional', 'complete'] },
    { id: 'agenda', label: 'Agenda', to: '/app/agenda', icon: CalendarDays, plans: ['essential', 'professional', 'complete'] },
    { id: 'finance', label: 'Financeiro', to: '/app/financeiro', icon: Wallet, plans: ['professional', 'complete'] },
    { id: 'goals', label: 'Metas', to: '/app/metas', icon: Target, plans: ['professional', 'complete'] },
    { id: 'marketing', label: 'Marketing com IA', to: '/app/marketing', icon: Sparkles, plans: ['complete'] },
    { id: 'trash', label: 'Lixeira', to: '/app/lixeira', icon: Trash2, plans: ['essential', 'professional', 'complete'], base: true },
    { id: 'settings', label: 'Configurações', to: '/app/configuracoes', icon: Settings, plans: ['essential', 'professional', 'complete'], base: true },
];

// Acesso rápido por id.
export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m]));

// Lista ordenada de ids de módulos (útil para definições de plano).
export const ALL_MODULE_IDS = MODULES.map((m) => m.id);

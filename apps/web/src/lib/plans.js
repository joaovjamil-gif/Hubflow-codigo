// =========================================================================
// HubFlow — Definição de planos
// -------------------------------------------------------------------------
// Três níveis de plano, cada um referenciando módulos por id (ver
// apps/web/src/lib/modules.js). A visibilidade real é resolvida em
// @/contexts/PlanContext.
//
//   PLANO ESSENCIAL    — operação básica: Clientes, Agenda, Orçamentos, OS.
//   PLANO PROFISSIONAL — Essencial + Financeiro, Dashboard, Metas, CRM.
//   PLANO COMPLETO     — todos os módulos disponíveis.
//
// Módulos marcados como `base` no registro (Configurações, Lixeira) estão
// sempre disponíveis, independentemente do plano.
//
// Nenhum cobrança/checkout é implementado nesta etapa — esta estrutura
// apenas prepara a base para a integração futura com a Cakto.
// =========================================================================

export const PLANS = {
    essential: {
        id: 'essential',
        label: 'Essencial',
        tagline: 'Operação básica',
        // 'all' = todos os módulos; caso contrário, lista explícita de ids.
        modules: ['clients', 'agenda', 'quotes', 'orders'],
    },
    professional: {
        id: 'professional',
        label: 'Profissional',
        tagline: 'Gestão avançada',
        modules: ['clients', 'agenda', 'quotes', 'orders', 'finance', 'dashboard', 'goals', 'crm'],
    },
    complete: {
        id: 'complete',
        label: 'Completo',
        tagline: 'Todos os módulos',
        modules: 'all',
    },
};

// Plano padrão durante os testes do projeto — mantém todos os módulos
// visíveis e funcionando. No futuro, será lido do registro do usuário.
export const DEFAULT_PLAN = 'complete';

// Ordem de exibição comercial dos planos.
export const PLAN_ORDER = ['essential', 'professional', 'complete'];

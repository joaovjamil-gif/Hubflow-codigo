import React, { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MODULES } from '@/lib/modules';
import { PLANS, DEFAULT_PLAN } from '@/lib/plans';

// =========================================================================
// HubFlow — Contexto de plano e controle de acesso por módulo
// -------------------------------------------------------------------------
// Resolve qual plano o usuário possui e quais módulos ele enxerga.
//
// Hoje o plano padrão é `complete` (todos os módulos visíveis), para não
// alterar a experiência atual durante os testes.
//
// Ponto de extensão futuro:
//   - Ler `user.plan_id` (campo a ser adicionado na coleção `users` quando a
//     integração com a Cakto for implementada). Hoje o campo não existe,
//     então caímos no DEFAULT_PLAN automaticamente.
//   - Para habilitar a ocultação real, basta popular `plan_id` no cadastro/
//     assinatura do usuário; nenhuma outra mudança será necessária aqui.
// =========================================================================

const PlanContext = createContext(null);

export const PlanProvider = ({ children }) => {
    const { user } = useAuth();

    // Campo reservado para o futuro; ausente hoje → DEFAULT_PLAN.
    const planId = user?.plan_id || DEFAULT_PLAN;
    const plan = PLANS[planId] || PLANS[DEFAULT_PLAN];

    const visibleModules = useMemo(() => {
        if (plan.modules === 'all') return MODULES;
        const allowed = new Set(plan.modules);
        return MODULES.filter((m) => allowed.has(m.id) || m.base);
    }, [plan]);

    const visibleModuleIds = useMemo(
        () => new Set(visibleModules.map((m) => m.id)),
        [visibleModules],
    );

    // Verifica se um módulo (por id) está disponível no plano atual.
    const hasModule = (id) => visibleModuleIds.has(id);

    // Verifica se uma rota está acessível no plano atual (por path exato).
    const hasRoute = (to) => visibleModules.some((m) => m.to === to);

    const value = useMemo(
        () => ({ planId, plan, visibleModules, hasModule, hasRoute }),
        [planId, plan, visibleModules, hasModule, hasRoute],
    );

    return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
};

export const usePlan = () => useContext(PlanContext);

export default PlanContext;

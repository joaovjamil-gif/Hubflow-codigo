import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowRight, CalendarDays, CheckCircle2, ClipboardList, CreditCard,
    LineChart, MessageSquare, Sparkles, Users, Wallet, Clock, ShieldCheck,
    LayoutDashboard, FolderOpen, TrendingUp, Zap,
} from 'lucide-react';
import Reveal from '@/components/Reveal';
import { brl } from '@/lib/hubflow';
import { cn } from '@/lib/utils';
import {
    Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';

const landingPricing = {
    monthly: { price: 59, suffix: '/mês' },
    yearly: { monthlyEquivalent: 39.9, annualPrice: 478.8 },
};

const benefits = [
    { icon: Clock, title: 'Menos planilhas, mais tempo', text: 'Tudo o que você anota em cadernos e planilhas em uma única tela organizada.' },
    { icon: ShieldCheck, title: 'Nada se perde', text: 'Clientes, orçamentos e serviços registrados com histórico completo.' },
    { icon: LineChart, title: 'Controle do dinheiro', text: 'Saiba quanto tem a receber, o que está atrasado e o que vence essa semana.' },
    { icon: MessageSquare, title: 'Atendimento mais rápido', text: 'Orçamento pronto em minutos, com status claro do começo ao fim.' },
];

const modules = [
    { icon: Users, name: 'Clientes', text: 'Cadastro completo com telefone, WhatsApp, documento e observações.' },
    { icon: ClipboardList, name: 'Orçamentos', text: 'Do rascunho à aprovação, acompanhando cada resposta.' },
    { icon: CheckCircle2, name: 'Ordens de Serviço', text: 'Serviço, responsável, valor e status em tempo real.' },
    { icon: CalendarDays, name: 'Agenda', text: 'Compromissos e serviços do dia sem conflito de horário.' },
    { icon: Wallet, name: 'Financeiro', text: 'Contas a receber, a pagar, pagamentos e vencimentos.' },
    { icon: Sparkles, name: 'Marketing com IA', text: 'Em breve: conteúdos e mensagens geradas para o seu negócio.' },
];

const flow = ['Cliente', 'Orçamento', 'Aprovação', 'Ordem de Serviço', 'Agendamento', 'Conclusão'];

const faq = [
    { q: 'Preciso instalar alguma coisa?', a: 'Não. O HubFlow roda no navegador do computador e do celular. Basta criar sua conta e começar.' },
    { q: 'Serve para MEI e autônomo?', a: 'Sim. O HubFlow foi desenhado para eletricistas, instaladores, técnicos de manutenção, profissionais de climatização e refrigeração e outros pequenos prestadores de serviço que precisam de organização sem complicação.' },
    { q: 'Posso cadastrar meus clientes antigos?', a: 'Pode. O cadastro de clientes é livre e você registra o histórico de orçamentos e ordens de serviço de cada um.' },
    { q: 'Como funciona a cobrança?', a: `O plano mensal custa ${brl(landingPricing.monthly.price)} por mês. No plano anual, a contratação anual equivale a ${brl(landingPricing.yearly.monthlyEquivalent)} por mês, com valor total de ${brl(landingPricing.yearly.annualPrice)} por ano.` },
    { q: 'E a integração com WhatsApp e pagamentos?', a: 'A plataforma já está preparada para receber WhatsApp, automações, IA e gateway de pagamento nas próximas etapas.' },
];

// Novos: benefícios rápidos (logo após o Hero)
const quickBenefits = [
    { icon: Users, title: 'Clientes organizados', text: 'Cadastro, histórico e contato sempre à mão.' },
    { icon: ClipboardList, title: 'Orçamentos rápidos', text: 'Pronto em minutos, do rascunho à aprovação.' },
    { icon: CheckCircle2, title: 'Ordens de serviço', text: 'Serviço, responsável e status em tempo real.' },
    { icon: CalendarDays, title: 'Agenda', text: 'Compromissos do dia sem conflito de horário.' },
    { icon: Wallet, title: 'Financeiro', text: 'A receber, a pagar e vencimentos sob controle.' },
    { icon: TrendingUp, title: 'Controle do negócio', text: 'Visão completa de onde está o seu dinheiro.' },
];

// Como funciona — 5 passos
const howSteps = [
    { n: 1, title: 'Cadastre seus clientes', text: 'Nome, contato, documento e observações em segundos.' },
    { n: 2, title: 'Crie o orçamento', text: 'Monte o serviço e envie com status de acompanhamento.' },
    { n: 3, title: 'Agende o serviço', text: 'Data e horário direto na agenda, sem conflito.' },
    { n: 4, title: 'Execute a OS', text: 'Ordem de serviço com responsável e valor definidos.' },
    { n: 5, title: 'Controle o financeiro', text: 'Conta a receber gerada e acompanhada até o pagamento.' },
];

// Diferencial — conexão entre módulos
const connected = [
    { icon: Users, label: 'Clientes' },
    { icon: ClipboardList, label: 'Orçamentos' },
    { icon: CheckCircle2, label: 'OS' },
    { icon: CalendarDays, label: 'Agenda' },
    { icon: Wallet, label: 'Financeiro' },
    { icon: LayoutDashboard, label: 'Dashboard' },
];

// Prova visual do produto — telas
const productShots = [
    {
        icon: LayoutDashboard, title: 'Dashboard',
        text: 'Métricas do dia, ações rápidas e atividade recente em uma tela.',
        preview: (
            <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                    {[['A receber', 'R$ 1.240', 'text-primary'], ['Serviços hoje', '3', 'text-accent'], ['Atrasados', '1', 'text-destructive']].map(([k, v, c]) => (
                        <div key={k} className="rounded-lg bg-secondary/70 p-2.5">
                            <p className="text-[10px] font-medium text-muted-foreground">{k}</p>
                            <p className={`mt-0.5 font-display text-sm font-extrabold ${c}`}>{v}</p>
                        </div>
                    ))}
                </div>
                <div className="space-y-1.5">
                    {['Orçamento aprovado — Maria S.', 'OS concluída — João P.', 'Pagamento recebido — R$ 320'].map((t) => (
                        <div key={t} className="flex items-center gap-2 rounded-md bg-secondary/40 px-2 py-1.5 text-[11px] font-medium">
                            <CheckCircle2 className="h-3 w-3 text-accent" /> {t}
                        </div>
                    ))}
                </div>
            </div>
        ),
    },
    {
        icon: Users, title: 'Clientes',
        text: 'Cadastro completo com telefone, WhatsApp e histórico.',
        preview: (
            <div className="space-y-1.5">
                {[['Maria Silva', '(11) 99999-1234'], ['João Pereira', '(21) 98888-5678'], ['Ana Costa', '(31) 97777-4321']].map(([n, p]) => (
                    <div key={n} className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-2">
                        <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">{n[0]}</span>
                            <span className="text-[11px] font-semibold">{n}</span>
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">{p}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: ClipboardList, title: 'Orçamentos',
        text: 'Do rascunho à aprovação, com status claro de cada um.',
        preview: (
            <div className="space-y-1.5">
                {[['Orçamento #042', 'Aprovado', 'bg-accent/15 text-accent'], ['Orçamento #041', 'Aguardando', 'bg-amber-500/15 text-amber-600'], ['Orçamento #040', 'Rascunho', 'bg-secondary text-muted-foreground']].map(([t, s, c]) => (
                    <div key={t} className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-2">
                        <span className="text-[11px] font-semibold">{t}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${c}`}>{s}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: CalendarDays, title: 'Agenda',
        text: 'Compromissos e serviços do dia sem conflito de horário.',
        preview: (
            <div className="space-y-1.5">
                {[['09:00', 'Instalação elétrica'], ['13:30', 'Manutenção preventiva'], ['16:00', 'Visita técnica']].map(([t, s]) => (
                    <div key={t} className="flex items-center gap-2 rounded-md bg-secondary/50 px-2.5 py-2">
                        <span className="font-mono text-[10px] font-bold text-primary">{t}</span>
                        <span className="text-[11px] font-medium">{s}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: Wallet, title: 'Financeiro',
        text: 'A receber, a pagar, pagamentos e vencimentos.',
        preview: (
            <div className="space-y-1.5">
                {[['A receber', 'R$ 1.240', 'text-primary'], ['Recebido', 'R$ 3.480', 'text-accent'], ['Vencido', 'R$ 220', 'text-destructive']].map(([k, v, c]) => (
                    <div key={k} className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-2">
                        <span className="text-[11px] font-medium text-muted-foreground">{k}</span>
                        <span className={`font-display text-sm font-extrabold ${c}`}>{v}</span>
                    </div>
                ))}
            </div>
        ),
    },
    {
        icon: FolderOpen, title: 'Catálogo',
        text: 'Serviços, produtos, fornecedores e modelos prontos para reusar.',
        preview: (
            <div className="space-y-1.5">
                {[['Serviço', 'Instalação elétrica', 'R$ 180'], ['Produto', 'Disjuntor 20A', 'R$ 45'], ['Modelo', 'Manutenção padrão', 'R$ 320']].map(([tag, n, v]) => (
                    <div key={n} className="flex items-center justify-between rounded-md bg-secondary/50 px-2.5 py-2">
                        <div className="flex items-center gap-2">
                            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase text-primary">{tag}</span>
                            <span className="text-[11px] font-semibold">{n}</span>
                        </div>
                        <span className="font-mono text-[10px] font-bold text-foreground">{v}</span>
                    </div>
                ))}
            </div>
        ),
    },
];

const LandingPage = () => (
    <div className="min-h-screen bg-background text-foreground">
        <Helmet>
            <title>HubFlow — Gestão para prestadores de serviços técnicos</title>
            <meta name="description" content="HubFlow reúne clientes, orçamentos, ordens de serviço, agenda e financeiro em um só lugar. Feito para eletricistas, instaladores, técnicos de manutenção e pequenos prestadores de serviço. Do primeiro contato ao serviço concluído, tudo organizado." />
        </Helmet>

        {/* HEADER */}
        <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-[76rem] items-center justify-between px-5">
                <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">H</span>
                    HubFlow
                </Link>
                <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
                    <a href="#beneficios" className="transition hover:text-foreground">Benefícios</a>
                    <a href="#como-funciona" className="transition hover:text-foreground">Como funciona</a>
                    <a href="#modulos" className="transition hover:text-foreground">Módulos</a>
                    <a href="#precos" className="transition hover:text-foreground">Preços</a>
                    <a href="#faq" className="transition hover:text-foreground">Dúvidas</a>
                </nav>
                <div className="flex items-center gap-2">
                    <Link to="/login" className="hidden rounded-full px-4 py-2 text-sm font-semibold text-primary transition hover:bg-secondary sm:block">Entrar</Link>
                    <Link to="/cadastro" className="rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98]">Começar agora</Link>
                </div>
            </div>
        </header>

        {/* HERO */}
        <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-32 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
            <div className="pointer-events-none absolute -left-20 top-56 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
            <div className="mx-auto grid max-w-[76rem] items-center gap-12 px-5 py-16 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                        <Sparkles className="h-3.5 w-3.5" /> Feito para prestadores de serviços técnicos
                    </span>
                    <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.6rem]">
                        Menos tempo organizando,{' '}
                        <span className="hf-gradient-text">mais tempo</span>{' '}
                        fazendo seu negócio crescer.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg text-muted-foreground">
                        Do primeiro contato ao serviço concluído, tudo organizado em um só lugar. HubFlow reúne clientes, orçamentos, ordens de serviço, agenda e financeiro — simples de usar, profissional de verdade.
                    </p>
                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <Link to="/cadastro" className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground shadow-[0_10px_30px_-12px_rgba(34,197,94,0.6)] transition hover:brightness-110 active:scale-[0.98]">
                            Começar agora <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link to="/login" className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-border bg-card px-7 text-base font-semibold text-foreground transition hover:border-primary/40 hover:bg-secondary/50">
                            Já tenho conta
                        </Link>
                    </div>
                    <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-accent" /> Sem instalação. Funciona no celular e no computador.
                    </p>
                </div>

                {/* PAINEL DEMONSTRATIVO */}
                <motion.div
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="hf-card overflow-hidden p-5 md:p-6"
                >
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <div className="flex items-center gap-2">
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                            <p className="font-display text-sm font-bold">Painel do seu negócio</p>
                        </div>
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">hoje</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 py-4">
                        {[
                            { k: 'A receber', v: 'R$ 1.240', icon: Wallet, c: 'text-primary' },
                            { k: 'Orçamentos pendentes', v: '2', icon: ClipboardList, c: 'text-foreground' },
                            { k: 'Serviços hoje', v: '3', icon: CalendarDays, c: 'text-accent' },
                            { k: 'Pagamentos atrasados', v: '1', icon: Clock, c: 'text-destructive' },
                        ].map((m) => (
                            <div key={m.k} className="rounded-2xl border border-border/60 bg-secondary/50 p-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-muted-foreground">{m.k}</p>
                                    <m.icon className={`h-4 w-4 ${m.c}`} strokeWidth={1.8} />
                                </div>
                                <p className={`mt-2 font-display text-2xl font-extrabold ${m.c}`}>{m.v}</p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-border pt-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agenda de hoje</p>
                        <div className="space-y-1.5">
                            {[['09:00', 'Instalação elétrica', 'Maria S.'], ['13:30', 'Manutenção preventiva', 'João P.'], ['16:00', 'Visita técnica', 'Ana C.']].map(([t, s, c]) => (
                                <div key={t} className="flex items-center gap-3 rounded-xl bg-secondary/40 px-3 py-2 text-sm transition hover:bg-secondary/70">
                                    <span className="font-mono text-xs font-bold text-primary">{t}</span>
                                    <span className="font-medium">{s}</span>
                                    <span className="ml-auto text-xs text-muted-foreground">{c}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>

        {/* MARQUEE */}
        <div className="overflow-hidden border-y border-border bg-primary py-3 text-primary-foreground">
            <div className="marquee-track flex w-max gap-10 whitespace-nowrap text-sm font-semibold uppercase tracking-widest">
                {Array.from({ length: 2 }).map((_, i) => (
                    <span key={i} className="flex gap-10">
                        {['Clientes', 'Orçamentos', 'Ordens de serviço', 'Agenda', 'Financeiro', 'CRM', 'Marketing com IA'].map((w) => (
                            <span key={w} className="flex items-center gap-10">{w}<span className="text-accent">•</span></span>
                        ))}
                    </span>
                ))}
            </div>
        </div>

        {/* BENEFÍCIOS RÁPIDOS */}
        <section id="beneficios" className="mx-auto max-w-[76rem] px-5 py-20 md:py-24">
            <Reveal>
                <div className="max-w-2xl">
                    <span className="text-sm font-semibold uppercase tracking-wider text-accent">Por que usar a HubFlow</span>
                    <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Tudo o que o seu negócio precisa, sem complicação
                    </h2>
                    <p className="mt-3 text-muted-foreground">Organização real para quem coloca a mão na massa — em segundos, não em horas.</p>
                </div>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {quickBenefits.map((b, i) => (
                    <Reveal key={b.title} delay={i * 0.05}>
                        <div className="hf-card group h-full p-6 transition hover:-translate-y-1 hover:shadow-[0_12px_36px_-16px_rgba(29,78,216,0.4)]">
                            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                                <b.icon className="h-5 w-5" strokeWidth={1.8} />
                            </span>
                            <h3 className="mt-5 font-display text-lg font-bold">{b.title}</h3>
                            <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
                        </div>
                    </Reveal>
                ))}
            </div>

            {/* benefícios detalhados (preservados) */}
            <div className="mt-16 grid gap-x-10 gap-y-8 sm:grid-cols-2">
                {benefits.map((b, i) => (
                    <Reveal key={b.title} delay={i * 0.06}>
                        <div className="flex gap-4 border-t border-border pt-6">
                            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <b.icon className="h-5 w-5" strokeWidth={1.8} />
                            </span>
                            <div>
                                <h3 className="font-display text-lg font-bold">{b.title}</h3>
                                <p className="mt-1 text-muted-foreground">{b.text}</p>
                            </div>
                        </div>
                    </Reveal>
                ))}
            </div>
        </section>

        {/* COMO FUNCIONA */}
        <section id="como-funciona" className="border-y border-border bg-secondary/40 py-20 md:py-24">
            <div className="mx-auto max-w-[76rem] px-5">
                <Reveal>
                    <div className="max-w-2xl">
                        <span className="text-sm font-semibold uppercase tracking-wider text-accent">Como funciona</span>
                        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                            O fluxo inteiro do seu negócio em 5 passos
                        </h2>
                        <p className="mt-3 text-muted-foreground">Do primeiro contato ao pagamento — tudo conectado, sem retrabalho.</p>
                    </div>
                </Reveal>

                <div className="mt-12 grid gap-4 md:grid-cols-5">
                    {howSteps.map((s, i) => (
                        <Reveal key={s.n} delay={i * 0.07}>
                            <div className="relative h-full">
                                <div className="hf-card h-full p-5">
                                    <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-display text-sm font-extrabold text-primary-foreground">{s.n}</span>
                                    <h3 className="mt-4 font-display text-base font-bold leading-snug">{s.title}</h3>
                                    <p className="mt-1.5 text-sm text-muted-foreground">{s.text}</p>
                                </div>
                                {i < howSteps.length - 1 && (
                                    <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                                        <ArrowRight className="h-5 w-5 text-primary/40" />
                                    </div>
                                )}
                                {i < howSteps.length - 1 && (
                                    <div className="flex justify-center md:hidden">
                                        <ArrowRight className="mt-1 h-5 w-5 rotate-90 text-primary/40" />
                                    </div>
                                )}
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>

        {/* DIFERENCIAL — Tudo conectado */}
        <section className="mx-auto max-w-[76rem] px-5 py-20 md:py-24">
            <Reveal>
                <div className="mx-auto max-w-2xl text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-accent">Diferencial</span>
                    <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                        Tudo conectado em um só lugar
                    </h2>
                    <p className="mt-3 text-muted-foreground">
                        A HubFlow não é apenas um cadastro de clientes. Cada etapa conversa com a próxima — o que entra como cliente vira orçamento, ordem, agenda e caixa.
                    </p>
                </div>
            </Reveal>

            <Reveal delay={0.1}>
                <div className="mt-12 flex flex-wrap items-stretch justify-center gap-3 md:flex-nowrap md:gap-0">
                    {connected.map((c, i) => (
                        <React.Fragment key={c.label}>
                            <div className="hf-card flex min-w-[8.5rem] flex-1 flex-col items-center gap-2 px-4 py-5 text-center md:flex-none">
                                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                                    <c.icon className="h-5 w-5" strokeWidth={1.8} />
                                </span>
                                <p className="font-display text-sm font-bold">{c.label}</p>
                            </div>
                            {i < connected.length - 1 && (
                                <div className="flex items-center px-1 md:px-2">
                                    <span className="hidden h-px w-6 bg-gradient-to-r from-primary/30 to-primary/60 md:block" />
                                    <ArrowRight className="h-4 w-4 rotate-90 text-primary/50 md:rotate-0" />
                                    <span className="hidden h-px w-6 bg-gradient-to-l from-primary/30 to-primary/60 md:block" />
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </Reveal>
        </section>

        {/* PROVA VISUAL DO PRODUTO */}
        <section id="modulos" className="border-y border-border bg-secondary/40 py-20 md:py-24">
            <div className="mx-auto max-w-[76rem] px-5">
                <Reveal>
                    <div className="max-w-2xl">
                        <span className="text-sm font-semibold uppercase tracking-wider text-accent">A plataforma</span>
                        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Veja como o HubFlow funciona por dentro</h2>
                        <p className="mt-3 text-muted-foreground">Interfaces reais da plataforma — simples de usar, profissionais de verdade.</p>
                    </div>
                </Reveal>

                <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {productShots.map((p, i) => (
                        <Reveal key={p.title} delay={i * 0.05}>
                            <div className="hf-card group h-full overflow-hidden p-0 transition hover:-translate-y-1 hover:shadow-[0_14px_40px_-18px_rgba(29,78,216,0.45)]">
                                <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
                                    <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                                        <p.icon className="h-4 w-4" strokeWidth={1.8} />
                                    </span>
                                    <p className="font-display text-sm font-bold">{p.title}</p>
                                </div>
                                <div className="bg-secondary/30 px-5 py-4">
                                    <div className="rounded-xl border border-border/60 bg-card p-3 shadow-sm">
                                        {p.preview}
                                    </div>
                                </div>
                                <p className="px-5 pb-5 pt-1 text-sm text-muted-foreground">{p.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>

                {/* módulos (preservados) */}
                <Reveal>
                    <h3 className="mt-16 font-display text-2xl font-extrabold tracking-tight sm:text-3xl">Os módulos da plataforma</h3>
                    <p className="mt-3 max-w-xl text-muted-foreground">Tudo conectado: o que entra como cliente vira orçamento, ordem de serviço e caixa.</p>
                </Reveal>
                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {modules.map((m, i) => (
                        <Reveal key={m.name} delay={i * 0.05}>
                            <div className="hf-card h-full p-6 transition hover:-translate-y-1">
                                <m.icon className="h-6 w-6 text-accent" strokeWidth={1.8} />
                                <h4 className="mt-4 font-display text-lg font-bold">{m.name}</h4>
                                <p className="mt-2 text-sm text-muted-foreground">{m.text}</p>
                            </div>
                        </Reveal>
                    ))}
                </div>
            </div>
        </section>

        {/* CRESCIMENTO (preservado) */}
        <section className="mx-auto max-w-[76rem] px-5 py-20 md:py-24">
            <Reveal>
                <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">A HubFlow cresce junto com o seu negócio</h2>
                <p className="mt-3 max-w-2xl text-muted-foreground">
                    Comece organizando clientes e orçamentos. Conforme o negócio cresce, ative ordens de serviço, agenda e financeiro — e em breve WhatsApp, automações e pagamentos.
                </p>
            </Reveal>
            <div className="mt-10 flex flex-wrap items-center gap-3">
                {flow.map((step, i) => (
                    <React.Fragment key={step}>
                        <span className="rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-sm font-semibold text-primary">{step}</span>
                        {i < flow.length - 1 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
                    </React.Fragment>
                ))}
            </div>
        </section>

        {/* PREÇOS */}
        <section id="precos" className="border-y border-border bg-secondary/40 py-20 md:py-24">
            <div className="mx-auto max-w-[60rem] px-5">
                <Reveal>
                    <div className="text-center">
                        <span className="text-sm font-semibold uppercase tracking-wider text-accent">Preços</span>
                        <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Preço simples, sem surpresa</h2>
                        <p className="mt-3 text-muted-foreground">Todos os módulos incluídos. Cancele quando quiser.</p>
                    </div>
                </Reveal>
                <div className="mt-12 grid items-start gap-5 md:grid-cols-2">
                    {/* Mensal */}
                    <div className="hf-card p-8">
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">Plano mensal</p>
                        <p className="mt-4 font-display text-4xl font-extrabold text-foreground">{brl(landingPricing.monthly.price)}<span className="text-base font-semibold text-muted-foreground">{landingPricing.monthly.suffix}</span></p>
                        <ul className="mt-6 space-y-3 text-sm text-foreground">
                            {['Todos os módulos', 'Usuários ilimitados no seu negócio', 'Cancele quando quiser'].map((f) => (
                                <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /><span>{f}</span></li>
                            ))}
                        </ul>
                        <Link to="/cadastro" className="mt-8 flex min-h-[48px] items-center justify-center rounded-full border border-primary/30 font-semibold text-primary transition hover:bg-primary/5 active:scale-[0.98]">Começar agora</Link>
                    </div>
                    {/* Anual — destaque */}
                    <div className="relative rounded-2xl border border-primary/40 bg-primary p-8 text-white shadow-[0_18px_50px_-20px_rgba(29,78,216,0.7)]">
                        <span className="absolute -top-3 left-8 rounded-full bg-accent px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow">Melhor custo-benefício</span>
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-white">Plano anual</p>
                        <p className="mt-4 font-display text-4xl font-extrabold text-white">{brl(landingPricing.yearly.monthlyEquivalent)}<span className="text-base font-semibold text-white">/mês</span></p>
                        <p className="mt-1 text-sm text-white">Contratação anual: {brl(landingPricing.yearly.annualPrice)}/ano</p>
                        <ul className="mt-6 space-y-3 text-sm text-white">
                            {['Todos os módulos', 'Usuários ilimitados no seu negócio', 'Cancele quando quiser'].map((f) => (
                                <li key={f} className="flex items-center gap-2.5"><CheckCircle2 className="h-4 w-4 shrink-0 text-accent" /><span className="text-white">{f}</span></li>
                            ))}
                        </ul>
                        <Link to="/cadastro" className="mt-8 flex min-h-[48px] items-center justify-center rounded-full bg-accent font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98]">Assinar o anual</Link>
                    </div>
                </div>
                <p className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <CreditCard className="h-4 w-4" /> Gateway de pagamento e assinaturas em breve.
                </p>
            </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-[52rem] px-5 py-20 md:py-24">
            <Reveal>
                <div className="text-center">
                    <span className="text-sm font-semibold uppercase tracking-wider text-accent">Dúvidas</span>
                    <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Perguntas frequentes</h2>
                </div>
            </Reveal>
            <Accordion type="single" collapsible className="mt-10">
                {faq.map((item, i) => (
                    <AccordionItem key={item.q} value={item.q} className={cn(
                        'overflow-hidden rounded-2xl border border-border bg-card px-5 shadow-sm transition [&[data-state=open]]:shadow-[0_8px_28px_-16px_rgba(29,78,216,0.4)]',
                        i > 0 && 'mt-3',
                    )}>
                        <AccordionTrigger className="text-left font-display text-base font-bold hover:no-underline">
                            {item.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        </section>

        {/* CTA FINAL */}
        <section className="mx-auto max-w-[76rem] px-5 pb-20 md:pb-24">
            <Reveal>
                <div className="hf-card flex flex-col items-center gap-5 bg-primary px-6 py-12 text-center text-primary-foreground">
                    <Zap className="h-8 w-8 text-accent" strokeWidth={1.8} />
                    <h2 className="max-w-xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Comece a organizar seu negócio hoje</h2>
                    <p className="max-w-md text-primary-foreground/85">Sem instalação, sem complicação. Crie sua conta gratuita e comece em minutos.</p>
                    <Link to="/cadastro" className="inline-flex min-h-[52px] items-center gap-2 rounded-full bg-accent px-8 text-base font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98]">
                        Começar agora <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </Reveal>
        </section>

        {/* RODAPÉ */}
        <footer className="border-t border-white/10 bg-[#1f242c] text-[#f4f6f8]">
            <div className="mx-auto grid max-w-[76rem] gap-10 px-5 py-14 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2 lg:col-span-1">
                    <p className="flex items-center gap-2 font-display text-lg font-extrabold">
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground">H</span> HubFlow
                    </p>
                    <p className="mt-3 max-w-xs text-sm text-[#b8c0ca]">Gestão simples para MEIs, autônomos e pequenos negócios. Menos tempo organizando, mais tempo fazendo crescer.</p>
                </div>
                <div className="text-sm">
                    <p className="font-display font-bold text-white">Plataforma</p>
                    <ul className="mt-4 space-y-2.5 text-[#b8c0ca]">
                        <li><a href="#beneficios" className="transition hover:text-white">Benefícios</a></li>
                        <li><a href="#como-funciona" className="transition hover:text-white">Como funciona</a></li>
                        <li><a href="#modulos" className="transition hover:text-white">Módulos</a></li>
                        <li><a href="#precos" className="transition hover:text-white">Preços</a></li>
                    </ul>
                </div>
                <div className="text-sm">
                    <p className="font-display font-bold text-white">Conta</p>
                    <ul className="mt-4 space-y-2.5 text-[#b8c0ca]">
                        <li><Link to="/cadastro" className="transition hover:text-white">Criar conta</Link></li>
                        <li><Link to="/login" className="transition hover:text-white">Entrar</Link></li>
                        <li><a href="#faq" className="transition hover:text-white">Dúvidas</a></li>
                    </ul>
                </div>
                <div className="text-sm">
                    <p className="font-display font-bold text-white">Contato</p>
                    <ul className="mt-4 space-y-2.5 text-[#b8c0ca]">
                        <li><a href="mailto:contato@hubflow.com.br" className="transition hover:text-white">contato@hubflow.com.br</a></li>
                        <li>Atendimento seg. a sex., 9h às 18h</li>
                        <li><Link to="/termos-de-uso" className="transition hover:text-white">Termos de Uso</Link></li>
                        <li><Link to="/politica-de-privacidade" className="transition hover:text-white">Política de Privacidade</Link></li>
                    </ul>
                </div>
            </div>
            <div className="flex flex-col items-center justify-between gap-3 border-t border-white/10 px-5 py-5 text-center text-xs text-[#b8c0ca] sm:flex-row sm:text-left">
                <span>© {new Date().getFullYear()} HubFlow. Todos os direitos reservados.</span>
                <div className="flex items-center gap-4">
                    <Link to="/termos-de-uso" className="transition hover:text-white">Termos de Uso</Link>
                    <Link to="/politica-de-privacidade" className="transition hover:text-white">Política de Privacidade</Link>
                </div>
            </div>
        </footer>
    </div>
);

export default LandingPage;

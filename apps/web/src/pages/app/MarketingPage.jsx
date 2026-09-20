import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Helmet } from 'react-helmet';
import { Sparkles, Wand2, Megaphone, MessageSquare, Copy, Check, RefreshCw, Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/CrudPanel';
import { useIntegratedAi } from '@/hooks/use-integrated-ai';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const MODES = [
    { id: 'descricao', icon: Wand2, label: 'Melhorar descrição', hint: 'Transforme uma descrição simples em uma descrição profissional do serviço.' },
    { id: 'divulgacao', icon: Megaphone, label: 'Criar divulgação', hint: 'Gere um texto de divulgação atrativo e honesto para redes sociais ou WhatsApp.' },
    { id: 'mensagem', icon: MessageSquare, label: 'Criar mensagem para cliente', hint: 'Gere mensagens de atendimento prontas para revisar e enviar.' },
];

const MESSAGE_TYPES = [
    'Envio de orçamento',
    'Confirmação de visita',
    'Confirmação de serviço',
    'Conclusão do serviço',
    'Cobrança amigável',
    'Agradecimento',
];

const PLACEHOLDERS = {
    descricao: 'Ex.: Instalação de 3 tomadas.',
    divulgacao: 'Descreva o serviço que quer divulgar. Ex.: Manutenção de ar-condicionado split.',
    mensagem: 'Contexto do atendimento. Ex.: Orçamento de R$ 320, visita agendada para amanhã às 9h.',
};

const MarketingPage = () => {
    const { messages, isStreaming, isLoadingHistory, sendMessage, clearMessages } = useIntegratedAi();
    const [mode, setMode] = useState('descricao');
    const [msgType, setMsgType] = useState(MESSAGE_TYPES[0]);
    const [input, setInput] = useState('');
    const [edited, setEdited] = useState('');
    const [copied, setCopied] = useState(false);
    const prevStreaming = useRef(false);

    const lastAssistant = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant') return messages[i];
        }
        return null;
    }, [messages]);

    // Sync the editable result when a generation finishes.
    useEffect(() => {
        if (prevStreaming.current && !isStreaming && lastAssistant?.content) {
            setEdited(lastAssistant.content);
        }
        prevStreaming.current = isStreaming;
    }, [isStreaming, lastAssistant]);

    const liveResult = lastAssistant?.content || '';
    const displayValue = isStreaming ? liveResult : (edited || liveResult);

    const generate = async () => {
        const text = input.trim();
        if (!text || isStreaming) return;
        setEdited('');
        setCopied(false);
        let prompt;
        if (mode === 'descricao') {
            prompt = `[MODO: Melhorar descrição]\nDescrição fornecida: "${text}"\nReescreva como uma descrição profissional, clara e objetiva do serviço, sem inventar informações.`;
        } else if (mode === 'divulgacao') {
            prompt = `[MODO: Criar divulgação]\nServiço/descrição: "${text}"\nCrie um texto de divulgação profissional, atrativo e honesto, pronto para redes sociais ou WhatsApp. Não invente condições.`;
        } else {
            prompt = `[MODO: Criar mensagem para cliente]\nTipo de mensagem: ${msgType}\nContexto: "${text}"\nCrie uma mensagem profissional e cordial. Use [NOME DO CLIENTE] onde o nome deve aparecer. Não invente valores.`;
        }
        try {
            await sendMessage(prompt);
        } catch (err) {
            toast({ title: 'Não foi possível gerar o texto', description: err?.message, variant: 'destructive' });
        }
    };

    const copy = async () => {
        const out = (edited || liveResult || '').trim();
        if (!out) return;
        try {
            await navigator.clipboard.writeText(out);
            setCopied(true);
            toast({ title: 'Texto copiado' });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({ title: 'Não foi possível copiar', variant: 'destructive' });
        }
    };

    const reset = () => {
        setEdited('');
        setInput('');
        clearMessages();
        setCopied(false);
    };

    const activeMode = MODES.find((m) => m.id === mode);

    return (
        <div>
            <Helmet>
                <title>Marketing com IA — HubFlow</title>
                <meta name="description" content="Gere descrições profissionais, divulgações e mensagens para clientes com inteligência artificial. Revise e edite antes de usar." />
            </Helmet>

            <PageHeader
                title="Marketing com IA"
                description="Gere textos profissionais para o seu serviço. Revise e edite antes de usar — nada é publicado ou enviado automaticamente."
            />

            {/* Seleção de modo */}
            <div className="grid gap-3 sm:grid-cols-3">
                {MODES.map((m) => (
                    <button
                        key={m.id}
                        type="button"
                        onClick={() => { setMode(m.id); reset(); }}
                        className={cn(
                            'hf-card flex items-start gap-3 p-5 text-left transition hover:-translate-y-0.5',
                            mode === m.id ? 'border-primary ring-2 ring-primary/20' : '',
                        )}
                    >
                        <span className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-xl', mode === m.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary')}>
                            <m.icon className="h-5 w-5" strokeWidth={1.8} />
                        </span>
                        <div>
                            <p className="font-display text-sm font-bold">{m.label}</p>
                            <p className="mt-1 text-xs text-muted-foreground">{m.hint}</p>
                        </div>
                    </button>
                ))}
            </div>

            {/* Formulário */}
            <div className="hf-card mt-6 p-6">
                {mode === 'mensagem' && (
                    <div className="mb-4 grid gap-2">
                        <label className="text-sm font-semibold">Tipo de mensagem</label>
                        <select
                            value={msgType}
                            onChange={(e) => setMsgType(e.target.value)}
                            className="min-h-[44px] max-w-sm rounded-xl border border-input bg-background px-3 text-sm outline-none focus:border-primary"
                        >
                            {MESSAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                )}

                <label className="text-sm font-semibold">
                    {mode === 'descricao' && 'Descrição do serviço'}
                    {mode === 'divulgacao' && 'Serviço para divulgar'}
                    {mode === 'mensagem' && 'Contexto da mensagem'}
                </label>
                <textarea
                    rows={3}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={PLACEHOLDERS[mode]}
                    className="mt-2 min-h-[88px] w-full rounded-xl border border-input bg-background p-3 text-sm outline-none focus:border-primary"
                />

                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={generate}
                        disabled={!input.trim() || isStreaming}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
                    >
                        {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        {isStreaming ? 'Gerando...' : 'Gerar com IA'}
                    </button>
                    {(liveResult || edited) && !isStreaming && (
                        <button
                            type="button"
                            onClick={reset}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                        >
                            <RefreshCw className="h-4 w-4" /> Novo texto
                        </button>
                    )}
                </div>
            </div>

            {/* Resultado */}
            {(isStreaming || liveResult || edited) && (
                <div className="hf-card mt-6 p-6">
                    <div className="mb-3 flex items-center justify-between">
                        <p className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground">
                            {isStreaming ? 'Gerando...' : 'Resultado — revise e edite'}
                        </p>
                        {!isStreaming && (edited || liveResult) && (
                            <button
                                type="button"
                                onClick={copy}
                                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary"
                            >
                                {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
                                {copied ? 'Copiado' : 'Copiar'}
                            </button>
                        )}
                    </div>
                    <textarea
                        rows={10}
                        value={displayValue}
                        readOnly={isStreaming}
                        onChange={(e) => setEdited(e.target.value)}
                        placeholder={isStreaming ? '' : 'O texto gerado aparecerá aqui para você revisar e editar.'}
                        className="w-full rounded-xl border border-input bg-background p-4 text-sm leading-relaxed outline-none focus:border-primary"
                    />
                    {!isStreaming && (edited || liveResult) && (
                        <p className="mt-3 text-xs text-muted-foreground">
                            Este texto é apenas uma sugestão editável. Nada é publicado ou enviado automaticamente.
                        </p>
                    )}
                </div>
            )}

            {isLoadingHistory && (
                <p className="mt-4 text-sm text-muted-foreground">Carregando...</p>
            )}
        </div>
    );
};

export default MarketingPage;

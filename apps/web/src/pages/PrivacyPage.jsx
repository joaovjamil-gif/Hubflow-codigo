import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const PrivacyPage = () => (
    <main className="min-h-screen bg-background text-foreground">
        <Helmet>
            <title>Política de Privacidade — HubFlow</title>
            <meta name="description" content="Consulte a Política de Privacidade da plataforma HubFlow." />
        </Helmet>
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
            <Link to="/" className="inline-flex items-center font-display text-lg font-extrabold tracking-tight text-primary hover:underline">
                HubFlow
            </Link>
            <article className="mt-12 space-y-8">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">Informações legais</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Política de Privacidade</h1>
                    <p className="mt-4 text-muted-foreground">Última atualização: 17 de agosto de 2026</p>
                </header>
                <section className="space-y-4 leading-7 text-muted-foreground">
                    <h2 className="font-display text-2xl font-bold text-foreground">1. Dados que utilizamos</h2>
                    <p>O HubFlow utiliza os dados fornecidos por você, como nome, e-mail, dados do negócio e informações registradas na plataforma, para disponibilizar os recursos de gestão contratados.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">2. Uso e proteção</h2>
                    <p>Usamos essas informações para autenticar sua conta, organizar seus registros e melhorar a experiência no HubFlow. Adotamos medidas técnicas e administrativas para proteger os dados contra acesso não autorizado.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">3. Seus direitos</h2>
                    <p>Você pode solicitar informações sobre o tratamento dos seus dados ou esclarecer dúvidas sobre privacidade pelo e-mail contato@hubflow.com.br.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">4. Atualizações</h2>
                    <p>Esta política pode ser atualizada para refletir melhorias da plataforma ou mudanças legais. A versão mais recente estará sempre disponível nesta página.</p>
                </section>
            </article>
        </div>
    </main>
);

export default PrivacyPage;

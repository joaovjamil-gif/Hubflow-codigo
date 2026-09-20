import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';

const TermsPage = () => (
    <main className="min-h-screen bg-background text-foreground">
        <Helmet>
            <title>Termos de Uso — HubFlow</title>
            <meta name="description" content="Consulte os Termos de Uso da plataforma HubFlow." />
        </Helmet>
        <div className="mx-auto max-w-3xl px-5 py-12 sm:py-20">
            <Link to="/" className="inline-flex items-center font-display text-lg font-extrabold tracking-tight text-primary hover:underline">
                HubFlow
            </Link>
            <article className="mt-12 space-y-8">
                <header>
                    <p className="text-sm font-semibold uppercase tracking-wider text-primary">Informações legais</p>
                    <h1 className="mt-3 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">Termos de Uso</h1>
                    <p className="mt-4 text-muted-foreground">Última atualização: 17 de agosto de 2026</p>
                </header>
                <section className="space-y-4 leading-7 text-muted-foreground">
                    <h2 className="font-display text-2xl font-bold text-foreground">1. Sobre o HubFlow</h2>
                    <p>O HubFlow é uma plataforma de gestão para MEIs, autônomos e pequenos negócios. Ao utilizar a plataforma, você concorda com estes Termos de Uso.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">2. Uso da plataforma</h2>
                    <p>Você é responsável pela veracidade das informações cadastradas, pela segurança das suas credenciais e pelo uso adequado dos recursos disponibilizados.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">3. Planos e disponibilidade</h2>
                    <p>Os planos, valores e condições vigentes são apresentados na página inicial. Recursos de pagamentos e assinaturas ainda estão em desenvolvimento e serão comunicados quando estiverem disponíveis.</p>
                    <h2 className="font-display text-2xl font-bold text-foreground">4. Contato</h2>
                    <p>Em caso de dúvidas sobre estes termos, entre em contato pelo e-mail contato@hubflow.com.br.</p>
                </section>
            </article>
        </div>
    </main>
);

export default TermsPage;

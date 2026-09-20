import React from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import CrudPanel from '@/components/CrudPanel';
import { useCollection } from '@/lib/hubflow';

const fields = [
    { name: 'name', label: 'Nome', required: true },
    { name: 'phone', label: 'Telefone' },
    { name: 'whatsapp', label: 'WhatsApp' },
    { name: 'email', label: 'E-mail' },
    { name: 'document', label: 'CPF/CNPJ' },
    { name: 'address', label: 'Endereço' },
    { name: 'notes', label: 'Observações', type: 'textarea' },
];

const ClientsPage = () => {
    const collection = useCollection('clients');
    return (
        <>
            <Helmet>
                <title>Clientes — HubFlow</title>
                <meta name="description" content="Cadastre e gerencie os clientes do seu negócio com telefone, WhatsApp, documento e observações." />
            </Helmet>
            <CrudPanel
                title="Clientes"
                description="Cadastro completo dos seus clientes."
                addLabel="Novo cliente"
                collection={collection}
                fields={fields}
                searchKeys={['name', 'phone', 'email', 'document']}
                emptyLabel="Nenhum cliente cadastrado ainda."
                renderItem={(c) => (
                    <Link to={`/app/clientes/${c.id}`} className="block">
                        <p className="font-display font-bold text-foreground hover:text-primary">{c.name}</p>
                        <p className="text-sm text-muted-foreground">
                            {[c.phone, c.email, c.document].filter(Boolean).join(' • ') || 'Sem contato registrado'}
                        </p>
                    </Link>
                )}
            />
        </>
    );
};

export default ClientsPage;

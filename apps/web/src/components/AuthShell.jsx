import React from 'react';
import { Link } from 'react-router-dom';

const AuthShell = ({ title, subtitle, children }) => (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-primary p-12 text-primary-foreground lg:flex">
            <Link to="/" className="flex items-center gap-2 font-display text-xl font-extrabold">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-foreground text-primary">H</span> HubFlow
            </Link>
            <div>
                <p className="font-display text-3xl font-extrabold leading-tight">
                    Menos tempo organizando, mais tempo fazendo seu negócio crescer.
                </p>
                <p className="mt-4 max-w-md text-primary-foreground/80">
                    Clientes, orçamentos, ordens de serviço, agenda e financeiro em um só lugar.
                </p>
            </div>
            <p className="text-sm text-primary-foreground/60">© {new Date().getFullYear()} HubFlow</p>
        </div>
        <div className="flex items-center justify-center px-5 py-12">
            <div className="w-full max-w-md">
                <Link to="/" className="mb-8 flex items-center gap-2 font-display text-xl font-extrabold lg:hidden">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-primary-foreground">H</span> HubFlow
                </Link>
                <h1 className="font-display text-3xl font-extrabold tracking-tight">{title}</h1>
                <p className="mb-8 mt-2 text-muted-foreground">{subtitle}</p>
                {children}
            </div>
        </div>
    </div>
);

export default AuthShell;

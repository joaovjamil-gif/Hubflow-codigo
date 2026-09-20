import React from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlanProvider } from '@/contexts/PlanContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import AppLayout from '@/components/AppLayout';
import DashboardPage from '@/pages/app/DashboardPage';
import ClientsPage from '@/pages/app/ClientsPage';
import ClientDetailPage from '@/pages/app/ClientDetailPage';
import CatalogPage from '@/pages/app/CatalogPage';
import ServiceModelsPage from '@/pages/app/ServiceModelsPage';
import QuotesPage from '@/pages/app/QuotesPage';
import OrdersPage from '@/pages/app/OrdersPage';
import AgendaPage from '@/pages/app/AgendaPage';
import FinancePage from '@/pages/app/FinancePage';
import StockPage from '@/pages/app/StockPage';
import GoalsPage from '@/pages/app/GoalsPage';
import TrashPage from '@/pages/app/TrashPage';
import SettingsPage from '@/pages/app/SettingsPage';
import MarketingPage from '@/pages/app/MarketingPage';
import CrmPage from '@/pages/app/CrmPage';
import TermsPage from '@/pages/TermsPage';
import PrivacyPage from '@/pages/PrivacyPage';

function App() {
    return (
        <AuthProvider>
            <PlanProvider>
            <Router>
                <ScrollToTop />
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/cadastro" element={<SignupPage />} />
                    <Route path="/termos-de-uso" element={<TermsPage />} />
                    <Route path="/politica-de-privacidade" element={<PrivacyPage />} />
                    <Route
                        path="/app"
                        element={
                            <ProtectedRoute>
                                <AppLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<DashboardPage />} />
                        <Route path="clientes" element={<ClientsPage />} />
                        <Route path="clientes/:id" element={<ClientDetailPage />} />
                        <Route path="catalogo" element={<CatalogPage />} />
                        <Route path="modelos" element={<ServiceModelsPage />} />
                        <Route path="crm" element={<CrmPage />} />
                        <Route path="orcamentos" element={<QuotesPage />} />
                        <Route path="ordens" element={<OrdersPage />} />
                        <Route path="agenda" element={<AgendaPage />} />
                        <Route path="financeiro" element={<FinancePage />} />
                        <Route path="estoque" element={<StockPage />} />
                        <Route path="metas" element={<GoalsPage />} />
                        <Route path="lixeira" element={<TrashPage />} />
                        <Route path="marketing" element={<MarketingPage />} />
                        <Route path="configuracoes" element={<SettingsPage />} />
                    </Route>
                </Routes>
                <Toaster />
            </Router>
            </PlanProvider>
        </AuthProvider>
    );
}

export default App;

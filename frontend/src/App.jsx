/**
 * @fileoverview Componente raÃ­z de la aplicaciÃ³n. Define el Ã¡rbol de rutas y
 * el layout protegido con sidebar y navbar.
 *
 * **Estructura de rutas:**
 * - `/`                  â†’ LandingPage (pÃºblica, sin layout)
 * - `/login`, `/register`â†’ PublicRoute (redirige a /dashboard si ya autenticado)
 * - `/dashboard` y demÃ¡s â†’ ProtectedRoute â†’ ProtectedLayout â†’ pÃ¡gina especÃ­fica
 * - `/espacios-trabajo`  â†’ ademÃ¡s envuelto en NonEmployeeRoute (solo owners/admins)
 *
 * @module App
 */

import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import NonEmployeeRoute from './components/NonEmployeeRoute';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Empleados from './pages/Empleados';
import Empresas from './pages/Empresas';
import Contratos from './pages/Contratos';
import RegistrosSalud from './pages/RegistrosSalud';
import Evaluaciones from './pages/Evaluaciones';
import Contactos from './pages/Contactos';
import Solicitudes from './pages/Solicitudes';
import Liquidaciones from './pages/Liquidaciones';
import Dashboard from './pages/Dashboard';
import Reportes from './pages/Reportes';
import Roles from './pages/Roles';
import EspaciosTrabajo from './pages/EspaciosTrabajo';

/**
 * Layout para rutas protegidas. Incluye sidebar colapsable, overlay mÃ³vil y navbar.
 * Escucha el evento personalizado `toggle-sidebar` emitido por el Navbar para abrir
 * el sidebar en dispositivos mÃ³viles.
 *
 * @param {{ sidebarCollapsed: boolean, setSidebarCollapsed: Function, children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
function ProtectedLayout({ sidebarCollapsed, setSidebarCollapsed, children }) {
    const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);

    /** Escucha el botÃ³n hamburguesa del Navbar para abrir/cerrar el sidebar en mÃ³vil. */
    useEffect(() => {
        const handler = () => setSidebarMobileOpen(prev => !prev);
        window.addEventListener('toggle-sidebar', handler);
        return () => window.removeEventListener('toggle-sidebar', handler);
    }, []);

    /** Cierra el sidebar mÃ³vil al cambiar de pÃ¡gina (cuando `children` cambia). */
    useEffect(() => {
        setSidebarMobileOpen(false);
    }, [children]);

    return (
        <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            {/* Overlay oscuro detrÃ¡s del sidebar en mÃ³vil */}
            {sidebarMobileOpen && (
                <div
                    className="sidebar-overlay active"
                    onClick={() => setSidebarMobileOpen(false)}
                />
            )}
            <Sidebar
                isCollapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobileOpen={sidebarMobileOpen}
                onMobileClose={() => setSidebarMobileOpen(false)}
            />
            <main className="main-content">
                <Navbar />
                <div className="page-container">
                    {children}
                </div>
            </main>
        </div>
    );
}

/**
 * Componente raÃ­z de la aplicaciÃ³n.
 * Provee el `AuthProvider` y define el Ã¡rbol completo de rutas con React Router.
 *
 * @returns {JSX.Element}
 */
function App() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <AuthProvider>
            <Routes>
                {/* Ruta pÃºblica sin layout */}
                <Route path="/" element={<LandingPage />} />

                {/* Rutas de auth â€” redirigen a /dashboard si ya autenticado */}
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

                {/* Rutas protegidas con layout */}
                <Route element={<ProtectedRoute />}>
                    <Route path="/dashboard" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Dashboard />
                        </ProtectedLayout>
                    } />
                    <Route path="/reportes" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Reportes />
                        </ProtectedLayout>
                    } />
                    {/* Solo owners/admins pueden gestionar espacios de trabajo */}
                    <Route path="/espacios-trabajo" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <NonEmployeeRoute><EspaciosTrabajo /></NonEmployeeRoute>
                        </ProtectedLayout>
                    } />
                    <Route path="/empleados" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Empleados />
                        </ProtectedLayout>
                    } />
                    <Route path="/empresas" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Empresas />
                        </ProtectedLayout>
                    } />
                    <Route path="/contratos" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Contratos />
                        </ProtectedLayout>
                    } />
                    <Route path="/registros-salud" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <RegistrosSalud />
                        </ProtectedLayout>
                    } />
                    <Route path="/evaluaciones" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Evaluaciones />
                        </ProtectedLayout>
                    } />
                    <Route path="/contactos" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Contactos />
                        </ProtectedLayout>
                    } />
                    <Route path="/solicitudes" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Solicitudes />
                        </ProtectedLayout>
                    } />
                    <Route path="/liquidaciones" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Liquidaciones />
                        </ProtectedLayout>
                    } />
                    <Route path="/roles" element={
                        <ProtectedLayout sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed}>
                            <Roles />
                        </ProtectedLayout>
                    } />
                </Route>
            </Routes>
        </AuthProvider>
    );
}

export default App;


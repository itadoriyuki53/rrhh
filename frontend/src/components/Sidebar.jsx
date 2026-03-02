/**
 * @fileoverview Menú lateral de navegación con control de permisos por módulo.
 * @module components/Sidebar
 */

import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Sidebar
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isCollapsed - Estado de colapso de la barra.
 * @param {Function} props.onToggle - Función para alternar el colapso.
 * @param {boolean} [props.isMobileOpen=false] - Indica si está abierto en vista móvil (overlay).
 * @param {Function} [props.onMobileClose] - Función para cerrar el menú en móvil.
 * @returns {JSX.Element}
 */
const Sidebar = ({ isCollapsed, onToggle, isMobileOpen = false, onMobileClose }) => {
    const { isDark, toggleTheme } = useTheme();
    const { user } = useAuth();

    // Permisos de los módulos
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canReadEmpleados = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'empleados' && p.accion === 'leer');
    const canReadEmpresas = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'empresas' && p.accion === 'leer');
    const canReadContratos = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'contratos' && p.accion === 'leer');
    const canReadSalud = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'registros_salud' && p.accion === 'leer');
    const canReadEvaluaciones = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'leer');
    const canReadContactos = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'contactos' && p.accion === 'leer');
    const canReadSolicitudes = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'leer');
    const canReadLiquidaciones = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'liquidaciones' && p.accion === 'leer');
    const canReadRoles = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'roles' && p.accion === 'leer');
    const canReadReportes = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'reportes' && p.accion === 'leer');

    const handleNavClick = () => {
        if (onMobileClose) onMobileClose();
    };

    return (
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'open' : ''}`}>

            <div className="sidebar-header">
                <div className="sidebar-logo">
                    <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                {!isCollapsed && <h1 className="sidebar-title">Cataratas<span>RH</span></h1>}
                <button className="sidebar-toggle" onClick={onToggle} title={isCollapsed ? 'Expandir' : 'Colapsar'}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        {isCollapsed ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                        )}
                    </svg>
                </button>
            </div>

            <nav className="sidebar-nav" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} onClick={handleNavClick}>
                <NavLink
                    to="/dashboard"
                    className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    title="Dashboard"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                    </svg>
                    {!isCollapsed && <span>Dashboard</span>}
                </NavLink>

                {user && !user.esEmpleado && (
                    <NavLink
                        to="/espacios-trabajo"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Espacios de Trabajo"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                        </svg>
                        {!isCollapsed && <span>Espacios</span>}
                    </NavLink>
                )}

                {canReadEmpleados && (
                    <NavLink
                        to="/empleados"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Empleados"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        {!isCollapsed && <span>Empleados</span>}
                    </NavLink>
                )}

                {canReadEmpresas && (
                    <NavLink
                        to="/empresas"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Empresas"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                        {!isCollapsed && <span>Empresas</span>}
                    </NavLink>
                )}

                {canReadContratos && (
                    <NavLink
                        to="/contratos"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Contratos"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                        {!isCollapsed && <span>Contratos</span>}
                    </NavLink>
                )}

                {canReadSalud && (
                    <NavLink
                        to="/registros-salud"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Registros de Salud"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
                        </svg>
                        {!isCollapsed && <span>Salud</span>}
                    </NavLink>
                )}

                {canReadEvaluaciones && (
                    <NavLink
                        to="/evaluaciones"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Evaluaciones"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        {!isCollapsed && <span>Evaluaciones</span>}
                    </NavLink>
                )}

                {canReadContactos && (
                    <NavLink
                        to="/contactos"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Contactos"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                        </svg>
                        {!isCollapsed && <span>Contactos</span>}
                    </NavLink>
                )}

                {canReadSolicitudes && (
                    <NavLink
                        to="/solicitudes"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Solicitudes"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25V6.108" />
                        </svg>
                        {!isCollapsed && <span>Solicitudes</span>}
                    </NavLink>
                )}

                {canReadLiquidaciones && (
                    <NavLink
                        to="/liquidaciones"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Liquidaciones"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                        </svg>
                        {!isCollapsed && <span>Liquidaciones</span>}
                    </NavLink>
                )}

                {canReadRoles && (
                    <NavLink
                        to="/roles"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Roles y Permisos"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                        </svg>
                        {!isCollapsed && <span>Roles</span>}
                    </NavLink>
                )}

                {canReadReportes && (
                    <NavLink
                        to="/reportes"
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                        title="Reportes"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        {!isCollapsed && <span>Reportes</span>}
                    </NavLink>
                )}

            </nav>

            <div className="sidebar-footer" style={{ flexShrink: 0 }}>
                <button className="theme-toggle" onClick={toggleTheme} title={isDark ? 'Modo claro' : 'Modo oscuro'}>
                    {isDark ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    )}
                    {!isCollapsed && <span>{isDark ? 'Modo claro' : 'Modo oscuro'}</span>}
                </button>
                {!isCollapsed && (
                    <p className="sidebar-copyright">© 2026 CataratasRH</p>
                )}
            </div>
        </aside>
    );
};

export default Sidebar;


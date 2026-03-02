/**
 * @fileoverview Barra de navegación principal con menú de usuario y selector de contrato.
 * @module components/Navbar
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getContratos } from '../services/api';
import EmpleadoDetail from './EmpleadoDetail';
import EmpleadoWizard from './EmpleadoWizard';
import PerfilUsuarioModal from './PerfilUsuarioModal';
import ConfirmDialog from './ConfirmDialog';
import Alert from './Alert';

/**
 * Componente interno ContractSelect
 * Renderiza un selector personalizado para cambiar entre los diferentes contratos del empleado.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.contratos - Lista de objetos de contrato.
 * @param {number|string} props.selectedId - ID del contrato actualmente seleccionado.
 * @param {Function} props.onChange - Callback al cambiar la selección.
 * @returns {JSX.Element}
 */
const ContractSelect = ({ contratos, selectedId, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    if (contratos.length === 0) {
        return (
            <div style={{ fontSize: '0.8rem', color: 'var(--neutral-400)', fontStyle: 'italic', padding: '0.35rem 0' }}>
                Sin contratos activos
            </div>
        );
    }

    const selected = contratos.find(c => c.id === selectedId);
    const getLabel = (c) => {
        const puesto = c.puestos?.[0]?.nombre || 'Sin Puesto';
        const empresa = c.puestos?.[0]?.departamento?.area?.empresa?.nombre || null;
        return { puesto, empresa, rol: c.rol?.nombre || null };
    };

    const sel = selected ? getLabel(selected) : null;

    return (
        <div ref={ref} style={{ position: 'relative' }}>
            {/* Trigger */}
            <button
                onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                    padding: '0.5rem 0.65rem',
                    border: '1.5px solid var(--neutral-200)',
                    borderRadius: '0.45rem',
                    background: 'var(--neutral-50)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 0.15s',
                    outline: open ? '2px solid var(--primary-color)' : 'none',
                    outlineOffset: '1px',
                }}
            >
                <div style={{ flex: 1, minWidth: 0 }}>
                    {sel ? (
                        <>
                            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {sel.puesto}{sel.empresa ? ` Â· ${sel.empresa}` : ''}
                            </div>
                            {sel.rol && (
                                <div style={{ marginTop: '0.2rem' }}>
                                    <span style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '0.22rem',
                                        fontSize: '0.68rem', fontWeight: 600,
                                        padding: '0.08rem 0.45rem', borderRadius: '9999px',
                                        background: 'rgba(13,148,136,0.1)', color: '#0d9488',
                                        border: '1px solid rgba(13,148,136,0.2)',
                                    }}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 9, height: 9 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                        </svg>
                                        {sel.rol}
                                    </span>
                                </div>
                            )}
                        </>
                    ) : (
                        <span style={{ fontSize: '0.82rem', color: 'var(--neutral-400)' }}>Seleccionar contrato...</span>
                    )}
                </div>
                {/* Chevron */}
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                    style={{ width: 14, height: 14, color: 'var(--neutral-400)', flexShrink: 0, transition: 'transform 0.15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
            </button>

            {/* Dropdown */}
            {open && (
                <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--card-bg, #fff)',
                    border: '1.5px solid var(--neutral-200)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    zIndex: 9999,
                    overflow: 'hidden',
                    animation: 'fadeInDown 0.12s ease',
                }}>
                    {contratos.map((c, i) => {
                        const { puesto, empresa, rol } = getLabel(c);
                        const isSelected = c.id === selectedId;
                        return (
                            <button
                                key={c.id}
                                onClick={(e) => { e.stopPropagation(); onChange(c.id); setOpen(false); }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    width: '100%',
                                    padding: '0.6rem 0.75rem',
                                    background: isSelected ? 'rgba(var(--primary-rgb, 99,102,241), 0.07)' : 'transparent',
                                    border: 'none',
                                    borderBottom: i < contratos.length - 1 ? '1px solid var(--neutral-100)' : 'none',
                                    cursor: 'pointer',
                                    textAlign: 'left',
                                    transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--neutral-50)'; }}
                                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                            >
                                {/* Check icon */}
                                <div style={{ width: 16, flexShrink: 0, color: isSelected ? 'var(--primary-color)' : 'transparent' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
                                        <path fillRule="evenodd" d="M19.916 4.626a.75.75 0 01.208 1.04l-9 13.5a.75.75 0 01-1.154.114l-6-6a.75.75 0 011.06-1.06l5.353 5.353 8.493-12.739a.75.75 0 011.04-.208z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {puesto}{empresa ? ` Â· ${empresa}` : ''}
                                    </div>
                                    {rol && (
                                        <div style={{ marginTop: '0.2rem' }}>
                                            <span style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '0.22rem',
                                                fontSize: '0.68rem', fontWeight: 600,
                                                padding: '0.08rem 0.45rem', borderRadius: '9999px',
                                                background: 'rgba(13,148,136,0.1)', color: '#0d9488',
                                                border: '1px solid rgba(13,148,136,0.2)',
                                            }}>
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 9, height: 9 }}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                                </svg>
                                                {rol}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

/**
 * Componente Navbar
 * Barra superior que contiene el disparador del sidebar móvil, 
 * información del usuario, selector de contrato y cierre de sesión.
 * 
 * @returns {JSX.Element}
 */
const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout, checkAuth, seleccionarContrato } = useAuth();

    const [showMenu, setShowMenu] = useState(false);
    const [contratos, setContratos] = useState([]);
    const [showProfile, setShowProfile] = useState(false);
    const [showEditWizard, setShowEditWizard] = useState(false);
    const [showPerfilModal, setShowPerfilModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [globalSuccessAlert, setGlobalSuccessAlert] = useState('');
    const [avatarPath, setAvatarPath] = useState('');
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    if (!user) return null;

    useEffect(() => {
        if (!user) return;
        const genero = user.genero?.toLowerCase() || 'otro';
        const randomIndex = Math.floor(Math.random() * 3) + 1;
        setAvatarPath(`/avatares/${genero}/${genero}${randomIndex}.jpg`);

        if (user.esEmpleado && user.empleadoId) {
            getContratos({ empleadoId: user.empleadoId, activo: true })
                .then(res => setContratos(res.data || []))
                .catch(console.error);
        } else {
            setContratos([]);
        }
    }, [user]);

    /**
     * Gestiona el cambio de contrato activo del usuario empleado.
     * 
     * @async
     * @param {number|string} id - ID del contrato a seleccionar.
     * @returns {Promise<void>}
     */
    const handleContractChange = async (id) => {
        try {
            await seleccionarContrato(id);
        } catch (err) {
            console.error('Failed to select contract', err);
        }
    };

    /**
     * Trunca un nombre largo para evitar desbordes en la UI.
     * 
     * @param {string} name - Nombre completo.
     * @param {number} [maxLength=20] - Longitud máxima permitida.
     * @returns {string} Nombre truncado.
     */
    const truncateName = (name, maxLength = 20) => {
        if (!name) return '';
        return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
    };

    const fullName = `${user.nombre} ${user.apellido}`;
    const displayName = truncateName(fullName);
    const role = user.esAdministrador ? 'Administrador' : 'Usuario';

    const handleViewProfile = () => { setShowMenu(false); setShowProfile(true); };
    const handleEditProfile = () => {
        setShowProfile(false);
        if (user.esEmpleado) {
            // Empleado â†’ wizard de empleado
            setShowEditWizard(true);
        } else {
            // Propietario (no empleado) â†’ modal de ediciÃ³n de perfil
            setShowPerfilModal(true);
        }
    };
    const handleEditSuccess = async () => {
        setShowEditWizard(false);
        await checkAuth();
        setGlobalSuccessAlert('Perfil actualizado correctamente');
    };
    const handlePerfilSuccess = async () => {
        await checkAuth();
        setGlobalSuccessAlert('Perfil actualizado correctamente');
    };
    const handleLogoutClick = () => { setShowMenu(false); setShowLogoutConfirm(true); };
    const handleConfirmLogout = async () => {
        try { await logout(); navigate('/login'); }
        catch (error) { console.error('Error al cerrar sesiÃ³n:', error); }
    };

    /**
     * Dispara un evento personalizado para alternar la visibilidad del sidebar en móviles.
     * 
     * @returns {void}
     */
    const toggleSidebar = () => {
        // Dispatch custom event for sidebar toggle on mobile
        window.dispatchEvent(new CustomEvent('toggle-sidebar'));
    };

    return (
        <>
            {globalSuccessAlert && (
                <Alert
                    type="success"
                    message={globalSuccessAlert}
                    onClose={() => setGlobalSuccessAlert('')}
                    duration={3000}
                />
            )}
            <nav className="navbar">
                <div className="navbar-content">
                    <div className="navbar-left">
                        <button
                            className="navbar-menu-btn"
                            onClick={toggleSidebar}
                            aria-label="Abrir menÃº"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>

                    <div className="navbar-right">
                        <div className="user-menu-wrapper" ref={menuRef}>
                            <button
                                className="user-menu-trigger"
                                onClick={() => setShowMenu(!showMenu)}
                                aria-label="MenÃº de usuario"
                            >
                                <img
                                    src={avatarPath}
                                    alt="Avatar"
                                    className="user-avatar"
                                    onError={(e) => { e.target.src = '/avatares/otro/otro1.jpg'; }}
                                />
                                <div className="user-info">
                                    <span className="user-name">{displayName}</span>
                                    <span className="user-role">{role}</span>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"
                                    className={`chevron-icon ${showMenu ? 'rotated' : ''}`}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {showMenu && (
                                <div className="user-menu-dropdown">
                                    {/* Selector de contrato */}
                                    <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--neutral-200)', minWidth: '270px' }}>
                                        <label style={{ display: 'block', fontSize: '0.70rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--neutral-500)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                                            Contrato Activo
                                        </label>
                                        <ContractSelect
                                            contratos={contratos}
                                            selectedId={user.ultimoContratoSeleccionadoId}
                                            onChange={handleContractChange}
                                        />
                                    </div>

                                    <button className="menu-item" onClick={handleViewProfile}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                        </svg>
                                        Ver informaciÃ³n
                                    </button>
                                    <div className="menu-divider"></div>
                                    <button className="menu-item menu-item-danger" onClick={handleLogoutClick}>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                                        </svg>
                                        Cerrar sesiÃ³n
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {showProfile && user && (
                <EmpleadoDetail
                    empleado={user}
                    onClose={() => setShowProfile(false)}
                    onEdit={handleEditProfile}
                    hideEditButton={false}
                />
            )}

            {showEditWizard && user && (
                <EmpleadoWizard
                    empleado={user}
                    onClose={() => setShowEditWizard(false)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {showPerfilModal && user && (
                <PerfilUsuarioModal
                    user={user}
                    onClose={() => setShowPerfilModal(false)}
                    onSuccess={handlePerfilSuccess}
                />
            )}

            <ConfirmDialog
                isOpen={showLogoutConfirm}
                title="Cerrar sesiÃ³n"
                message="Â¿EstÃ¡s seguro de que deseas cerrar sesiÃ³n?"
                onConfirm={handleConfirmLogout}
                onCancel={() => setShowLogoutConfirm(false)}
                confirmText="Cerrar sesiÃ³n"
                variant="danger"
            />
        </>
    );
};

export default Navbar;


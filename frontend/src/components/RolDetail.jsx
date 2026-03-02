/**
 * @fileoverview Vista detallada de un rol del sistema, mostrando todos sus permisos asignados.
 * @module components/RolDetail
 */

import { useAuth } from '../context/AuthContext';

// Icons SVG components
const Icons = {
    calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    ),
    clock: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    edit: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    ),
    shield: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    document: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
};

/**
 * Componente RolDetail
 * Muestra el nombre, descripción y una matriz completa de permisos del rol.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.rol - Objeto rol con sus permisos.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir la edición del rol.
 * @returns {JSX.Element|null}
 */
const RolDetail = ({ rol, onClose, onEdit }) => {
    if (!rol) return null;

    // Permisos del mÃ³dulo roles
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'roles' && p.accion === 'actualizar');

    const primaryColor = '#0d9488';

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleString('es-AR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate relative time
    const getRelativeTime = (dateString) => {
        if (!dateString) return 'fecha desconocida';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMinutes < 1) return 'menos de un minuto';
        if (diffMinutes < 60) return `${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
        if (diffHours < 24) return `${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
        return `${diffDays} dÃ­a${diffDays !== 1 ? 's' : ''}`;
    };

    const getModuloLabel = (modulo) => {
        const labels = {
            empleados: 'Empleados',
            empresas: 'Empresas',
            contratos: 'Contratos',
            registros_salud: 'Registros de Salud',
            evaluaciones: 'Evaluaciones',
            contactos: 'Contactos',
            solicitudes: 'Solicitudes',
            liquidaciones: 'Liquidaciones',
            roles: 'Roles y Permisos',
            reportes: 'Reportes',
        };
        return labels[modulo] || modulo;
    };

    const getAccionLabel = (accion) => {
        const labels = {
            crear: 'Crear',
            leer: 'Leer',
            actualizar: 'Actualizar',
            eliminar: 'Eliminar',
        };
        return labels[accion] || accion;
    };

    const getAccionColor = (accion) => {
        const colors = {
            crear: '#10b981',
            leer: '#3b82f6',
            actualizar: '#f59e0b',
            eliminar: '#ef4444',
        };
        return colors[accion] || '#6b7280';
    };

    // Agrupar permisos por mÃ³dulo
    const permisosAgrupados = (rol.permisos || []).reduce((acc, permiso) => {
        if (!acc[permiso.modulo]) {
            acc[permiso.modulo] = [];
        }
        acc[permiso.modulo].push(permiso);
        return acc;
    }, {});

    // Field component with icon
    const Field = ({ icon, label, value }) => (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border-color)'
        }}>
            <div style={{
                color: 'var(--primary-color)',
                flexShrink: 0,
                marginTop: '2px'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.25rem'
                }}>
                    {label}
                </div>
                <div style={{
                    fontWeight: 500,
                    color: 'var(--text-primary)',
                    wordBreak: 'break-word'
                }}>
                    {value || '-'}
                </div>
            </div>
        </div>
    );

    // Section header component
    const SectionHeader = ({ title, subtitle }) => (
        <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--primary-color)'
            }}>
                <span style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)'
                }}>
                    {title}
                </span>
                {subtitle && (
                    <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)'
                    }}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle del Rol</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Rol name + ID + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {rol.nombre}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{rol.id}
                            </span>
                        </div>
                        {onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(rol)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(rol.updatedAt)}`} />
                        <div className="activity-log-grid">
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>{Icons.calendar}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Fecha de CreaciÃ³n
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(rol.createdAt)}
                                    </div>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: rol.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Estado en Sistema
                                    </div>
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.8rem',
                                        padding: '0.3rem 0.7rem',
                                        borderRadius: '9999px',
                                        background: rol.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: rol.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {rol.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>{Icons.clock}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Ãšltima ModificaciÃ³n
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(rol.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Two-column layout */}
                    <div className="detail-grid-2col">
                        {/* Left Column: InformaciÃ³n BÃ¡sica */}
                        <div>
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(rol.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0.5rem 1rem'
                            }}>
                                <Field icon={Icons.shield} label="Nombre" value={rol.nombre} />
                                <Field icon={Icons.document} label="DescripciÃ³n" value={rol.descripcion} />
                            </div>
                        </div>

                        {/* Right Column: Permisos en Tabla */}
                        <div>
                            <SectionHeader title="Permisos Asignados" subtitle={`Total de Accion(es) Permitida(s): ${rol.permisos?.length || 0}`} />

                            {Object.keys(permisosAgrupados).length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem',
                                    color: 'var(--text-secondary)',
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)'
                                }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 48, height: 48, margin: '0 auto 1rem', opacity: 0.5 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                    <p style={{ fontSize: '0.875rem' }}>No hay permisos asignados</p>
                                </div>
                            ) : (
                                <div style={{
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '0.5rem',
                                    overflow: 'hidden',
                                    maxHeight: '400px',
                                    overflowY: 'auto'
                                }}>
                                    <table style={{
                                        width: '100%',
                                        borderCollapse: 'collapse',
                                        fontSize: '0.75rem'
                                    }}>
                                        <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                                            <tr style={{
                                                background: 'var(--bg-secondary)',
                                                borderBottom: '2px solid var(--border-color)'
                                            }}>
                                                <th style={{
                                                    padding: '0.5rem 0.75rem',
                                                    textAlign: 'left',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    MÃ³dulo
                                                </th>
                                                <th style={{
                                                    padding: '0.5rem 0.75rem',
                                                    textAlign: 'center',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    C
                                                </th>
                                                <th style={{
                                                    padding: '0.5rem 0.75rem',
                                                    textAlign: 'center',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    L
                                                </th>
                                                <th style={{
                                                    padding: '0.5rem 0.75rem',
                                                    textAlign: 'center',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    A
                                                </th>
                                                <th style={{
                                                    padding: '0.5rem 0.75rem',
                                                    textAlign: 'center',
                                                    fontWeight: 600,
                                                    color: 'var(--text-primary)',
                                                    fontSize: '0.75rem'
                                                }}>
                                                    E
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const MODULE_ORDER = [
                                                    'empleados',
                                                    'empresas',
                                                    'contratos',
                                                    'registros_salud',
                                                    'evaluaciones',
                                                    'contactos',
                                                    'solicitudes',
                                                    'liquidaciones',
                                                    'roles',
                                                    'reportes'
                                                ];

                                                return MODULE_ORDER.map((modulo, index) => {
                                                    const permisos = permisosAgrupados[modulo];
                                                    if (!permisos) return null;

                                                    const accionesOrdenadas = ['crear', 'leer', 'actualizar', 'eliminar'];

                                                    return (
                                                        <tr key={modulo} style={{
                                                            borderBottom: index < MODULE_ORDER.length - 1 ? '1px solid var(--border-color)' : 'none'
                                                        }}>
                                                            <td style={{
                                                                padding: '0.5rem 0.75rem',
                                                                fontWeight: 500,
                                                                color: 'var(--text-primary)',
                                                                fontSize: '0.75rem'
                                                            }}>
                                                                {getModuloLabel(modulo)}
                                                            </td>
                                                            {accionesOrdenadas.map(accion => {
                                                                const permiso = permisos.find(p => p.accion === accion);
                                                                const color = getAccionColor(accion);

                                                                return (
                                                                    <td key={accion} style={{
                                                                        padding: '0.5rem 0.75rem',
                                                                        textAlign: 'center'
                                                                    }}>
                                                                        {permiso ? (
                                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} style={{ width: 16, height: 16 }}>
                                                                                <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                                                                            </svg>
                                                                        ) : (
                                                                            <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>-</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-footer" style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '1rem 2rem',
                    borderTop: '1px solid var(--border-color)'
                }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RolDetail;


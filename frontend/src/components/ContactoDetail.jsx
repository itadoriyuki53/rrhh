/**
 * @fileoverview Vista detallada de un contacto de empleado (familiar o emergencia).
 * @module components/ContactoDetail
 */

import { formatDateOnly, formatDateTime, formatFullName } from '../helpers/formatters';
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
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    phone: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    ),
    document: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    location: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    heart: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    ),
    shield: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
        </svg>
    ),
    edit: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
    ),
    check: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    x: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
};

const PARENTESCOS = [
    'CÃ³nyuge', 'Padre', 'Madre', 'Hijo/a', 'Hermano/a',
    'Abuelo/a', 'Nieto/a', 'TÃ­o/a', 'Sobrino/a', 'Primo/a',
    'Suegro/a', 'CuÃ±ado/a', 'Yerno', 'Nuera', 'Otro'
];

/**
 * Componente ContactoDetail
 * 
 * Muestra la información completa de un contacto, incluyendo su relación con el empleado,
 * datos de contacto, ubicación e información adicional como discapacidad o dependencia.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.contacto - Objeto contacto con sus relaciones pobladas.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir la edición.
 * @returns {JSX.Element|null}
 */
const ContactoDetail = ({ contacto, onClose, onEdit }) => {
    if (!contacto) return null;

    // Permisos del mÃ³dulo contactos
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'contactos' && p.accion === 'actualizar');

    // Calculate relative time (hace X minutos/horas/dÃ­as)
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

    // Boolean field component
    const BooleanField = ({ icon, label, value }) => (
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    color: value ? '#15803d' : 'var(--text-secondary)',
                    fontWeight: 500
                }}>
                    {value ? Icons.check : Icons.x}
                    {value ? 'SÃ­' : 'No'}
                </div>
            </div>
        </div>
    );

    // Section header component with optional subtitle
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

    // Badge component
    const Badge = ({ label, color }) => (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem',
            fontSize: '0.75rem',
            padding: '0.25rem 0.6rem',
            borderRadius: '9999px',
            background: color === 'green' ? 'rgba(21, 128, 61, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: color === 'green' ? '#15803d' : '#3b82f6',
            fontWeight: 600
        }}>
            {label}
        </span>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle del Contacto</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Contact name + badges + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {contacto.nombreCompleto}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{contacto.id}
                            </span>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {contacto.esFamiliar && <Badge label="Familiar" color="green" />}
                                {contacto.esContactoEmergencia && <Badge label="Emergencia" color="blue" />}
                            </div>
                        </div>
                        {onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(contacto)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.updatedAt)}`} />
                        <div className="activity-log-grid">
                            {/* Fecha de CreaciÃ³n */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>
                                    {Icons.calendar}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Fecha de CreaciÃ³n
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(contacto.createdAt)}
                                    </div>
                                </div>
                            </div>
                            {/* Estado en Sistema */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem',
                                borderRight: '1px solid var(--border-color)'
                            }}>
                                <div style={{ color: contacto.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: contacto.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: contacto.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {contacto.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            {/* Ãšltima ModificaciÃ³n */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                padding: '0.75rem 1rem'
                            }}>
                                <div style={{ color: 'var(--primary-color)', flexShrink: 0 }}>
                                    {Icons.clock}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                        Ãšltima ModificaciÃ³n
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(contacto.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Datos del Contacto */}
                        <div>
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <Field icon={Icons.user} label="Nombre Completo" value={contacto.nombreCompleto} />
                                <Field icon={Icons.document} label="DNI" value={contacto.dni} />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.users}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Tipo de Contacto</div>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {contacto.esFamiliar && <Badge label="Familiar" color="green" />}
                                            {contacto.esContactoEmergencia && <Badge label="Emergencia" color="blue" />}
                                        </div>
                                    </div>
                                </div>
                                <Field icon={Icons.heart} label="Parentesco" value={contacto.parentesco} />
                            </div>

                            {/* Contacto */}
                            <SectionHeader title="Contacto" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <Field icon={Icons.phone} label="TelÃ©fono Principal" value={contacto.telefonoPrincipal} />
                                <Field icon={Icons.phone} label="TelÃ©fono Secundario" value={contacto.telefonoSecundario} />
                            </div>

                            {/* UbicaciÃ³n */}
                            <SectionHeader title="UbicaciÃ³n" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field icon={Icons.location} label="DirecciÃ³n" value={contacto.direccion} />
                            </div>
                        </div>

                        {/* Column 2: Empleado + InformaciÃ³n Adicional */}
                        <div>
                            {/* Empleado Asociado */}
                            <SectionHeader title="Datos del Empleado" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.empleado?.updatedAt || contacto.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <Field
                                    icon={Icons.user}
                                    label="Empleado"
                                    value={formatFullName(contacto.empleado)}
                                />
                                <Field
                                    icon={Icons.document}
                                    label="Documento Empleado"
                                    value={contacto.empleado?.numeroDocumento}
                                />
                            </div>

                            {/* InformaciÃ³n Adicional */}
                            <SectionHeader title="InformaciÃ³n Adicional" subtitle={`Ãšltimos cambios hace ${getRelativeTime(contacto.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field icon={Icons.calendar} label="Fecha de Nacimiento" value={formatDateOnly(contacto.fechaNacimiento)} />
                                <BooleanField icon={Icons.users} label="Discapacidad" value={contacto.discapacidad} />
                                <BooleanField icon={Icons.users} label="Dependiente" value={contacto.dependiente} />
                                <BooleanField icon={Icons.users} label="Escolaridad" value={contacto.escolaridad} />
                            </div>
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

export default ContactoDetail;


/**
 * @fileoverview Vista detallada de un registro de salud (examen médico), mostrando resultados y comprobantes.
 * @module components/RegistroSaludDetail
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
    document: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
    ),
    clipboard: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
        </svg>
    ),
    check: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
};

const TIPOS_EXAMEN_LABELS = {
    pre_ocupacional: 'Pre-Ocupacional',
    periodico: 'PeriÃ³dico',
    post_ocupacional: 'Post-Ocupacional',
    retorno_trabajo: 'Retorno al Trabajo',
};

const RESULTADO_LABELS = {
    apto: 'Apto',
    apto_preexistencias: 'Apto con Preexistencias',
    no_apto: 'No Apto',
};

const RESULTADO_COLORS = {
    apto: '#22c55e',
    apto_preexistencias: '#f59e0b',
    no_apto: '#ef4444',
};

/**
 * Componente RegistroSaludDetail
 * Muestra el detalle de exámenes preocupacionales, periódicos o de retorno.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.registro - Objeto de salud poblado.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir la edición.
 * @returns {JSX.Element|null}
 */
const RegistroSaludDetail = ({ registro, onClose, onEdit }) => {
    if (!registro) return null;

    // Permisos del mÃ³dulo registros de salud
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'registros_salud' && p.accion === 'actualizar');

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

    // Check if vencimiento is close (within 30 days) or expired
    const getVencimientoStatus = () => {
        return {
            label: registro.vigente ? 'Vigente' : 'Vencido',
            color: registro.vigente ? '#22c55e' : '#ef4444'
        };
    };

    const vencimientoStatus = getVencimientoStatus();

    const Field = ({ icon, label, value }) => (
        <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem',
            padding: '0.75rem 0',
            borderBottom: '1px solid var(--border-color)'
        }}>
            <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>
                {icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                    {label}
                </div>
                <div style={{ fontWeight: 500, color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                    {value || '-'}
                </div>
            </div>
        </div>
    );

    const SectionHeader = ({ title, subtitle }) => (
        <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                paddingBottom: '0.5rem',
                borderBottom: '2px solid var(--primary-color)'
            }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {title}
                </span>
                {subtitle && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Detalle del Registro de Salud</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {TIPOS_EXAMEN_LABELS[registro.tipoExamen] || registro.tipoExamen}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{registro.id}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '9999px',
                                background: `${RESULTADO_COLORS[registro.resultado]}20`,
                                color: RESULTADO_COLORS[registro.resultado],
                                fontWeight: 700
                            }}>
                                {RESULTADO_LABELS[registro.resultado] || registro.resultado}
                            </span>
                        </div>
                        {onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(registro)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(registro.updatedAt)}`} />
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
                                        {formatDateTime(registro.createdAt)}
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
                                <div style={{ color: registro.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: registro.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: registro.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {registro.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(registro.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Resumen */}
                        <div>
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(registro.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field icon={Icons.clipboard} label="Tipo de Examen" value={TIPOS_EXAMEN_LABELS[registro.tipoExamen] || registro.tipoExamen} />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.check}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Resultado
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.85rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '9999px',
                                            background: `${RESULTADO_COLORS[registro.resultado]}20`,
                                            color: RESULTADO_COLORS[registro.resultado],
                                            fontWeight: 700
                                        }}>
                                            {RESULTADO_LABELS[registro.resultado] || registro.resultado}
                                        </span>
                                    </div>
                                </div>
                                <Field icon={Icons.calendar} label="Fecha de RealizaciÃ³n" value={formatDateOnly(registro.fechaRealizacion)} />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.calendar}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Fecha de Vencimiento
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                                {formatDateOnly(registro.fechaVencimiento)}
                                            </span>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.75rem',
                                                padding: '0.2rem 0.5rem',
                                                borderRadius: '9999px',
                                                background: `${vencimientoStatus.color}20`,
                                                color: vencimientoStatus.color,
                                                fontWeight: 600
                                            }}>
                                                {vencimientoStatus.label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2 */}
                        <div>
                            {/* Datos del Empleado */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <SectionHeader title="Datos del Empleado" subtitle={`Ãšltimos cambios hace ${getRelativeTime(registro.empleado?.updatedAt || registro.updatedAt)}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    padding: '0 1rem'
                                }}>
                                    <Field icon={Icons.user} label="Nombre Completo" value={formatFullName(registro.empleado)} />
                                    <Field icon={Icons.document} label="Documento" value={registro.empleado?.numeroDocumento} />
                                </div>
                            </div>

                            {(() => {
                                // Collect all comprobantes (legacy single + new array format)
                                const allComprobantes = [];
                                if (registro.comprobante) {
                                    allComprobantes.push({
                                        data: registro.comprobante,
                                        nombre: registro.comprobanteNombre || 'Comprobante',
                                        tipo: registro.comprobanteTipo || 'application/pdf',
                                    });
                                }
                                if (registro.comprobantes && Array.isArray(registro.comprobantes)) {
                                    allComprobantes.push(...registro.comprobantes);
                                }

                                if (allComprobantes.length === 0) return null;

                                return (
                                    <div>
                                        <SectionHeader title="Comprobantes MÃ©dicos" subtitle={`Ãšltimos cambios hace ${getRelativeTime(registro.empleado?.updatedAt || registro.updatedAt)}`} />
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            padding: '0 1rem'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                gap: '0.75rem',
                                                padding: '0.75rem 0'
                                            }}>
                                                <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.document}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                                                        Comprobantes MÃ©dicos ({allComprobantes.length})
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                                        {allComprobantes.map((file, index) => (
                                                            <a
                                                                key={index}
                                                                href={file.data}
                                                                download={file.nombre}
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '0.5rem',
                                                                    color: 'var(--primary-color)',
                                                                    textDecoration: 'none',
                                                                    fontWeight: 500,
                                                                    padding: '0.5rem 0.75rem',
                                                                    background: 'var(--bg-secondary)',
                                                                    borderRadius: '0.375rem',
                                                                    fontSize: '0.875rem',
                                                                }}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                                                                </svg>
                                                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px', display: 'inline-block' }} title={file.nombre}>
                                                                    {file.nombre}
                                                                </span>
                                                            </a>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
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

export default RegistroSaludDetail;


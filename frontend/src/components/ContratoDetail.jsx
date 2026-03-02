/**
 * @fileoverview Vista detallada de un contrato laboral y sus condiciones.
 * @module components/ContratoDetail
 */

import { formatDateOnly, formatCurrency as formatCurrencyUtil, formatDateTime, formatFullName } from '../helpers/formatters';
import { useAuth } from '../context/AuthContext';

// Mapeo de tipos de contrato a labels legibles
const TIPOS_CONTRATO_LABELS = {
    tiempo_indeterminado: 'Contrato por Tiempo Indeterminado (Efectivo)',
    periodo_prueba: 'Período de Prueba (Art. 92 bis)',
    plazo_fijo: 'Contrato a Plazo Fijo',
    eventual: 'Contrato Eventual',
    teletrabajo: 'Contrato de Teletrabajo (Ley 27.555)',
    locacion_servicios: 'Locación de Servicios (Contractor / Freelancer)',
    monotributista: 'Monotributista',
    responsable_inscripto: 'Responsable Inscripto (Autónomo)',
    honorarios: 'Honorarios',
    contrato_obra: 'Contrato de Obra',
    pasantia_educativa: 'Pasantía Educativa (Ley 26.427)',
    beca: 'Beca',
    ad_honorem: 'Ad honorem',
};

// Categorías de contrato
const CATEGORIA_CONTRATO = {
    tiempo_indeterminado: 'Relación de Dependencia',
    periodo_prueba: 'Relación de Dependencia',
    plazo_fijo: 'Relación de Dependencia',
    eventual: 'Relación de Dependencia',
    teletrabajo: 'Relación de Dependencia',
    locacion_servicios: 'No Laborales / Extracontractuales',
    monotributista: 'No Laborales / Extracontractuales',
    responsable_inscripto: 'No Laborales / Extracontractuales',
    honorarios: 'No Laborales / Extracontractuales',
    contrato_obra: 'No Laborales / Extracontractuales',
    pasantia_educativa: 'Formativos (Educativos)',
    beca: 'Formativos (Educativos)',
    ad_honorem: 'Formativos (Educativos)',
};

// Icons SVG components
const Icons = {
    calendar: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
    ),
    money: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
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
    building: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    gift: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
        </svg>
    ),
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    briefcase: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
    ),
    checkCircle: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width: 20, height: 20 }}>
            <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
        </svg>
    ),
    check: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
};

/**
 * Componente ContratoDetail
 * 
 * Presenta el estado del contrato (en curso, finalizado, pendiente),
 * el desglose de puestos asignados, salarios, horarios y rol de sistema.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.contrato - Objeto contrato poblado con empleado y puestos.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir la edición (deshabilitado si finalizado).
 * @returns {JSX.Element|null}
 */
const ContratoDetail = ({ contrato, onClose, onEdit }) => {
    if (!contrato) return null;

    // Permisos del módulo contratos
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'contratos' && p.accion === 'actualizar');


    const formatCurrency = formatCurrencyUtil;

    // Calculate relative time (hace X minutos/horas/días)
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
        return `${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    };

    // Determine contract status based on dates
    const ESTADO_LABELS = {
        pendiente: 'Pendiente',
        en_curso: 'En Curso',
        finalizado: 'Finalizado'
    };

    const ESTADO_COLORS = {
        pendiente: '#f97316', // orange
        en_curso: '#3b82f6', // blue
        finalizado: '#ef4444' // red
    };

    const getContractStatus = () => {
        return ESTADO_LABELS[contrato.estado] || contrato.estado;
    };

    // Get status badge color
    const getContractStatusColor = () => {
        return ESTADO_COLORS[contrato.estado] || '#6b7280';
    };

    const categoria = CATEGORIA_CONTRATO[contrato.tipoContrato] || 'Otro';

    // Obtener el primer puesto para el subtítulo
    const primerPuesto = contrato.puestos?.[0];
    const subtitulo = primerPuesto
        ? `${primerPuesto.nombre}${primerPuesto.departamento?.area?.empresa?.nombre ? ` - ${primerPuesto.departamento.area.empresa.nombre}` : ''}`
        : 'Sin puesto asignado';

    // Determinar estado del timeline
    const isCreated = true;
    const isActive = contrato.activo;
    const isFinished = contrato.fechaFin && new Date(contrato.fechaFin) < new Date();

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

    // Timeline step component (vertical)
    const TimelineStep = ({ completed, label, date }) => (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.5rem 0'
        }}>
            <div style={{
                color: completed ? '#22c55e' : 'var(--text-secondary)',
                flexShrink: 0
            }}>
                {completed ? Icons.checkCircle : Icons.circle}
            </div>
            <div>
                <div style={{
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    color: completed ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                    {label}
                </div>
                <div style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-secondary)'
                }}>
                    {date}
                </div>
            </div>
        </div>
    );

    // Section header component with optional subtitle (subtitle before the green line)
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
                    <h2 className="modal-title">Detalle del Contrato</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Employee info + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {formatFullName(contrato.empleado)}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{contrato.id}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '9999px',
                                background: `${ESTADO_COLORS[contrato.estado]}20`,
                                color: ESTADO_COLORS[contrato.estado],
                                fontWeight: 700
                            }}>
                                {ESTADO_LABELS[contrato.estado] || contrato.estado}
                            </span>
                        </div>
                        {onEdit && contrato.estado !== 'finalizado' && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(contrato)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Últimos cambios hace ${getRelativeTime(contrato.updatedAt)}`} />
                        <div className="activity-log-grid">
                            {/* Fecha de Creación */}
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
                                        Fecha de Creación
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(contrato.createdAt)}
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
                                <div style={{ color: contrato.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: contrato.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: contrato.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {contrato.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            {/* Última Modificación */}
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
                                        Última Modificación
                                    </div>
                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {formatDateTime(contrato.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        <div>
                            {/* Column 1: Resumen */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <SectionHeader title="Resumen" subtitle={`Últimos cambios hace ${getRelativeTime(contrato.updatedAt)}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    padding: '0 1rem'
                                }}>
                                    {/* Contract Status */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.875rem 0',
                                        borderBottom: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{ color: 'var(--primary-color)' }}>
                                            {Icons.check}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.15rem' }}>
                                                Estado del Contrato
                                            </div>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.4rem',
                                                fontSize: '0.85rem',
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '9999px',
                                                background: `${getContractStatusColor()}20`,
                                                color: getContractStatusColor(),
                                                fontWeight: 700
                                            }}>
                                                {getContractStatus()}
                                            </span>
                                        </div>
                                    </div>
                                    <Field icon={Icons.calendar} label="Fecha de Inicio" value={formatDateOnly(contrato.fechaInicio)} />
                                    <Field icon={Icons.calendar} label="Fecha de Fin" value={contrato.fechaFin ? formatDateOnly(contrato.fechaFin) : 'Indeterminado'} />
                                    <Field icon={Icons.document} label="Tipo de Contrato" value={TIPOS_CONTRATO_LABELS[contrato.tipoContrato] || contrato.tipoContrato} />
                                    <Field icon={Icons.building} label="Categoría" value={categoria} />
                                </div>
                            </div>

                            {/* Puestos Asignados */}
                            <div>
                                <SectionHeader title={`Distribución de Puestos`} subtitle={`Total de Puesto(s) Asignado(s): ${contrato.puestos?.length || 0}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    overflow: 'hidden'
                                }}>
                                    {contrato.puestos && contrato.puestos.length > 0 ? (
                                        contrato.puestos.map((puesto, index) => (
                                            <div key={puesto.id} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.75rem',
                                                padding: '0.875rem 1rem',
                                                borderBottom: index < contrato.puestos.length - 1 ? '1px solid var(--border-color)' : 'none'
                                            }}>
                                                <div style={{ color: 'var(--primary-color)' }}>
                                                    {Icons.briefcase}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                                        {puesto.nombre}
                                                    </div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {puesto.departamento?.nombre} • {puesto.departamento?.area?.nombre} • {puesto.departamento?.area?.empresa?.nombre}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                            Sin puestos asignados
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: DatosDelEmpleado + Puestos */}
                        <div>
                            {/* Datos del Empleado */}
                            <div style={{ marginBottom: '1.5rem' }}>
                                <SectionHeader title="Datos del Empleado" subtitle={`Últimos cambios hace ${getRelativeTime(contrato.empleado?.updatedAt || contrato.updatedAt)}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    padding: '0 1rem'
                                }}>
                                    <Field icon={Icons.user} label="Nombre Completo" value={formatFullName(contrato.empleado)} />
                                    <Field icon={Icons.document} label="Documento" value={contrato.empleado?.numeroDocumento} />
                                    {/* Rol del contrato */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '0.75rem',
                                        padding: '0.75rem 0',
                                    }}>
                                        <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>
                                            {Icons.shield}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                                Rol en la Empresa
                                            </div>
                                            {contrato.rol ? (
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.35rem',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    padding: '0.25rem 0.65rem',
                                                    borderRadius: '9999px',
                                                    background: 'rgba(13, 148, 136, 0.12)',
                                                    color: '#0d9488',
                                                    border: '1px solid rgba(13, 148, 136, 0.25)',
                                                }}>
                                                    {Icons.shield}
                                                    {contrato.rol.nombre}
                                                </span>
                                            ) : (
                                                <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.875rem' }}>Sin rol asignado</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Condiciones */}
                            <div>
                                <SectionHeader title="Condiciones" subtitle={`Últimos cambios hace ${getRelativeTime(contrato.updatedAt)}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    padding: '0 1rem'
                                }}>
                                    <Field icon={Icons.money} label="Salario" value={formatCurrency(contrato.salario)} />
                                    <Field icon={Icons.clock} label="Horario" value={contrato.horario} />
                                    {contrato.compensacion && (
                                        <Field icon={Icons.gift} label="Compensación Adicional" value={contrato.compensacion} />
                                    )}
                                </div>
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

export default ContratoDetail;


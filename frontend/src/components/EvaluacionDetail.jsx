/**
 * @fileoverview Vista detallada de una evaluación de desempeño, incluyendo puntajes y feedback.
 * @module components/EvaluacionDetail
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
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
    star: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
    ),
    chat: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
    ),
    notes: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
        </svg>
    ),
};

const PERIODO_LABELS = {
    anual: 'Anual',
    semestre_1: '1er Semestre',
    semestre_2: '2do Semestre',
    q1: 'Q1',
    q2: 'Q2',
    q3: 'Q3',
    q4: 'Q4',
    cierre_prueba: 'Cierre PerÃ­odo de Prueba',
    fin_proyecto: 'Fin de Proyecto',
    ad_hoc: 'Ad-hoc / Extraordinaria',
};

const TIPO_EVALUACION_LABELS = {
    autoevaluacion: 'AutoevaluaciÃ³n',
    descendente_90: '90Â° (Descendente)',
    pares_jefe_180: '180Â° (Pares + Jefe)',
    ascendente_270: '270Â° (Ascendente)',
    integral_360: '360Â° (Integral)',
    competencias: 'Por Competencias',
    objetivos: 'Por Objetivos',
    mixta: 'Mixta',
    potencial: 'Potencial',
};

const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    en_curso: 'En curso',
    finalizada: 'Finalizada',
    firmada: 'Firmada',
};

const ESTADO_COLORS = {
    pendiente: '#6b7280',
    en_curso: '#3b82f6',
    finalizada: '#22c55e',
    firmada: '#8b5cf6',
};

const ESCALA_LABELS = {
    supera_expectativas: 'Supera Expectativas',
    cumple: 'Cumple',
    necesita_mejora: 'Necesita Mejora',
};

const ESCALA_COLORS = {
    supera_expectativas: '#22c55e',
    cumple: '#3b82f6',
    necesita_mejora: '#ef4444',
};

/**
 * Componente EvaluacionDetail
 * Muestra el resultado completo de una evaluación, diferenciando entre periodos y escalas.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.evaluacion - El objeto evaluación poblado.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir la edición.
 * @returns {JSX.Element|null}
 */
const EvaluacionDetail = ({ evaluacion, onClose, onEdit }) => {
    if (!evaluacion) return null;

    // Permisos del mÃ³dulo evaluaciones
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'actualizar');

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

    const formatContratoLabel = (contrato) => {
        if (!contrato) return '-';
        const nombre = formatFullName(contrato.empleado);
        const puesto = contrato.puestos && contrato.puestos.length > 0 ? contrato.puestos[0].nombre : 'Sin puesto';
        const empresa = contrato.puestos && contrato.puestos.length > 0 && contrato.puestos[0].departamento?.area?.empresa?.nombre;
        return (
            <div>
                <div>{nombre}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 400 }}>
                    {puesto} {empresa && `(${empresa})`}
                </div>
            </div>
        );
    };

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
        <div className="modal-overlay" onClick={onClose} style={{ overflow: 'hidden' }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{
                maxWidth: '950px',
                height: 'auto',
                maxHeight: '90vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de la EvaluaciÃ³n</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem', overflowY: 'auto' }}>
                    {/* Top Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {PERIODO_LABELS[evaluacion.periodo] || evaluacion.periodo}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{evaluacion.id}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '9999px',
                                background: `${ESTADO_COLORS[evaluacion.estado]}20`,
                                color: ESTADO_COLORS[evaluacion.estado],
                                fontWeight: 700
                            }}>
                                {ESTADO_LABELS[evaluacion.estado] || evaluacion.estado}
                            </span>
                        </div>
                        {onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(evaluacion)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
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
                                        {formatDateTime(evaluacion.createdAt)}
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
                                <div style={{ color: evaluacion.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: evaluacion.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: evaluacion.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {evaluacion.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(evaluacion.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Resumen, Resultado y Feedback */}
                        <div>
                            {/* Resumen */}
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <Field icon={Icons.clipboard} label="PerÃ­odo" value={PERIODO_LABELS[evaluacion.periodo] || evaluacion.periodo} />
                                <Field icon={Icons.document} label="Tipo de EvaluaciÃ³n" value={TIPO_EVALUACION_LABELS[evaluacion.tipoEvaluacion] || evaluacion.tipoEvaluacion} />
                                <Field icon={Icons.calendar} label="Fecha" value={formatDateOnly(evaluacion.fecha)} />
                            </div>

                            {/* Resultado Final */}
                            <SectionHeader title="Resultado" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.star}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Puntaje
                                        </div>
                                        <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                                            {evaluacion.puntaje}/100
                                        </div>
                                    </div>
                                </div>
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
                                            Escala
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.85rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '9999px',
                                            background: `${ESCALA_COLORS[evaluacion.escala]}20`,
                                            color: ESCALA_COLORS[evaluacion.escala],
                                            fontWeight: 700
                                        }}>
                                            {ESCALA_LABELS[evaluacion.escala] || evaluacion.escala}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Feedback Section */}
                            <SectionHeader title="Feedback" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '1rem'
                            }}>
                                <p style={{ margin: 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                    {evaluacion.feedback || 'Sin feedback'}
                                </p>
                            </div>
                        </div>

                        {/* Column 2: SituaciÃ³n Actual, Participantes y Notas */}
                        <div>
                            {/* SituaciÃ³n Actual */}
                            <SectionHeader title="SituaciÃ³n Actual" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
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
                                            Estado
                                        </div>
                                        <span style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            fontSize: '0.85rem',
                                            padding: '0.25rem 0.6rem',
                                            borderRadius: '9999px',
                                            background: `${ESTADO_COLORS[evaluacion.estado]}20`,
                                            color: ESTADO_COLORS[evaluacion.estado],
                                            fontWeight: 700
                                        }}>
                                            {ESTADO_LABELS[evaluacion.estado] || evaluacion.estado}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.check}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Reconocido por el Empleado
                                        </div>
                                        <div style={{ fontWeight: 500, color: evaluacion.reconocidoPorEmpleado ? '#22c55e' : 'var(--text-primary)', display: 'flex', alignItems: 'center' }}>
                                            {evaluacion.reconocidoPorEmpleado ? 'SÃ­' : 'No'}
                                            {evaluacion.reconocidoPorEmpleado && evaluacion.fechaReconocimiento && (
                                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: '0.5rem', fontWeight: 400 }}>
                                                    ({formatDateOnly(evaluacion.fechaReconocimiento)})
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Participantes */}
                            <SectionHeader title="Participantes" subtitle={`Total de Evaluador(es): ${evaluacion.evaluadores ? evaluacion.evaluadores.length : 0}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                {/* Contrato Evaluado */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.user}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Evaluado (Contrato)
                                        </div>
                                        <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                            {formatContratoLabel(evaluacion.contratoEvaluado)}
                                        </div>
                                    </div>
                                </div>

                                {/* Evaluadores */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.user}</div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                                            Evaluadores ({evaluacion.evaluadores ? evaluacion.evaluadores.length : 0})
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {evaluacion.evaluadores && evaluacion.evaluadores.length > 0 ? (
                                                evaluacion.evaluadores.map(ev => (
                                                    <div key={ev.id} style={{ fontSize: '0.875rem' }}>
                                                        {formatContratoLabel(ev)}
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                    Sin evaluadores asignados
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Notas Section */}
                            {evaluacion.notas && (
                                <>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <SectionHeader title="Notas" subtitle={`Ãšltimos cambios hace ${getRelativeTime(evaluacion.updatedAt)}`} />
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            padding: '1rem'
                                        }}>
                                            <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                {evaluacion.notas}
                                            </p>
                                        </div>
                                    </div>
                                </>
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

export default EvaluacionDetail;


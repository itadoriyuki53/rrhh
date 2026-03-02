/**
 * @fileoverview Vista detallada de una solicitud (vacaciones, licencias, horas extras, renuncias).
 * @module components/SolicitudDetail
 */

import { formatDateOnly, formatDateTime, formatFullName } from '../helpers/formatters';
import { useAuth } from '../context/AuthContext';

const TIPO_LABELS = {
    vacaciones: { label: 'Vacaciones', icon: 'ðŸ–ï¸' },
    licencia: { label: 'Licencia / Inasistencia', icon: 'ðŸ“‹' },
    horas_extras: { label: 'Horas Extras', icon: 'â°' },
    renuncia: { label: 'Renuncia', icon: 'ðŸ‘‹' },
};

const MOTIVO_LABELS = {
    matrimonio: 'Matrimonio (LCT Art. 168)',
    nacimiento_hijo: 'Nacimiento de hijo',
    fallecimiento_conyugue_hijo_padres: 'Fallecimiento familiar directo',
    fallecimiento_hermano: 'Fallecimiento de hermano',
    examen_estudio: 'Examen / Estudio',
    accidente_trabajo_art: 'Accidente de trabajo (ART)',
    enfermedad_inculpable: 'Enfermedad inculpable',
    maternidad: 'Maternidad',
    excedencia: 'Estado de excedencia',
    donacion_sangre: 'DonaciÃ³n de sangre',
    citacion_judicial: 'CitaciÃ³n judicial',
    presidente_mesa: 'Presidente de mesa',
    mudanza: 'Mudanza',
    cumpleanos: 'DÃ­a de cumpleaÃ±os',
    tramites_personales: 'TrÃ¡mites personales',
    compensatorio_franco: 'Compensatorio / Franco',
};

const ESTADO_STYLES = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    justificada: { bg: '#d1fae5', color: '#065f46', label: 'Justificada' },
    injustificada: { bg: '#fee2e2', color: '#991b1b', label: 'Injustificada' },
    rechazada: { bg: '#fee2e2', color: '#991b1b', label: 'Rechazada' },
    aprobada: { bg: '#d1fae5', color: '#065f46', label: 'Aprobada' },
    aceptada: { bg: '#dbeafe', color: '#1e40af', label: 'Aceptada' },
    procesada: { bg: '#f3e8ff', color: '#6b21a8', label: 'Procesada' },
};

// Icons
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
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    building: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    briefcase: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
        </svg>
    ),
    shield: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
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
};

// Field component with icon
const Field = ({ icon, label, value, noBorder }) => (
    <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '0.75rem 0',
        borderBottom: noBorder ? 'none' : '1px solid var(--border-color)'
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

/**
 * Componente SolicitudDetail
 * 
 * Centraliza la visualización de cualquier tipo de solicitud, 
 * adaptando los campos mostrados según el tipo y permitiendo la edición si está pendiente.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.solicitud - Objeto solicitud con sus relaciones pobladas.
 * @param {Function} [props.onEdit] - Callback para abrir la edición.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @returns {JSX.Element|null}
 */
const SolicitudDetail = ({ solicitud, onEdit, onClose }) => {
    if (!solicitud) return null;

    // Permisos del mÃ³dulo solicitudes
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'actualizar');

    const tipoInfo = TIPO_LABELS[solicitud.tipoSolicitud] || { label: solicitud.tipoSolicitud, icon: 'ðŸ“„' };
    const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia || {};
    const estadoStyle = ESTADO_STYLES[typeData.estado] || ESTADO_STYLES.pendiente;

    const empleado = solicitud.contrato?.empleado;
    const puesto = solicitud.contrato?.puestos?.[0];
    const empresa = puesto?.departamento?.area?.empresa;

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

    const Section = ({ title, children, subtitle }) => (
        <div style={{ marginBottom: '1.5rem' }}>
            <SectionHeader title={title} subtitle={subtitle} />
            <div style={{
                background: 'var(--card-bg)',
                borderRadius: '0.5rem',
                border: '1px solid var(--border-color)',
                padding: '0 1rem'
            }}>
                {children}
            </div>
        </div>
    );

    const formatDecimalToTime = (decimalValue) => {
        if (!decimalValue || isNaN(decimalValue)) return '0:00 hs';
        const totalMinutes = Math.round(parseFloat(decimalValue) * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${minutes.toString().padStart(2, '0')} hs`;
    };

    const DetalleGrupo = ({ title, children, noBorder }) => {
        if (!children) return null;
        return (
            <div style={{
                padding: '0.75rem 0',
                borderBottom: noBorder ? 'none' : '1px solid var(--border-color)'
            }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    {title}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {children}
                </div>
            </div>
        );
    };

    const renderPeriodoFields = () => {
        const type = solicitud.tipoSolicitud;
        const data = typeData;
        if (!data) return null;

        if (type === 'vacaciones' || type === 'licencia') {
            return (
                <DetalleGrupo title="PerÃ­odo Solicitado">
                    <Field icon={Icons.calendar} label="Fecha de Inicio" value={formatDateOnly(data.fechaInicio)} />
                    {type === 'vacaciones' ? (
                        <>
                            <Field icon={Icons.calendar} label="Fecha de Fin" value={formatDateOnly(data.fechaFin)} />
                            <Field icon={Icons.calendar} label="Fecha de Regreso" value={formatDateOnly(data.fechaRegreso)} noBorder={true} />
                        </>
                    ) : (
                        <Field icon={Icons.calendar} label="Fecha de Fin" value={formatDateOnly(data.fechaFin)} noBorder={true} />
                    )}
                </DetalleGrupo>
            );
        } else if (type === 'horas_extras') {
            return (
                <DetalleGrupo title="PerÃ­odo Solicitado">
                    <Field icon={Icons.calendar} label="Fecha" value={formatDateOnly(data.fecha)} />
                    <Field icon={Icons.clock} label="Hora de Inicio" value={data.horaInicio} />
                    <Field icon={Icons.clock} label="Hora de Fin" value={data.horaFin} noBorder={true} />
                </DetalleGrupo>
            );
        } else if (type === 'renuncia') {
            return (
                <DetalleGrupo title="PerÃ­odo Solicitado">
                    <Field icon={Icons.calendar} label="Fecha de NotificaciÃ³n" value={formatDateOnly(data.fechaNotificacion)} noBorder={true} />
                </DetalleGrupo>
            );
        }
        return null;
    };

    const renderAlcanceFields = () => {
        const type = solicitud.tipoSolicitud;
        const data = typeData;
        if (!data) return null;

        if (type === 'vacaciones') {
            return (
                <DetalleGrupo title="Alcance">
                    <Field icon={Icons.calendar} label="PerÃ­odo (AÃ±o)" value={data.periodo} />
                    <Field icon={Icons.calendar} label="DÃ­as Solicitados" value={data.diasSolicitud} noBorder={true} />
                </DetalleGrupo>
            );
        } else if (type === 'licencia') {
            return (
                <DetalleGrupo title="Alcance">
                    <Field icon={Icons.document} label="Tipo" value={data.esLicencia ? 'Licencia' : 'Inasistencia'} />
                    <Field icon={Icons.document} label="Motivo Legal" value={MOTIVO_LABELS[data.motivoLegal] || data.motivoLegal} />
                    <Field icon={Icons.calendar} label="DÃ­as Solicitados" value={data.diasSolicitud} noBorder={true} />
                </DetalleGrupo>
            );
        } else if (type === 'horas_extras') {
            return (
                <DetalleGrupo title="Alcance">
                    <Field icon={Icons.clock} label="Cantidad de Horas" value={formatDecimalToTime(data.cantidadHoras)} />
                    <Field icon={Icons.document} label="Tipo de Horas Extra" value={data.tipoHorasExtra === '100' ? '100% (Fines de semana/Feriados)' : '50% (DÃ­as hÃ¡biles)'} noBorder={true} />
                </DetalleGrupo>
            );
        } else if (type === 'renuncia') {
            return (
                <DetalleGrupo title="Alcance">
                    <Field icon={Icons.calendar} label="Fecha Baja Efectiva" value={formatDateOnly(data.fechaBajaEfectiva)} />
                    <Field icon={Icons.document} label="Preaviso" value={'15 dÃ­as (SegÃºn LCT)'} noBorder={true} />
                </DetalleGrupo>
            );
        }
        return null;
    };

    const renderEnlacesFields = () => {
        const type = solicitud.tipoSolicitud;
        const data = typeData;
        if (!data) return null;

        const url = data.urlJustificativo || data.urlComprobante;
        if (!url) return null;

        return (
            <DetalleGrupo title="Enlaces Adjuntos">
                <div style={{ padding: '0.75rem 0' }}>
                    <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                        </svg>
                        Ver Documento Adjunto
                    </a>
                </div>
            </DetalleGrupo>
        );
    };

    const renderExtraFields = () => {
        const type = solicitud.tipoSolicitud;
        const data = typeData;
        if (!data) return null;

        const info = data.descripcion || data.motivo;
        const hasNotificado = type === 'vacaciones' && data.notificadoEl;

        if (!info && !hasNotificado) return null;

        return (
            <DetalleGrupo title="InformaciÃ³n Adicional">
                {hasNotificado && <Field icon={Icons.calendar} label="Notificado el" value={formatDateOnly(data.notificadoEl)} />}
                {info && <Field icon={Icons.document} label={type === 'horas_extras' || type === 'renuncia' ? "Motivo" : "DescripciÃ³n"} value={info} />}
            </DetalleGrupo>
        );
    };

    const renderRegistroSaludSection = () => {
        if (solicitud.tipoSolicitud !== 'licencia') return null;
        const rs = solicitud.licencia?.registroSalud;
        if (!rs) return null;

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

        const isExpired = new Date(rs.fechaVencimiento) < new Date();
        const allComprobantes = rs.comprobantes || [];

        return (
            <Section title="Registro de Salud" subtitle={`Ãšltimos cambios hace ${getRelativeTime(rs.updatedAt)}`}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border-color)',
                }}>
                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.document}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Tipo de Examen
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {TIPOS_EXAMEN_LABELS[rs.tipoExamen] || rs.tipoExamen}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                background: `${RESULTADO_COLORS[rs.resultado]}20`,
                                color: RESULTADO_COLORS[rs.resultado],
                                fontWeight: 600
                            }}>
                                {RESULTADO_LABELS[rs.resultado] || rs.resultado}
                            </span>
                        </div>
                    </div>
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    padding: '0.75rem 0',
                    borderBottom: allComprobantes.length === 0 ? 'none' : '1px solid var(--border-color)',
                }}>
                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.calendar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                            Fecha de Vencimiento
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                {formatDateOnly(rs.fechaVencimiento)}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.75rem',
                                padding: '0.2rem 0.5rem',
                                borderRadius: '9999px',
                                background: isExpired ? '#ef444420' : '#22c55e20',
                                color: isExpired ? '#ef4444' : '#22c55e',
                                fontWeight: 600
                            }}>
                                {isExpired ? 'Vencido' : 'Vigente'}
                            </span>
                        </div>
                    </div>
                </div>

                {allComprobantes.length > 0 && (
                    <div style={{ padding: '0.75rem 0', borderTop: '1px solid var(--border-color)' }}>
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
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }} title={file.nombre}>
                                        {file.nombre}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}
            </Section>
        );
    };

    const renderInformacionAdicionalSection = () => {
        const type = solicitud.tipoSolicitud;
        const data = typeData;
        const isVacaciones = type === 'vacaciones';

        const diasDisponibles = (isVacaciones && data) ? (
            <DetalleGrupo title="DÃ­as disponibles">
                <Field icon={Icons.calendar} label="DÃ­as Correspondientes" value={data.diasCorrespondientes} />
                <Field icon={Icons.calendar} label="DÃ­as Tomados" value={data.diasTomados} />
                <Field icon={Icons.calendar} label="DÃ­as Disponibles" value={data.diasDisponibles} />
            </DetalleGrupo>
        ) : null;

        const enlaces = renderEnlacesFields();
        const extra = renderExtraFields();

        if (!diasDisponibles && !enlaces && !extra) return null;

        return (
            <Section title="InformaciÃ³n de Respaldo" subtitle={`Ãšltimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {diasDisponibles}
                    {enlaces}
                    {extra}
                </div>
            </Section>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Solicitud</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Type + ID + Status + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {tipoInfo.label}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{solicitud.id}
                            </span>
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                fontSize: '0.85rem',
                                padding: '0.3rem 0.7rem',
                                borderRadius: '9999px',
                                background: estadoStyle.bg,
                                color: estadoStyle.color,
                                fontWeight: 700
                            }}>
                                {estadoStyle.label}
                            </span>
                        </div>
                        {typeData.estado === 'pendiente' && onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(solicitud)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section - FIRST */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`} />
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
                                        {formatDateTime(solicitud.createdAt)}
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
                                <div style={{ color: solicitud.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: solicitud.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: solicitud.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {solicitud.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(solicitud.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Resumen de la Solicitud */}
                        <div>
                            <Section
                                title="Resumen"
                                subtitle={`Ãšltimos cambios hace ${getRelativeTime(solicitud.updatedAt)}`}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {/* Estado Badge inside Resumen */}
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
                                                fontSize: '0.8rem',
                                                padding: '0.3rem 0.7rem',
                                                borderRadius: '9999px',
                                                background: estadoStyle.bg,
                                                color: estadoStyle.color,
                                                fontWeight: 700
                                            }}>
                                                {estadoStyle.label}
                                            </span>
                                        </div>
                                    </div>
                                    {renderPeriodoFields()}
                                    {renderAlcanceFields()}
                                </div>
                            </Section>

                            {/* Registro de Salud si aplica */}
                            {renderRegistroSaludSection()}
                        </div>

                        {/* Column 2: Datos de Referencia y Adicionales */}
                        <div>
                            {/* Datos del Empleado */}
                            <Section
                                title="Datos del Empleado"
                                subtitle={`Ãšltimos cambios hace ${getRelativeTime(solicitud.contrato?.empleado?.updatedAt)}`}
                            >
                                <Field
                                    icon={Icons.user}
                                    label="Empleado"
                                    value={formatFullName(empleado)}
                                />
                                <Field
                                    icon={Icons.briefcase}
                                    label="Puesto"
                                    value={puesto?.nombre || 'Sin puesto'}
                                />
                                <Field
                                    icon={Icons.building}
                                    label="Empresa"
                                    value={empresa?.nombre || 'Sin empresa'}
                                />
                            </Section>

                            {/* Enlaces e InformaciÃ³n Adicional */}
                            {renderInformacionAdicionalSection()}
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

export default SolicitudDetail;


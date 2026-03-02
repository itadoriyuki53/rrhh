/**
 * @fileoverview Vista detallada de una liquidación de sueldo, incluyendo conceptos remunerativos y retenciones.
 * @module components/LiquidacionDetail
 */

import { formatDateOnly, formatCurrency, formatFullName, formatDateTime } from '../helpers/formatters';
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
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
    ),
    bank: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
    ),
    wallet: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
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
    arrowTrendingDown: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.5 4.5L21.75 7.5M21.75 7.5V12m0-4.5H17.25" />
        </svg>
    ),
    clipboard: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
    ),
};

/**
 * Componente LiquidacionDetail
 * Proporciona un desglose detallado de todos los conceptos que integran una liquidación.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.liquidacion - Objeto liquidación con relaciones pobladas.
 * @param {Function} props.onClose - Callback para cerrar el modal.
 * @param {Function} [props.onEdit] - Callback para editar (solo si no está pagada).
 * @returns {JSX.Element|null}
 */
const LiquidacionDetail = ({ liquidacion, onClose, onEdit }) => {
    if (!liquidacion) return null;

    // Permisos del mÃ³dulo liquidaciones
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'liquidaciones' && p.accion === 'actualizar');

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

    const Badge = ({ label, color }) => (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.85rem',
            padding: '0.3rem 0.7rem',
            borderRadius: '9999px',
            background: color === 'green' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
            color: color === 'green' ? '#10b981' : '#3b82f6',
            fontWeight: 700
        }}>
            {label}
        </span>
    );

    const formatContratoLabel = (contrato) => {
        if (!contrato || !contrato.puestos || contrato.puestos.length === 0) return 'Sin puesto';
        return contrato.puestos.map(p => p.nombre).join(' / ');
    };

    const amountInasistencias = Number(liquidacion?.inasistencias || 0);
    const amountTotalRetenciones = Number(liquidacion?.totalRetenciones || 0);
    const totalDeducciones = amountInasistencias + amountTotalRetenciones;

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
                    <h2 className="modal-title">Detalle de LiquidaciÃ³n</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem', overflowY: 'auto' }}>
                    {/* Top Section */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                {formatFullName(liquidacion?.contrato?.empleado)}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{liquidacion.id}
                            </span>
                            <Badge
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                }}
                                label={liquidacion.estaPagada ? 'Pagada' : 'Generada'}
                                color={liquidacion.estaPagada ? 'green' : 'blue'}
                            />
                        </div>
                        {onEdit && canEdit && !liquidacion.estaPagada && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(liquidacion)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(liquidacion.updatedAt)}`} />
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
                                        {formatDateTime(liquidacion.createdAt)}
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
                                <div style={{ color: liquidacion.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: liquidacion.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: liquidacion.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {liquidacion.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(liquidacion.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">

                        {/* Column 1: Resumen y Conceptos Remunerativos */}
                        <div>
                            {/* Resumen */}
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(liquidacion.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <Field
                                    icon={Icons.calendar}
                                    label="PerÃ­odo"
                                    value={`${formatDateOnly(liquidacion.fechaInicio)} - ${formatDateOnly(liquidacion.fechaFin)}`}
                                />
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 0',
                                    borderBottom: '1px solid var(--border-color)'
                                }}>
                                    <div style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }}>{Icons.shield}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Estado</div>
                                        <Badge
                                            label={liquidacion.estaPagada ? 'Pagada' : 'Generada'}
                                            color={liquidacion.estaPagada ? 'green' : 'blue'}
                                        />
                                    </div>
                                </div>
                                <Field
                                    icon={Icons.document}
                                    label="Puesto(s) Asignado(s) del Contrato"
                                    value={formatContratoLabel(liquidacion?.contrato)}
                                />
                            </div>

                            {/* Conceptos Remunerativos */}
                            <SectionHeader title="Conceptos Remunerativos" subtitle={`Total Bruto: ${formatCurrency(liquidacion?.totalBruto)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                marginBottom: '1.5rem'
                            }}>
                                <table className="table" style={{ margin: 0, border: 'none', minWidth: '100%' }}>
                                    <tbody>
                                        <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>BÃ¡sico</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.basico)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>AntigÃ¼edad</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.antiguedad)}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Presentismo</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.presentismo)}</td>
                                        </tr>
                                        {liquidacion?.horasExtras > 0 && <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Horas Extras</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.horasExtras)}</td>
                                        </tr>}
                                        {liquidacion?.vacaciones > 0 && <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Vacaciones</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.vacaciones)}</td>
                                        </tr>}
                                        {liquidacion?.sac > 0 && <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>SAC</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.sac)}</td>
                                        </tr>}
                                        {liquidacion?.vacacionesNoGozadas > 0 && <tr>
                                            <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>Vacaciones No Gozadas</td>
                                            <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(liquidacion?.vacacionesNoGozadas)}</td>
                                        </tr>}

                                        {/* Detalle Remunerativo Adicional */}
                                        {liquidacion?.detalleRemunerativo && liquidacion.detalleRemunerativo.length > 0 && liquidacion.detalleRemunerativo.map((remunerativo, index) => (
                                            <tr key={`rem-${index}`}>
                                                <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                                                    <div>{remunerativo.nombre}</div>
                                                    {remunerativo.porcentaje && (
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {remunerativo.porcentaje}%
                                                        </div>
                                                    )}
                                                </td>
                                                <td style={{ textAlign: 'right', padding: '0.75rem 1rem', fontWeight: 600, color: '#10b981' }}>+ {formatCurrency(remunerativo.monto)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Resumen de LiquidaciÃ³n */}
                            <SectionHeader title="Resumen de LiquidaciÃ³n" subtitle={`Total Neto: ${formatCurrency(liquidacion?.neto)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '1rem',
                                marginBottom: '1.5rem'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            {Icons.bank}
                                            <span>Total Bruto</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#10b981' }}>+ {formatCurrency(liquidacion?.totalBruto)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                                            {Icons.arrowTrendingDown}
                                            <span>Total Deducciones</span>
                                        </div>
                                        <span style={{ fontWeight: 700, color: '#ef4444' }}>- {formatCurrency(totalDeducciones)}</span>
                                    </div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginTop: '0.5rem',
                                        paddingTop: '0.75rem',
                                        borderTop: '2px solid var(--border-color)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                                            {Icons.wallet}
                                            <span>Neto a Cobrar</span>
                                        </div>
                                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                                            {formatCurrency(liquidacion?.neto)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Datos del Empleado y Resumen de Totales */}
                        <div>
                            {/* Datos del Empleado */}
                            <SectionHeader title="Datos del Empleado" subtitle={`Ãšltimos cambios hace ${getRelativeTime(liquidacion?.contrato?.empleado?.updatedAt)}`} />
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
                                    value={formatFullName(liquidacion?.contrato?.empleado)}
                                />
                                <Field
                                    icon={Icons.document}
                                    label="Documento"
                                    value={liquidacion?.contrato?.empleado?.numeroDocumento}
                                />
                                <Field
                                    icon={Icons.clipboard}
                                    label="Legajo / ID Empleado"
                                    value={liquidacion?.contrato?.empleado?.id}
                                />
                            </div>

                            {/* Deducciones */}
                            <SectionHeader title="Deducciones" subtitle={`Total Retenciones: ${formatCurrency(liquidacion?.totalRetenciones)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                overflow: 'hidden',
                                minHeight: '100px',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                {totalDeducciones > 0 || (liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0) ? (
                                    <table className="table" style={{ margin: 0, border: 'none', minWidth: '100%' }}>
                                        <tbody>
                                            {amountInasistencias > 0 && <tr><td style={{ textAlign: 'left', padding: '0.75rem 1rem', color: '#ef4444' }}>Inasistencias Injustificadas</td><td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#ef4444', fontWeight: 600 }}>- {formatCurrency(amountInasistencias)}</td></tr>}

                                            {/* Detalle de Retenciones */}
                                            {liquidacion?.detalleRetenciones && liquidacion.detalleRetenciones.length > 0 && liquidacion.detalleRetenciones.map((retencion, index) => (
                                                <tr key={index}>
                                                    <td style={{ textAlign: 'left', padding: '0.75rem 1rem' }}>
                                                        <div>{retencion.nombre}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                            {retencion.porcentaje}% del bruto
                                                        </div>
                                                    </td>
                                                    <td style={{ textAlign: 'right', padding: '0.75rem 1rem', color: '#ef4444', fontWeight: 600 }}>- {formatCurrency(retencion.monto)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', margin: 'auto' }}>
                                        <div style={{ opacity: 0.5, marginBottom: '0.5rem' }}>{Icons.shield}</div>
                                        <div style={{ fontSize: '0.85rem' }}>Sin deducciones en este perÃ­odo</div>
                                    </div>
                                )}
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

export default LiquidacionDetail;


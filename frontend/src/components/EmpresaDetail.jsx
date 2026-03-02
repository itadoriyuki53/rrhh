/**
 * @fileoverview Vista detallada de la información de una empresa, incluyendo organigrama.
 * @module components/EmpresaDetail
 */

import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../helpers/formatters';

/**
 * Componente EmpresaDetail
 * Muestra el perfil completo de una empresa, su estructura jerárquica y métricas de empleados.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.empresa - Objeto empresa con toda su data poblada.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir el editor de la empresa.
 * @returns {JSX.Element|null}
 */
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
    building: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    mail: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
    ),
    phone: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
    ),
    location: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
        </svg>
    ),
    industry: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
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
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
};

const EmpresaDetail = ({ empresa, onClose, onEdit }) => {
    if (!empresa) return null;

    // Permisos del mÃ³dulo empresas
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'empresas' && p.accion === 'actualizar');

    const primaryColor = '#0d9488';

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

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

    // Calculate totals
    const totalAreas = empresa.areas?.length || 0;
    const totalDepartamentos = empresa.areas?.reduce((acc, area) => acc + (area.departamentos?.length || 0), 0) || 0;
    const totalPuestos = empresa.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) => acc2 + (depto.puestos?.length || 0), 0) || 0), 0) || 0;

    // Calculate total employees (count unique employees from all positions)
    const totalEmpleados = empresa.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) =>
            acc2 + (depto.puestos?.reduce((acc3, puesto) =>
                acc3 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso' && c.empleado?.usuario?.activo !== false)?.length || 0), 0) || 0), 0) || 0), 0) || 0;

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

    // Counter card component (for use in a unified container with dividers)
    const CounterCard = ({ value, label, color }) => (
        <div style={{
            padding: '1rem',
            textAlign: 'center'
        }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{label}</div>
        </div>
    );

    // Calculate employee count for area
    const getAreaEmployeeCount = (area) => {
        return area.departamentos?.reduce((acc, depto) =>
            acc + (depto.puestos?.reduce((acc2, puesto) =>
                acc2 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso' && c.empleado?.usuario?.activo !== false)?.length || 0), 0) || 0), 0) || 0;
    };

    // Calculate employee count for department
    const getDeptoEmployeeCount = (depto) => {
        return depto.puestos?.reduce((acc, puesto) =>
            acc + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso' && c.empleado?.usuario?.activo !== false)?.length || 0), 0) || 0;
    };

    // Calculate employee count for position
    const getPuestoEmployeeCount = (puesto) => {
        return puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso' && c.empleado?.usuario?.activo !== false)?.length || 0;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle de Empresa</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Company name + ID + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {empresa.nombre}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{empresa.id}
                            </span>
                        </div>
                        {onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(empresa)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empresa.updatedAt)}`} />
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
                                        {formatDateTime(empresa.createdAt)}
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
                                <div style={{ color: empresa.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: empresa.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: empresa.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {empresa.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(empresa.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Resumen */}
                        <div>
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empresa.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field icon={Icons.building} label="Nombre" value={empresa.nombre} />
                                <Field icon={Icons.industry} label="Industria" value={empresa.industria} />
                                <Field icon={Icons.mail} label="Email" value={empresa.email} />
                                <Field icon={Icons.phone} label="TelÃ©fono" value={empresa.telefono} />
                                <Field icon={Icons.location} label="DirecciÃ³n" value={empresa.direccion} />
                            </div>
                        </div>

                        {/* Column 2: Estructura Organizacional */}
                        <div>
                            <SectionHeader title="Estructura Organizacional" subtitle={`Total de Empleado(s) Activo(s): ${totalEmpleados}`} />

                            {/* Counters */}
                            <div className="empresa-step-grid" style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(4, 1fr)',
                                marginBottom: '1rem',
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                overflow: 'hidden'
                            }}>
                                <CounterCard value={totalAreas} label="Ãreas" color={primaryColor} />
                                <CounterCard value={totalDepartamentos} label="Departamentos" color="#22c55e" />
                                <CounterCard value={totalPuestos} label="Puestos" color="#3b82f6" />
                                <CounterCard value={totalEmpleados} label="Empleados" color="#8b5cf6" isLast />
                            </div>

                            {/* Tree Structure */}
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '1rem',
                                maxHeight: '350px',
                                overflowY: 'auto'
                            }}>
                                {!empresa.areas || empresa.areas.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', margin: 0 }}>Sin estructura definida</p>
                                ) : (
                                    <div style={{ paddingLeft: '0.5rem' }}>
                                        {empresa.areas.map((area, areaIndex) => (
                                            <div key={area.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: areaIndex === empresa.areas.length - 1 ? 0 : '1rem' }}>
                                                {/* Vertical line */}
                                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', bottom: area.departamentos?.length > 0 ? '0.75rem' : 0, width: '2px', background: primaryColor }} />
                                                {/* Horizontal line */}
                                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', width: '1rem', height: '2px', background: primaryColor }} />

                                                {/* Area row */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{area.nombre}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: `${primaryColor}15`, color: primaryColor, borderRadius: '1rem', fontWeight: 500 }}>
                                                        {area.departamentos?.length || 0} Depto(s)
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem', fontWeight: 500 }}>
                                                        {getAreaEmployeeCount(area)} Empleado(s)
                                                    </span>
                                                </div>

                                                {/* Departments */}
                                                {area.departamentos?.map((depto, deptoIndex) => (
                                                    <div key={depto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: deptoIndex === area.departamentos.length - 1 ? 0 : '0.5rem' }}>
                                                        {/* Vertical line for puestos */}
                                                        {depto.puestos?.length > 0 && (
                                                            <div style={{ position: 'absolute', left: '0.75rem', top: '0.4rem', bottom: '0.4rem', width: '2px', background: '#22c55e' }} />
                                                        )}
                                                        {/* Horizontal line */}
                                                        <div style={{ position: 'absolute', left: 0, top: '0.4rem', width: '1.25rem', height: '2px', background: '#22c55e' }} />

                                                        {/* Department row */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: depto.puestos?.length > 0 ? '0.4rem' : 0, flexWrap: 'wrap' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{depto.nombre}</span>
                                                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#22c55e20', color: '#22c55e', borderRadius: '1rem' }}>
                                                                {depto.puestos?.length || 0} Puesto(s)
                                                            </span>
                                                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                                {getDeptoEmployeeCount(depto)} Empleado(s)
                                                            </span>
                                                        </div>

                                                        {/* Positions */}
                                                        {depto.puestos?.map((puesto, puestoIndex) => (
                                                            <div key={puesto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: puestoIndex === depto.puestos.length - 1 ? 0 : '0.25rem' }}>
                                                                {/* Horizontal line */}
                                                                <div style={{ position: 'absolute', left: '0.25rem', top: '0.4rem', width: '1rem', height: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />

                                                                {/* Position row */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{puesto.nombre}</span>
                                                                    <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                                        {getPuestoEmployeeCount(puesto)} Empleado(s)
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
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

export default EmpresaDetail;


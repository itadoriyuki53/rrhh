/**
 * @fileoverview Vista detallada del perfil de un empleado, incluyendo datos personales, legales y de desempeño.
 * @module components/EmpleadoDetail
 */

import { useState, useEffect } from 'react';
import { formatDateOnly, formatDateTime } from '../helpers/formatters';
import { useAuth } from '../context/AuthContext';
import { getEvaluaciones } from '../services/api';
import ubicaciones from '../data/ubicaciones.json';

/**
 * Componente EmpleadoDetail
 * Muestra la ficha completa de un empleado organizada en secciones (Resumen, Identificación, Datos Personales, Dirección).
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.empleado - Objeto empleado con toda su data.
 * @param {Function} props.onClose - Callback para cerrar la vista.
 * @param {Function} [props.onEdit] - Callback para abrir el editor del empleado.
 * @param {boolean} [props.hideEditButton=false] - Indica si se debe ocultar proactivamente el botón de edición.
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
    user: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
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
    globe: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
        </svg>
    ),
    heart: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
    ),
    users: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
        </svg>
    ),
    identification: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z" />
        </svg>
    ),
    home: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
    ),
    building: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
    ),
    mapPin: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
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
};

const EmpleadoDetail = ({ empleado, onClose, onEdit, hideEditButton = false }) => {
    if (!empleado) return null;

    // Permisos del mÃ³dulo empleados
    const { user } = useAuth();
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'empleados' && p.accion === 'actualizar');

    // Identificar el ID de empleado real (en el objeto user de AuthContext es .empleadoId, en el objeto de la lista es .id)
    const targetEmpleadoId = empleado.empleadoId || empleado.id;

    const [promedioPuntaje, setPromedioPuntaje] = useState(null);
    const [loadingPromedio, setLoadingPromedio] = useState(false);

    useEffect(() => {
        if (empleado.esEmpleado) {
            const fetchPromedio = async () => {
                setLoadingPromedio(true);
                try {
                    const result = await getEvaluaciones({
                        evaluadoId: targetEmpleadoId,
                        estado: 'firmada',
                        activo: 'true',
                        limit: 1000
                    });

                    const evals = result.data || result.evaluaciones || [];

                    if (evals.length > 0) {
                        const total = evals.reduce((sum, ev) => sum + (ev.puntaje || 0), 0);
                        setPromedioPuntaje((total / evals.length).toFixed(1));
                    } else {
                        setPromedioPuntaje('Sin evaluaciones registradas y/o firmadas');
                    }
                } catch (error) {
                    console.error('Error fetching evaluaciones', error);
                    setPromedioPuntaje('Error al obtener datos');
                } finally {
                    setLoadingPromedio(false);
                }
            };
            fetchPromedio();
        }
    }, [empleado.id, empleado.esEmpleado]);

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

    const getGeneroLabel = (genero) => {
        const labels = { femenino: 'Femenino', masculino: 'Masculino', otro: 'Otro' };
        return labels[genero] || genero || '-';
    };

    const getEstadoCivilLabel = (estado) => {
        const labels = { soltero: 'Soltero/a', casado: 'Casado/a', divorciado: 'Divorciado/a', viudo: 'Viudo/a' };
        return labels[estado] || estado || '-';
    };

    const getTipoDocLabel = (tipo) => {
        const labels = { cedula: 'CÃ©dula', pasaporte: 'Pasaporte' };
        return labels[tipo] || tipo || '-';
    };

    const getNacionalidadNombre = (id) => {
        if (!id) return '-';
        const nac = ubicaciones.nacionalidades.find(n => n.id === id);
        return nac ? nac.nombre : id;
    };

    const getProvinciaNombre = (id) => {
        if (!id) return '-';
        const prov = ubicaciones.provincias.find(p => p.id === id);
        return prov ? prov.nombre : id;
    };

    const getCiudadNombre = (provinciaId, ciudadId) => {
        if (!provinciaId || !ciudadId) return '-';
        const prov = ubicaciones.provincias.find(p => p.id === provinciaId);
        if (!prov) return ciudadId;
        const ciudad = prov.ciudades?.find(c => c.id === ciudadId);
        return ciudad ? ciudad.nombre : ciudadId;
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

    const renderPromedioBadge = () => {
        if (loadingPromedio) return <span style={{ color: 'var(--text-secondary)' }}>Cargando...</span>;
        if (promedioPuntaje === 'Sin evaluaciones registradas y/o firmadas') {
            return <span style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}> (Sin evaluaciones registradas y/o firmadas)</span>;
        }
        if (promedioPuntaje === 'Error al obtener datos' || promedioPuntaje === null) {
            return <span style={{ color: '#ef4444', fontSize: '0.85rem' }}> {promedioPuntaje ? '(Error al obtener datos)' : ''}</span>;
        }

        const score = parseFloat(promedioPuntaje);
        let badgeText = '';
        let bgColor = '';
        let color = '';

        if (score < 60) {
            badgeText = 'Necesita mejora';
            bgColor = 'rgba(239, 68, 68, 0.15)';
            color = '#ef4444';
        } else if (score < 85) {
            badgeText = 'Cumple';
            bgColor = 'rgba(245, 158, 11, 0.15)';
            color = '#f59e0b';
        } else {
            badgeText = 'Supera expectativas';
            bgColor = 'rgba(21, 128, 61, 0.15)';
            color = '#15803d';
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '-0.1rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{score}</span>
                <span style={{
                    background: bgColor,
                    color: color,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                }}>
                    {badgeText}
                </span>
            </div>
        );
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                {/* Header */}
                <div className="modal-header">
                    <h2 className="modal-title">Detalle del Empleado</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem 2rem 2rem' }}>
                    {/* Top Section: Employee name + ID + Edit button */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                margin: 0
                            }}>
                                {empleado.apellido}, {empleado.nombre}
                            </h2>
                            <span style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                fontWeight: 500,
                                background: 'var(--bg-secondary)',
                                padding: '0.25rem 0.6rem',
                                borderRadius: '0.25rem'
                            }}>
                                #{empleado.id}
                            </span>
                        </div>
                        {!hideEditButton && onEdit && canEdit && (
                            <button className="btn btn-warning btn-sm" onClick={() => onEdit(empleado)} title="Editar">
                                {Icons.edit}
                                Editar
                            </button>
                        )}
                    </div>

                    {/* Registro de Actividad Section */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <SectionHeader title="Registro de Actividad" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
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
                                        {formatDateTime(empleado.createdAt)}
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
                                <div style={{ color: empleado.activo ? '#10b981' : '#ef4444' }}>{Icons.shield}</div>
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
                                        background: empleado.activo ? 'rgba(21, 128, 61, 0.2)' : 'rgba(239, 68, 68, 0.15)',
                                        color: empleado.activo ? '#15803d' : '#ef4444',
                                        fontWeight: 700
                                    }}>
                                        {empleado.activo ? 'Activo' : 'Inactivo'}
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
                                        {formatDateTime(empleado.updatedAt)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content: 2 columns */}
                    <div className="detail-grid-2col">
                        {/* Column 1: Resumen */}
                        <div>
                            <SectionHeader title="Resumen" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
                            <div style={{
                                background: 'var(--card-bg)',
                                borderRadius: '0.5rem',
                                border: '1px solid var(--border-color)',
                                padding: '0 1rem'
                            }}>
                                <Field icon={Icons.user} label="Nombre Completo" value={`${empleado.apellido}, ${empleado.nombre}`} />
                                <Field icon={Icons.mail} label="Email" value={empleado.email} />
                                {empleado.esEmpleado && (
                                    <Field icon={Icons.star} label="Promedio de DesempeÃ±o Laboral" value={renderPromedioBadge()} />
                                )}
                            </div>

                            {empleado.esEmpleado && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <SectionHeader title="IdentificaciÃ³n" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
                                    <div style={{
                                        background: 'var(--card-bg)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        padding: '0 1rem'
                                    }}>
                                        <Field icon={Icons.identification} label="Documento" value={`${getTipoDocLabel(empleado.tipoDocumento)}: ${empleado.numeroDocumento}`} />
                                        <Field icon={Icons.document} label="CUIL" value={empleado.cuil} />
                                        <Field icon={Icons.globe} label="Nacionalidad" value={getNacionalidadNombre(empleado.nacionalidadId || empleado.nacionalidad)} />
                                    </div>
                                </div>
                            )}

                            {empleado.esEmpleado && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <SectionHeader title="Datos Personales" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
                                    <div style={{
                                        background: 'var(--card-bg)',
                                        borderRadius: '0.5rem',
                                        border: '1px solid var(--border-color)',
                                        padding: '0 1rem'
                                    }}>
                                        <Field icon={Icons.calendar} label="Fecha de Nacimiento" value={formatDateOnly(empleado.fechaNacimiento)} />
                                        <Field icon={Icons.users} label="GÃ©nero" value={getGeneroLabel(empleado.genero)} />
                                        <Field icon={Icons.heart} label="Estado Civil" value={getEstadoCivilLabel(empleado.estadoCivil)} />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Column 2: DirecciÃ³n Legal */}
                        {empleado.esEmpleado && (
                            <div>
                                <SectionHeader title="DirecciÃ³n Legal" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
                                <div style={{
                                    background: 'var(--card-bg)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)',
                                    padding: '0 1rem'
                                }}>
                                    <Field icon={Icons.home} label="Calle" value={empleado.calle} />
                                    <Field icon={Icons.building} label="NÃºmero" value={empleado.numero} />
                                    <Field icon={Icons.building} label="Piso" value={empleado.piso} />
                                    <Field icon={Icons.building} label="Departamento" value={empleado.departamento} />
                                    <Field icon={Icons.mapPin} label="Provincia" value={getProvinciaNombre(empleado.provinciaId || empleado.provinciaNombre)} />
                                    <Field icon={Icons.location} label="Ciudad" value={getCiudadNombre(empleado.provinciaId, empleado.ciudadId || empleado.ciudadNombre)} />
                                    <Field icon={Icons.document} label="CÃ³digo Postal" value={empleado.codigoPostal} />
                                </div>

                                {empleado.esEmpleado && (
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <SectionHeader title="Contacto" subtitle={`Ãšltimos cambios hace ${getRelativeTime(empleado.updatedAt)}`} />
                                        <div style={{
                                            background: 'var(--card-bg)',
                                            borderRadius: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            padding: '0 1rem'
                                        }}>
                                            <Field icon={Icons.phone} label="TelÃ©fono" value={empleado.telefono} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
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
        </div >
    );
};

export default EmpleadoDetail;


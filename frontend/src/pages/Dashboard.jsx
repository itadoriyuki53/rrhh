/**
 * @fileoverview Vista principal con resumen de actividad y solicitudes pendientes.
 * @module pages/Dashboard
 */

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSolicitudes, updateSolicitud, deleteSolicitud, getFeriados } from '../services/api';
import ConfirmDialog from '../components/ConfirmDialog';
import Alert from '../components/Alert';
import { useAuth } from '../context/AuthContext';

const ESTADO_STYLES = {
    pendiente: { bg: '#fef3c7', color: '#92400e', label: 'Pendiente' },
    aprobada: { bg: '#d1fae5', color: '#065f46', label: 'Aprobada' },
};

const TIPO_LABELS = {
    vacaciones: 'Vacaciones',
    licencia: 'Licencia',
    horas_extras: 'Horas Extras',
    renuncia: 'Renuncia',
};
/**
 * Componente Dashboard
 * Muestra un resumen de actividad, próximos feriados y las solicitudes pendientes de los empleados.
 *
 * @returns {JSX.Element} La vista del Dashboard.
 */
const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    // Permisos del mÃ³dulo solicitudes
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canReadSolicitudes = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'leer');
    const canEditSolicitudes = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'actualizar');
    const canDeleteSolicitudes = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'solicitudes' && p.accion === 'eliminar');

    const [solicitudesPendientes, setSolicitudesPendientes] = useState([]);
    const [feriados, setFeriados] = useState([]);
    const [loadingSolicitudes, setLoadingSolicitudes] = useState(true);
    const [loadingFeriados, setLoadingFeriados] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showWelcomeAlert, setShowWelcomeAlert] = useState(false);

    // Session storage check for welcome alert
    useEffect(() => {
        if (sessionStorage.getItem('justLoggedIn')) {
            setShowWelcomeAlert(true);
            sessionStorage.removeItem('justLoggedIn');
        }
    }, []);

    // Confirmation dialog state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger',
        confirmText: 'Confirmar'
    });

    /**
     * Carga la lista de solicitudes con estado pendiente.
     * Filtra localmente los registros obtenidos considerando estado vacío ("") como 'pendiente'.
     *
     * @async
     * @returns {Promise<void>}
     */
    const loadSolicitudesPendientes = async () => {
        try {
            setLoadingSolicitudes(true);
            const result = await getSolicitudes({
                activo: 'true',
                page: 1,
                limit: 50,
            });
            // Filtrar pendientes en el cliente
            // estado vacÃ­o ("") se trata como 'pendiente' para datos legacy
            const pendientes = (result.data || []).filter(sol => {
                const typeData = sol.licencia || sol.vacaciones || sol.horasExtras || sol.renuncia;
                const estadoNorm = typeData?.estado || 'pendiente';
                return estadoNorm === 'pendiente';
            }).slice(0, 5);
            setSolicitudesPendientes(pendientes);
        } catch (err) {
            console.error('Dashboard: error al cargar solicitudes pendientes:', err.message);
        } finally {
            setLoadingSolicitudes(false);
        }
    };

    /**
     * Carga la lista de los próximos feriados nacionales utilizando el servicio de API.
     *
     * @async
     * @returns {Promise<void>}
     */
    const loadFeriados = async () => {
        try {
            setLoadingFeriados(true);
            const data = await getFeriados();
            setFeriados(data.slice(0, 5));
        } catch (err) {
            console.error('Error loading holidays:', err);
            setError('No se pudieron cargar los feriados');
        } finally {
            setLoadingFeriados(false);
        }
    };

    useEffect(() => {
        loadSolicitudesPendientes();
        loadFeriados();
    }, []);

    /**
     * Navega a la pantalla de solicitudes en modo edición para la solicitud especificada.
     *
     * @param {Object} solicitud - Objeto con los datos de la solicitud a editar.
     * @returns {void}
     */
    const handleEditar = (solicitud) => {
        navigate('/solicitudes', { state: { editSolicitudId: solicitud.id } });
    };

    /**
     * Abre el modal de confirmación para desactivar o eliminar una solicitud específica.
     *
     * @param {Object} solicitud - Objeto con los datos de la solicitud.
     * @returns {void}
     */
    const handleDesactivar = (solicitud) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Â¿Desactivar solicitud?',
            message: `Â¿EstÃ¡ seguro que desea desactivar la solicitud? Esta acciÃ³n no se puede deshacer.`,
            variant: 'danger',
            confirmText: 'Desactivar',
            onConfirm: async () => {
                try {
                    await deleteSolicitud(solicitud.id);
                    setSuccess(`Solicitud desactivada correctamente`);
                    loadSolicitudesPendientes();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (err) {
                    setError(err.message || 'Error al desactivar la solicitud');
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    /**
     * Abre el modal de confirmación para aceptar/aprobar una solicitud específica.
     * Aplica reglas de normalización del estado según el tipo de solicitud.
     *
     * @param {Object} solicitud - Objeto con los datos de la solicitud.
     * @returns {Promise<void>}
     */
    const handleAceptar = async (solicitud) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Â¿Aceptar solicitud?',
            message: `Â¿EstÃ¡ seguro que desea aceptar la solicitud? Esta acciÃ³n no se puede deshacer.`,
            variant: 'success',
            confirmText: 'Aceptar',
            onConfirm: async () => {
                try {
                    // Set estado based on solicitud type
                    let estado = 'aprobada';
                    if (solicitud.renuncia) {
                        estado = 'aceptada';
                    }
                    if (solicitud.licencia) {
                        estado = 'justificada';
                    }

                    await updateSolicitud(solicitud.id, { estado });
                    setSuccess('Solicitud aceptada correctamente');
                    loadSolicitudesPendientes();
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                } catch (err) {
                    setError(err.message);
                    setConfirmDialog({ ...confirmDialog, isOpen: false });
                }
            }
        });
    };

    /**
     * Da formato legible a una cadena de fecha a formato local ES-AR.
     *
     * @param {string} dateString - Cadena de texto o ISO de la fecha.
     * @returns {string} Fecha formateada o '-' si es inválida.
     */
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    /**
     * Obtiene el nombre completo formateado del empleado asociado a una solicitud.
     *
     * @param {Object} sol - Objeto de la solicitud.
     * @returns {string} Nombre formateado "Apellido, Nombre" o '-'.
     */
    const getEmpleadoNombre = (sol) => {
        const emp = sol.contrato?.empleado.usuario;
        return emp ? `${emp.apellido}, ${emp.nombre}` : '-';
    };

    /**
     * Extrae de forma segura el estado de una solicitud revisando la nested data correspondiente.
     *
     * @param {Object} sol - Objeto de la solicitud.
     * @returns {string} El estado de la misma, por defecto 'pendiente'.
     */
    const getEstado = (sol) => {
        const typeData = sol.licencia || sol.vacaciones || sol.horasExtras || sol.renuncia;
        return typeData?.estado || 'pendiente';
    };

    return (
        <div>
            {showWelcomeAlert && (
                <Alert
                    type="success"
                    message="Â¡Bienvenido! Has iniciado sesiÃ³n correctamente."
                    onClose={() => setShowWelcomeAlert(false)}
                    duration={3000}
                />
            )}

            {/* Confirmation Dialog */}
            <ConfirmDialog
                isOpen={confirmDialog.isOpen}
                title={confirmDialog.title}
                message={confirmDialog.message}
                variant={confirmDialog.variant}
                confirmText={confirmDialog.confirmText}
                onConfirm={confirmDialog.onConfirm}
                onCancel={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
            />

            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Resumen de actividad y prÃ³ximos eventos</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>âœ•</button>
                </div>
            )}
            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {success}
                    <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>âœ•</button>
                </div>
            )}

            {/* Dashboard Grid */}
            <div className="dashboard-main-grid">
                {/* PrÃ³ximos Eventos */}
                <div className="card">
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            <h3 className="card-title">PrÃ³ximos Eventos</h3>
                        </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                        {loadingFeriados ? (
                            <div className="loading" style={{ padding: '2rem' }}><div className="spinner"></div></div>
                        ) : feriados.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                <p>No hay feriados prÃ³ximos</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {feriados.map((feriado, index) => (
                                    <div key={index} style={{
                                        background: 'var(--card-bg)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '0.5rem',
                                        padding: '1rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <div>
                                            <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                                                {feriado.nombre}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {formatDate(feriado.fecha)}
                                            </div>
                                        </div>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '9999px',
                                            background: feriado.tipo === 'inamovible' ? '#fee2e2' : '#dbeafe',
                                            color: feriado.tipo === 'inamovible' ? '#991b1b' : '#1e40af',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            textTransform: 'capitalize'
                                        }}>
                                            {feriado.tipo}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Solicitudes Pendientes */}
                <div className="card">
                    <div className="card-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25V6.108" />
                            </svg>
                            <h3 className="card-title">Solicitudes Pendientes</h3>
                        </div>
                    </div>

                    <div style={{ padding: '1rem' }}>
                        {loadingSolicitudes ? (
                            <div className="loading" style={{ padding: '2rem' }}><div className="spinner"></div></div>
                        ) : solicitudesPendientes.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                <p>No hay solicitudes pendientes</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {solicitudesPendientes.map((solicitud) => {
                                    const estado = getEstado(solicitud);
                                    const estadoStyle = ESTADO_STYLES[estado] || ESTADO_STYLES.pendiente;

                                    return (
                                        <div key={solicitud.id} style={{
                                            background: 'var(--card-bg)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '0.5rem',
                                            padding: '1rem'
                                        }}>
                                            {/* First row: Employee name and action buttons */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                                    {getEmpleadoNombre(solicitud)}
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    {canEditSolicitudes && (
                                                        <button
                                                            className="btn btn-primary btn-sm"
                                                            onClick={() => handleAceptar(solicitud)}
                                                            title="Aceptar"
                                                            style={{
                                                                padding: '0.5rem',
                                                                minWidth: 'auto',
                                                                width: '36px',
                                                                height: '36px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75l2.25 2.25L15 9.75" />
                                                                <circle cx="12" cy="12" r="9" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canEditSolicitudes && (
                                                        <button
                                                            className="btn btn-warning btn-sm"
                                                            onClick={() => handleEditar(solicitud)}
                                                            title="Editar"
                                                            style={{
                                                                padding: '0.5rem',
                                                                minWidth: 'auto',
                                                                width: '36px',
                                                                height: '36px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                    {canDeleteSolicitudes && (
                                                        <button
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => handleDesactivar(solicitud)}
                                                            title="Desactivar"
                                                            style={{
                                                                padding: '0.5rem',
                                                                minWidth: 'auto',
                                                                width: '36px',
                                                                height: '36px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Second row: Type, date and badge */}
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                <span>{TIPO_LABELS[solicitud.tipoSolicitud]} â€¢ {formatDate(solicitud.createdAt)}</span>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '0.15rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    background: estadoStyle.bg,
                                                    color: estadoStyle.color,
                                                    fontSize: '0.7rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {estadoStyle.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {solicitudesPendientes.length > 0 && (
                            <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                                <button
                                    className="btn btn-secondary btn-sm"
                                    onClick={() => navigate('/solicitudes')}
                                >
                                    Ver todas las solicitudes
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;


/**
 * @fileoverview Orquestador para la creación y edición de roles y la gestión granular de sus permisos.
 * @module components/RolWizard
 */

import { useState, useEffect } from 'react';
import StepTracker from './StepTracker';
import EspacioTrabajoSelector from './EspacioTrabajoSelector';
import { createRol, updateRol, getPermisosGrouped, canChangeRolWorkspace } from '../services/api';

/**
 * Componente interno de error de campo.
 * 
 * @param {Object} props - Propiedades.
 * @param {string} [props.message] - Mensaje de error.
 */
const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};

/**
 * Componente RolWizard
 * 
 * Gestiona el nombre, descripción y la selección de permisos por módulo
 * mediante una matriz de selección masiva o individual.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.rol] - Objeto rol a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @returns {JSX.Element}
 */
const RolWizard = ({ rol, onClose, onSuccess }) => {
    const isEditMode = !!rol;
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingPermisos, setLoadingPermisos] = useState(true);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [permisosAgrupados, setPermisosAgrupados] = useState({});

    // Form data - Paso 1: Información básica
    const [info, setInfo] = useState({
        nombre: '',
        descripcion: '',
    });

    // Espacio de Trabajo
    const [espacioTrabajoId, setEspacioTrabajoId] = useState('');
    const [canChangeWorkspace, setCanChangeWorkspace] = useState(true);
    const [workspaceChangeMessage, setWorkspaceChangeMessage] = useState('');

    // Form data - Paso 2: Permisos
    const [permisos, setPermisos] = useState([]);

    const steps = [
        { number: 1, title: 'Información Básica' },
        { number: 2, title: 'Permisos' },
    ];

    // Cargar permisos disponibles
    useEffect(() => {
        const loadPermisos = async () => {
            try {
                setLoadingPermisos(true);
                const grouped = await getPermisosGrouped();
                setPermisosAgrupados(grouped);
            } catch (err) {
                setError('Error al cargar permisos: ' + err.message);
            } finally {
                setLoadingPermisos(false);
            }
        };
        loadPermisos();
    }, []);

    // Cargar datos del rol en modo edición
    useEffect(() => {
        if (rol) {
            setInfo({
                nombre: rol.nombre || '',
                descripcion: rol.descripcion || '',
            });
            setPermisos(rol.permisos?.map(p => p.id) || []);

            // Cargar espacio de trabajo
            setEspacioTrabajoId(String(rol.espacioTrabajoId || ''));

            // Verificar si puede cambiar de espacio
            if (rol.id) {
                checkCanChangeWorkspace(rol.id);
            }
        }
    }, [rol]);

    const checkCanChangeWorkspace = async (rolId) => {
        try {
            const result = await canChangeRolWorkspace(rolId);
            setCanChangeWorkspace(result.canChange);
            setWorkspaceChangeMessage(result.reason || '');
        } catch (err) {
            console.error('Error al verificar cambio de espacio:', err);
            setCanChangeWorkspace(true);
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field) => {
        const errors = { ...fieldErrors };

        if (field === 'nombre' && !info.nombre?.trim()) {
            errors.nombre = 'El nombre del rol es requerido';
        } else if (field === 'nombre') {
            delete errors.nombre;
        }

        setFieldErrors(errors);
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfo(prev => ({ ...prev, [name]: value }));
        if (touched[name]) {
            validateField(name);
        }
    };

    const handlePermisoToggle = (permisoId) => {
        setPermisos(prev =>
            prev.includes(permisoId)
                ? prev.filter(id => id !== permisoId)
                : [...prev, permisoId]
        );
    };

    const handleModuloToggle = (modulo) => {
        const permisosDelModulo = permisosAgrupados[modulo].map(p => p.id);
        const todosSeleccionados = permisosDelModulo.every(id => permisos.includes(id));

        setPermisos(prev =>
            todosSeleccionados
                ? prev.filter(id => !permisosDelModulo.includes(id))
                : [...new Set([...prev, ...permisosDelModulo])]
        );
    };

    const validateStep1 = () => {
        const errors = {};
        if (!info.nombre?.trim()) {
            errors.nombre = 'El nombre del rol es requerido';
        }
        if (info.descripcion && info.descripcion.length > 1000) {
            errors.descripcion = 'Las notas no pueden exceder 1000 caracteres';
        }
        if (!espacioTrabajoId) {
            errors.espacioTrabajoId = 'El espacio de trabajo es requerido';
        }
        setFieldErrors(errors);
        setTouched({ nombre: true });
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (currentStep === 1 && !validateStep1()) {
            return;
        }
        setCurrentStep(prev => prev + 1);
    };

    const prevStep = () => {
        setCurrentStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        if (!validateStep1()) {
            setCurrentStep(1);
            return;
        }

        try {
            setLoading(true);
            setError('');

            const data = {
                nombre: info.nombre,
                descripcion: info.descripcion,
                permisos: permisos,
                espacioTrabajoId: espacioTrabajoId ? parseInt(espacioTrabajoId) : undefined,
            };

            if (isEditMode) {
                await updateRol(rol.id, data);
            } else {
                await createRol(data);
            }
            onSuccess();
        } catch (err) {
            const errorMessage = err.message.toLowerCase();
            // Detect step 1 field errors
            if (errorMessage.includes('nombre')) {
                setCurrentStep(1);
                setFieldErrors(prev => ({ ...prev, nombre: err.message }));
                setTouched(prev => ({ ...prev, nombre: true }));
            }
            setError(err.message);
        } finally {
            setLoading(false);
        }
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

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-group">
                <label className="form-label">Nombre *</label>
                <input
                    type="text"
                    name="nombre"
                    className={`form-input ${touched.nombre && fieldErrors.nombre ? 'input-error' : ''}`}
                    value={info.nombre}
                    onChange={handleInfoChange}
                    onBlur={() => handleBlur('nombre')}
                    placeholder="Ej: Gerente de RRHH"
                />
                <FieldError message={touched.nombre && fieldErrors.nombre} />
            </div>

            <div className="form-group">
                <label className="form-label">Descripción</label>
                <textarea
                    name="descripcion"
                    className="form-input"
                    value={info.descripcion}
                    onChange={handleInfoChange}
                    placeholder="Descripción del rol y sus responsabilidades..."
                    rows={4}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                    maxLength={1000}
                />
                <FieldError message={touched.descripcion && fieldErrors.descripcion} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{info.descripcion.length}/1000</span>
            </div>

            {/* Espacio de Trabajo */}
            <EspacioTrabajoSelector
                value={espacioTrabajoId}
                onChange={(e) => setEspacioTrabajoId(e.target.value)}
                onBlur={() => handleBlur('espacioTrabajoId')}
                canChange={!isEditMode || canChangeWorkspace}
                changeRestrictionMessage={workspaceChangeMessage}
                touched={touched.espacioTrabajoId}
                error={fieldErrors.espacioTrabajoId}
            />
        </div>
    );

    const renderStep2 = () => {
        // Definir el orden de las acciones
        const accionesOrdenadas = ['crear', 'leer', 'actualizar', 'eliminar'];

        // Calcular si todos los permisos están seleccionados
        const todosLosPermisos = Object.values(permisosAgrupados).flat().map(p => p.id);
        const todosSeleccionados = todosLosPermisos.length > 0 && todosLosPermisos.every(id => permisos.includes(id));
        const algunosSeleccionados = todosLosPermisos.some(id => permisos.includes(id)) && !todosSeleccionados;

        const handleSeleccionarTodos = () => {
            if (todosSeleccionados) {
                setPermisos([]);
            } else {
                setPermisos(todosLosPermisos);
            }
        };

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-secondary)',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <p style={{
                        fontSize: '0.875rem',
                        color: 'var(--text-secondary)',
                        margin: 0
                    }}>
                        <strong style={{ color: 'var(--text-primary)' }}>{permisos.length}</strong> permisos seleccionados
                    </p>
                    <label style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 500,
                        color: 'var(--text-primary)'
                    }}>
                        <input
                            type="checkbox"
                            checked={todosSeleccionados}
                            ref={input => {
                                if (input) input.indeterminate = algunosSeleccionados;
                            }}
                            onChange={handleSeleccionarTodos}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                        />
                        Seleccionar todos
                    </label>
                </div>

                {loadingPermisos ? (
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div className="spinner"></div>
                    </div>
                ) : (
                    <div style={{
                        border: '1px solid var(--border-color)',
                        borderRadius: '0.5rem',
                        overflow: 'hidden'
                    }}>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.875rem'
                            }}>
                                <thead>
                                    <tr style={{
                                        background: 'var(--bg-secondary)',
                                        borderBottom: '2px solid var(--border-color)'
                                    }}>
                                        <th style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'left',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            position: 'sticky',
                                            left: 0,
                                            background: 'var(--bg-secondary)',
                                            zIndex: 1
                                        }}>
                                            Módulo
                                        </th>
                                        {accionesOrdenadas.map(accion => (
                                            <th key={accion} style={{
                                                padding: '0.75rem 1rem',
                                                textAlign: 'center',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                minWidth: '100px'
                                            }}>
                                                {getAccionLabel(accion)}
                                            </th>
                                        ))}
                                        <th style={{
                                            padding: '0.75rem 1rem',
                                            textAlign: 'center',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            minWidth: '120px'
                                        }}>
                                            Seleccionar Todo
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
                                            const permisosModulo = permisosAgrupados[modulo];
                                            if (!permisosModulo) return null;

                                            const permisosDelModulo = permisosModulo.map(p => p.id);
                                            const todosSeleccionados = permisosDelModulo.every(id => permisos.includes(id));
                                            const algunosSeleccionados = permisosDelModulo.some(id => permisos.includes(id)) && !todosSeleccionados;

                                            return (
                                                <tr key={modulo} style={{
                                                    borderBottom: index < MODULE_ORDER.length - 1 ? '1px solid var(--border-color)' : 'none',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--hover-bg)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <td style={{
                                                        padding: '0.75rem 1rem',
                                                        fontWeight: 600,
                                                        color: 'var(--text-primary)',
                                                        position: 'sticky',
                                                        left: 0,
                                                        background: 'var(--card-bg, white)',
                                                        zIndex: 1,
                                                        boxShadow: '2px 0 4px rgba(0,0,0,0.04)'
                                                    }}>
                                                        {getModuloLabel(modulo)}
                                                    </td>
                                                    {accionesOrdenadas.map(accion => {
                                                        const permiso = permisosModulo.find(p => p.accion === accion);
                                                        if (!permiso) {
                                                            return (
                                                                <td key={accion} style={{
                                                                    padding: '0.75rem 1rem',
                                                                    textAlign: 'center'
                                                                }}>
                                                                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                                                                </td>
                                                            );
                                                        }
                                                        return (
                                                            <td key={accion} style={{
                                                                padding: '0.75rem 1rem',
                                                                textAlign: 'center'
                                                            }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permisos.includes(permiso.id)}
                                                                    onChange={() => handlePermisoToggle(permiso.id)}
                                                                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                    <td style={{
                                                        padding: '0.75rem 1rem',
                                                        textAlign: 'center'
                                                    }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={todosSeleccionados}
                                                            ref={input => {
                                                                if (input) input.indeterminate = algunosSeleccionados;
                                                            }}
                                                            onChange={() => handleModuloToggle(modulo)}
                                                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const content = (
        <>
            <div className="modal-body" style={{ padding: '2rem' }}>
                <StepTracker steps={steps} currentStep={currentStep} />

                <div style={{ marginTop: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {steps[currentStep - 1].title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {currentStep === 1 && 'Define el nombre y descripción del rol'}
                        {currentStep === 2 && 'Selecciona los permisos que tendrá este rol'}
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error">
                        {error}
                    </div>
                )}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                <div>
                    {currentStep > 1 && (
                        <button className="btn btn-secondary" onClick={prevStep}>
                            Anterior
                        </button>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>
                        Cancelar
                    </button>
                    {currentStep < 2 ? (
                        <button className="btn btn-primary" onClick={nextStep}>
                            Siguiente
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || loadingPermisos}>
                            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')} Rol
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Editar Rol' : 'Nuevo Rol'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                {content}
            </div>
        </div>
    );
};

export default RolWizard;


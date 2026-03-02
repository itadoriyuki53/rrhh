/**
 * @fileoverview Orquestador para la creación y edición de registros de salud mediante un proceso guiado.
 * @module components/RegistroSaludWizard
 */

import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { getEmpleados, createRegistroSalud, updateRegistroSalud } from '../services/api';
import { validarDiaHabil } from '../helpers/diasHabiles';
import { getTodayStr, formatFullName } from '../helpers/formatters';
import { useIsDark } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

const TIPOS_EXAMEN = [
    { value: 'pre_ocupacional', label: 'Pre-Ocupacional' },
    { value: 'periodico', label: 'PeriÃ³dico' },
    { value: 'post_ocupacional', label: 'Post-Ocupacional' },
    { value: 'retorno_trabajo', label: 'Retorno al Trabajo' },
];

const RESULTADOS = [
    { value: 'apto', label: 'Apto' },
    { value: 'apto_preexistencias', label: 'Apto con Preexistencias' },
    { value: 'no_apto', label: 'No Apto' },
];

// Tooltip content for medical certificate
const TOOLTIP_COMPROBANTE = `El comprobante mÃ©dico sirve para **justificar una licencia o inasistencia** laboral.
Cuando la inasistencia estÃ¡ debidamente justificada con un comprobante mÃ©dico, el empleado puede solicitar licencia o inasistencia y continuar percibiendo su salario, conforme a la normativa vigente de la ART.`;

// Field error component
const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};



/**
 * Componente RegistroSaludWizard
 * 
 * Gestiona el alta y modificación de exámenes de salud, permitiendo
 * la carga de múltiples comprobantes y validando fechas en 2 pasos.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.registro] - Objeto registro a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @returns {JSX.Element}
 */
const RegistroSaludWizard = ({ registro, onClose, onSuccess }) => {
    const isEditing = !!registro;
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        empleadoId: null,
        tipoExamen: '',
        resultado: '',
        fechaRealizacion: getTodayStr(),
        fechaVencimiento: '',
        comprobantes: [],
    });

    const [empleados, setEmpleados] = useState([]);
    const [loadingEmpleados, setLoadingEmpleados] = useState(true);
    const [selectedEmpleado, setSelectedEmpleado] = useState(null);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const isDark = useIsDark();

    const steps = [
        { number: 1, title: 'InformaciÃ³n BÃ¡sica' },
        { number: 2, title: 'DocumentaciÃ³n MÃ©dica' },
    ];



    // Load empleados
    useEffect(() => {
        const loadEmpleados = async () => {
            try {
                setLoadingEmpleados(true);
                const result = await getEmpleados({ activo: 'true', limit: 1000 });
                setEmpleados(result.data);
            } catch (err) {
                console.error('Error loading empleados:', err);
            } finally {
                setLoadingEmpleados(false);
            }
        };
        loadEmpleados();
    }, []);

    // Initialize form with existing data
    useEffect(() => {
        if (registro) {
            if (registro.empleado) {
                const empOption = {
                    value: registro.empleado.id,
                    label: `${formatFullName(registro.empleado)} (${registro.empleado.numeroDocumento || 'Sin doc'})`,
                    empleado: registro.empleado
                };
                setSelectedEmpleado(empOption);
            }

            // Parse comprobantes - could be single or array
            let comprobantes = [];
            if (registro.comprobante) {
                comprobantes = [{
                    data: registro.comprobante,
                    nombre: registro.comprobanteNombre || 'Comprobante',
                    tipo: registro.comprobanteTipo || 'application/pdf',
                }];
            }
            if (registro.comprobantes && Array.isArray(registro.comprobantes)) {
                comprobantes = registro.comprobantes;
            }

            setFormData({
                empleadoId: registro.empleado?.id || null,
                tipoExamen: registro.tipoExamen || '',
                resultado: registro.resultado || '',
                fechaRealizacion: registro.fechaRealizacion || '',
                fechaVencimiento: registro.fechaVencimiento || '',
                comprobantes,
            });
        }
    }, [registro]);

    const empleadoOptions = Object.values(empleados.reduce((acc, emp) => {
        const wsName = emp.espacioTrabajo?.nombre || 'Sin Espacio';
        if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };
        acc[wsName].options.push({
            value: emp.id,
            label: `${formatFullName(emp)} - ${emp.numeroDocumento || 'Sin doc'}`,
            empleado: emp,
        });
        return acc;
    }, {}));

    const handleEmpleadoChange = (option) => {
        setSelectedEmpleado(option);
        setFormData(prev => ({
            ...prev,
            empleadoId: option ? option.value : null,
        }));
        if (touched.empleadoId) validateStep();
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateStep();
    };

    const handleChange = (field, value) => { // âœ… SÃ­ncrono ahora
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');

        // Validar dÃ­as hÃ¡biles en tiempo real SÃNCRONO
        if ((field === 'fechaRealizacion' || field === 'fechaVencimiento') && value) {
            try {
                const nombreCampo = field === 'fechaRealizacion'
                    ? 'La fecha de realizaciÃ³n'
                    : 'La fecha de vencimiento';
                validarDiaHabil(value, nombreCampo); // âœ… SÃ­ncrono
                setFieldErrors(prev => ({ ...prev, [field]: null }));
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, [field]: error.message }));
                setTouched(prev => ({ ...prev, [field]: true })); // Marcar como touched para mostrar error
            }
        }

        if (touched[field]) validateStep();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        const newComprobantes = [...formData.comprobantes];
        let hasError = false;

        files.forEach(file => {
            if (!validTypes.includes(file.type)) {
                setFieldErrors(prev => ({ ...prev, comprobantes: 'Solo se permiten archivos PDF o imÃ¡genes' }));
                hasError = true;
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                setFieldErrors(prev => ({ ...prev, comprobantes: 'Cada archivo no puede superar 10MB' }));
                hasError = true;
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                newComprobantes.push({
                    data: reader.result,
                    nombre: file.name,
                    tipo: file.type,
                });
                setFormData(prev => ({ ...prev, comprobantes: [...newComprobantes] }));
                setFieldErrors(prev => ({ ...prev, comprobantes: null }));
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const removeFile = (index) => {
        setFormData(prev => ({
            ...prev,
            comprobantes: prev.comprobantes.filter((_, i) => i !== index),
        }));
    };

    const validateStep = () => {
        const errors = {};

        if (currentStep === 1) {
            if (!formData.empleadoId) errors.empleadoId = 'Debe seleccionar un empleado';
            if (!formData.tipoExamen) errors.tipoExamen = 'El tipo de examen es requerido';
            if (!formData.resultado) errors.resultado = 'El resultado es requerido';
            if (!formData.fechaRealizacion) {
                errors.fechaRealizacion = 'La fecha de realizaciÃ³n es requerida';
            } else if (new Date(formData.fechaRealizacion) > new Date()) {
                errors.fechaRealizacion = 'La fecha de realizaciÃ³n no puede ser mayor a la fecha actual';
            }
            if (!formData.fechaVencimiento) {
                errors.fechaVencimiento = 'La fecha de vencimiento es requerida';
            } else if (formData.fechaRealizacion && new Date(formData.fechaVencimiento) < new Date(formData.fechaRealizacion)) {
                errors.fechaVencimiento = 'La fecha de vencimiento no puede ser anterior a la fecha de realizaciÃ³n';
            }
        }
        // Step 2 has no required fields (comprobantes are optional)

        // Preservar solo los errores de dÃ­as hÃ¡biles de campos de fecha
        setFieldErrors(prev => {
            const camposFecha = ['fechaRealizacion', 'fechaVencimiento'];
            const erroresDiasHabiles = {};

            // Preservar errores de dÃ­as hÃ¡biles en campos de fecha
            camposFecha.forEach(campo => {
                if (prev[campo] && prev[campo].includes('dÃ­a hÃ¡bil')) {
                    erroresDiasHabiles[campo] = prev[campo];
                }
            });

            // Combinar: errores de la validaciÃ³n actual + errores de dÃ­as hÃ¡biles preservados
            return { ...erroresDiasHabiles, ...errors };
        });

        if (Object.keys(errors).length > 0) {
            const allTouched = {};
            Object.keys(errors).forEach(key => { allTouched[key] = true; });
            setTouched(prev => ({ ...prev, ...allTouched }));
            setError('Por favor completa todos los campos obligatorios');
        }

        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => prev + 1);
            setTouched({});
            setError('');
        }
    };

    const prevStep = () => setCurrentStep(prev => prev - 1);

    const handleSubmit = async () => {
        if (!validateStep()) return;

        try {
            setSubmitting(true);
            const payload = {
                tipoExamen: formData.tipoExamen,
                resultado: formData.resultado,
                fechaRealizacion: formData.fechaRealizacion,
                fechaVencimiento: formData.fechaVencimiento,
                comprobantes: formData.comprobantes,
                empleadoId: formData.empleadoId,
            };

            if (isEditing) {
                await updateRegistroSalud(registro.id, payload);
            } else {
                await createRegistroSalud(payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Empleado Selection with react-select */}
            <div className="form-group">
                <label className="form-label">Empleado *</label>
                <Select
                    isLoading={loadingEmpleados}
                    options={empleadoOptions}
                    value={selectedEmpleado}
                    onChange={handleEmpleadoChange}
                    onBlur={() => handleBlur('empleadoId')}
                    placeholder="Buscar y seleccionar empleado..."
                    noOptionsMessage={() => "No se encontraron empleados"}
                    styles={buildSelectStyles(isDark)}
                    formatGroupLabel={data => (
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                            {data.label}
                        </div>
                    )}
                    isClearable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                />
                <FieldError message={touched.empleadoId && fieldErrors.empleadoId} />
            </div>

            {/* Tipo de Examen y Resultado - 2 columns */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Tipo de Examen *</label>
                    <select
                        className={`form-input ${touched.tipoExamen && fieldErrors.tipoExamen ? 'input-error' : ''}`}
                        value={formData.tipoExamen}
                        onChange={(e) => handleChange('tipoExamen', e.target.value)}
                        onBlur={() => handleBlur('tipoExamen')}
                    >
                        <option value="">Seleccionar tipo...</option>
                        {TIPOS_EXAMEN.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                    <FieldError message={touched.tipoExamen && fieldErrors.tipoExamen} />
                </div>
                <div className="form-group">
                    <label className="form-label">Resultado *</label>
                    <select
                        className={`form-input ${touched.resultado && fieldErrors.resultado ? 'input-error' : ''}`}
                        value={formData.resultado}
                        onChange={(e) => handleChange('resultado', e.target.value)}
                        onBlur={() => handleBlur('resultado')}
                    >
                        <option value="">Seleccionar resultado...</option>
                        {RESULTADOS.map(r => (
                            <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                    </select>
                    <FieldError message={touched.resultado && fieldErrors.resultado} />
                </div>
            </div>

            {/* Fechas - 2 columns */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha de RealizaciÃ³n *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fechaRealizacion && fieldErrors.fechaRealizacion ? 'input-error' : ''}`}
                        value={formData.fechaRealizacion}
                        onChange={(e) => handleChange('fechaRealizacion', e.target.value)}
                        onBlur={() => handleBlur('fechaRealizacion')}
                    />
                    <FieldError message={touched.fechaRealizacion && fieldErrors.fechaRealizacion} />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Vencimiento *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fechaVencimiento && fieldErrors.fechaVencimiento ? 'input-error' : ''}`}
                        value={formData.fechaVencimiento}
                        onChange={(e) => handleChange('fechaVencimiento', e.target.value)}
                        onBlur={() => handleBlur('fechaVencimiento')}
                    />
                    <FieldError message={touched.fechaVencimiento && fieldErrors.fechaVencimiento} />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Comprobantes - Multiple files */}
            <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Comprobantes MÃ©dicos
                    <span
                        className="tooltip-icon"
                        onClick={() => setShowTooltip(!showTooltip)}
                    >
                        ?
                    </span>
                </label>
                {showTooltip && (
                    <div className="tooltip-info">
                        {TOOLTIP_COMPROBANTE.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </div>
                )}

                {/* Files list */}
                {formData.comprobantes.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        {formData.comprobantes.map((file, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-color)'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20, color: 'var(--primary-color)', flexShrink: 0 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                </svg>
                                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.875rem' }}>
                                    {file.nombre}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeFile(index)}
                                    className="btn btn-danger btn-sm"
                                    style={{
                                        padding: '0.4rem 0.6rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.35rem',
                                    }}
                                    title="Eliminar archivo"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Eliminar
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Upload area */}
                <div
                    style={{
                        border: '2px dashed var(--border-color)',
                        borderRadius: '0.5rem',
                        padding: '1.5rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        background: 'var(--bg-secondary)',
                        transition: 'border-color 0.2s',
                    }}
                    onClick={() => document.getElementById('comprobante-input').click()}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = '#0d9488'; }}
                    onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        const dt = e.dataTransfer;
                        const files = dt.files;
                        handleFileChange({ target: { files } });
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 36, height: 36, color: 'var(--text-secondary)', margin: '0 auto 0.5rem' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Haz clic o arrastra archivos para subir
                    </p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        PDF o imÃ¡genes â€¢ MÃ¡ximo 10MB cada uno
                    </p>
                </div>
                <input
                    id="comprobante-input"
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                />
                <FieldError message={fieldErrors.comprobantes} />
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Registro de Salud' : 'Nuevo Registro de Salud'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <StepTracker steps={steps} currentStep={currentStep} />

                    <div style={{ marginTop: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                            {steps[currentStep - 1].title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {currentStep === 1 && 'Ingresa los datos bÃ¡sicos del registro de salud'}
                            {currentStep === 2 && 'Adjunta los comprobantes mÃ©dicos (opcional)'}
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
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
                        <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                            Cancelar
                        </button>
                        {currentStep < 2 ? (
                            <button className="btn btn-primary" onClick={nextStep}>
                                Siguiente
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Registro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegistroSaludWizard;


import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { getContratos, createEvaluacion, updateEvaluacion } from '../services/api';
import { validarDiaHabil } from '../utils/diasHabiles';
import { getTodayStr, formatFullName } from '../utils/formatters';

// Periods
const PERIODOS = [
    { value: 'anual', label: 'Anual' },
    { value: 'semestre_1', label: `${new Date().getFullYear()} – 1er Semestre` },
    { value: 'semestre_2', label: `${new Date().getFullYear()} – 2do Semestre` },
    { value: 'q1', label: 'Trimestral / Q1' },
    { value: 'q2', label: 'Trimestral / Q2' },
    { value: 'q3', label: 'Trimestral / Q3' },
    { value: 'q4', label: 'Trimestral / Q4' },
    { value: 'cierre_prueba', label: 'Cierre de Período de Prueba' },
    { value: 'fin_proyecto', label: 'Fin de Proyecto' },
    { value: 'ad_hoc', label: 'Ad-hoc / Extraordinaria' },
];

// Tipos de evaluación
const TIPOS_EVALUACION = [
    { value: 'autoevaluacion', label: 'Autoevaluación' },
    { value: 'descendente_90', label: '90° (Descendente)' },
    { value: 'pares_jefe_180', label: '180° (Pares + Jefe)' },
    { value: 'ascendente_270', label: '270° (Ascendente)' },
    { value: 'integral_360', label: '360° (Integral)' },
    { value: 'competencias', label: 'Por Competencias' },
    { value: 'objetivos', label: 'Por Objetivos (KPIs / OKRs)' },
    { value: 'mixta', label: 'Mixta' },
    { value: 'potencial', label: 'Potencial' },
];

// Estados
const ESTADOS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'firmada', label: 'Firmada' },
];

// Escalas
const ESCALAS = [
    { value: 'supera_expectativas', label: 'Supera Expectativas' },
    { value: 'cumple', label: 'Cumple' },
    { value: 'necesita_mejora', label: 'Necesita Mejora' },
];

// Tooltips
const TOOLTIP_PERIODO = `Define el **lapso evaluado**: anual, semestral, trimestral, cierre de período de prueba, fin de proyecto o fuera de calendario.`;
const TOOLTIP_TIPO_EVALUACION = `Define la **metodología y el alcance de la evaluación**: quién evalúa a quién (auto, jefe, pares, 360°) y el enfoque (competencias, objetivos, mixto o potencial).`;
const TOOLTIP_ESTADO = `**Estado del proceso de evaluación**: Pendiente, En curso, Finalizada o Firmada.`;
const TOOLTIP_ESCALA = `**Escala de valoración**: Supera expectativas, Cumple o Necesita mejora.`;

// Field error component
const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};

// Custom styles for react-select - Green selected items like ContratoWizard
const getSelectStyles = (isDark) => ({
    control: (base, state) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        borderColor: state.isFocused ? '#0d9488' : (isDark ? '#334155' : '#e2e8f0'),
        boxShadow: state.isFocused ? '0 0 0 2px rgba(13, 148, 136, 0.2)' : 'none',
        '&:hover': { borderColor: '#0d9488' },
        minHeight: '42px',
        borderRadius: '0.5rem',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
    }),
    menuPortal: (base) => ({
        ...base,
        zIndex: 9999,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected ? '#0d9488' : state.isFocused ? (isDark ? '#334155' : '#f1f5f9') : 'transparent',
        color: state.isSelected ? 'white' : (isDark ? '#e2e8f0' : '#1e293b'),
        cursor: 'pointer',
        '&:active': { backgroundColor: '#0d9488' },
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#0d9488',
        borderRadius: '0.375rem',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: 'white',
        padding: '4px 8px',
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: 'white',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' },
    }),
    input: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b' }),
    singleValue: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8' }),
});

const TooltipIcon = ({ content, isOpen, onToggle }) => (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <span className="tooltip-icon" onClick={onToggle} style={{ cursor: 'pointer' }}>?</span>
    </span>
);

const TooltipContent = ({ content, isOpen }) => {
    if (!isOpen) return null;
    return (
        <div className="tooltip-info" style={{ whiteSpace: 'pre-line', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
            {content.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
            )}
        </div>
    );
};

const EvaluacionWizard = ({ evaluacion, onClose, onSuccess }) => {
    const isEditing = !!evaluacion;
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        periodo: '',
        tipoEvaluacion: '',
        fecha: getTodayStr(),
        evaluadoresIds: [],
        contratosEvaluadosIds: [],
        contratoEvaluadoId: null,
        estado: 'pendiente',
        puntaje: '',
        escala: '',
        feedback: '',
        reconocidoPorEmpleado: false,
        fechaReconocimiento: null,
        notas: '',
    });

    const [contratos, setContratos] = useState([]);
    const [loadingContratos, setLoadingContratos] = useState(true);

    const [selectedEvaluadores, setSelectedEvaluadores] = useState([]);
    const [selectedContratosEvaluados, setSelectedContratosEvaluados] = useState([]);
    const [selectedSingleContratoEvaluado, setSelectedSingleContratoEvaluado] = useState(null);

    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
    const [activeTooltip, setActiveTooltip] = useState(null);

    const steps = [
        { number: 1, title: 'Información Básica' },
        { number: 2, title: 'Participantes' },
        { number: 3, title: 'Resultado Final' },
    ];

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Load Contratos
    useEffect(() => {
        const loadRequests = async () => {
            try {
                setLoadingContratos(true);
                const result = await getContratos({ activo: 'true', estado: 'en_curso', limit: 1000 });
                setContratos(result.data);
            } catch (err) {
                console.error('Error loading contratos:', err);
            } finally {
                setLoadingContratos(false);
            }
        };
        loadRequests();
    }, []);

    const workspaceId = selectedEvaluadores[0]?.contrato?.empleado?.espacioTrabajoId ||
        selectedContratosEvaluados[0]?.contrato?.empleado?.espacioTrabajoId ||
        selectedSingleContratoEvaluado?.contrato?.empleado?.espacioTrabajoId;

    const contratoOptions = Object.values(contratos.reduce((acc, contrato) => {
        // Filtrar por espacio de trabajo si hay alguno seleccionado
        if (workspaceId && contrato.empleado?.espacioTrabajoId !== workspaceId) return acc;

        const wsName = contrato.empleado?.espacioTrabajo?.nombre || 'Sin Espacio';
        if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };

        const nombreEmpleado = formatFullName(contrato.empleado);
        const puesto = contrato.puestos && contrato.puestos.length > 0 ? contrato.puestos[0].nombre : 'Sin puesto';
        const empresa = contrato.puestos && contrato.puestos.length > 0 && contrato.puestos[0].departamento?.area?.empresa?.nombre;
        const label = `${nombreEmpleado} - ${puesto}${empresa ? ` (${empresa})` : ''}`;

        acc[wsName].options.push({
            value: contrato.id,
            label: label,
            contrato: contrato
        });
        return acc;
    }, {}));

    // Helper to find option for editing or initial values
    const findContratoOption = (id) => {
        for (const group of contratoOptions) {
            const found = group.options.find(opt => opt.value === id);
            if (found) return found;
        }
        return null;
    };

    // Initialize form
    useEffect(() => {
        if (evaluacion) {
            // ... existing init logic ...
            setFormData(prev => ({
                ...prev,
                periodo: evaluacion.periodo || '',
                tipoEvaluacion: evaluacion.tipoEvaluacion || '',
                fecha: evaluacion.fecha || getTodayStr(),
                contratoEvaluadoId: evaluacion.contratoEvaluadoId,
                estado: evaluacion.estado || 'pendiente',
                puntaje: evaluacion.puntaje?.toString() || '',
                escala: evaluacion.escala || '',
                feedback: evaluacion.feedback || '',
                reconocidoPorEmpleado: evaluacion.reconocidoPorEmpleado || false,
                fechaReconocimiento: evaluacion.fechaReconocimiento || null,
                notas: evaluacion.notas || '',
            }));

            if (evaluacion.contratoEvaluado) {
                // Reconstruct option manually if not found in list yet (though list should cover it)
                // or try to find in loaded groups
                // Simple reconstruction for display if list not ready
                const c = evaluacion.contratoEvaluado;
                const nombre = formatFullName(c.empleado);
                const puesto = c.puestos?.[0]?.nombre || 'Sin puesto';
                const empresa = c.puestos?.[0]?.departamento?.area?.empresa?.nombre;
                setSelectedSingleContratoEvaluado({
                    value: c.id,
                    label: `${nombre} - ${puesto}${empresa ? ` (${empresa})` : ''}`,
                    contrato: c
                });
            }

            if (evaluacion.evaluadores && evaluacion.evaluadores.length > 0) {
                // Similarly reconstruction
                const evalOpts = evaluacion.evaluadores.map(c => {
                    const nombre = formatFullName(c.empleado);
                    const puesto = c.puestos?.[0]?.nombre || 'Sin puesto';
                    const empresa = c.puestos?.[0]?.departamento?.area?.empresa?.nombre;
                    return {
                        value: c.id,
                        label: `${nombre} - ${puesto}${empresa ? ` (${empresa})` : ''}`,
                        contrato: c
                    };
                });
                setSelectedEvaluadores(evalOpts);
                setFormData(prev => ({ ...prev, evaluadoresIds: evalOpts.map(o => o.value) }));
            }
        }
    }, [evaluacion]);

    const handleEvaluadoresChange = (options) => {
        const opts = options || [];
        setSelectedEvaluadores(opts);
        setFormData(prev => ({ ...prev, evaluadoresIds: opts.map(o => o.value) }));
        if (touched.evaluadoresIds) validateStep();
    };

    const validateStep = (newFormData = formData) => {
        // Validation logic can be here if needed for real-time feedback
        // currently nextStep handles main validation
    };



    const handleContratosEvaluadosChange = (options) => {
        const opts = options || [];
        setSelectedContratosEvaluados(opts);
        setFormData(prev => ({ ...prev, contratosEvaluadosIds: opts.map(o => o.value) }));
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
    };

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');

        if (field === 'fecha' && value) {
            try {
                const nombresCampos = {
                    fecha: 'La fecha de evaluación'
                };
                validarDiaHabil(value, nombresCampos[field]);
                setFieldErrors(prev => ({ ...prev, fecha: null }));
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, fecha: error.message }));
                setTouched(prev => ({ ...prev, fecha: true }));
            }
        }
    };

    const nextStep = () => {
        const errors = {};
        let isValid = true;

        if (currentStep === 1) {
            if (!formData.periodo) errors.periodo = 'El período es requerido';
            if (!formData.tipoEvaluacion) errors.tipoEvaluacion = 'El tipo de evaluación es requerido';
            if (!formData.fecha) errors.fecha = 'La fecha es requerida';
            else if (new Date(formData.fecha) > new Date()) errors.fecha = 'La fecha no puede ser futura';
            if (!formData.estado) errors.estado = 'El estado es requerido';
            // Validar dia habil error
            if (fieldErrors.fecha) isValid = false;

        } else if (currentStep === 2) {
            if (!formData.evaluadoresIds || formData.evaluadoresIds.length === 0) {
                errors.evaluadoresIds = 'Debe seleccionar al menos un evaluador';
            }
            if (!isEditing) {
                if (!formData.contratosEvaluadosIds || formData.contratosEvaluadosIds.length === 0) {
                    errors.contratosEvaluadosIds = 'Debe seleccionar al menos un contrato a evaluar';
                }
                // Check intersection
                if (formData.contratosEvaluadosIds.length > 0 && formData.evaluadoresIds.length > 0) {
                    const intersection = formData.contratosEvaluadosIds.filter(id => formData.evaluadoresIds.includes(id));
                    if (intersection.length > 0) {
                        errors.contratosEvaluadosIds = 'No puede evaluar a quien lo evalúa (conflicto de intereses)';
                    }
                }
            }
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...errors }));
            setTouched(prev => Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), prev));
            setError('Por favor completa todos los campos obligatorios');
            isValid = false;
        }

        if (isValid) {
            setCurrentStep(prev => prev + 1);
            setTouched({});
            setError('');
        }
    };


    const prevStep = () => setCurrentStep(prev => prev - 1);

    const validateFinalStep = () => {
        const errors = {};
        if (!formData.puntaje) {
            errors.puntaje = 'El puntaje es requerido';
        } else {
            const p = parseInt(formData.puntaje, 10);
            if (isNaN(p) || p < 0 || p > 100) errors.puntaje = 'El puntaje debe estar entre 0 y 100';
        }
        if (!formData.escala) errors.escala = 'La escala es requerida';
        if (!formData.feedback) {
            errors.feedback = 'El feedback es requerido';
        } else if (formData.feedback.length < 10) {
            errors.feedback = 'El feedback debe tener al menos 10 caracteres';
        } else if (formData.feedback.length > 2000) {
            errors.feedback = 'El feedback no puede exceder 2000 caracteres';
        }

        if (Object.keys(errors).length > 0) {
            setFieldErrors(prev => ({ ...prev, ...errors }));
            setTouched(prev => Object.keys(errors).reduce((acc, key) => ({ ...acc, [key]: true }), prev));
            setError('Por favor completa todos los campos obligatorios');
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateFinalStep()) return;

        try {
            setSubmitting(true);
            const payload = {
                ...formData,
                puntaje: parseInt(formData.puntaje, 10),
            };

            // Remove contracts logic if is editing (readonly)
            if (isEditing) {
                // Keep only editable fields for update? Actually backend handles update
                await updateEvaluacion(evaluacion.id, payload);
            } else {
                await createEvaluacion(payload);
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
            {/* Período y Tipo */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Período *
                        <TooltipIcon content={TOOLTIP_PERIODO} isOpen={activeTooltip === 'periodo'} onToggle={() => setActiveTooltip(activeTooltip === 'periodo' ? null : 'periodo')} />
                    </label>
                    <TooltipContent content={TOOLTIP_PERIODO} isOpen={activeTooltip === 'periodo'} />
                    <select
                        className={`form-input ${touched.periodo && fieldErrors.periodo ? 'input-error' : ''}`}
                        value={formData.periodo}
                        onChange={(e) => handleChange('periodo', e.target.value)}
                        onBlur={() => handleBlur('periodo')}
                    >
                        <option value="">Seleccionar...</option>
                        {PERIODOS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                    <FieldError message={touched.periodo && fieldErrors.periodo} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Tipo *
                        <TooltipIcon content={TOOLTIP_TIPO_EVALUACION} isOpen={activeTooltip === 'tipoEvaluacion'} onToggle={() => setActiveTooltip(activeTooltip === 'tipoEvaluacion' ? null : 'tipoEvaluacion')} />
                    </label>
                    <TooltipContent content={TOOLTIP_TIPO_EVALUACION} isOpen={activeTooltip === 'tipoEvaluacion'} />
                    <select
                        className={`form-input ${touched.tipoEvaluacion && fieldErrors.tipoEvaluacion ? 'input-error' : ''}`}
                        value={formData.tipoEvaluacion}
                        onChange={(e) => handleChange('tipoEvaluacion', e.target.value)}
                        onBlur={() => handleBlur('tipoEvaluacion')}
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_EVALUACION.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <FieldError message={touched.tipoEvaluacion && fieldErrors.tipoEvaluacion} />
                </div>
            </div>

            {/* Fecha y Estado */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fecha && fieldErrors.fecha ? 'input-error' : ''}`}
                        value={formData.fecha}
                        onChange={(e) => handleChange('fecha', e.target.value)}
                        onBlur={() => handleBlur('fecha')}
                        max={getTodayStr()}
                    />
                    <FieldError message={touched.fecha && fieldErrors.fecha} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Estado *
                        <TooltipIcon content={TOOLTIP_ESTADO} isOpen={activeTooltip === 'estado'} onToggle={() => setActiveTooltip(activeTooltip === 'estado' ? null : 'estado')} />
                    </label>
                    <TooltipContent content={TOOLTIP_ESTADO} isOpen={activeTooltip === 'estado'} />
                    <select
                        className={`form-input ${touched.estado && fieldErrors.estado ? 'input-error' : ''}`}
                        value={formData.estado}
                        onChange={(e) => handleChange('estado', e.target.value)}
                        onBlur={() => handleBlur('estado')}
                    >
                        <option value="">Seleccionar...</option>
                        {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                    <FieldError message={touched.estado && fieldErrors.estado} />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Evaluadores */}
            <div className="form-group">
                <label className="form-label">Evaluador(es) *</label>
                <Select
                    isMulti
                    isLoading={loadingContratos}
                    options={contratoOptions}
                    value={selectedEvaluadores}
                    onChange={handleEvaluadoresChange}
                    onBlur={() => handleBlur('evaluadoresIds')}
                    placeholder="Buscar..."
                    noOptionsMessage={() => "No se encontraron contratos"}
                    styles={getSelectStyles(isDark)}
                    formatGroupLabel={data => (
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                            {data.label}
                        </div>
                    )}
                    isClearable
                    menuPortalTarget={document.body}
                    menuPosition="fixed"
                />
                <FieldError message={touched.evaluadoresIds && fieldErrors.evaluadoresIds} />
            </div>

            {/* Evaluados */}
            <div className="form-group">
                <label className="form-label">{isEditing ? 'Evaluado' : 'Evaluado(s) *'}</label>
                {isEditing ? (
                    <Select
                        isDisabled
                        value={selectedSingleContratoEvaluado}
                        styles={getSelectStyles(isDark)}
                    />
                ) : (
                    <>
                        <Select
                            isMulti
                            isLoading={loadingContratos}
                            options={contratoOptions}
                            value={selectedContratosEvaluados}
                            onChange={handleContratosEvaluadosChange}
                            onBlur={() => handleBlur('contratosEvaluadosIds')}
                            placeholder="Buscar..."
                            noOptionsMessage={() => "No se encontraron contratos"}
                            styles={getSelectStyles(isDark)}
                            formatGroupLabel={data => (
                                <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                                    {data.label}
                                </div>
                            )}
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                        <FieldError message={touched.contratosEvaluadosIds && fieldErrors.contratosEvaluadosIds} />
                    </>
                )}
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Puntaje y Escala */}
            <div className="form-grid-stacked-3">
                <div className="form-group">
                    <label className="form-label">Puntaje *</label>
                    <input
                        type="number"
                        className={`form-input ${touched.puntaje && fieldErrors.puntaje ? 'input-error' : ''}`}
                        value={formData.puntaje}
                        onChange={(e) => handleChange('puntaje', e.target.value)}
                        onBlur={() => handleBlur('puntaje')}
                        min="0"
                        max="100"
                        placeholder="0-100"
                    />
                    <FieldError message={touched.puntaje && fieldErrors.puntaje} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Escala *
                        <TooltipIcon content={TOOLTIP_ESCALA} isOpen={activeTooltip === 'escala'} onToggle={() => setActiveTooltip(activeTooltip === 'escala' ? null : 'escala')} />
                    </label>
                    <TooltipContent content={TOOLTIP_ESCALA} isOpen={activeTooltip === 'escala'} />
                    <select
                        className={`form-input ${touched.escala && fieldErrors.escala ? 'input-error' : ''}`}
                        value={formData.escala}
                        onChange={(e) => handleChange('escala', e.target.value)}
                        onBlur={() => handleBlur('escala')}
                    >
                        <option value="">Seleccionar...</option>
                        {ESCALAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                    <FieldError message={touched.escala && fieldErrors.escala} />
                </div>
                <div className="form-group">
                    <label className="form-label">Reconocimiento</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
                        <input
                            type="checkbox"
                            id="reconocido"
                            checked={formData.reconocidoPorEmpleado}
                            onChange={(e) => handleChange('reconocidoPorEmpleado', e.target.checked)}
                            style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        />
                        <label htmlFor="reconocido" style={{ cursor: 'pointer', fontSize: '0.95rem', userSelect: 'none' }}>
                            Reconocido por el empleado
                        </label>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            <div className="form-group">
                <label className="form-label">Feedback *</label>
                <textarea
                    className={`form-input ${touched.feedback && fieldErrors.feedback ? 'input-error' : ''}`}
                    value={formData.feedback}
                    onChange={(e) => handleChange('feedback', e.target.value)}
                    onBlur={() => handleBlur('feedback')}
                    rows={4}
                    style={{ resize: 'vertical', minHeight: '100px' }}
                    maxLength={2000}
                />
                <FieldError message={touched.feedback && fieldErrors.feedback} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{formData.feedback.length}/2000</span>
            </div>

            {/* Notas */}
            <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea
                    className={`form-input ${fieldErrors.notas ? 'input-error' : ''}`}
                    value={formData.notas}
                    onChange={(e) => handleChange('notas', e.target.value)}
                    rows={3}
                    style={{ resize: 'vertical', minHeight: '80px' }}
                    maxLength={1000}
                />
                <FieldError message={touched.notas && fieldErrors.notas} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{formData.notas.length}/1000</span>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Evaluación' : 'Nueva Evaluación'}</h2>
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
                            {currentStep === 1 && 'Define el período, tipo y estado de la evaluación'}
                            {currentStep === 2 && 'Selecciona los evaluadores y evaluados'}
                            {currentStep === 3 && 'Ingresa el puntaje, escala y feedback'}
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                            {error}
                        </div>
                    )}

                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
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
                        {currentStep < 3 ? (
                            <button className="btn btn-primary" onClick={nextStep}>
                                Siguiente
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                                {submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Evaluación
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EvaluacionWizard;

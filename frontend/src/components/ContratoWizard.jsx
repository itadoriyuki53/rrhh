/**
 * @fileoverview Asistente multi-paso para la creación y edición de contratos laborales.
 * @module components/ContratoWizard
 */

import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { useAuth } from '../context/AuthContext';
import {
    createContrato,
    updateContrato,
    getEmpleados,
    getEmpresas,
    getEmpresaById,
    getPuestosConContrato,
    getRoles
} from '../services/api';
import { validarDiaHabil } from '../helpers/diasHabiles';
import { getTodayStr, formatFullName } from '../helpers/formatters';
import { useIsDark } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

// Tipos de contrato agrupados por categorÃ­a
const TIPOS_CONTRATO = {
    'RelaciÃ³n de Dependencia (Ley 20.744 â€“ LCT)': [
        { value: 'tiempo_indeterminado', label: 'Contrato por Tiempo Indeterminado (Efectivo)' },
        { value: 'periodo_prueba', label: 'PerÃ­odo de Prueba (Art. 92 bis)' },
        { value: 'plazo_fijo', label: 'Contrato a Plazo Fijo' },
        { value: 'eventual', label: 'Contrato Eventual' },
        { value: 'teletrabajo', label: 'Contrato de Teletrabajo (Ley 27.555)' },
    ],
    'No Laborales / Extracontractuales (Freelancers / Outsourcing)': [
        { value: 'locacion_servicios', label: 'LocaciÃ³n de Servicios (Contractor / Freelancer)' },
        { value: 'monotributista', label: 'Monotributista' },
        { value: 'responsable_inscripto', label: 'Responsable Inscripto (AutÃ³nomo)' },
        { value: 'honorarios', label: 'Honorarios' },
        { value: 'contrato_obra', label: 'Contrato de Obra' },
    ],
    'Formativos (Educativos)': [
        { value: 'pasantia_educativa', label: 'PasantÃ­a Educativa (Ley 26.427)' },
        { value: 'beca', label: 'Beca' },
        { value: 'ad_honorem', label: 'Ad honorem' },
    ],
};

// Tooltip content for Step 1 - Puestos
const TOOLTIP_PUESTOS = `**Reglas de asignaciÃ³n:**
â€¢ Un empleado puede tener varios puestos en un mismo contrato solo si pertenecen a la misma empresa.
â€¢ Si los puestos son de empresas distintas, deben crearse contratos separados.
â€¢ No se permite crear un contrato para un puesto que el empleado ya tiene asignado en otro contrato activo.

**CategorÃ­a superior:** SegÃºn la Ley de Contrato de Trabajo, si el empleado realiza dos tareas de distinta jerarquÃ­a, se le debe remunerar segÃºn la de mayor categorÃ­a o proporcionalmente al tiempo dedicado a cada una.`;

// Tooltip content for Step 2 - Tipos de Contrato
const TOOLTIP_TIPOS_CONTRATO = `**RelaciÃ³n de Dependencia**
â€¢ La empresa paga cargas sociales (jubilaciÃ³n, obra social, ART).
â€¢ El estÃ¡ndar es el contrato por tiempo indeterminado.
â€¢ El perÃ­odo de prueba comprende los primeros 3 meses (Art. 92 bis).
â€¢ El plazo fijo tiene fecha de fin y requiere preaviso especial.
â€¢ El contrato eventual cubre necesidades extraordinarias.
â€¢ El teletrabajo debe registrarse segÃºn la ley vigente.

**No Laborales / Extracontractuales**
â€¢ Incluye locaciÃ³n de servicios, monotributistas, responsables inscriptos, honorarios y contrato de obra.
â€¢ No tienen recibo de sueldo ni vacaciones pagas automÃ¡ticas.
â€¢ Requieren constancia de inscripciÃ³n y facturaciÃ³n mensual.

**Formativos**
â€¢ Incluye pasantÃ­a educativa, beca y ad honorem.
â€¢ No son empleados ni freelancers.
â€¢ La pasantÃ­a tiene duraciÃ³n mÃ¡xima y asignaciÃ³n estÃ­mulo.`;

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
 * Componente ContratoWizard
 * 
 * Gestiona el ciclo de vida de un contrato: selección de empleado/puesto,
 * tipo de contrato (dependencia, freelance, formativo) y condiciones económicas/horarias.
 * Permite la creación masiva (un contrato por empleado si se seleccionan varios).
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.contrato] - Objeto contrato a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @param {Object} [props.empleadoPreseleccionado] - Empleado inicial opcional.
 * @returns {JSX.Element}
 */
const ContratoWizard = ({ contrato: contratoToEdit, onClose, onSuccess, empleadoPreseleccionado = null }) => {
    const { user } = useAuth();
    const isEditMode = !!contratoToEdit;
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [isEditDataLoaded, setIsEditDataLoaded] = useState(false);
    const [showTooltipPuestos, setShowTooltipPuestos] = useState(false);
    const [showTooltipTipos, setShowTooltipTipos] = useState(false);
    const isDark = useIsDark();

    // Data
    const [empleados, setEmpleados] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [roles, setRoles] = useState([]); // Roles de sistema
    const [puestosDisponibles, setPuestosDisponibles] = useState([]);
    const [puestosConContrato, setPuestosConContrato] = useState(new Map()); // Map<puestoId, Map<empleadoId, empleadoName>>

    // Step 1: Empleados y Puestos
    const [selectedEmpleados, setSelectedEmpleados] = useState([]);
    const [selectedPuestos, setSelectedPuestos] = useState([]);
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);

    // Step 2: Tipo de Contrato
    const [tipoContrato, setTipoContrato] = useState('');

    // Step 3: Datos del Contrato
    const [formData, setFormData] = useState({
        fechaInicio: getTodayStr(),
        fechaFin: '',
        horario: '',
        salario: '',
        compensacion: '',
        rolId: '',
    });

    const steps = [
        { number: 1, title: 'Empleado y Puestos' },
        { number: 2, title: 'Tipo de Contrato' },
        { number: 3, title: 'Datos del Contrato' },
    ];

    // Load initial data
    useEffect(() => {
        if (user) {
            loadInitialData();
        }
    }, [user]);

    // Preseleccionar empleado
    useEffect(() => {
        if (empleadoPreseleccionado && !isEditMode) {
            const option = {
                value: empleadoPreseleccionado.id,
                label: `${formatFullName(empleadoPreseleccionado)} - ${empleadoPreseleccionado.numeroDocumento}`,
                empleado: empleadoPreseleccionado,
            };
            setSelectedEmpleados([option]);
        }
    }, [empleadoPreseleccionado, isEditMode]);

    // Load edit data
    useEffect(() => {
        if (contratoToEdit) {
            // Mark that we are loading edit data to prevent puestos reset
            setIsEditDataLoaded(true);

            if (contratoToEdit.empleado) {
                setSelectedEmpleados([{
                    value: contratoToEdit.empleado.id,
                    label: `${formatFullName(contratoToEdit.empleado)} - ${contratoToEdit.empleado.numeroDocumento}`,
                    empleado: contratoToEdit.empleado,
                }]);
            }
            if (contratoToEdit.puestos && contratoToEdit.puestos.length > 0) {
                const puestoOptions = contratoToEdit.puestos.map(p => ({
                    value: p.id,
                    label: `${p.nombre}${p.departamento ? ` (${p.departamento.nombre}${p.departamento.area ? ` - ${p.departamento.area.nombre}` : ''})` : ''}`,
                    puesto: p,
                    empresaId: p.departamento?.area?.empresa?.id,
                }));
                setSelectedPuestos(puestoOptions);
                // Set empresa from first puesto
                if (puestoOptions[0]?.empresaId) {
                    loadEmpresaData(puestoOptions[0].empresaId);
                }
            }
            setTipoContrato(contratoToEdit.tipoContrato || '');
            setFormData({
                fechaInicio: contratoToEdit.fechaInicio || '',
                fechaFin: contratoToEdit.fechaFin || '',
                horario: contratoToEdit.horario || '',
                salario: contratoToEdit.salario?.toString() || '',
                compensacion: contratoToEdit.compensacion || '',
                rolId: contratoToEdit.rolId || '',
            });
        }
    }, [contratoToEdit]);

    const loadInitialData = async () => {
        try {
            // Determine workspace ID filter
            let filters = { limit: 500, activo: 'true' };

            // Si NO es admin, filtrar por el espacio de trabajo del usuario
            if (user && user.esEmpleado) {
                const espacioId = user.empleado?.espacioTrabajoId;
                if (espacioId) {
                    filters.espacioTrabajoId = espacioId;
                }
            }

            // Para roles, usamos el mismo filtro
            const roleFilters = { limit: 100, activo: 'true' };
            if (filters.espacioTrabajoId) {
                roleFilters.espacioTrabajoId = filters.espacioTrabajoId;
            }

            // Para empresas, tambiÃ©n usamos el mismo filtro
            const empresaFilters = { limit: 100, activo: 'true' };
            if (filters.espacioTrabajoId) {
                empresaFilters.espacioTrabajoId = filters.espacioTrabajoId;
            }

            const [empleadosRes, empresasRes, rolesRes] = await Promise.all([
                getEmpleados(filters),
                getEmpresas(empresaFilters),
                getRoles(roleFilters)
            ]);
            setEmpleados(empleadosRes.data || []);
            setEmpresas(empresasRes.data || []);
            setRoles(rolesRes.roles || []);
        } catch (err) {
            console.error('Error loading data:', err);
        }
    };

    const loadPuestosConContrato = async (empleados) => {
        try {
            const contratos = new Map(); // Map<puestoId, Map<empleadoId, empleadoNombre>>
            for (const emp of empleados) {
                const result = await getPuestosConContrato(emp.value);
                const empleadoNombre = emp.label.split(' - ')[0]; // Nombre del empleado
                (result.puestoIds || []).forEach(puestoId => {
                    if (!contratos.has(puestoId)) {
                        contratos.set(puestoId, new Map());
                    }
                    contratos.get(puestoId).set(emp.value, empleadoNombre);
                });
            }
            setPuestosConContrato(contratos);
        } catch (err) {
            console.error('Error loading puestos con contrato:', err);
        }
    };

    const loadEmpresaData = async (empresaId) => {
        try {
            const empresa = await getEmpresaById(empresaId);
            setSelectedEmpresa(empresa);

            // Flatten puestos from empresa hierarchy
            const puestos = [];
            empresa.areas?.forEach(area => {
                area.departamentos?.forEach(depto => {
                    depto.puestos?.forEach(puesto => {
                        const empleadosConContratoPuesto = puestosConContrato.get(puesto.id);
                        puestos.push({
                            value: puesto.id,
                            label: `${puesto.nombre} (${depto.nombre} - ${area.nombre})`,
                            puesto: puesto,
                            empresaId: empresa.id,
                            empleadosConContrato: empleadosConContratoPuesto || new Map(),
                        });
                    });
                });
            });

            // If we're in edit mode and have selectedPuestos, update their labels with the correct info
            if (isEditMode && selectedPuestos.length > 0) {
                const puestosMap = new Map(puestos.map(p => [p.value, p]));
                setSelectedPuestos(prev => prev.map(sp => {
                    const updatedPuesto = puestosMap.get(sp.value);
                    return updatedPuesto ? { ...sp, ...updatedPuesto } : sp;
                }));
            }

            setPuestosDisponibles(puestos);
        } catch (err) {
            console.error('Error loading empresa:', err);
        }
    };

    const handleEmpleadoChange = async (options, skipPuestosReset = false) => {
        const selectedOptions = isEditMode ? (options ? [options] : []) : (options || []);

        // Validar que todos los empleados seleccionados pertenezcan al mismo espacio de trabajo
        if (selectedOptions.length > 1) {
            const firstWs = selectedOptions[0].empleado?.espacioTrabajoId;
            const diffWs = selectedOptions.some(opt => opt.empleado?.espacioTrabajoId !== firstWs);
            if (diffWs) {
                setError('Todos los empleados seleccionados deben pertenecer al mismo espacio de trabajo.');
                return;
            }
        }
        setError('');

        setSelectedEmpleados(selectedOptions);

        // Resetear puestos al cambiar selecciÃ³n, except when loading edit data
        if (!skipPuestosReset) {
            setSelectedPuestos([]);
            setSelectedEmpresa(null);
            setPuestosDisponibles([]);
        }

        // Cargar puestos con contrato para todos los empleados seleccionados
        if (selectedOptions.length > 0) {
            await loadPuestosConContrato(selectedOptions);
        } else {
            setPuestosConContrato(new Map());
        }
        if (touched.empleados) validateStep();
    };

    const handleEmpresaChange = async (option) => {
        const empresaId = option ? option.value : null;
        setSelectedPuestos([]);
        if (empresaId) {
            await loadEmpresaData(parseInt(empresaId));
        } else {
            setSelectedEmpresa(option ? option.empresa : null);
            setPuestosDisponibles([]);
        }
    };

    const handlePuestosChange = (options) => {
        setSelectedPuestos(options || []);
        if (touched.puestos) validateStep();
    };

    const handleRolChange = (option) => {
        const value = option ? option.value : '';
        setFormData(prev => ({ ...prev, rolId: value }));
        if (touched.rolId) validateStep();
    };

    const validateStep = () => {
        const errors = {};

        if (currentStep === 1) {
            if (selectedEmpleados.length === 0) errors.empleados = 'Debe seleccionar al menos un empleado';
            if (selectedPuestos.length === 0) errors.puestos = 'Debe seleccionar al menos un puesto';
        } else if (currentStep === 2) {
            if (!tipoContrato) errors.tipoContrato = 'Debe seleccionar un tipo de contrato';
        } else if (currentStep === 3) {
            // ValidaciÃ³n de fecha de inicio
            if (!formData.fechaInicio) {
                errors.fechaInicio = 'La fecha de inicio es requerida';
            } else if (!isEditMode) {
                // Solo validar que no sea anterior a hoy si no es ediciÃ³n
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const [year, month, day] = formData.fechaInicio.split('-');
                const startDate = new Date(year, month - 1, day); // fecha local
                if (startDate < today) {
                    errors.fechaInicio = 'La fecha de inicio no puede ser anterior a hoy';
                }
            }

            // ValidaciÃ³n de fecha de fin (si se ingresÃ³)
            if (formData.fechaFin && formData.fechaInicio) {
                if (new Date(formData.fechaFin) < new Date(formData.fechaInicio)) {
                    errors.fechaFin = 'La fecha de fin no puede ser anterior a la fecha de inicio';
                }
            }

            // ValidaciÃ³n de horario
            if (!formData.horario?.trim()) {
                errors.horario = 'El horario es requerido';
            } else if (formData.horario.length < 5 || formData.horario.length > 100) {
                errors.horario = 'El horario debe tener entre 5 y 100 caracteres';
            }

            // ValidaciÃ³n de salario
            if (!formData.salario) {
                errors.salario = 'El salario es requerido';
            } else if (isNaN(parseFloat(formData.salario))) {
                errors.salario = 'Debe ser un nÃºmero vÃ¡lido';
            } else if (parseFloat(formData.salario) < 0) {
                errors.salario = 'El salario no puede ser negativo';
            } else if (parseFloat(formData.salario) > 999999999.99) {
                errors.salario = 'El salario no puede exceder 999,999,999.99';
            }

            // ValidaciÃ³n de compensaciÃ³n (opcional pero con lÃ­mite)
            if (formData.compensacion && formData.compensacion.length > 500) {
                errors.compensacion = 'La compensaciÃ³n no puede exceder 500 caracteres';
            }

            // ValidaciÃ³n de rol
            if (!formData.rolId) {
                errors.rolId = 'El rol es requerido';
            }
        }

        // Preservar solo los errores de dÃ­as hÃ¡biles de campos de fecha
        setFieldErrors(prev => {
            const camposFecha = ['fechaInicio', 'fechaFin'];
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

        // Mark all fields with errors as touched so error messages are displayed
        if (Object.keys(errors).length > 0) {
            const allTouched = {};
            Object.keys(errors).forEach(key => { allTouched[key] = true; });
            setTouched(prev => ({ ...prev, ...allTouched }));
            setError('Por favor completa todos los campos obligatorios');
        }

        return Object.keys(errors).length === 0;
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateStep();
    };

    const handleChange = (e) => { // âœ… SÃ­ncrono ahora
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Validar dÃ­as hÃ¡biles en tiempo real SÃNCRONO
        if ((name === 'fechaInicio' || name === 'fechaFin') && value) {
            try {
                const nombreCampo = name === 'fechaInicio'
                    ? 'La fecha de inicio'
                    : 'La fecha de fin';
                validarDiaHabil(value, nombreCampo); // âœ… SÃ­ncrono
                setFieldErrors(prev => ({ ...prev, [name]: null }));
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, [name]: error.message }));
                setTouched(prev => ({ ...prev, [name]: true })); // Marcar como touched para mostrar error
            }
        }

        if (touched[name]) validateStep();
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

        setLoading(true);
        setError('');

        try {
            // In edit mode, if selectedPuestos is empty but the contract has puestos, use original puestos
            let puestoIds = selectedPuestos.map(p => p.value);
            if (isEditMode && puestoIds.length === 0 && contratoToEdit?.puestos?.length > 0) {
                puestoIds = contratoToEdit.puestos.map(p => p.id);
            }
            const baseData = {
                puestoIds,
                tipoContrato,
                fechaInicio: formData.fechaInicio,
                fechaFin: formData.fechaFin || null,
                horario: formData.horario,
                salario: parseFloat(formData.salario),
                compensacion: formData.compensacion || null,
                rolId: formData.rolId || null,
            };

            if (isEditMode) {
                await updateContrato(contratoToEdit.id, { ...baseData, empleadoId: selectedEmpleados[0].value });
                onSuccess(1);
            } else {
                // Crear un contrato por cada empleado seleccionado
                let createdCount = 0;
                for (const emp of selectedEmpleados) {
                    await createContrato({ ...baseData, empleadoId: emp.value });
                    createdCount++;
                }
                onSuccess(createdCount);
            }
        } catch (err) {
            const errorMessage = err.message.toLowerCase();

            // Handle fechaFin validation error specifically
            if (errorMessage.includes('fecha de fin') || errorMessage.includes('fecha fin')) {
                setCurrentStep(3);
                setFieldErrors(prev => ({ ...prev, fechaFin: err.message }));
                setTouched(prev => ({ ...prev, fechaFin: true }));
            }

            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Format option with individual "ya tiene contrato" badges per employee
    const formatPuestoOption = (option) => {
        // Find which of the selected employees have contracts for this position
        const empleadosSeleccionadosConContrato = selectedEmpleados.filter(emp =>
            option.empleadosConContrato?.has(emp.value)
        );

        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span>{option.label}</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {empleadosSeleccionadosConContrato.map(emp => (
                        <span key={emp.value} style={{
                            fontSize: '0.65rem',
                            backgroundColor: '#f59e0b',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            whiteSpace: 'nowrap',
                        }}>
                            {option.empleadosConContrato.get(emp.value)} ya tiene contrato
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    // Disable position if ANY selected employee has a contract for it (except in edit mode for the current contract)
    const isPuestoDisabled = (option) => {
        if (selectedEmpleados.length === 0) return false;

        // In edit mode, allow selecting positions even if they have contracts
        // The backend will validate conflicts with OTHER active contracts
        if (isEditMode) return false;

        // Check if ANY selected employee has a contract for this position
        const anyHasContract = selectedEmpleados.some(emp =>
            option.empleadosConContrato?.has(emp.value)
        );
        return anyHasContract;
    };

    const empleadoOptions = Object.values(
        empleados.reduce((acc, emp) => {
            const ws = emp.espacioTrabajo?.nombre || 'Sin Espacio';
            if (!acc[ws]) acc[ws] = { label: ws, options: [] };
            acc[ws].options.push({
                value: emp.id,
                label: `${formatFullName(emp)} - ${emp.numeroDocumento}`,
                empleado: emp,
            });
            return acc;
        }, {})
    );

    const areFieldsLocked = isEditMode && contratoToEdit?.estado !== 'pendiente';
    const isEmpleadoLocked = areFieldsLocked;

    // Update puestos options when puestosConContrato changes
    useEffect(() => {
        if (selectedEmpresa) {
            loadEmpresaData(selectedEmpresa.id);
        }
    }, [puestosConContrato]);

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Empleados */}
            <div className="form-group">
                <label className="form-label">
                    {isEditMode ? 'Empleado *' : 'Empleado(s) *'}
                    {!isEditMode && selectedEmpleados.length > 1 && (
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 500 }}>
                            ({selectedEmpleados.length} seleccionados - se crearÃ¡ un contrato por cada uno)
                        </span>
                    )}
                </label>
                <Select
                    isMulti={!isEditMode}
                    isDisabled={isEmpleadoLocked}
                    options={Object.values(empleados.reduce((acc, emp) => {
                        const wsName = emp.espacioTrabajo?.nombre || 'Sin Espacio';
                        if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };
                        acc[wsName].options.push({
                            value: emp.id,
                            label: `${formatFullName(emp)} - ${emp.numeroDocumento}`,
                            empleado: emp,
                        });
                        return acc;
                    }, {}))}
                    value={selectedEmpleados}
                    onChange={handleEmpleadoChange}
                    onBlur={() => handleBlur('empleados')}
                    placeholder={isEditMode ? "Empleado..." : "Buscar y seleccionar empleados..."}
                    noOptionsMessage={() => "No se encontraron empleados"}
                    styles={buildSelectStyles(isDark)}
                    isClearable={!isEmpleadoLocked}
                    closeMenuOnSelect={isEditMode}
                    formatGroupLabel={data => (
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                            {data.label}
                        </div>
                    )}
                />
                <FieldError message={touched.empleados && fieldErrors.empleados} />
            </div>

            {/* Empresa (para filtrar puestos) */}
            {selectedEmpleados.length > 0 && (
                <div className="form-group">
                    <label className="form-label">Empresa *</label>
                    <Select
                        isDisabled={areFieldsLocked}
                        options={Object.values(empresas.reduce((acc, emp) => {
                            // Filtrar por espacio si hay empleados seleccionados
                            const currentWorkspaceId = selectedEmpleados[0]?.empleado?.espacioTrabajoId;
                            if (currentWorkspaceId && emp.espacioTrabajoId !== currentWorkspaceId) return acc;

                            const wsName = emp.espacioTrabajo?.nombre || 'General';
                            if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };
                            acc[wsName].options.push({
                                value: emp.id,
                                label: emp.nombre,
                                empresa: emp
                            });
                            return acc;
                        }, {}))}
                        value={selectedEmpresa ? { value: selectedEmpresa.id, label: selectedEmpresa.nombre, empresa: selectedEmpresa } : null}
                        onChange={handleEmpresaChange}
                        placeholder="Seleccionar empresa..."
                        noOptionsMessage={() => "No se encontraron empresas"}
                        styles={buildSelectStyles(isDark)}
                        isClearable
                        formatGroupLabel={data => (
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                                {data.label}
                            </div>
                        )}
                    />
                </div>
            )}

            {/* Puestos */}
            {selectedEmpresa && (
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Puestos de Trabajo *
                        <span
                            className="tooltip-icon"
                            onClick={() => setShowTooltipPuestos(!showTooltipPuestos)}
                        >
                            ?
                        </span>
                    </label>
                    {showTooltipPuestos && (
                        <div className="tooltip-info">
                            {TOOLTIP_PUESTOS.split('**').map((part, i) =>
                                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                            )}
                        </div>
                    )}
                    <Select
                        isDisabled={areFieldsLocked}
                        isMulti
                        options={puestosDisponibles}
                        value={selectedPuestos}
                        onChange={handlePuestosChange}
                        onBlur={() => handleBlur('puestos')}
                        placeholder="Seleccionar puestos..."
                        noOptionsMessage={() => "No hay puestos disponibles"}
                        formatOptionLabel={formatPuestoOption}
                        isOptionDisabled={isPuestoDisabled}
                        styles={buildSelectStyles(isDark)}
                        closeMenuOnSelect={false}
                    />
                    <FieldError message={touched.puestos && fieldErrors.puestos} />
                    {!isEditMode && (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Los puestos con contrato activo no pueden ser seleccionados
                        </p>
                    )}
                </div>
            )}
        </div>
    );

    const renderStep2 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Tipo de Contrato *
                    <span
                        className="tooltip-icon"
                        onClick={() => setShowTooltipTipos(!showTooltipTipos)}
                    >
                        ?
                    </span>
                </label>
                {showTooltipTipos && (
                    <div className="tooltip-info">
                        {TOOLTIP_TIPOS_CONTRATO.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </div>
                )}
                <select
                    className={`form-input ${touched.tipoContrato && fieldErrors.tipoContrato ? 'input-error' : ''}`}
                    value={tipoContrato}
                    onChange={(e) => { setTipoContrato(e.target.value); if (touched.tipoContrato) validateStep(); }}
                    onBlur={() => handleBlur('tipoContrato')}
                >
                    <option value="">Seleccionar tipo de contrato</option>
                    {Object.entries(TIPOS_CONTRATO).map(([category, options]) => (
                        <optgroup key={category} label={category}>
                            {options.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </optgroup>
                    ))}
                </select>
                <FieldError message={touched.tipoContrato && fieldErrors.tipoContrato} />
            </div>
        </div>
    );

    const renderStep3 = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            {/* Fechas */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha de Inicio *</label>
                    <input
                        type="date"
                        name="fechaInicio"
                        disabled={areFieldsLocked}
                        className={`form-input ${touched.fechaInicio && fieldErrors.fechaInicio ? 'input-error' : ''}`}
                        value={formData.fechaInicio}
                        onChange={handleChange}
                        onBlur={() => handleBlur('fechaInicio')}
                    />
                    <FieldError message={touched.fechaInicio && fieldErrors.fechaInicio} />
                </div>
                <div className="form-group">
                    <label className="form-label">Fecha de Fin</label>
                    <input
                        type="date"
                        name="fechaFin"
                        className={`form-input ${touched.fechaFin && fieldErrors.fechaFin ? 'input-error' : ''}`}
                        value={formData.fechaFin}
                        onChange={handleChange}
                        onBlur={() => handleBlur('fechaFin')}
                    />
                    <FieldError message={touched.fechaFin && fieldErrors.fechaFin} />
                </div>
            </div>

            {/* Horario */}
            <div className="form-group">
                <label className="form-label">Horario *</label>
                <input
                    type="text"
                    name="horario"
                    className={`form-input ${touched.horario && fieldErrors.horario ? 'input-error' : ''}`}
                    value={formData.horario}
                    onChange={handleChange}
                    onBlur={() => handleBlur('horario')}
                    placeholder="Ej: Lunes a Viernes 9:00 a 18:00"
                />
                <FieldError message={touched.horario && fieldErrors.horario} />
            </div>

            {/* Salario y CompensaciÃ³n */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Salario *</label>
                    <input
                        type="number"
                        name="salario"
                        className={`form-input ${touched.salario && fieldErrors.salario ? 'input-error' : ''}`}
                        value={formData.salario}
                        onChange={handleChange}
                        onBlur={() => handleBlur('salario')}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                    />
                    <FieldError message={touched.salario && fieldErrors.salario} />
                </div>
                <div className="form-group">
                    <label className="form-label">CompensaciÃ³n</label>
                    <input
                        type="text"
                        name="compensacion"
                        className={`form-input ${touched.compensacion && fieldErrors.compensacion ? 'input-error' : ''}`}
                        value={formData.compensacion}
                        onChange={handleChange}
                        onBlur={() => handleBlur('compensacion')}
                        placeholder="Beneficios adicionales..."
                    />
                    <FieldError message={touched.compensacion && fieldErrors.compensacion} />
                </div>
            </div>

            {/* Rol de Sistema */}
            <div className="form-group">
                <label className="form-label">Rol en la Empresa *</label>
                <Select
                    options={Object.values(roles.reduce((acc, rol) => {
                        // Filtrar por espacio si hay empleados seleccionados
                        const currentWorkspaceId = selectedEmpleados[0]?.empleado?.espacioTrabajoId;
                        if (currentWorkspaceId && rol.espacioTrabajoId !== currentWorkspaceId) return acc;

                        const wsName = rol.espacioTrabajo?.nombre || 'General';
                        if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };
                        acc[wsName].options.push({
                            value: rol.id,
                            label: rol.nombre,
                        });
                        return acc;
                    }, {}))}
                    value={roles.find(r => r.id === parseInt(formData.rolId)) ? {
                        value: parseInt(formData.rolId),
                        label: roles.find(r => r.id === parseInt(formData.rolId))?.nombre
                    } : null}
                    onChange={handleRolChange}
                    onBlur={() => handleBlur('rolId')}
                    placeholder="Seleccionar rol..."
                    noOptionsMessage={() => "No se encontraron roles"}
                    styles={buildSelectStyles(isDark)}
                    formatGroupLabel={data => (
                        <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                            {data.label}
                        </div>
                    )}
                />
                <FieldError message={touched.rolId && fieldErrors.rolId} />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Asigna permisos de sistema al usuario mientras dure el contrato.
                </p>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Editar Contrato' : 'Nuevo Contrato'}
                    </h2>
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
                            {currentStep === 1 && 'Selecciona el empleado y los puestos que ocuparÃ¡'}
                            {currentStep === 2 && 'Elige el tipo de contrato laboral'}
                            {currentStep === 3 && 'Completa los datos del contrato'}
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
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        {currentStep < 3 ? (
                            <button className="btn btn-primary" onClick={nextStep}>
                                Siguiente
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')} Contrato
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContratoWizard;


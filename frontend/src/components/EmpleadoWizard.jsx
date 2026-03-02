/**
 * @fileoverview Orquestador de alta y modificación de empleados mediante un proceso guiado (Wizard).
 * @module components/EmpleadoWizard
 */

import { useState, useEffect } from 'react';
import StepTracker from './StepTracker';
import EspacioTrabajoSelector from './EspacioTrabajoSelector';
import { createEmpleado, updateEmpleado, canChangeEmpleadoWorkspace } from '../services/api';
import ubicaciones from '../data/ubicaciones.json';

const GENEROS = [
    { value: 'femenino', label: 'Femenino' },
    { value: 'masculino', label: 'Masculino' },
    { value: 'otro', label: 'Otro' },
];

const ESTADOS_CIVILES = [
    { value: 'soltero', label: 'Soltero/a' },
    { value: 'casado', label: 'Casado/a' },
    { value: 'divorciado', label: 'Divorciado/a' },
    { value: 'viudo', label: 'Viudo/a' },
];

const TIPOS_DOCUMENTO = [
    { value: 'cedula', label: 'Cédula' },
    { value: 'pasaporte', label: 'Pasaporte' },
];

// Tooltip content for Argentine labor law
const TOOLTIP_EDAD_MINIMA = `En Argentina, la edad mínima para trabajar es 16 años, según la Ley 26.390 de Prohibición del Trabajo Infantil y Protección del Trabajo Adolescente.

Entre 16 y 18 años, los adolescentes pueden trabajar con autorización de sus padres o tutores, en una jornada reducida de hasta 6 horas diarias o 36 horas semanales, y sin realizar tareas nocturnas, peligrosas o insalubres.

Como excepción, los adolescentes de 14 a 16 años solo pueden trabajar en empresas familiares, en jornadas más reducidas (máximo 3 horas diarias y 15 horas semanales), con autorización administrativa y siempre que no se vea afectada su escolaridad.`;

/**
 * Componente interno FieldError
 * Renderiza un mensaje de error estilizado para campos de formulario.
 * 
 * @param {Object} props - Propiedades.
 * @param {string} props.message - El mensaje a mostrar.
 */
const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};

/**
 * Componente EmpleadoWizard
 * 
 * Gestiona la creación y edición de empleados, validando datos personales,
 * legales y dirección en múltiples pasos. Asegura el cumplimiento de reglas
 * de negocio como edad mínima y unicidad de campos sensibles.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.empleado] - Objeto empleado a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras una operación exitosa.
 * @returns {JSX.Element}
 */
const EmpleadoWizard = ({ empleado: empleadoToEdit, onClose, onSuccess }) => {
    const isEditMode = !!empleadoToEdit;
    const [currentStep, setCurrentStep] = useState(1);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [showTooltipEdad, setShowTooltipEdad] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Espacio de Trabajo
    const [espacioTrabajoId, setEspacioTrabajoId] = useState('');
    const [canChangeWorkspace, setCanChangeWorkspace] = useState(true);
    const [workspaceChangeMessage, setWorkspaceChangeMessage] = useState('');

    // Datos externos
    const [nacionalidades, setNacionalidades] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [ciudades, setCiudades] = useState([]);

    // Form data - Paso 1: Información básica
    const [info, setInfo] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        tipoDocumento: 'cedula',
        numeroDocumento: '',
        cuil: '',
        fechaNacimiento: '',
        nacionalidadId: '',
        genero: '',
        estadoCivil: '',
        contrasena: '',
        confirmarContrasena: '',
    });

    // Form data - Paso 2: Dirección
    const [direccion, setDireccion] = useState({
        calle: '',
        numero: '',
        piso: '',
        departamento: '',
        codigoPostal: '',
        provinciaId: '',
        provinciaNombre: '',
        ciudadId: '',
        ciudadNombre: '',
    });

    const steps = [
        { number: 1, title: 'Información Básica' },
        { number: 2, title: 'Dirección' },
    ];

    // Cargar datos iniciales
    useEffect(() => {
        loadInitialData();
    }, []);

    // Cargar datos del empleado si es edición
    useEffect(() => {
        if (empleadoToEdit) {
            setInfo({
                nombre: empleadoToEdit.nombre || '',
                apellido: empleadoToEdit.apellido || '',
                email: empleadoToEdit.email || '',
                telefono: empleadoToEdit.telefono || '',
                tipoDocumento: empleadoToEdit.tipoDocumento || 'cedula',
                numeroDocumento: empleadoToEdit.numeroDocumento || '',
                cuil: empleadoToEdit.cuil || '',
                fechaNacimiento: empleadoToEdit.fechaNacimiento || '',
                nacionalidadId: String(empleadoToEdit.nacionalidadId || ''),
                genero: empleadoToEdit.genero || '',
                estadoCivil: empleadoToEdit.estadoCivil || '',
            });
            setDireccion({
                calle: empleadoToEdit.calle || '',
                numero: empleadoToEdit.numero || '',
                piso: empleadoToEdit.piso || '',
                departamento: empleadoToEdit.departamento || '',
                codigoPostal: empleadoToEdit.codigoPostal || '',
                provinciaId: String(empleadoToEdit.provinciaId || ''),
                provinciaNombre: empleadoToEdit.provinciaNombre || '',
                ciudadId: String(empleadoToEdit.ciudadId || ''),
                ciudadNombre: empleadoToEdit.ciudadNombre || '',
            });

            // Cargar espacio de trabajo
            setEspacioTrabajoId(String(empleadoToEdit.espacioTrabajoId || ''));

            // Verificar si puede cambiar de espacio
            if (empleadoToEdit.id) {
                checkCanChangeWorkspace(empleadoToEdit.id);
            }
        }
    }, [empleadoToEdit]);

    const checkCanChangeWorkspace = async (empleadoId) => {
        try {
            const result = await canChangeEmpleadoWorkspace(empleadoId);
            setCanChangeWorkspace(result.canChange);
            setWorkspaceChangeMessage(result.reason || '');
        } catch (err) {
            console.error('Error al verificar cambio de espacio:', err);
            // En caso de error, permitir el cambio por defecto
            setCanChangeWorkspace(true);
        }
    };

    const loadInitialData = () => {
        setNacionalidades(ubicaciones.nacionalidades);
        setProvincias(ubicaciones.provincias);
    };

    // Cargar ciudades cuando cambia la provincia
    useEffect(() => {
        if (direccion.provinciaId) {
            loadCiudades(direccion.provinciaId);
        } else {
            setCiudades([]);
        }
    }, [direccion.provinciaId]);



    const loadCiudades = (provinciaId) => {
        const provincia = ubicaciones.provincias.find(p => p.id == provinciaId);
        if (provincia && provincia.ciudades) {
            setCiudades(provincia.ciudades);
        } else {
            setCiudades([]);
        }
    };



    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateField(field);
    };

    const validateField = (field) => {
        const errors = { ...fieldErrors };

        // Step 1 validations
        if (field === 'nombre' && !info.nombre?.trim()) errors.nombre = 'El nombre es requerido';
        else if (field === 'nombre') delete errors.nombre;

        if (field === 'apellido' && !info.apellido?.trim()) errors.apellido = 'El apellido es requerido';
        else if (field === 'apellido') delete errors.apellido;

        if (field === 'email') {
            if (!info.email?.trim()) errors.email = 'El email es requerido';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Email inválido';
            else delete errors.email;
        }

        if (field === 'numeroDocumento' && !info.numeroDocumento?.trim()) errors.numeroDocumento = 'El documento es requerido';
        else if (field === 'numeroDocumento') delete errors.numeroDocumento;

        if (field === 'fechaNacimiento' && !info.fechaNacimiento?.trim()) errors.fechaNacimiento = 'La fecha es requerida';
        else if (field === 'fechaNacimiento') delete errors.fechaNacimiento;

        if (field === 'nacionalidadId' && !info.nacionalidadId?.trim()) errors.nacionalidadId = 'La nacionalidad es requerida';
        else if (field === 'nacionalidadId') delete errors.nacionalidadId;

        if (field === 'genero' && !info.genero?.trim()) errors.genero = 'El género es requerido';
        else if (field === 'genero') delete errors.genero;

        if (field === 'estadoCivil' && !info.estadoCivil?.trim()) errors.estadoCivil = 'El estado civil es requerido';
        else if (field === 'estadoCivil') delete errors.estadoCivil;

        // Step 2 validations
        if (field === 'calle' && !direccion.calle?.trim()) errors.calle = 'La calle es requerida';
        else if (field === 'calle') delete errors.calle;

        if (field === 'numero' && !direccion.numero?.trim()) errors.numero = 'El número es requerido';
        else if (field === 'numero') delete errors.numero;

        if (field === 'provinciaId' && !direccion.provinciaId) errors.provinciaId = 'La provincia es requerida';
        else if (field === 'provinciaId') delete errors.provinciaId;

        setFieldErrors(errors);
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfo(prev => ({ ...prev, [name]: value }));
        setError('');
        if (touched[name]) validateField(name);
    };

    const handleDireccionChange = (e) => {
        const { name, value } = e.target;

        if (name === 'provinciaId') {
            const prov = provincias.find(p => p.id == value);
            setDireccion(prev => ({
                ...prev,
                provinciaId: value,
                provinciaNombre: prov?.nombre || '',
                ciudadId: '',
                ciudadNombre: '',
            }));
        } else if (name === 'ciudadId') {
            const city = ciudades.find(c => c.id == value);
            setDireccion(prev => ({
                ...prev,
                ciudadId: value,
                ciudadNombre: city?.nombre || '',
            }));
        } else {
            setDireccion(prev => ({ ...prev, [name]: value }));
        }
        setError('');
        if (touched[name]) validateField(name);
    };



    const validateStep = () => {
        const errors = {};

        if (currentStep === 1) {
            if (!info.nombre?.trim()) errors.nombre = 'El nombre es requerido';
            if (!info.apellido?.trim()) errors.apellido = 'El apellido es requerido';
            if (!info.email?.trim()) errors.email = 'El email es requerido';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(info.email)) errors.email = 'Email inválido';

            // Validación de documento
            if (!info.numeroDocumento?.trim()) {
                errors.numeroDocumento = 'El documento es requerido';
            } else if (!/^(\d{8}|[MF]\d{7})$/.test(info.numeroDocumento)) {
                errors.numeroDocumento = 'El documento debe ser 8 números o comenzar con M/F seguido de 7 números';
            }

            // Validación de fecha de nacimiento
            if (!info.fechaNacimiento?.trim()) {
                errors.fechaNacimiento = 'La fecha es requerida';
            } else {
                const birthDate = new Date(info.fechaNacimiento);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // No puede ser futura
                if (birthDate > today) {
                    errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
                } else {
                    // Calcular edad
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    if (age < 14) {
                        errors.fechaNacimiento = 'El empleado debe tener al menos 14 años';
                    }
                }
            }

            if (!info.nacionalidadId?.trim()) errors.nacionalidadId = 'La nacionalidad es requerida';
            if (!info.genero?.trim()) errors.genero = 'El género es requerido';
            if (!info.estadoCivil?.trim()) errors.estadoCivil = 'El estado civil es requerido';

            // Validación de contraseña (opcional en edición si no se cambia)
            const passwordEntered = !!info.contrasena?.trim();
            const passwordRequired = !isEditMode;

            if (passwordRequired || passwordEntered) {
                if (!info.contrasena?.trim()) {
                    errors.contrasena = 'La contraseña es requerida';
                } else if (info.contrasena.length < 8) {
                    errors.contrasena = 'La contraseña debe tener al menos 8 caracteres';
                } else if (!/[A-Z]/.test(info.contrasena)) {
                    errors.contrasena = 'La contraseña debe contener al menos una mayúscula';
                } else if (!/[0-9]/.test(info.contrasena)) {
                    errors.contrasena = 'La contraseña debe contener al menos un número';
                } else if (!/[@$!%*?&#]/.test(info.contrasena)) {
                    errors.contrasena = 'La contraseña debe contener al menos un carácter especial (@$!%*?&#)';
                }
            }

            if (passwordRequired || !!info.confirmarContrasena?.trim() || passwordEntered) {
                if (!info.confirmarContrasena?.trim()) {
                    errors.confirmarContrasena = 'Debes confirmar la contraseña';
                } else if (info.contrasena !== info.confirmarContrasena) {
                    errors.confirmarContrasena = 'Las contraseñas no coinciden';
                }
            }

            // Validación de espacio de trabajo
            if (!espacioTrabajoId) {
                errors.espacioTrabajoId = 'El espacio de trabajo es requerido';
            }
        }

        if (currentStep === 2) {
            if (!direccion.calle?.trim()) errors.calle = 'La calle es requerida';
            if (!direccion.numero?.trim()) errors.numero = 'El número es requerido';
            if (!direccion.provinciaId) errors.provinciaId = 'La provincia es requerida';
        }



        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            setError('Por favor completa todos los campos obligatorios');
            // Mark all fields as touched
            const allTouched = {};
            Object.keys(errors).forEach(key => { allTouched[key] = true; });
            setTouched(prev => ({ ...prev, ...allTouched }));
            return false;
        }

        setError('');
        return true;
    };

    const nextStep = () => {
        if (validateStep()) {
            setCurrentStep(prev => Math.min(prev + 1, 2));
        }
    };

    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (!validateStep()) return;

        setLoading(true);
        setError('');

        try {
            const data = {
                ...info,
                ...direccion,
                espacioTrabajoId: espacioTrabajoId ? parseInt(espacioTrabajoId) : undefined,
            };

            if (isEditMode) {
                // En edición, si la contraseña está vacía, no enviarla para mantener la actual
                if (!data.contrasena) {
                    delete data.contrasena;
                    delete data.confirmarContrasena;
                }

                await updateEmpleado(empleadoToEdit.id, data);
                onSuccess();
            } else {
                const nuevoEmpleado = await createEmpleado(data);
                onSuccess(nuevoEmpleado);
            }
        } catch (err) {
            const errorMessage = err.message.toLowerCase();
            // Detect step 1 field errors (nombre, apellido, email, documento, cuil, fecha nacimiento, nacionalidad, género, estado civil)
            const step1Fields = ['nombre', 'apellido', 'email', 'documento', 'cuil', 'fecha', 'nacimiento', 'nacionalidad', 'nacionalidadId', 'género', 'genero', 'estado civil', 'estadocivil', 'edad', 'años'];
            const isStep1Error = step1Fields.some(field => errorMessage.includes(field));

            if (isStep1Error) {
                setCurrentStep(1);
                // Set specific field errors based on error message
                if (errorMessage.includes('email')) {
                    if (errorMessage.includes('unique') || errorMessage.includes('existe') || errorMessage.includes('duplicado') || errorMessage.includes('registrado')) {
                        setFieldErrors(prev => ({ ...prev, email: 'Este email ya está registrado' }));
                    } else {
                        setFieldErrors(prev => ({ ...prev, email: 'Debe ser un email válido' }));
                    }
                    setTouched(prev => ({ ...prev, email: true }));
                }
                if (errorMessage.includes('documento')) {
                    setFieldErrors(prev => ({ ...prev, numeroDocumento: err.message }));
                    setTouched(prev => ({ ...prev, numeroDocumento: true }));
                }
                if (errorMessage.includes('cuil')) {
                    setFieldErrors(prev => ({ ...prev, cuil: err.message }));
                    setTouched(prev => ({ ...prev, cuil: true }));
                }
                if (errorMessage.includes('apellido')) {
                    setFieldErrors(prev => ({ ...prev, apellido: err.message }));
                    setTouched(prev => ({ ...prev, apellido: true }));
                }
                if (errorMessage.includes('nombre') && !errorMessage.includes('apellido')) {
                    setFieldErrors(prev => ({ ...prev, nombre: err.message }));
                    setTouched(prev => ({ ...prev, nombre: true }));
                }
                // Handle fechaNacimiento errors (futura, edad, años, nacimiento)
                if (errorMessage.includes('fecha') || errorMessage.includes('nacimiento') ||
                    errorMessage.includes('futura') || errorMessage.includes('edad') ||
                    errorMessage.includes('años') || errorMessage.includes('14')) {
                    setFieldErrors(prev => ({ ...prev, fechaNacimiento: err.message }));
                    setTouched(prev => ({ ...prev, fechaNacimiento: true }));
                }
                if (errorMessage.includes('nacionalidad')) {
                    setFieldErrors(prev => ({ ...prev, nacionalidadId: err.message }));
                    setTouched(prev => ({ ...prev, nacionalidadId: true }));
                }
            }
            // Always show the error message in the banner
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Nombre *</label>
                    <input
                        type="text"
                        name="nombre"
                        className={`form-input ${touched.nombre && fieldErrors.nombre ? 'input-error' : ''}`}
                        value={info.nombre}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('nombre')}
                        placeholder="Ingrese el nombre"
                    />
                    <FieldError message={touched.nombre && fieldErrors.nombre} />
                </div>
                <div className="form-group">
                    <label className="form-label">Apellido *</label>
                    <input
                        type="text"
                        name="apellido"
                        className={`form-input ${touched.apellido && fieldErrors.apellido ? 'input-error' : ''}`}
                        value={info.apellido}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('apellido')}
                        placeholder="Ingrese el apellido"
                    />
                    <FieldError message={touched.apellido && fieldErrors.apellido} />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                        type="email"
                        name="email"
                        className={`form-input ${touched.email && fieldErrors.email ? 'input-error' : ''}`}
                        value={info.email}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('email')}
                        placeholder="email@ejemplo.com"
                    />
                    <FieldError message={touched.email && fieldErrors.email} />
                </div>
                <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <input
                        type="text"
                        name="telefono"
                        className="form-input"
                        value={info.telefono}
                        onChange={handleInfoChange}
                        placeholder="+54 11 1234-5678"
                    />
                </div>
            </div>

            <div className="form-grid-stacked-3">
                <div className="form-group">
                    <label className="form-label">Tipo de Documento *</label>
                    <select
                        name="tipoDocumento"
                        className="form-input"
                        value={info.tipoDocumento}
                        onChange={handleInfoChange}
                    >
                        {TIPOS_DOCUMENTO.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Número de Documento *</label>
                    <input
                        type="text"
                        name="numeroDocumento"
                        className={`form-input ${touched.numeroDocumento && fieldErrors.numeroDocumento ? 'input-error' : ''}`}
                        value={info.numeroDocumento}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('numeroDocumento')}
                        placeholder="12345678"
                    />
                    <FieldError message={touched.numeroDocumento && fieldErrors.numeroDocumento} />
                </div>
                <div className="form-group">
                    <label className="form-label">CUIL</label>
                    <input
                        type="text"
                        name="cuil"
                        className={`form-input ${touched.cuil && fieldErrors.cuil ? 'input-error' : ''}`}
                        value={info.cuil}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('cuil')}
                        placeholder="XX-XXXXXXXX-X"
                    />
                    <FieldError message={touched.cuil && fieldErrors.cuil} />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Fecha de Nacimiento *
                        <span
                            className="tooltip-icon"
                            onClick={() => setShowTooltipEdad(!showTooltipEdad)}
                        >
                            ?
                        </span>
                    </label>
                    {showTooltipEdad && (
                        <div className="tooltip-info">
                            {TOOLTIP_EDAD_MINIMA.split('\n\n').map((paragraph, i) => (
                                <p key={i} style={{ marginBottom: i < 2 ? '0.75rem' : 0 }}>{paragraph}</p>
                            ))}
                        </div>
                    )}
                    <input
                        type="date"
                        name="fechaNacimiento"
                        className={`form-input ${touched.fechaNacimiento && fieldErrors.fechaNacimiento ? 'input-error' : ''}`}
                        value={info.fechaNacimiento}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('fechaNacimiento')}
                    />
                    <FieldError message={touched.fechaNacimiento && fieldErrors.fechaNacimiento} />
                </div>
                <div className="form-group">
                    <label className="form-label">Nacionalidad *</label>
                    <select
                        name="nacionalidadId"
                        className={`form-input ${touched.nacionalidadId && fieldErrors.nacionalidadId ? 'input-error' : ''}`}
                        value={info.nacionalidadId}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('nacionalidadId')}
                    >
                        <option value="">Seleccionar nacionalidad</option>
                        {nacionalidades.map(nac => (
                            <option key={nac.id} value={nac.id}>{nac.nombre}</option>
                        ))}
                    </select>
                    <FieldError message={touched.nacionalidadId && fieldErrors.nacionalidadId} />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Género *</label>
                    <select
                        name="genero"
                        className={`form-input ${touched.genero && fieldErrors.genero ? 'input-error' : ''}`}
                        value={info.genero}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('genero')}
                    >
                        <option value="">Seleccionar género</option>
                        {GENEROS.map(g => (
                            <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                    </select>
                    <FieldError message={touched.genero && fieldErrors.genero} />
                </div>
                <div className="form-group">
                    <label className="form-label">Estado Civil *</label>
                    <select
                        name="estadoCivil"
                        className={`form-input ${touched.estadoCivil && fieldErrors.estadoCivil ? 'input-error' : ''}`}
                        value={info.estadoCivil}
                        onChange={handleInfoChange}
                        onBlur={() => handleBlur('estadoCivil')}
                    >
                        <option value="">Seleccionar estado civil</option>
                        {ESTADOS_CIVILES.map(e => (
                            <option key={e.value} value={e.value}>{e.label}</option>
                        ))}
                    </select>
                    <FieldError message={touched.estadoCivil && fieldErrors.estadoCivil} />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="contrasena"
                            className={`form-input ${touched.contrasena && fieldErrors.contrasena ? 'input-error' : ''}`}
                            value={info.contrasena}
                            onChange={handleInfoChange}
                            onBlur={() => handleBlur('contrasena')}
                            placeholder="Mínimo 8 caracteres"
                            style={{ paddingRight: '3rem', width: '100%' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--neutral-500)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <FieldError message={touched.contrasena && fieldErrors.contrasena} />
                </div>
                <div className="form-group">
                    <label className="form-label">Confirmar Contraseña *</label>
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            name="confirmarContrasena"
                            className={`form-input ${touched.confirmarContrasena && fieldErrors.confirmarContrasena ? 'input-error' : ''}`}
                            value={info.confirmarContrasena}
                            onChange={handleInfoChange}
                            onBlur={() => handleBlur('confirmarContrasena')}
                            placeholder="Repetir contraseña"
                            style={{ paddingRight: '3rem', width: '100%' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '0.75rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                color: 'var(--neutral-500)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '4px',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--neutral-50)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                            aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                            {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: '20px', height: '20px' }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <FieldError message={touched.confirmarContrasena && fieldErrors.confirmarContrasena} />
                </div>
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

    const renderStep2 = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Calle *</label>
                    <input
                        type="text"
                        name="calle"
                        className={`form-input ${touched.calle && fieldErrors.calle ? 'input-error' : ''}`}
                        value={direccion.calle}
                        onChange={handleDireccionChange}
                        onBlur={() => handleBlur('calle')}
                        placeholder="Nombre de la calle"
                    />
                    <FieldError message={touched.calle && fieldErrors.calle} />
                </div>
                <div className="form-group">
                    <label className="form-label">Número *</label>
                    <input
                        type="text"
                        name="numero"
                        className={`form-input ${touched.numero && fieldErrors.numero ? 'input-error' : ''}`}
                        value={direccion.numero}
                        onChange={handleDireccionChange}
                        onBlur={() => handleBlur('numero')}
                        placeholder="123"
                    />
                    <FieldError message={touched.numero && fieldErrors.numero} />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Piso</label>
                    <input
                        type="text"
                        name="piso"
                        className="form-input"
                        value={direccion.piso}
                        onChange={handleDireccionChange}
                        placeholder="1"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <input
                        type="text"
                        name="departamento"
                        className="form-input"
                        value={direccion.departamento}
                        onChange={handleDireccionChange}
                        placeholder="A"
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">Código Postal</label>
                    <input
                        type="text"
                        name="codigoPostal"
                        className="form-input"
                        value={direccion.codigoPostal}
                        onChange={handleDireccionChange}
                        placeholder="1234"
                    />
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Provincia *</label>
                    <select
                        name="provinciaId"
                        className={`form-input ${touched.provinciaId && fieldErrors.provinciaId ? 'input-error' : ''}`}
                        value={direccion.provinciaId}
                        onChange={handleDireccionChange}
                        onBlur={() => handleBlur('provinciaId')}
                    >
                        <option value="">Seleccionar provincia</option>
                        {provincias.map(prov => (
                            <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                        ))}
                    </select>
                    <FieldError message={touched.provinciaId && fieldErrors.provinciaId} />
                </div>
                <div className="form-group">
                    <label className="form-label">Ciudad</label>
                    <select
                        name="ciudadId"
                        className="form-input"
                        value={direccion.ciudadId}
                        onChange={handleDireccionChange}
                        disabled={!direccion.provinciaId}
                    >
                        <option value="">
                            {direccion.provinciaId ? 'Seleccionar ciudad' : 'Primero seleccione provincia'}
                        </option>
                        {ciudades.map(city => (
                            <option key={city.id} value={city.id}>{city.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );




    const content = (
        <>
            <div className="modal-body" style={{ padding: '2rem' }}>
                <StepTracker steps={steps} currentStep={currentStep} />

                <div style={{ marginTop: '2rem', textAlign: 'center', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                        {steps[currentStep - 1].title}
                    </h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {currentStep === 1 && 'Ingresa los datos básicos del empleado'}
                        {currentStep === 2 && 'Ingresa la dirección del empleado'}
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
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')} Empleado
                        </button>
                    )}
                </div>
            </div>
        </>
    );

    // Render with modal wrapper
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">
                        {isEditMode ? 'Editar Empleado' : 'Nuevo Empleado'}
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

export default EmpleadoWizard;


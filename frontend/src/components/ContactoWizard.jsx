/**
 * @fileoverview Orquestador para el alta y edición de contactos de empleados.
 * @module components/ContactoWizard
 */

import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { getEmpleados, createContacto, updateContacto } from '../services/api';
import { formatFullName } from '../helpers/formatters';
import { useIsDark } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

const PARENTESCOS = [
    'Cónyuge', 'Padre', 'Madre', 'Hijo/a', 'Hermano/a',
    'Abuelo/a', 'Nieto/a', 'Tío/a', 'Sobrino/a', 'Primo/a',
    'Suegro/a', 'Cuñado/a', 'Yerno', 'Nuera', 'Otro'
];

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
 * Componente ContactoWizard
 * 
 * Formulario multi-paso para gestionar familiares y contactos de emergencia.
 * Incluye validaciones de DNI, edad mínima del contacto y campos obligatorios.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.contacto] - Objeto contacto a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @returns {JSX.Element}
 */
const ContactoWizard = ({ contacto, onClose, onSuccess }) => {
    const isEditing = !!contacto;
    const [currentStep, setCurrentStep] = useState(1);

    const [formData, setFormData] = useState({
        empleadoId: null,
        esFamiliar: false,
        esContactoEmergencia: false,
        nombreCompleto: '',
        dni: '',
        fechaNacimiento: '',
        parentesco: '',
        discapacidad: false,
        dependiente: false,
        escolaridad: false,
        telefonoPrincipal: '',
        telefonoSecundario: '',
        direccion: '',
    });

    const [empleados, setEmpleados] = useState([]);
    const [loadingEmpleados, setLoadingEmpleados] = useState(true);
    const [selectedEmpleado, setSelectedEmpleado] = useState(null);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const isDark = useIsDark();

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
        if (contacto) {
            if (contacto.empleado) {
                const empOption = {
                    value: contacto.empleado.id,
                    label: `${formatFullName(contacto.empleado)} (${contacto.empleado.numeroDocumento || 'Sin doc'})`,
                    empleado: contacto.empleado
                };
                setSelectedEmpleado(empOption);
            }

            setFormData({
                empleadoId: contacto.empleado?.id || contacto.empleadoId || null,
                esFamiliar: contacto.esFamiliar || false,
                esContactoEmergencia: contacto.esContactoEmergencia || false,
                nombreCompleto: contacto.nombreCompleto || '',
                dni: contacto.dni || '',
                fechaNacimiento: contacto.fechaNacimiento || '',
                parentesco: contacto.parentesco || '',
                discapacidad: contacto.discapacidad || false,
                dependiente: contacto.dependiente || false,
                escolaridad: contacto.escolaridad || false,
                telefonoPrincipal: contacto.telefonoPrincipal || '',
                telefonoSecundario: contacto.telefonoSecundario || '',
                direccion: contacto.direccion || '',
            });
        }
    }, [contacto]);

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

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setError('');
        if (touched[field]) validateStep();
    };

    const handleCheckboxChange = (field) => {
        setFormData(prev => ({ ...prev, [field]: !prev[field] }));
        setError('');
    };

    const validateStep = () => {
        const errors = {};

        if (currentStep === 1) {
            if (!formData.empleadoId) errors.empleadoId = 'Debe seleccionar un empleado';
            if (!formData.esFamiliar && !formData.esContactoEmergencia) {
                errors.checkboxes = 'Debe seleccionar al menos una opción: Familiar o Contacto de Emergencia';
            }
            if (!formData.nombreCompleto) {
                errors.nombreCompleto = 'El nombre completo es requerido';
            } else if (formData.nombreCompleto.length < 2 || formData.nombreCompleto.length > 200) {
                errors.nombreCompleto = 'El nombre debe tener entre 2 y 200 caracteres';
            }
            if (!formData.dni) {
                errors.dni = 'El DNI es requerido';
            } else if (!/^(\d{8}|[MF]\d{7})$/.test(formData.dni)) {
                errors.dni = 'El DNI debe ser 8 números o comenzar con M/F seguido de 7 números';
            }
            if (formData.fechaNacimiento) {
                const birthDate = new Date(formData.fechaNacimiento);
                const minDate = new Date('1900-01-01');
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (birthDate < minDate) {
                    errors.fechaNacimiento = 'La fecha de nacimiento no es válida';
                } else if (birthDate > today) {
                    errors.fechaNacimiento = 'La fecha de nacimiento no puede ser futura';
                } else {
                    // Check minimum age (18 years)
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    if (age < 18) {
                        errors.fechaNacimiento = 'El contacto debe tener al menos 18 años para ser responsable';
                    }
                }
            }
            if (!formData.parentesco) {
                errors.parentesco = 'El parentesco es requerido';
            }
        }

        if (currentStep === 2) {
            if (!formData.telefonoPrincipal) {
                errors.telefonoPrincipal = 'El teléfono principal es requerido';
            } else if (!/^[0-9+\-\s()]*$/.test(formData.telefonoPrincipal)) {
                errors.telefonoPrincipal = 'El teléfono solo puede contener números, +, -, espacios y paréntesis';
            }
            if (formData.telefonoSecundario && !/^[0-9+\-\s()]*$/.test(formData.telefonoSecundario)) {
                errors.telefonoSecundario = 'El teléfono solo puede contener números, +, -, espacios y paréntesis';
            }
            if (formData.direccion && formData.direccion.length > 300) {
                errors.direccion = 'La dirección no puede exceder 300 caracteres';
            }
        }

        setFieldErrors(errors);

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
                empleadoId: formData.empleadoId,
                esFamiliar: formData.esFamiliar,
                esContactoEmergencia: formData.esContactoEmergencia,
                nombreCompleto: formData.nombreCompleto,
                dni: formData.dni,
                fechaNacimiento: formData.fechaNacimiento || null,
                parentesco: formData.parentesco,
                discapacidad: formData.discapacidad,
                dependiente: formData.dependiente,
                escolaridad: formData.escolaridad,
                telefonoPrincipal: formData.telefonoPrincipal,
                telefonoSecundario: formData.telefonoSecundario || null,
                direccion: formData.direccion || null,
            };

            if (isEditing) {
                await updateContacto(contacto.id, payload);
            } else {
                await createContacto(payload);
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
            {/* Empleado Selection */}
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

            {/* Checkboxes for Es Familiar / Es Contacto de Emergencia */}
            <div className="form-group">
                <label className="form-label">Tipo de Contacto *</label>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.esFamiliar}
                            onChange={() => handleCheckboxChange('esFamiliar')}
                            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
                        />
                        <span>Es familiar</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.esContactoEmergencia}
                            onChange={() => handleCheckboxChange('esContactoEmergencia')}
                            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
                        />
                        <span>Es contacto de emergencia</span>
                    </label>
                </div>
                <FieldError message={fieldErrors.checkboxes} />
            </div>

            {/* Nombre completo y DNI */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Nombre Completo *</label>
                    <input
                        type="text"
                        className={`form-input ${touched.nombreCompleto && fieldErrors.nombreCompleto ? 'input-error' : ''}`}
                        value={formData.nombreCompleto}
                        onChange={(e) => handleChange('nombreCompleto', e.target.value)}
                        onBlur={() => handleBlur('nombreCompleto')}
                        placeholder="Nombre y apellido del contacto"
                    />
                    <FieldError message={touched.nombreCompleto && fieldErrors.nombreCompleto} />
                </div>
                <div className="form-group">
                    <label className="form-label">DNI *</label>
                    <input
                        type="text"
                        className={`form-input ${touched.dni && fieldErrors.dni ? 'input-error' : ''}`}
                        value={formData.dni}
                        onChange={(e) => handleChange('dni', e.target.value)}
                        onBlur={() => handleBlur('dni')}
                        placeholder="12345678 o M1234567"
                    />
                    <FieldError message={touched.dni && fieldErrors.dni} />
                </div>
            </div>

            {/* Fecha de nacimiento y Parentesco */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fechaNacimiento && fieldErrors.fechaNacimiento ? 'input-error' : ''}`}
                        value={formData.fechaNacimiento}
                        onChange={(e) => handleChange('fechaNacimiento', e.target.value)}
                        onBlur={() => handleBlur('fechaNacimiento')}
                    />
                    <FieldError message={touched.fechaNacimiento && fieldErrors.fechaNacimiento} />
                </div>
                <div className="form-group">
                    <label className="form-label">Parentesco *</label>
                    <select
                        className={`form-input ${touched.parentesco && fieldErrors.parentesco ? 'input-error' : ''}`}
                        value={formData.parentesco}
                        onChange={(e) => handleChange('parentesco', e.target.value)}
                        onBlur={() => handleBlur('parentesco')}
                    >
                        <option value="">Seleccionar parentesco...</option>
                        {PARENTESCOS.map(p => (
                            <option key={p} value={p}>{p}</option>
                        ))}
                    </select>
                    <FieldError message={touched.parentesco && fieldErrors.parentesco} />
                </div>
            </div>
        </div>
    );

    const renderStep2 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* Checkboxes adicionales */}
            <div className="form-group">
                <label className="form-label">Información Adicional</label>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.discapacidad}
                            onChange={() => handleCheckboxChange('discapacidad')}
                            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
                        />
                        <span>Discapacidad</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.dependiente}
                            onChange={() => handleCheckboxChange('dependiente')}
                            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
                        />
                        <span>Dependiente</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                            type="checkbox"
                            checked={formData.escolaridad}
                            onChange={() => handleCheckboxChange('escolaridad')}
                            style={{ width: '18px', height: '18px', accentColor: '#0d9488' }}
                        />
                        <span>Escolaridad</span>
                    </label>
                </div>
            </div>

            {/* Teléfonos */}
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Teléfono Principal *</label>
                    <input
                        type="tel"
                        className={`form-input ${touched.telefonoPrincipal && fieldErrors.telefonoPrincipal ? 'input-error' : ''}`}
                        value={formData.telefonoPrincipal}
                        onChange={(e) => handleChange('telefonoPrincipal', e.target.value)}
                        onBlur={() => handleBlur('telefonoPrincipal')}
                        placeholder="+54 11 1234-5678"
                    />
                    <FieldError message={touched.telefonoPrincipal && fieldErrors.telefonoPrincipal} />
                </div>
                <div className="form-group">
                    <label className="form-label">Teléfono Secundario</label>
                    <input
                        type="tel"
                        className={`form-input ${touched.telefonoSecundario && fieldErrors.telefonoSecundario ? 'input-error' : ''}`}
                        value={formData.telefonoSecundario}
                        onChange={(e) => handleChange('telefonoSecundario', e.target.value)}
                        onBlur={() => handleBlur('telefonoSecundario')}
                        placeholder="Opcional"
                    />
                    <FieldError message={touched.telefonoSecundario && fieldErrors.telefonoSecundario} />
                </div>
            </div>

            {/* Dirección */}
            <div className="form-group">
                <label className="form-label">Dirección</label>
                <textarea
                    className={`form-input ${touched.direccion && fieldErrors.direccion ? 'input-error' : ''}`}
                    value={formData.direccion}
                    onChange={(e) => handleChange('direccion', e.target.value)}
                    onBlur={() => handleBlur('direccion')}
                    placeholder="Dirección completa (opcional)"
                    rows={3}
                    style={{ resize: 'vertical' }}
                    maxLength={300}
                />
                <FieldError message={touched.direccion && fieldErrors.direccion} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{formData.direccion.length}/300</span>
            </div>
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Contacto' : 'Nuevo Contacto'}</h2>
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
                            {currentStep === 1 && 'Ingresa los datos básicos del contacto'}
                            {currentStep === 2 && 'Completa la información adicional del contacto'}
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
                                {submitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Contacto
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactoWizard;


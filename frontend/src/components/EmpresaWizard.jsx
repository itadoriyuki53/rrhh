/**
 * @fileoverview Orquestador de creación y edición de empresas mediante un formulario multi-paso.
 * @module components/EmpresaWizard
 */

import { useState, useEffect } from 'react';
import StepTracker from './StepTracker';
import EspacioTrabajoSelector from './EspacioTrabajoSelector';
import { createEmpresa, updateEmpresa, checkCanDeleteEmpresaItem, canChangeEmpresaWorkspace } from '../services/api';

/**
 * Componente EmpresaWizard
 * 
 * Gestiona el ciclo de vida de creación/edición de una empresa, incluyendo su información básica,
 * estructura organizacional (Áreas, Departamentos, Puestos) y asignación a Espacios de Trabajo.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.empresa] - Objeto empresa a editar (si es null, el modo es creación).
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras una operación exitosa.
 * @returns {JSX.Element}
 */
const EmpresaWizard = ({ empresa: empresaToEdit, onClose, onSuccess }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const primaryColor = '#0d9488';
    const borderColor = 'var(--border-color, #e2e8f0)';

    const [empresa, setEmpresa] = useState({
        nombre: '',
        email: '',
        telefono: '',
        industria: '',
        direccion: '',
        areas: []
    });

    // Espacio de Trabajo
    const [espacioTrabajoId, setEspacioTrabajoId] = useState('');
    const [canChangeWorkspace, setCanChangeWorkspace] = useState(true);
    const [workspaceChangeMessage, setWorkspaceChangeMessage] = useState('');

    const [tempArea, setTempArea] = useState({ nombre: '', descripcion: '' });
    const [tempDepto, setTempDepto] = useState({ nombre: '', descripcion: '' });
    const [tempPuesto, setTempPuesto] = useState({ nombre: '', descripcion: '' });

    const [selectedAreaId, setSelectedAreaId] = useState(null);
    const [selectedDeptoId, setSelectedDeptoId] = useState(null);

    const isEditing = !!empresaToEdit;

    // Cargar datos de empresa a editar
    useEffect(() => {
        if (empresaToEdit) {
            setEmpresa({
                nombre: empresaToEdit.nombre || '',
                email: empresaToEdit.email || '',
                telefono: empresaToEdit.telefono || '',
                industria: empresaToEdit.industria || '',
                direccion: empresaToEdit.direccion || '',
                areas: (empresaToEdit.areas || []).map(area => ({
                    ...area,
                    id: area.id || generateId(),
                    departamentos: (area.departamentos || []).map(depto => ({
                        ...depto,
                        id: depto.id || generateId(),
                        puestos: (depto.puestos || []).map(puesto => ({
                            ...puesto,
                            id: puesto.id || generateId()
                        }))
                    }))
                }))
            });

            // Cargar espacio de trabajo
            setEspacioTrabajoId(String(empresaToEdit.espacioTrabajoId || ''));

            // Verificar si puede cambiar de espacio
            if (empresaToEdit.id) {
                checkCanChangeWorkspace(empresaToEdit.id);
            }
        }
    }, [empresaToEdit]);

    const checkCanChangeWorkspace = async (empresaId) => {
        try {
            const result = await canChangeEmpresaWorkspace(empresaId);
            setCanChangeWorkspace(result.canChange);
            setWorkspaceChangeMessage(result.reason || '');
        } catch (err) {
            console.error('Error al verificar cambio de espacio:', err);
            setCanChangeWorkspace(true);
        }
    };

    const generateId = () => Math.random().toString(36).substr(2, 9);

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setEmpresa(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const addArea = () => {
        if (!tempArea.nombre.trim()) {
            setErrors(prev => ({ ...prev, areaNombre: 'El nombre del Ã¡rea es requerido' }));
            return;
        }
        setEmpresa(prev => ({
            ...prev,
            areas: [...prev.areas, { ...tempArea, id: generateId(), departamentos: [] }]
        }));
        setTempArea({ nombre: '', descripcion: '' });
        setErrors(prev => ({ ...prev, areaNombre: '' }));
    };

    const removeArea = async (id) => {
        // Only check with backend if this is an existing area (numeric id from DB)
        if (isEditing && typeof id === 'number') {
            try {
                const result = await checkCanDeleteEmpresaItem('area', id);
                if (!result.canDelete) {
                    setErrors({ general: result.message });
                    return;
                }
            } catch (err) {
                console.error('Error checking delete:', err);
            }
        }
        setEmpresa(prev => ({ ...prev, areas: prev.areas.filter(a => a.id !== id) }));
        if (selectedAreaId === id) setSelectedAreaId(null);
        setErrors({});
    };

    const addDepto = () => {
        if (!tempDepto.nombre.trim()) {
            setErrors(prev => ({ ...prev, deptoNombre: 'El nombre del departamento es requerido' }));
            return;
        }
        if (!selectedAreaId) return;
        setEmpresa(prev => ({
            ...prev,
            areas: prev.areas.map(area => {
                if (area.id === selectedAreaId) {
                    return { ...area, departamentos: [...area.departamentos, { ...tempDepto, id: generateId(), puestos: [] }] };
                }
                return area;
            })
        }));
        setTempDepto({ nombre: '', descripcion: '' });
        setErrors(prev => ({ ...prev, deptoNombre: '' }));
    };

    const removeDepto = async (areaId, deptoId) => {
        // Only check with backend if this is an existing departamento (numeric id from DB)
        if (isEditing && typeof deptoId === 'number') {
            try {
                const result = await checkCanDeleteEmpresaItem('departamento', deptoId);
                if (!result.canDelete) {
                    setErrors({ general: result.message });
                    return;
                }
            } catch (err) {
                console.error('Error checking delete:', err);
            }
        }
        setEmpresa(prev => ({
            ...prev,
            areas: prev.areas.map(area => {
                if (area.id === areaId) {
                    return { ...area, departamentos: area.departamentos.filter(d => d.id !== deptoId) };
                }
                return area;
            })
        }));
        if (selectedDeptoId === deptoId) setSelectedDeptoId(null);
        setErrors({});
    };

    const addPuesto = () => {
        if (!tempPuesto.nombre.trim()) {
            setErrors(prev => ({ ...prev, puestoNombre: 'El nombre del puesto es requerido' }));
            return;
        }
        if (!selectedDeptoId) return;
        setEmpresa(prev => ({
            ...prev,
            areas: prev.areas.map(area => ({
                ...area,
                departamentos: area.departamentos.map(depto => {
                    if (depto.id === selectedDeptoId) {
                        return { ...depto, puestos: [...depto.puestos, { ...tempPuesto, id: generateId() }] };
                    }
                    return depto;
                })
            }))
        }));
        setTempPuesto({ nombre: '', descripcion: '' });
        setErrors(prev => ({ ...prev, puestoNombre: '' }));
    };

    const removePuesto = async (deptoId, puestoId) => {
        // Only check with backend if this is an existing puesto (numeric id from DB)
        if (isEditing && typeof puestoId === 'number') {
            try {
                const result = await checkCanDeleteEmpresaItem('puesto', puestoId);
                if (!result.canDelete) {
                    setErrors({ general: result.message });
                    return;
                }
            } catch (err) {
                console.error('Error checking delete:', err);
            }
        }
        setEmpresa(prev => ({
            ...prev,
            areas: prev.areas.map(area => ({
                ...area,
                departamentos: area.departamentos.map(depto => {
                    if (depto.id === deptoId) {
                        return { ...depto, puestos: depto.puestos.filter(p => p.id !== puestoId) };
                    }
                    return depto;
                })
            }))
        }));
        setErrors({});
    };

    const validateStep = () => {
        const newErrors = {};
        if (step === 1) {
            if (!empresa.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
            else if (empresa.nombre.length < 2 || empresa.nombre.length > 200) newErrors.nombre = 'El nombre debe tener entre 2 y 200 caracteres';

            if (!empresa.email.trim()) newErrors.email = 'El email es requerido';
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.email)) newErrors.email = 'El email no es vÃ¡lido';
            else if (empresa.email.length < 5 || empresa.email.length > 100) newErrors.email = 'El email debe tener entre 5 y 100 caracteres';

            // ValidaciÃ³n de telÃ©fono (opcional pero con formato si se ingresa)
            if (empresa.telefono && !/^[0-9+\-\s()]*$/.test(empresa.telefono)) {
                newErrors.telefono = 'El telÃ©fono solo puede contener nÃºmeros, +, -, espacios y parÃ©ntesis';
            } else if (empresa.telefono && empresa.telefono.length > 50) {
                newErrors.telefono = 'El telÃ©fono no puede exceder 50 caracteres';
            }

            if (!empresa.industria.trim()) newErrors.industria = 'La industria es requerida';
            else if (empresa.industria.length < 2 || empresa.industria.length > 100) newErrors.industria = 'La industria debe tener entre 2 y 100 caracteres';

            if (!empresa.direccion.trim()) newErrors.direccion = 'La direcciÃ³n es requerida';
            else if (empresa.direccion.length < 5 || empresa.direccion.length > 255) newErrors.direccion = 'La direcciÃ³n debe tener entre 5 y 255 caracteres';

            // Add general error message if any field has errors
            if (Object.keys(newErrors).length > 0) {
                newErrors.general = 'Por favor completa todos los campos obligatorios';
            }

            // ValidaciÃ³n de espacio de trabajo
            if (!espacioTrabajoId) {
                newErrors.espacioTrabajoId = 'El espacio de trabajo es requerido';
            }
        }
        if (step === 2 && empresa.areas.length === 0) newErrors.general = 'Debes agregar al menos un Ã¡rea para continuar';
        setErrors(newErrors);
        return Object.keys(newErrors).filter(k => k !== 'general').length === 0 && !newErrors.general;
    };

    const nextStep = () => { if (validateStep()) { setStep(s => s + 1); setErrors({}); } };
    const prevStep = () => { setStep(s => s - 1); setErrors({}); };

    const validateFinalSubmit = () => {
        if (!empresa.nombre.trim()) { setErrors({ nombre: 'El nombre de la empresa es requerido' }); setStep(1); return false; }
        if (!empresa.email.trim()) { setErrors({ email: 'El email es requerido' }); setStep(1); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.email)) { setErrors({ email: 'El email no es vÃ¡lido' }); setStep(1); return false; }
        if (!empresa.industria.trim()) { setErrors({ industria: 'La industria es requerida' }); setStep(1); return false; }
        if (!empresa.direccion.trim()) { setErrors({ direccion: 'La direcciÃ³n es requerida' }); setStep(1); return false; }
        if (!espacioTrabajoId) { setErrors({ espacioTrabajoId: 'El espacio de trabajo es requerido' }); setStep(1); return false; }
        if (empresa.areas.length === 0) { setErrors({ general: 'Debes agregar al menos un Ã¡rea' }); setStep(2); return false; }
        return true;
    };

    const handleSubmit = async () => {
        if (!validateFinalSubmit()) return;
        try {
            setLoading(true);
            let payload;

            if (isEditing) {
                // When editing, include IDs to preserve existing items
                payload = {
                    ...empresa,
                    areas: empresa.areas.map(area => ({
                        id: area.id, // Keep the ID for existing areas
                        nombre: area.nombre,
                        departamentos: area.departamentos.map(depto => ({
                            id: depto.id, // Keep the ID for existing departamentos
                            nombre: depto.nombre,
                            puestos: depto.puestos.map(puesto => ({
                                id: puesto.id, // Keep the ID for existing puestos
                                nombre: puesto.nombre,
                                descripcion: puesto.descripcion
                            }))
                        }))
                    }))
                };
            } else {
                // When creating, don't include IDs
                payload = {
                    ...empresa,
                    areas: empresa.areas.map(({ id, departamentos, ...areaRest }) => ({
                        ...areaRest,
                        departamentos: departamentos.map(({ id, puestos, ...deptoRest }) => ({
                            ...deptoRest,
                            puestos: puestos.map(({ id, ...puestoRest }) => puestoRest)
                        }))
                    }))
                };
            }

            // Agregar espacioTrabajoId al payload
            payload.espacioTrabajoId = espacioTrabajoId ? parseInt(espacioTrabajoId) : undefined;

            if (isEditing) {
                await updateEmpresa(empresaToEdit.id, payload);
            } else {
                await createEmpresa(payload);
            }
            onSuccess();
        } catch (err) {
            const errorMessage = err.message.toLowerCase();
            // Detect step 1 field errors (nombre, email, industria, direccion)
            const step1Fields = ['nombre', 'email', 'industria', 'direccion', 'direcciÃ³n'];
            const isStep1Error = step1Fields.some(field => errorMessage.includes(field));

            if (isStep1Error) {
                setStep(1);
                const newErrors = { submit: err.message };
                if (errorMessage.includes('email')) {
                    if (errorMessage.includes('unique') || errorMessage.includes('existe') || errorMessage.includes('duplicado') || errorMessage.includes('registrado')) {
                        newErrors.email = 'Este email ya estÃ¡ registrado';
                    } else {
                        newErrors.email = 'Debe ser un email vÃ¡lido';
                    }
                }
                if (errorMessage.includes('nombre')) {
                    newErrors.nombre = err.message;
                }
                setErrors(newErrors);
            } else {
                setErrors({ submit: err.message });
            }
        } finally {
            setLoading(false);
        }
    };

    const renderDeleteIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 18, height: 18 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );

    const getCardStyle = (isSelected) => ({
        padding: '1rem',
        background: isSelected ? `${primaryColor}15` : 'var(--card-bg)',
        border: `2px solid ${isSelected ? primaryColor : borderColor}`,
        borderRadius: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease'
    });

    const handleCardHover = (e, isSelected) => {
        if (!isSelected) {
            e.currentTarget.style.borderColor = primaryColor;
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = `0 4px 12px ${primaryColor}20`;
        }
    };

    const handleCardLeave = (e, isSelected) => {
        if (!isSelected) {
            e.currentTarget.style.borderColor = borderColor;
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
        }
    };

    // Estilos para contenedores con borde
    const listContainerStyle = {
        border: `1px solid ${borderColor}`,
        borderRadius: '0.5rem',
        padding: '1rem',
        minHeight: '200px'
    };

    const emptyStateStyle = {
        textAlign: 'center',
        color: 'var(--text-secondary)',
        padding: '3rem 1rem',
        background: 'var(--card-bg)',
        border: `2px dashed ${primaryColor}50`,
        borderRadius: '0.5rem'
    };

    const renderStep1 = () => (
        <div>
            <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>InformaciÃ³n de la Empresa</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Ingresa los datos bÃ¡sicos de la empresa</p>
            </div>

            {(errors.submit || errors.general) && (<div className="alert alert-error" style={{ marginBottom: '1.5rem', }}>{errors.submit || errors.general}</div>)}

            <div className="form-grid-stacked" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">Nombre de la Empresa *</label>
                    <input type="text" name="nombre" className={`form-input ${errors.nombre ? 'input-error' : ''}`}
                        value={empresa.nombre} onChange={handleInfoChange} placeholder="Ej: Tech Solutions S.A." autoFocus />
                    {errors.nombre && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.nombre}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">Email Corporativo *</label>
                    <input type="email" name="email" className={`form-input ${errors.email ? 'input-error' : ''}`}
                        value={empresa.email} onChange={handleInfoChange} placeholder="Ej: contacto@empresa.com" />
                    {errors.email && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.email}</span>}
                </div>
            </div>

            <div className="form-grid-stacked" style={{ marginBottom: '1rem' }}>
                <div className="form-group">
                    <label className="form-label">TelÃ©fono</label>
                    <input type="tel" name="telefono" className={`form-input ${errors.telefono ? 'input-error' : ''}`} value={empresa.telefono} onChange={handleInfoChange} placeholder="Ej: +54 11 1234-5678" />
                    {errors.telefono && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.telefono}</span>}
                </div>
                <div className="form-group">
                    <label className="form-label">Industria / Sector *</label>
                    <input type="text" name="industria" className={`form-input ${errors.industria ? 'input-error' : ''}`}
                        value={empresa.industria} onChange={handleInfoChange} placeholder="Ej: TecnologÃ­a, Salud..." />
                    {errors.industria && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.industria}</span>}
                </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">DirecciÃ³n *</label>
                <input type="text" name="direccion" className={`form-input ${errors.direccion ? 'input-error' : ''}`}
                    value={empresa.direccion} onChange={handleInfoChange} placeholder="Ej: Calle Falsa 123, Ciudad" />
                {errors.direccion && <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{errors.direccion}</span>}
            </div>

            {/* Espacio de Trabajo */}
            <EspacioTrabajoSelector
                value={espacioTrabajoId}
                onChange={(e) => setEspacioTrabajoId(e.target.value)}
                onBlur={() => { }}
                canChange={!isEditing || canChangeWorkspace}
                changeRestrictionMessage={workspaceChangeMessage}
                touched={!!errors.espacioTrabajoId}
                error={errors.espacioTrabajoId}
            />
        </div>
    );

    const renderStep2 = () => (
        <div>
            <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Ãreas de la Empresa</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Define las Ã¡reas principales que componen tu organizaciÃ³n</p>
            </div>

            {errors.general && (
                <div className="alert alert-error">
                    {errors.general}
                </div>
            )}

            <div className="form-grid-stacked" style={{ gap: '2rem' }}>
                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Ãreas Agregadas ({empresa.areas.length})</h4>
                    <div style={listContainerStyle}>
                        {empresa.areas.length === 0 ? (
                            <div style={emptyStateStyle}>
                                <p>No hay Ã¡reas agregadas aÃºn</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>Agrega tu primera Ã¡rea â†’</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {empresa.areas.map(area => (
                                    <div key={area.id} style={{ padding: '1rem', background: 'var(--card-bg)', border: `2px solid ${primaryColor}`, borderRadius: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{area.nombre}</div>
                                            {area.descripcion && <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{area.descripcion}</div>}
                                        </div>
                                        <button onClick={() => removeArea(area.id)} className="btn-icon-delete" style={{ marginLeft: '0.75rem' }} type="button">{renderDeleteIcon()}</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Agregar Nueva Ãrea</h4>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">Nombre del Ãrea <span className="required">*</span></label>
                        <input type="text" className={`form-input ${errors.areaNombre ? 'error' : ''}`}
                            value={tempArea.nombre} onChange={(e) => { setTempArea(prev => ({ ...prev, nombre: e.target.value })); if (errors.areaNombre) setErrors(prev => ({ ...prev, areaNombre: '' })); }}
                            placeholder="Ej: Recursos Humanos" />
                        {errors.areaNombre && <span className="form-error">{errors.areaNombre}</span>}
                    </div>
                    <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                        <label className="form-label">DescripciÃ³n (Opcional)</label>
                        <textarea className="form-input" value={tempArea.descripcion} onChange={(e) => setTempArea(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="Breve descripciÃ³n del Ã¡rea..." rows={3} />
                    </div>
                    <button className="btn btn-primary" onClick={addArea} type="button" style={{ width: '100%' }}>+ Agregar Ãrea</button>
                </div>
            </div>
        </div>
    );

    const renderStep3 = () => {
        const selectedArea = empresa.areas.find(a => a.id === selectedAreaId);
        const deptosCount = selectedArea?.departamentos.length || 0;

        return (
            <div>
                <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Departamentos por Ãrea</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Organiza cada Ã¡rea en departamentos especÃ­ficos</p>
                </div>

                {errors.general && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {errors.general}
                    </div>
                )}

                <div className="form-grid-stacked" style={{ gap: '2rem' }}>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Selecciona un Ãrea</h4>
                        <div style={listContainerStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {empresa.areas.map(area => (
                                    <div key={area.id} onClick={() => setSelectedAreaId(area.id)} style={getCardStyle(selectedAreaId === area.id)}
                                        onMouseEnter={(e) => handleCardHover(e, selectedAreaId === area.id)}
                                        onMouseLeave={(e) => handleCardLeave(e, selectedAreaId === area.id)}>
                                        <div style={{ fontWeight: '600', color: selectedAreaId === area.id ? primaryColor : 'var(--text-primary)', marginBottom: '0.25rem' }}>{area.nombre}</div>
                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{area.departamentos.length} Departamento(s)</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        {selectedAreaId ? (
                            <>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Departamentos de: {selectedArea?.nombre}</h4>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Nombre del Departamento <span className="required">*</span></label>
                                    <input type="text" className={`form-input ${errors.deptoNombre ? 'error' : ''}`}
                                        value={tempDepto.nombre} onChange={(e) => { setTempDepto(prev => ({ ...prev, nombre: e.target.value })); if (errors.deptoNombre) setErrors(prev => ({ ...prev, deptoNombre: '' })); }}
                                        placeholder="Ej: Reclutamiento" />
                                    {errors.deptoNombre && <span className="form-error">{errors.deptoNombre}</span>}
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">DescripciÃ³n (Opcional)</label>
                                    <textarea className="form-input" value={tempDepto.descripcion} onChange={(e) => setTempDepto(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="DescripciÃ³n del departamento..." rows={2} />
                                </div>
                                <button className="btn btn-primary" onClick={addDepto} type="button" style={{ width: '100%', marginBottom: '1.5rem' }}>+ Agregar Departamento</button>

                                <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Departamentos Agregados ({deptosCount})</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                                    {deptosCount === 0 ? (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>No hay departamentos</p>
                                    ) : (
                                        selectedArea?.departamentos.map(depto => (
                                            <div key={depto.id} style={{ padding: '0.75rem', background: 'var(--card-bg)', border: `1px solid ${primaryColor}50`, borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{depto.nombre}</div>
                                                    {depto.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{depto.descripcion}</div>}
                                                </div>
                                                <button onClick={() => removeDepto(selectedAreaId, depto.id)} className="btn-icon-delete" style={{ marginLeft: '0.75rem' }} type="button">{renderDeleteIcon()}</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={emptyStateStyle}>
                                <p style={{ fontSize: '1rem' }}>â† Selecciona un Ã¡rea</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>para gestionar sus departamentos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderStep4 = () => {
        const selectedDepto = empresa.areas.flatMap(a => a.departamentos).find(d => d.id === selectedDeptoId);
        const puestosCount = selectedDepto?.puestos.length || 0;

        return (
            <div>
                <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Puestos por Departamento</h3>
                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Define los puestos de trabajo para cada departamento</p>
                </div>

                {errors.general && (
                    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                        {errors.general}
                    </div>
                )}

                <div className="form-grid-stacked" style={{ gap: '2rem' }}>
                    <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Selecciona un Departamento</h4>
                        <div style={listContainerStyle}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {empresa.areas.map(area => (
                                    <div key={area.id}>
                                        <h5 style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{area.nombre}</h5>
                                        {area.departamentos.length === 0 ? (
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', paddingLeft: '0.75rem', fontStyle: 'italic' }}>Sin departamentos</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '0.5rem' }}>
                                                {area.departamentos.map(depto => (
                                                    <div key={depto.id} onClick={() => setSelectedDeptoId(depto.id)} style={getCardStyle(selectedDeptoId === depto.id)}
                                                        onMouseEnter={(e) => handleCardHover(e, selectedDeptoId === depto.id)}
                                                        onMouseLeave={(e) => handleCardLeave(e, selectedDeptoId === depto.id)}>
                                                        <div style={{ fontWeight: '600', color: selectedDeptoId === depto.id ? primaryColor : 'var(--text-primary)', marginBottom: '0.25rem' }}>{depto.nombre}</div>
                                                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{depto.puestos.length} Puesto(s)</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        {selectedDeptoId ? (
                            <>
                                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1rem' }}>Puestos de: {selectedDepto?.nombre}</h4>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">Nombre del Puesto <span className="required">*</span></label>
                                    <input type="text" className={`form-input ${errors.puestoNombre ? 'error' : ''}`}
                                        value={tempPuesto.nombre} onChange={(e) => { setTempPuesto(prev => ({ ...prev, nombre: e.target.value })); if (errors.puestoNombre) setErrors(prev => ({ ...prev, puestoNombre: '' })); }}
                                        placeholder="Ej: Analista de RRHH" />
                                    {errors.puestoNombre && <span className="form-error">{errors.puestoNombre}</span>}
                                </div>
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label className="form-label">DescripciÃ³n (Opcional)</label>
                                    <textarea className="form-input" value={tempPuesto.descripcion} onChange={(e) => setTempPuesto(prev => ({ ...prev, descripcion: e.target.value }))} placeholder="DescripciÃ³n del puesto..." rows={2} />
                                </div>
                                <button className="btn btn-primary" onClick={addPuesto} type="button" style={{ width: '100%', marginBottom: '1.5rem' }}>+ Agregar Puesto</button>

                                <h5 style={{ fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Puestos Agregados ({puestosCount})</h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '180px', overflowY: 'auto' }}>
                                    {puestosCount === 0 ? (
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontStyle: 'italic', padding: '1rem' }}>No hay puestos</p>
                                    ) : (
                                        selectedDepto?.puestos.map(puesto => (
                                            <div key={puesto.id} style={{ padding: '0.75rem', background: 'var(--card-bg)', border: `1px solid ${primaryColor}50`, borderRadius: '0.375rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--text-primary)' }}>{puesto.nombre}</div>
                                                    {puesto.descripcion && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{puesto.descripcion}</div>}
                                                </div>
                                                <button onClick={() => removePuesto(selectedDeptoId, puesto.id)} className="btn-icon-delete" style={{ marginLeft: '0.75rem' }} type="button">{renderDeleteIcon()}</button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </>
                        ) : (
                            <div style={emptyStateStyle}>
                                <p style={{ fontSize: '1rem' }}>â† Selecciona un departamento</p>
                                <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>para gestionar sus puestos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderStep5 = () => (
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ marginTop: '2rem', marginBottom: '2rem', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Resumen de Estructura Organizacional</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Revisa la estructura completa antes de crear la empresa</p>
            </div>

            <div className="empresa-resumen-cards" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: `1px solid ${borderColor}`, borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>{empresa.nombre}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Empresa</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: `1px solid ${borderColor}`, borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: primaryColor }}>{empresa.areas.length}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Ãreas</div>
                </div>
                <div style={{ padding: '1.25rem', background: 'var(--card-bg)', border: `1px solid ${borderColor}`, borderRadius: '0.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#22c55e' }}>{empresa.areas.reduce((acc, area) => acc + area.departamentos.length, 0)}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Departamentos</div>
                </div>
            </div>

            <div style={{ background: 'var(--card-bg)', border: `1px solid ${borderColor}`, borderRadius: '0.75rem', padding: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Estructura JerÃ¡rquica
                </h4>

                {empresa.areas.length === 0 ? (
                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No hay Ã¡reas definidas</p>
                ) : (
                    <div style={{ paddingLeft: '1rem' }}>
                        {empresa.areas.map((area, areaIndex) => (
                            <div key={area.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: areaIndex === empresa.areas.length - 1 ? 0 : '1.5rem' }}>
                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', bottom: area.departamentos.length > 0 ? '0.75rem' : 0, width: '2px', background: primaryColor }} />
                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', width: '1rem', height: '2px', background: primaryColor }} />

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                                    <span style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '1rem' }}>{area.nombre}</span>
                                    <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: `${primaryColor}15`, color: primaryColor, borderRadius: '1rem', fontWeight: '500' }}>{area.departamentos.length} Depto(s)</span>
                                </div>

                                {area.departamentos.map((depto, deptoIndex) => (
                                    <div key={depto.id} style={{ position: 'relative', paddingLeft: '2rem', marginBottom: deptoIndex === area.departamentos.length - 1 ? 0 : '0.75rem' }}>
                                        {depto.puestos.length > 0 && <div style={{ position: 'absolute', left: '1rem', top: '0.5rem', bottom: '0.5rem', width: '2px', background: '#22c55e' }} />}
                                        <div style={{ position: 'absolute', left: 0, top: '0.5rem', width: '1.5rem', height: '2px', background: '#22c55e' }} />

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: depto.puestos.length > 0 ? '0.5rem' : 0 }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{depto.nombre}</span>
                                            <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', background: '#22c55e20', color: '#22c55e', borderRadius: '1rem' }}>{depto.puestos.length} Puesto(s)</span>
                                        </div>

                                        {depto.puestos.map((puesto, puestoIndex) => (
                                            <div key={puesto.id} style={{ position: 'relative', paddingLeft: '2rem', marginBottom: puestoIndex === depto.puestos.length - 1 ? 0 : '0.25rem' }}>
                                                <div style={{ position: 'absolute', left: '0.5rem', top: '0.5rem', width: '1rem', height: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{puesto.nombre}</span>
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

            {errors.submit && <div className="alert alert-error" style={{ marginTop: '1.5rem' }}>{errors.submit}</div>}
        </div>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar' : 'Nueva'} Empresa</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '2rem' }}>
                    <StepTracker currentStep={step} totalSteps={5} />

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                    {step === 3 && renderStep3()}
                    {step === 4 && renderStep4()}
                    {step === 5 && renderStep5()}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                        {step > 1 && (
                            <button className="btn btn-secondary" onClick={prevStep}>
                                Anterior
                            </button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        {step < 5 ? (
                            <button className="btn btn-primary" onClick={nextStep}>
                                Siguiente
                            </button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Empresa
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default EmpresaWizard;


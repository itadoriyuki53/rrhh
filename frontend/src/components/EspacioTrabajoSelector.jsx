/**
 * @fileoverview Selector dinámico de espacios de trabajo con lógica de auto-asignación para empleados.
 * @module components/EspacioTrabajoSelector
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getEspaciosTrabajo, getEspacioTrabajoById } from '../services/api';

/**
 * Componente selector de Espacio de Trabajo
 * 
 * Se encarga de mostrar los espacios disponibles (para administradores) o fijar
 * el espacio propio (para empleados). Maneja restricciones de cambio si el registro
 * tiene dependencias activas.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {number|string} props.value - ID del espacio seleccionado.
 * @param {Function} props.onChange - Handler para el cambio de selección.
 * @param {Function} props.onBlur - Handler para el desenfoque del input.
 * @param {boolean} [props.disabled=false] - Indica si el selector está deshabilitado.
 * @param {boolean} [props.canChange=true] - Indica si el usuario tiene permiso para cambiar el espacio.
 * @param {string} [props.changeRestrictionMessage=''] - Mensaje explicativo si no puede cambiar.
 * @param {boolean} [props.touched=false] - Indica si el campo ha sido tocado (para validación).
 * @param {string} [props.error=''] - Mensaje de error a mostrar.
 * @param {boolean} [props.required=true] - Indica si el campo es obligatorio.
 * @param {string} [props.className=''] - Clases CSS adicionales.
 * @returns {JSX.Element}
 */
const EspacioTrabajoSelector = ({
    value,
    onChange,
    onBlur,
    disabled = false,
    canChange = true,
    changeRestrictionMessage = '',
    touched = false,
    error = '',
    required = true,
    className = ''
}) => {
    const { user } = useAuth();
    const [espacios, setEspacios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [autoAssigned, setAutoAssigned] = useState(false);
    const [workspaceName, setWorkspaceName] = useState('');

    useEffect(() => {
        if (user) {
            loadEspacios();
        }
    }, [user]);

    useEffect(() => {
        // Si el usuario es empleado y no se ha auto-asignado, asignar su espacio automÃ¡ticamente
        const espacioId = user?.empleado?.espacioTrabajoId || user?.espacioTrabajoId;

        if (user?.esEmpleado && espacioId && !autoAssigned && !value) {
            onChange({
                target: {
                    name: 'espacioTrabajoId',
                    value: espacioId
                }
            });
            setAutoAssigned(true);
        }
    }, [user, autoAssigned, value, onChange]);

    const loadEspacios = async () => {
        try {
            setLoading(true);

            if (user?.esEmpleado) {
                const espacioId = user?.empleado?.espacioTrabajoId || user?.espacioTrabajoId;
                if (espacioId) {
                    try {
                        const data = await getEspacioTrabajoById(espacioId);
                        setWorkspaceName(data.nombre);
                    } catch (error) {
                        console.error('Error al obtener info del espacio:', error);
                        setWorkspaceName('Error al cargar');
                    }
                }
            } else {
                const response = await getEspaciosTrabajo({ activo: 'true', limit: 100 });
                setEspacios(response.data || []);
            }
        } catch (err) {
            console.error('Error al cargar espacios de trabajo:', err);
        } finally {
            setLoading(false);
        }
    };

    // Si el usuario es empleado, mostrar el espacio de trabajo asignado (solo lectura)
    if (user?.esEmpleado) {
        // Usar el nombre obtenido o mostrar loading/placeholder
        const displayText = workspaceName || (loading ? 'Cargando...' : 'Sin asignar');

        return (
            <div className="form-group">
                <label className="form-label">
                    Espacio de Trabajo {required && '*'}
                </label>
                <input
                    type="text"
                    className="form-input"
                    value={displayText}
                    disabled
                    readOnly
                />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Asignado automÃ¡ticamente segÃºn tu perfil de empleado
                </p>
            </div>
        );
    }

    // Si el usuario NO es empleado, mostrar selector
    const isDisabled = disabled || !canChange || loading;

    return (
        <div className="form-group">
            <label className="form-label">
                Espacio de Trabajo {required && '*'}
            </label>
            <select
                name="espacioTrabajoId"
                className={`form-input ${touched && error ? 'input-error' : ''} ${className}`}
                value={value || ''}
                onChange={onChange}
                onBlur={onBlur}
                disabled={isDisabled}
            >
                <option value="">Seleccionar espacio de trabajo</option>
                {espacios.map(espacio => (
                    <option key={espacio.id} value={espacio.id}>
                        {espacio.nombre}
                    </option>
                ))}
            </select>

            {touched && error && (
                <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                    {error}
                </span>
            )}

            {!canChange && changeRestrictionMessage && (
                <div style={{
                    fontSize: '0.75rem',
                    color: '#f59e0b',
                    marginTop: '0.25rem',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: '0.375rem',
                    border: '1px solid rgba(245, 158, 11, 0.3)'
                }}>
                    <strong>Cambio restringido:</strong> {changeRestrictionMessage}
                </div>
            )}

            {!user?.esEmpleado && canChange && (
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                    Selecciona el espacio de trabajo al que pertenecerÃ¡ este registro
                </p>
            )}
        </div>
    );
};

export default EspacioTrabajoSelector;


/**
 * @fileoverview Modal de configuración para los parámetros laborales globales del sistema.
 * @module components/ParametrosLaboralesModal
 */

import { useState, useEffect } from 'react';
import EspacioTrabajoSelector from './EspacioTrabajoSelector';
import { getParametrosLaborales, updateParametrosLaborales } from '../services/api';

// Tooltip components like in EvaluacionWizard
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

const TOOLTIP_LIMITE_AUSENCIA = `**Cantidad máxima de días de ausencia injustificada** permitidos en un mes sin perder el presentismo. Si el empleado supera este límite, no cobrará el presentismo correspondiente al período.`;

/**
 * Componente ParametrosLaboralesModal
 * 
 * Permite a los administradores ajustar límites y reglas de negocio
 * transversales, como el máximo de inasistencias para el presentismo.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onClose - Callback para cerrar el modal.
 * @returns {JSX.Element}
 */
const ParametrosLaboralesModal = ({ onClose }) => {
    const [parametros, setParametros] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formData, setFormData] = useState({ limiteAusenciaInjustificada: 1 });
    const [activeTooltip, setActiveTooltip] = useState(null);
    const [espacioTrabajoId, setEspacioTrabajoId] = useState('');

    useEffect(() => {
        const loadParametros = async () => {
            if (!espacioTrabajoId) {
                setParametros(null);
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const data = await getParametrosLaborales({ espacioTrabajoId });
                setParametros(data);
                setFormData({ limiteAusenciaInjustificada: data.limiteAusenciaInjustificada });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadParametros();
    }, [espacioTrabajoId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!espacioTrabajoId) {
            setError('Debes seleccionar un espacio de trabajo');
            return;
        }
        try {
            setSaving(true);
            setError('');
            await updateParametrosLaborales({ ...formData, espacioTrabajoId: parseInt(espacioTrabajoId) });
            setSuccess('Parámetros actualizados correctamente');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleTooltip = (name) => setActiveTooltip(prev => prev === name ? null : name);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Configuración de Parámetros Laborales</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando...</div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ padding: '2rem' }}>
                            {/* Título y subtítulo dentro del body */}
                            <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                    Parámetros del Sistema
                                </h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    Configura los parámetros que afectan el cálculo de liquidaciones
                                </p>
                            </div>

                            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
                            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                            {/* Selector de Espacio de Trabajo */}
                            <div style={{ marginBottom: '2rem' }}>
                                <EspacioTrabajoSelector
                                    value={espacioTrabajoId}
                                    onChange={(e) => {
                                        setEspacioTrabajoId(e.target.value);
                                        setError('');
                                    }}
                                    onBlur={() => { }}
                                    canChange={true}
                                    required={true}
                                />
                            </div>

                            {espacioTrabajoId && parametros && (
                                <div className="form-group">
                                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        Límite de Ausencia Injustificada *
                                        <TooltipIcon content={TOOLTIP_LIMITE_AUSENCIA} isOpen={activeTooltip === 'limite'} onToggle={() => toggleTooltip('limite')} />
                                    </label>
                                    <TooltipContent content={TOOLTIP_LIMITE_AUSENCIA} isOpen={activeTooltip === 'limite'} />
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        max="10"
                                        required
                                        value={formData.limiteAusenciaInjustificada}
                                        onChange={(e) => setFormData({ ...formData, limiteAusenciaInjustificada: parseInt(e.target.value) })}
                                    />
                                    <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                        Cantidad máxima de días permitidos sin perder presentismo (0-10 días)
                                    </small>
                                </div>
                            )}

                            {!espacioTrabajoId && (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                    <p>Selecciona un espacio de trabajo para gestionar sus parámetros laborales</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving}>
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ParametrosLaboralesModal;


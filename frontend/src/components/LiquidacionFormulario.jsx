/**
 * @fileoverview Formulario para la edición manual de conceptos de liquidación.
 * @module components/LiquidacionFormulario
 */

import { useState } from 'react';
import { updateLiquidacion } from '../services/api';
import { formatDateOnly, formatCurrency } from '../helpers/formatters';

/**
 * Componente LiquidacionFormulario
 * Permite ajustar manualmente los valores de una liquidación generada.
 * 
 * @param {Object} props - Propiedades.
 * @param {Object} props.liquidacion - La liquidación a editar.
 * @param {Function} props.onClose - Callback para cerrar el formulario.
 * @param {Function} props.onSuccess - Callback tras guardado exitoso.
 * @returns {JSX.Element}
 */
const LiquidacionFormulario = ({ liquidacion, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        basico: liquidacion?.basico || 0,
        antiguedad: liquidacion?.antiguedad || 0,
        presentismo: liquidacion?.presentismo || 0,
        horasExtras: liquidacion?.horasExtras || 0,
        vacaciones: liquidacion?.vacaciones || 0,
        sac: liquidacion?.sac || 0,
        inasistencias: liquidacion?.inasistencias || 0,
        vacacionesNoGozadas: liquidacion?.vacacionesNoGozadas || 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError('');

            // Calcular totales
            const totalBruto = parseFloat(formData.basico) + parseFloat(formData.antiguedad) +
                parseFloat(formData.presentismo) + parseFloat(formData.horasExtras) +
                parseFloat(formData.vacaciones) + parseFloat(formData.sac) - parseFloat(formData.inasistencias);

            const totalRetenciones = liquidacion?.totalRetenciones || 0;
            const neto = totalBruto - totalRetenciones + parseFloat(formData.vacacionesNoGozadas);

            await updateLiquidacion(liquidacion.id, {
                ...formData,
                totalBruto,
                neto,
            });

            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">Editar LiquidaciÃ³n</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '2rem' }}>
                        {/* TÃ­tulo y subtÃ­tulo dentro del body */}
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Editar Valores
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Modifica los conceptos remunerativos y deducciones de la liquidaciÃ³n
                            </p>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                                {error}
                            </div>
                        )}

                        {/* Campos editables y de lectura */}
                        <div className="form-grid-stacked">
                            <div className="form-group">
                                <label className="form-label">Empleado</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={`${liquidacion?.contrato?.empleado?.usuario?.apellido}, ${liquidacion?.contrato?.empleado?.usuario?.nombre}`}
                                    readOnly
                                    disabled
                                    style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">PerÃ­odo</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={`${formatDateOnly(liquidacion?.fechaInicio)} - ${formatDateOnly(liquidacion?.fechaFin)}`}
                                    readOnly
                                    disabled
                                    style={{ background: 'var(--bg-secondary)', cursor: 'not-allowed' }}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">BÃ¡sico *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    required
                                    className="form-input"
                                    value={formData.basico}
                                    onChange={(e) => setFormData({ ...formData, basico: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">AntigÃ¼edad</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.antiguedad}
                                    onChange={(e) => setFormData({ ...formData, antiguedad: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Presentismo</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.presentismo}
                                    onChange={(e) => setFormData({ ...formData, presentismo: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Horas Extras</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.horasExtras}
                                    onChange={(e) => setFormData({ ...formData, horasExtras: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Vacaciones</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.vacaciones}
                                    onChange={(e) => setFormData({ ...formData, vacaciones: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">SAC</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.sac}
                                    onChange={(e) => setFormData({ ...formData, sac: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Inasistencias Injustificadas</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.inasistencias}
                                    onChange={(e) => setFormData({ ...formData, inasistencias: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Vacaciones No Gozadas</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    className="form-input"
                                    value={formData.vacacionesNoGozadas}
                                    onChange={(e) => setFormData({ ...formData, vacacionesNoGozadas: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LiquidacionFormulario;


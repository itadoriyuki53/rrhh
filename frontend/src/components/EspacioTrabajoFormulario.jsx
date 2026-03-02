/**
 * @fileoverview Formulario para la creación y edición de espacios de trabajo.
 * @module components/EspacioTrabajoFormulario
 */

import { useState, useEffect } from 'react';
import { createEspacioTrabajo, updateEspacioTrabajo } from '../services/api';

/**
 * Componente EspacioTrabajoFormulario
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.espacio] - Objeto espacio a editar (null para creación).
 * @param {Function} props.onClose - Callback para cerrar el modal.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @returns {JSX.Element}
 */
const EspacioTrabajoFormulario = ({ espacio, onClose, onSuccess }) => {
    const isEditMode = !!espacio;
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (espacio) {
            setFormData({
                nombre: espacio.nombre || '',
                descripcion: espacio.descripcion || '',
            });
        }
    }, [espacio]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!formData.nombre.trim()) {
            setError('El nombre es requerido');
            return;
        }

        try {
            setLoading(true);
            if (isEditMode) {
                await updateEspacioTrabajo(espacio.id, formData);
            } else {
                await createEspacioTrabajo(formData);
            }
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
                    <h2 className="modal-title">
                        {isEditMode ? 'Editar Espacio de Trabajo' : 'Nuevo Espacio de Trabajo'}
                    </h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="modal-body" style={{ padding: '2rem' }}>
                        {/* Título y subtítulo dentro del body */}
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Información Básica
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                {isEditMode ? 'Modifica los datos del espacio de trabajo' : 'Completa la información para crear un nuevo espacio de trabajo'}
                            </p>
                        </div>

                        {error && (
                            <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                                {error}
                            </div>
                        )}

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    className="form-input"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    placeholder="Ej: Proyecto Alpha"
                                    maxLength={100}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    className="form-input"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    placeholder="Descripción del espacio de trabajo..."
                                    rows={4}
                                    style={{ resize: 'vertical', minHeight: '100px' }}
                                    maxLength={1000}
                                />
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '0.25rem' }}>
                                    {formData.descripcion.length}/1000
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                        <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Guardando...' : (isEditMode ? 'Actualizar' : 'Crear')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EspacioTrabajoFormulario;


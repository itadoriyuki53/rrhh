/**
 * @fileoverview Modal para la gestión de conceptos salariales (remunerativos y deducciones) por espacio de trabajo.
 * @module components/ConceptosSalarialesModal
 */

import { useState, useEffect } from 'react';
import EspacioTrabajoSelector from './EspacioTrabajoSelector';
import { getConceptosSalariales, createConceptoSalarial, updateConceptoSalarial, deleteConceptoSalarial } from '../services/api';
import ConfirmDialog from './ConfirmDialog';
import { truncateText } from '../helpers/formatters';

/**
 * Componente ConceptosSalarialesModal
 * 
 * Permite definir, editar y dar de baja conceptos de liquidación.
 * Filtra los conceptos según el espacio de trabajo seleccionado.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onClose - Callback para cerrar el modal.
 * @returns {JSX.Element}
 */
const ConceptosSalarialesModal = ({ onClose }) => {
    const [conceptos, setConceptos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ nombre: '', tipo: 'deduccion', esPorcentaje: true, valor: 0 });
    const [espacioTrabajoId, setEspacioTrabajoId] = useState('');

    // Confirm dialog state
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const loadConceptos = async () => {
        if (!espacioTrabajoId) {
            setConceptos([]);
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await getConceptosSalariales({ activo: 'true', espacioTrabajoId });
            setConceptos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConceptos();
    }, [espacioTrabajoId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!espacioTrabajoId) {
            setError('Debes seleccionar un espacio de trabajo');
            return;
        }
        try {
            const dataToSubmit = { ...formData, espacioTrabajoId: parseInt(espacioTrabajoId) };
            if (editingId) {
                await updateConceptoSalarial(editingId, dataToSubmit);
            } else {
                await createConceptoSalarial(dataToSubmit);
            }
            setFormData({ nombre: '', tipo: 'deduccion', esPorcentaje: true, valor: 0 });
            setEditingId(null);
            loadConceptos();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEdit = (concepto) => {
        setEditingId(concepto.id);
        setFormData({
            nombre: concepto.nombre,
            tipo: concepto.tipo,
            esPorcentaje: concepto.esPorcentaje,
            valor: concepto.valor,
        });
    };

    const handleDeleteClick = (concepto) => {
        setItemToDelete(concepto);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteConceptoSalarial(itemToDelete.id);
            loadConceptos();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setItemToDelete(null);
    };

    const remunerativos = conceptos.filter(c => c.tipo === 'remunerativo');
    const deducciones = conceptos.filter(c => c.tipo === 'deduccion');

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '950px' }}>
                    <div className="modal-header">
                        <h2 className="modal-title">Gestionar Conceptos Salariales</h2>
                        <button className="modal-close" onClick={onClose}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="modal-body" style={{ padding: '2rem' }}>
                        {/* TÃ­tulo y subtÃ­tulo dentro del body */}
                        <div style={{ marginBottom: '2rem', textAlign: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                                Conceptos Salariales
                            </h3>
                            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                Gestiona los conceptos remunerativos y deducciones que se aplican a las liquidaciones
                            </p>
                        </div>

                        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

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

                        {/* Formulario */}
                        {espacioTrabajoId && (
                            <>
                                <form onSubmit={handleSubmit} style={{ marginBottom: '2rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <div className="form-group">
                                            <label className="form-label">Nombre *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                placeholder="Ej: JubilaciÃ³n"
                                                required
                                                value={formData.nombre}
                                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Tipo *</label>
                                            <select
                                                className="form-input"
                                                value={formData.tipo}
                                                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                            >
                                                <option value="remunerativo">Remunerativo</option>
                                                <option value="deduccion">DeducciÃ³n</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Unidad *</label>
                                            <select
                                                className="form-input"
                                                value={formData.esPorcentaje}
                                                onChange={(e) => setFormData({ ...formData, esPorcentaje: e.target.value === 'true' })}
                                            >
                                                <option value="true">Porcentaje</option>
                                                <option value="false">Monto Fijo</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Valor *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="form-input"
                                                placeholder={formData.esPorcentaje ? '%' : '$'}
                                                required
                                                value={formData.valor}
                                                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                        <button type="submit" className="btn btn-primary">
                                            {editingId ? 'Actualizar' : 'Agregar'}
                                        </button>
                                    </div>
                                </form>

                                {/* Listados 50/50 */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                    {/* Remunerativos */}
                                    <div>
                                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Remunerativos</h4>
                                        {loading ? (
                                            <div>Cargando...</div>
                                        ) : (
                                            <table className="table" style={{ border: '1px solid var(--border-color)' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Valor</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {remunerativos.map(c => (
                                                        <tr key={c.id}>
                                                            <td title={c.nombre}>{truncateText(c.nombre, 7)}</td>
                                                            <td>{c.esPorcentaje ? `${c.valor}%` : `$${c.valor}`}</td>
                                                            <td>
                                                                <div className="table-actions">
                                                                    <button className="btn btn-warning btn-sm" onClick={() => handleEdit(c)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                        </svg>
                                                                        Editar
                                                                    </button>
                                                                    {!c.esObligatorio && (
                                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(c)}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                            </svg>
                                                                            Eliminar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {remunerativos.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay conceptos remunerativos</td></tr>}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>

                                    {/* Deducciones */}
                                    <div>
                                        <h4 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: '600' }}>Deducciones</h4>
                                        {loading ? (
                                            <div>Cargando...</div>
                                        ) : (
                                            <table className="table" style={{ border: '1px solid var(--border-color)' }}>
                                                <thead>
                                                    <tr>
                                                        <th>Nombre</th>
                                                        <th>Valor</th>
                                                        <th>Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {deducciones.map(c => (
                                                        <tr key={c.id}>
                                                            <td title={c.nombre}>{truncateText(c.nombre, 7)}</td>
                                                            <td>{c.esPorcentaje ? `${c.valor}%` : `$${c.valor}`}</td>
                                                            <td>
                                                                <div className="table-actions">
                                                                    <button className="btn btn-warning btn-sm" onClick={() => handleEdit(c)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                        </svg>
                                                                        Editar
                                                                    </button>
                                                                    {!c.esObligatorio && (
                                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(c)}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                            </svg>
                                                                            Eliminar
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {deducciones.length === 0 && <tr><td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No hay deducciones</td></tr>}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}

                        {!espacioTrabajoId && (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                <p>Selecciona un espacio de trabajo para gestionar sus conceptos salariales</p>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', padding: '1.5rem 2rem', borderTop: '1px solid var(--border-color)' }}>
                        <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Eliminar concepto salarial"
                message={itemToDelete ? `Â¿EstÃ¡s seguro de eliminar el concepto "${itemToDelete.nombre}"? Esta acciÃ³n no se puede deshacer.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Eliminar"
                variant="danger"
            />
        </>
    );
};

export default ConceptosSalarialesModal;


/**
 * @fileoverview Modal de confirmación para acciones críticas.
 * @module components/ConfirmDialog
 */

/**
 * Componente ConfirmDialog
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el diálogo está visible.
 * @param {string} props.title - Título del diálogo.
 * @param {string} props.message - Mensaje descriptivo.
 * @param {Function} props.onConfirm - Callback al confirmar.
 * @param {Function} props.onCancel - Callback al cancelar/cerrar.
 * @param {string} [props.confirmText='Confirmar'] - Texto del botón de confirmación.
 * @param {string} [props.cancelText='Cancelar'] - Texto del botón de cancelación.
 * @param {'danger'|'primary'} [props.variant='danger'] - Variación de estilo para el botón de confirmación.
 * @returns {JSX.Element|null}
 */
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="confirm-overlay" onClick={onCancel}>
            <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="confirm-icon">
                    {variant === 'danger' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
                        </svg>
                    )}
                </div>
                <h3 className="confirm-title">{title}</h3>
                <p className="confirm-message">{message}</p>
                <div className="confirm-actions">
                    <button className="btn btn-secondary" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;


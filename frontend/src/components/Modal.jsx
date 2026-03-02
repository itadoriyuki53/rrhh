/**
 * @fileoverview Contenedor modal genérico y reutilizable.
 * @module components/Modal
 */

import { useState } from 'react';

/**
 * Componente Modal
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.isOpen - Indica si el modal está abierto.
 * @param {Function} props.onClose - Callback al cerrar el modal.
 * @param {string} props.title - Título de la cabecera del modal.
 * @param {React.ReactNode} props.children - Contenido del cuerpo del modal.
 * @param {string} [props.maxWidth='500px'] - Ancho máximo del contenedor.
 * @returns {JSX.Element|null}
 */
const Modal = ({ isOpen, onClose, title, children, maxWidth = '500px' }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                style={{ maxWidth }}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                        âœ•
                    </button>
                </div>
                <div className="modal-body">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;


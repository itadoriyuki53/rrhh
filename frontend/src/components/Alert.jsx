/**
 * @fileoverview Componente de alerta temporal para notificaciones del sistema.
 * @module components/Alert
 */

import { useState, useEffect } from 'react';

/**
 * Componente Alert
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {string} props.message - El mensaje a mostrar.
 * @param {'success'|'error'|'warning'|'info'} [props.type='info'] - El tipo de alerta (estilo visual).
 * @param {Function} [props.onClose] - Callback ejecutado al cerrar la alerta.
 * @param {number} [props.duration=5000] - Tiempo en ms antes de auto-cerrarse (0 para persistente).
 * @returns {JSX.Element|null}
 */
const Alert = ({ message, type = 'info', onClose, duration = 5000 }) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    /**
     * Inicia la secuencia de cierre con animación de salida.
     * 
     * @returns {void}
     */
    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            if (onClose) onClose();
        }, 300);
    };

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠️',
        info: 'ℹ️',
    };

    if (!isVisible) return null;

    return (
        <div className={`alert alert-${type} ${isVisible ? 'alert-enter' : 'alert-exit'}`}>
            <div className="alert-icon">{icons[type]}</div>
            <div className="alert-content">
                <p className="alert-message">{message}</p>
            </div>
            <button className="alert-close" onClick={handleClose} aria-label="Cerrar">
                ✕
            </button>
        </div>
    );
};

export default Alert;


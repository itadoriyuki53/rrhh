/**
 * @fileoverview Modal de edición del perfil de usuario, permitiendo cambios de datos personales y contraseña.
 * @module components/PerfilUsuarioModal
 */

import { useState, useEffect } from 'react';
import { updateMe, updatePassword } from '../services/api';

/**
 * Componente PerfilUsuarioModal
 * 
 * Proporciona una interfaz para que el usuario autenticado actualice su nombre,
 * apellido, email y gestione el cambio de su contraseña de forma segura.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} props.user - Objeto usuario actual.
 * @param {Function} props.onClose - Callback para cerrar el modal.
 * @param {Function} [props.onSuccess] - Callback tras una actualización exitosa.
 * @returns {JSX.Element}
 */
const PerfilUsuarioModal = ({ user, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        contrasenaActual: '',
        contrasena: '',
        confirmarContrasena: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [showActual, setShowActual] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        if (user) {
            setForm(prev => ({
                ...prev,
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                email: user.email || '',
            }));
        }
    }, [user]);

    // Cerrar con Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const validate = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
        if (!form.apellido.trim()) e.apellido = 'El apellido es requerido';
        if (!form.email.trim()) e.email = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email inválido';
        // Contraseña es opcional — solo validar si el usuario la completó
        if (form.contrasena) {
            if (!form.contrasenaActual) e.contrasenaActual = 'Ingresá tu contraseña actual';
            if (form.contrasena.length < 8) e.contrasena = 'Mínimo 8 caracteres';
            else if (!/[A-Z]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos una mayúscula';
            else if (!/[0-9]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos un número';
            else if (!/[@$!%*?&#]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos un carácter especial (@$!%*?&#)';
            if (!form.confirmarContrasena) e.confirmarContrasena = 'Debes confirmar la contraseña';
            else if (form.contrasena !== form.confirmarContrasena) e.confirmarContrasena = 'Las contraseñas no coinciden';
        }
        return e;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
        setGlobalError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setLoading(true);
        setGlobalError('');
        try {
            // Siempre actualizar datos personales
            await updateMe({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                email: form.email.trim(),
            });

            // Si completó contraseña, cambiarla también
            if (form.contrasena) {
                await updatePassword({
                    contrasenaActual: form.contrasenaActual,
                    nuevaContrasena: form.contrasena,
                });
            }

            if (onSuccess) await onSuccess();
            onClose();
        } catch (err) {
            setGlobalError(err.message || 'Error al guardar los cambios');
        } finally {
            setLoading(false);
        }
    };

    const EyeIcon = ({ visible }) => visible ? (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const FieldError = ({ msg }) => msg ? (
        <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{msg}</span>
    ) : null;

    const eyeBtnStyle = {
        position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', color: 'var(--neutral-500)', cursor: 'pointer',
        padding: '0.5rem', display: 'flex', alignItems: 'center', borderRadius: 4,
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>

                    {/* Header */}
                    <div className="modal-header">
                        <h2 className="modal-title">Editar Perfil</h2>
                        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem', padding: '1.5rem' }} noValidate>

                        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Datos Personales</h2>
                            <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>Completá tus datos personales</p>
                        </div>

                        {globalError && (
                            <div style={{
                                background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                                borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem'
                            }}>
                                {globalError}
                            </div>
                        )}

                        {/* Nombre y Apellido */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Nombre *</label>
                                <input
                                    type="text"
                                    name="nombre"
                                    className={`form-input${errors.nombre ? ' input-error' : ''}`}
                                    value={form.nombre}
                                    onChange={handleChange}
                                    placeholder="Juan"
                                    autoComplete="given-name"
                                />
                                <FieldError msg={errors.nombre} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Apellido *</label>
                                <input
                                    type="text"
                                    name="apellido"
                                    className={`form-input${errors.apellido ? ' input-error' : ''}`}
                                    value={form.apellido}
                                    onChange={handleChange}
                                    placeholder="Pérez"
                                    autoComplete="family-name"
                                />
                                <FieldError msg={errors.apellido} />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="form-group">
                            <label className="form-label">Email *</label>
                            <input
                                type="email"
                                name="email"
                                className={`form-input${errors.email ? ' input-error' : ''}`}
                                value={form.email}
                                onChange={handleChange}
                                placeholder="email@ejemplo.com"
                                autoComplete="email"
                            />
                            <FieldError msg={errors.email} />
                        </div>

                        {/* Contraseña actual — siempre visible */}
                        <div className="form-group">
                            <label className="form-label">Contraseña actual <span style={{ color: 'var(--neutral-400)', fontWeight: 400 }}>(requerida solo si cambiás la contraseña)</span></label>
                            <div style={{ position: 'relative', display: 'flex' }}>
                                <input
                                    type={showActual ? 'text' : 'password'}
                                    name="contrasenaActual"
                                    className={`form-input${errors.contrasenaActual ? ' input-error' : ''}`}
                                    value={form.contrasenaActual}
                                    onChange={handleChange}
                                    placeholder="Tu contraseña actual"
                                    style={{ paddingRight: '3rem', width: '100%' }}
                                    autoComplete="current-password"
                                />
                                <button type="button" style={eyeBtnStyle} onClick={() => setShowActual(p => !p)} aria-label="Mostrar contraseña actual">
                                    <EyeIcon visible={showActual} />
                                </button>
                            </div>
                            <FieldError msg={errors.contrasenaActual} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="form-group">
                                <label className="form-label">Nueva contraseña <span style={{ color: 'var(--neutral-400)', fontWeight: 400 }}>(opcional)</span></label>
                                <div style={{ position: 'relative', display: 'flex' }}>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        name="contrasena"
                                        className={`form-input${errors.contrasena ? ' input-error' : ''}`}
                                        value={form.contrasena}
                                        onChange={handleChange}
                                        placeholder="Dejar vacío para no cambiar"
                                        style={{ paddingRight: '3rem', width: '100%' }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" style={eyeBtnStyle} onClick={() => setShowPassword(p => !p)} aria-label="Mostrar contraseña">
                                        <EyeIcon visible={showPassword} />
                                    </button>
                                </div>
                                <FieldError msg={errors.contrasena} />
                            </div>

                            <div className="form-group">
                                <label className="form-label">Confirmar contraseña</label>
                                <div style={{ position: 'relative', display: 'flex' }}>
                                    <input
                                        type={showConfirm ? 'text' : 'password'}
                                        name="confirmarContrasena"
                                        className={`form-input${errors.confirmarContrasena ? ' input-error' : ''}`}
                                        value={form.confirmarContrasena}
                                        onChange={handleChange}
                                        placeholder="Repetir contraseña"
                                        style={{ paddingRight: '3rem', width: '100%' }}
                                        autoComplete="new-password"
                                    />
                                    <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm(p => !p)} aria-label="Mostrar confirmación">
                                        <EyeIcon visible={showConfirm} />
                                    </button>
                                </div>
                                <FieldError msg={errors.confirmarContrasena} />
                            </div>
                        </div>

                        {/* Footer */}
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid var(--neutral-200)', marginTop: '0.25rem' }}>
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                                Cancelar
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ minWidth: '130px', justifyContent: 'center' }}>
                                {loading ? 'Guardando...' : 'Guardar cambios'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
};

export default PerfilUsuarioModal;


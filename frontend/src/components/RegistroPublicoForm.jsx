/**
 * @fileoverview Formulario autónomo para el registro autogestionado de nuevos usuarios administradores.
 * @module components/RegistroPublicoForm
 */

import { useState } from 'react';
import { register, login } from '../services/api';

/**
 * Componente RegistroPublicoForm
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Function} props.onSuccess - Callback ejecutado tras el registro y login exitoso.
 * @returns {JSX.Element}
 */
const RegistroPublicoForm = ({ onSuccess }) => {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        email: '',
        contrasena: '',
        confirmarContrasena: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [globalError, setGlobalError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const validate = () => {
        const e = {};
        if (!form.nombre.trim()) e.nombre = 'El nombre es requerido';
        if (!form.apellido.trim()) e.apellido = 'El apellido es requerido';
        if (!form.email.trim()) e.email = 'El email es requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invÃ¡lido';
        if (!form.contrasena) e.contrasena = 'La contraseÃ±a es requerida';
        else if (form.contrasena.length < 8) e.contrasena = 'MÃ­nimo 8 caracteres';
        else if (!/[A-Z]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos una mayÃºscula';
        else if (!/[0-9]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos un nÃºmero';
        else if (!/[@$!%*?&#]/.test(form.contrasena)) e.contrasena = 'Debe contener al menos un carÃ¡cter especial (@$!%*?&#)';
        if (!form.confirmarContrasena) e.confirmarContrasena = 'Debes confirmar la contraseÃ±a';
        else if (form.contrasena !== form.confirmarContrasena) e.confirmarContrasena = 'Las contraseÃ±as no coinciden';
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
            // 1. Registrar usuario
            await register({
                nombre: form.nombre,
                apellido: form.apellido,
                email: form.email,
                contrasena: form.contrasena,
            });
            // 2. Auto-login con las mismas credenciales
            const loginResult = await login({
                email: form.email,
                contrasena: form.contrasena,
            });
            onSuccess(loginResult);
        } catch (err) {
            setGlobalError(err.message || 'Error al registrarse');
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
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.25rem' }} noValidate>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Crear cuenta</h2>
                <p style={{ color: 'var(--neutral-500)', fontSize: '0.875rem' }}>CompletÃ¡ tus datos para registrarte</p>
            </div>

            {globalError && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                    borderRadius: '0.5rem', padding: '0.75rem 1rem', fontSize: '0.875rem'
                }}>
                    {globalError}
                </div>
            )}

            <div className="form-grid-stacked">
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
                        placeholder="PÃ©rez"
                        autoComplete="family-name"
                    />
                    <FieldError msg={errors.apellido} />
                </div>
            </div>

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

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">ContraseÃ±a *</label>
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="contrasena"
                            className={`form-input${errors.contrasena ? ' input-error' : ''}`}
                            value={form.contrasena}
                            onChange={handleChange}
                            placeholder="MÃ­nimo 8 caracteres"
                            style={{ paddingRight: '3rem', width: '100%' }}
                            autoComplete="new-password"
                        />
                        <button type="button" style={eyeBtnStyle} onClick={() => setShowPassword(p => !p)} aria-label="Mostrar contraseÃ±a">
                            <EyeIcon visible={showPassword} />
                        </button>
                    </div>
                    <FieldError msg={errors.contrasena} />
                </div>

                <div className="form-group">
                    <label className="form-label">Confirmar contraseÃ±a *</label>
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            name="confirmarContrasena"
                            className={`form-input${errors.confirmarContrasena ? ' input-error' : ''}`}
                            value={form.confirmarContrasena}
                            onChange={handleChange}
                            placeholder="Repetir contraseÃ±a"
                            style={{ paddingRight: '3rem', width: '100%' }}
                            autoComplete="new-password"
                        />
                        <button type="button" style={eyeBtnStyle} onClick={() => setShowConfirm(p => !p)} aria-label="Mostrar contraseÃ±a">
                            <EyeIcon visible={showConfirm} />
                        </button>
                    </div>
                    <FieldError msg={errors.confirmarContrasena} />
                </div>
            </div>

            <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ justifyContent: 'center', marginTop: '0.5rem' }}
            >
                {loading ? 'Registrando...' : 'Crear cuenta'}
            </button>
        </form>
    );
};

export default RegistroPublicoForm;


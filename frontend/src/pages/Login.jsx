/**
 * @fileoverview Formulario de inicio de sesión público.
 * @module pages/Login
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BackgroundCarousel from '../components/BackgroundCarousel';
import Modal from '../components/Modal';
import Alert from '../components/Alert';

/**
 * Componente Login
 * 
 * Renderiza el formulario de inicio de sesión de usuario y maneja su estado
 * de validación delegando todo payload de autenticación en AuthContext.
 * 
 * @returns {JSX.Element}
 */
const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        contrasena: '',
        recordarme: false,
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    /**
     * Maneja el cambio en los inputs del formulario y actualiza el estado `formData`.
     * Soporta inputs tipo `checkbox` y standard (`text`, `email`, `password`).
     *
     * @param {React.ChangeEvent<HTMLInputElement>} e - Evento de cambio reactivo.
     * @returns {void}
     */
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    /**
     * Intercepta el submit del formulario de login. Realiza el reseteo de validaciones
     * locales, setea variables en transcurso y consumé la API asíncrona a través del AuthContext.
     *
     * @param {React.FormEvent<HTMLFormElement>} e - Evento submit del formulario.
     * @returns {Promise<void>}
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            sessionStorage.setItem('justLoggedIn', 'true');
            await login({
                email: formData.email,
                contrasena: formData.contrasena,
                recordarme: formData.recordarme,
            });
        } catch (err) {
            setError(err.message || 'Error al iniciar sesiÃ³n');
            setLoading(false);
        }
    };

    /**
     * Detiene el flujo base y despliega el Modal instructivo 
     * indicándole al usuario los pasos para recuperación de password.
     * 
     * @returns {void}
     */
    const handleForgotPassword = () => {
        setShowForgotPasswordModal(true);
    };

    return (
        <>
            <BackgroundCarousel />


            <div className="auth-container">
                <div className="auth-card">
                    {/* Left side - Form */}
                    <div className="auth-left">
                        <div className="auth-header">
                            <img src="/logo.png" alt="CataratasRH" className="auth-logo" />
                            <h1 className="auth-title">Cataratas<span>RH</span></h1>
                            <p className="auth-subtitle">Sistema de GestiÃ³n de Recursos Humanos</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form">
                            {error && <div className="auth-error">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="tu.email@ejemplo.com"
                                    required
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contrasena">ContraseÃ±a</label>
                                <div className="password-input-wrapper">
                                    <input
                                        id="contrasena"
                                        name="contrasena"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.contrasena}
                                        onChange={handleChange}
                                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? 'Ocultar contraseÃ±a' : 'Mostrar contraseÃ±a'}
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="login-options">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        name="recordarme"
                                        checked={formData.recordarme}
                                        onChange={handleChange}
                                    />
                                    <span>Recordarme</span>
                                </label>
                                <button
                                    type="button"
                                    className="link-button"
                                    onClick={handleForgotPassword}
                                >
                                    Â¿Te olvidaste tu contraseÃ±a?
                                </button>
                            </div>

                            <button
                                type="submit"
                                className="auth-button"
                                disabled={loading}
                            >
                                {loading ? 'Iniciando sesiÃ³n...' : 'Iniciar sesiÃ³n'}
                            </button>
                        </form>

                        {/* Mobile-only: link to register (auth-right is hidden on mobile) */}
                        <div className="auth-mobile-link">
                            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>
                                Â¿Primera vez aquÃ­?
                            </p>
                            <Link to="/register" style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                padding: '0.75rem 1.5rem',
                                background: 'var(--neutral-100)',
                                color: 'var(--neutral-700)',
                                borderRadius: '0.5rem',
                                fontSize: '0.9rem',
                                fontWeight: 600,
                                textDecoration: 'none'
                            }}>
                                Crear nueva cuenta
                            </Link>
                        </div>
                    </div>

                    {/* Right side - Register prompt */}
                    <div className="auth-right">
                        <div className="auth-promo">
                            <h2>Â¿Primera vez aquÃ­?</h2>
                            <p>Registrate para gestionar tus contratos y liquidaciones</p>
                            <Link to="/register" className="register-button">
                                Crear cuenta nueva
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Modal
                isOpen={showForgotPasswordModal}
                onClose={() => setShowForgotPasswordModal(false)}
                title="Â¿Olvidaste tu contraseÃ±a?"
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '1rem',
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        borderLeft: '4px solid #3b82f6'
                    }}>
                        <div style={{
                            flexShrink: 0,
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '50%',
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            fontWeight: 'bold',
                            fontSize: '1rem'
                        }}>
                            â„¹
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--neutral-800)', fontSize: '0.875rem', lineHeight: '1.6' }}>
                                Para restablecer tu contraseÃ±a, comunicate con el departamento de <strong>Recursos Humanos</strong> de tu empresa.
                            </p>
                            {formData.email && (
                                <p style={{
                                    padding: '0.75rem',
                                    background: 'var(--neutral-50)',
                                    borderRadius: '6px',
                                    fontSize: '0.813rem',
                                    color: 'var(--neutral-600)',
                                    margin: '0.75rem 0 0 0'
                                }}>
                                    Tu email registrado: <strong style={{ color: 'var(--neutral-800)' }}>{formData.email}</strong>
                                </p>
                            )}
                        </div>
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--neutral-500)', margin: 0 }}>
                        Ellos podrÃ¡n ayudarte a recuperar el acceso a tu cuenta de forma segura.
                    </p>
                    <div className="modal-actions">
                        <button
                            className="modal-button modal-button-primary"
                            onClick={() => setShowForgotPasswordModal(false)}
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
};

export default Login;


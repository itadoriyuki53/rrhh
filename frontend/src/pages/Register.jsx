/**
 * @fileoverview Punto de registro autónomo para nuevos administradores o empresas.
 * @module pages/Register
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RegistroPublicoForm from '../components/RegistroPublicoForm';
import BackgroundCarousel from '../components/BackgroundCarousel';
import Alert from '../components/Alert';

/**
 * Componente Register
 * 
 * Punto de entrada para el registro público de nuevos espacios de trabajo / empresas.
 * Envuelve el componente RegistroPublicoForm adaptándose a la estructura del Landing.
 * 
 * @returns {JSX.Element}
 */
const Register = () => {
    const navigate = useNavigate();
    const { checkAuth } = useAuth();
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    /**
     * Intercepta la conclusión exitosa del form. Fija banderas de sesión
     * y fuerza la reconexión de contexto en AuthProvider mediante checkAuth.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const handleSuccess = async () => {
        sessionStorage.setItem('justLoggedIn', 'true');
        await checkAuth();
    };

    return (
        <>
            <BackgroundCarousel />

            <div className="auth-container">
                <div className="auth-card register-card">
                    {/* Left side - Branding (30%) */}
                    <div className="auth-right register-left-side">
                        <div className="auth-promo">
                            <img src="/logo.png" alt="CataratasRH" className="register-sidebar-logo" />
                            <h2>Cataratas<span>RH</span></h2>
                            <p>Registrate en el sistema</p>
                            <Link to="/login" className="register-back-link">
                                ← Iniciar sesión
                            </Link>
                        </div>
                    </div>

                    {/* Right side - Form (70%) */}
                    <div className="auth-left register-right-side">
                        <RegistroPublicoForm onSuccess={handleSuccess} />

                        {/* Mobile-only: link back to login (left sidebar is hidden on mobile) */}
                        <div className="auth-mobile-link">
                            <p style={{ fontSize: '0.875rem', color: 'var(--neutral-500)', marginBottom: '0.5rem' }}>
                                ¿Ya tenés cuenta?
                            </p>
                            <Link to="/login" style={{
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
                                ← Volver al Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Register;


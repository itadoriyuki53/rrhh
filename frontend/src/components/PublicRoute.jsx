/**
 * @fileoverview Componente que redirige a usuarios ya autenticados lejos de rutas públicas (login/register).
 * @module components/PublicRoute
 */

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente PublicRoute
 * Redirige a /dashboard si el usuario ya inició sesión.
 * Utilizado para prevenir re-login accidental.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes de la ruta pública.
 * @returns {JSX.Element}
 */
const PublicRoute = ({ children }) => {
    const navigate = useNavigate();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated, loading, navigate]);

    // Mostrar loader mientras verifica autenticación
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)'
            }}>
                <div style={{
                    background: 'white',
                    padding: '2rem 3rem',
                    borderRadius: '12px',
                    textAlign: 'center',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
                }}>
                    <p style={{ margin: 0, color: 'var(--text-primary)' }}>Verificando sesión...</p>
                </div>
            </div>
        );
    }

    // Si no está autenticado, mostrar el contenido (login/register)
    return children;
};

export default PublicRoute;


/**
 * @fileoverview Componente para proteger rutas privadas que requieren autenticación.
 * @module components/ProtectedRoute
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente ProtectedRoute
 * Renderiza el Outlet (rutas anidadas) si el usuario está autenticado, 
 * de lo contrario redirige al /login.
 * 
 * @returns {JSX.Element}
 */
const ProtectedRoute = () => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '1.2rem',
                color: 'var(--text-secondary)'
            }}>
                Cargando...
            </div>
        );
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;


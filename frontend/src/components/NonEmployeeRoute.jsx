/**
 * @fileoverview Protector de ruta que restringe el acceso a usuarios que no son empleados (solo admins).
 * @module components/NonEmployeeRoute
 */

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Componente NonEmployeeRoute
 * Redirige a /dashboard si el usuario está identificado como empleado pero no es administrador.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {React.ReactNode} props.children - Componentes protegidos.
 * @returns {JSX.Element}
 */
const NonEmployeeRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                fontSize: '1.2rem',
                color: 'var(--text-secondary)'
            }}>
                Verificando permisos...
            </div>
        );
    }

    // Si el usuario es empleado, no tiene permiso para ver esta ruta
    if (user && user.esEmpleado) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
};

export default NonEmployeeRoute;


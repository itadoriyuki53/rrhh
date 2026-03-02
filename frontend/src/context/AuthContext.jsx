/**
 * @fileoverview Contexto de autenticaciÃ³n global de la aplicaciÃ³n.
 * Provee el estado de sesiÃ³n y las acciones de login/logout/registro a todos los componentes.
 * @module context/AuthContext
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import {
    getCurrentUser,
    login as loginAPI,
    logout as logoutAPI,
    register as registerAPI,
    updateSelectedContract as updateSelectedContractAPI,
} from '../services/authService';

/** Contexto de autenticaciÃ³n. No usar directamente: usar el hook `useAuth`. */
const AuthContext = createContext();

/**
 * Hook para acceder al contexto de autenticaciÃ³n desde cualquier componente.
 * Debe usarse dentro del Ã¡rbol envuelto por `AuthProvider`.
 *
 * @returns {{ user: Object|null, loading: boolean, isAuthenticated: boolean, login: Function, logout: Function, register: Function, checkAuth: Function, seleccionarContrato: Function }}
 * @throws {Error} Si se llama fuera de un `AuthProvider`.
 */
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe usarse dentro de un AuthProvider');
    }
    return context;
};

/**
 * Proveedor del contexto de autenticaciÃ³n.
 * Verifica la sesiÃ³n activa al montar el componente y expone todas las acciones de auth.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const { resetTheme } = useTheme();

    useEffect(() => {
        checkAuth(true);
    }, []);

    /**
     * Verifica el estado de la sesiÃ³n consultando el endpoint /auth/me.
     * Actualiza el estado de usuario e isAuthenticated.
     *
     * @param {boolean} [showLoading=false] - Si es true, activa el spinner de carga mientras verifica.
     */
    const checkAuth = async (showLoading = false) => {
        try {
            if (showLoading) setLoading(true);
            const userData = await getCurrentUser();
            if (userData) {
                setUser(userData);
                setIsAuthenticated(true);
            } else {
                setUser(null);
                setIsAuthenticated(false);
            }
        } catch (error) {
            console.error('Error al verificar autenticaciÃ³n:', error);
            setUser(null);
            setIsAuthenticated(false);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    /**
     * Inicia sesiÃ³n con las credenciales provistas y actualiza el estado global.
     *
     * @param {{ email: string, contrasena: string }} credentials
     * @returns {Promise<Object>} Respuesta del servidor con datos del usuario.
     * @throws {Error} Si las credenciales son incorrectas.
     */
    const login = async (credentials) => {
        const response = await loginAPI(credentials);
        setUser(response.usuario);
        setIsAuthenticated(true);
        return response;
    };

    /**
     * Cierra la sesiÃ³n del usuario. Si el servidor falla, limpia el estado local igualmente.
     *
     * @returns {Promise<void>}
     */
    const logout = async () => {
        try {
            await logoutAPI();
        } catch (error) {
            console.error('Error al cerrar sesiÃ³n en el servidor:', error);
        } finally {
            setUser(null);
            setIsAuthenticated(false);
            resetTheme();
        }
    };

    /**
     * Registra un nuevo empleado y lo deja autenticado.
     *
     * @param {Object} empleadoData - Datos del empleado a registrar.
     * @returns {Promise<Object>} Respuesta del servidor.
     * @throws {Error} Si el registro falla.
     */
    const register = async (empleadoData) => {
        const response = await registerAPI(empleadoData);
        setUser(response.usuario);
        setIsAuthenticated(true);
        return response;
    };

    /**
     * Actualiza el contrato laboral actualmente seleccionado por el usuario.
     * Actualiza el estado local sin recargar todos los datos del usuario.
     *
     * @param {number} contratoId - ID del contrato.
     * @returns {Promise<true>} `true` si la operaciÃ³n fue exitosa.
     * @throws {Error} Si el servidor rechaza el cambio.
     */
    const seleccionarContrato = async (contratoId) => {
        await updateSelectedContractAPI(contratoId);
        setUser(prev => ({ ...prev, ultimoContratoSeleccionadoId: contratoId }));
        return true;
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        register,
        checkAuth,
        seleccionarContrato,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


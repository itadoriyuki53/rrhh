/**
 * @fileoverview Servicio de autenticación y gestión de sesión.
 * Centraliza todas las operaciones relacionadas con login, logout, registro y perfil.
 * @module services/authService
 */

import { httpClient, API_URL } from './httpClient';

/**
 * Inicia sesión con las credenciales del usuario.
 *
 * @param {{ email: string, contrasena: string }} credentials - Credenciales de acceso.
 * @returns {Promise<{ usuario: Object }>} Datos del usuario autenticado.
 * @throws {Error} Si las credenciales son incorrectas o hay un error de servidor.
 */
export const login = async (credentials) => {
    const response = await httpClient(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al iniciar sesión');
    return result;
};

/**
 * Cierra la sesión del usuario actual en el servidor.
 *
 * @returns {Promise<Object>} Respuesta de confirmación del servidor.
 * @throws {Error} Si ocurre un error al cerrar sesión.
 */
export const logout = async () => {
    const response = await httpClient(`${API_URL}/auth/logout`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al cerrar sesión');
    return result;
};

/**
 * Registra un nuevo empleado/usuario en el sistema.
 *
 * @param {Object} empleadoData - Datos del nuevo empleado.
 * @returns {Promise<{ usuario: Object }>} Datos del usuario registrado.
 * @throws {Error} Si los datos son inválidos o el email ya existe.
 */
export const register = async (empleadoData) => {
    const response = await httpClient(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(empleadoData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al registrarse');
    return result;
};

/**
 * Obtiene los datos del usuario actualmente autenticado.
 *
 * @returns {Promise<Object|null>} Datos del usuario o `null` si no hay sesión activa.
 * @throws {Error} Si ocurre un error distinto a "no autenticado".
 */
export const getCurrentUser = async () => {
    const response = await httpClient(`${API_URL}/auth/me`);
    if (response.status === 401) return null;
    if (!response.ok) throw new Error('Error al obtener usuario actual');
    return response.json();
};

/**
 * Actualiza la contraseña del usuario autenticado.
 *
 * @param {{ contrasenaActual: string, nuevaContrasena: string }} passwordData - Datos de cambio de contraseña.
 * @returns {Promise<Object>} Respuesta de confirmación.
 * @throws {Error} Si la contraseña actual es incorrecta.
 */
export const updatePassword = async (passwordData) => {
    const response = await httpClient(`${API_URL}/auth/password`, {
        method: 'PUT',
        body: JSON.stringify(passwordData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contraseña');
    return result;
};

/**
 * Actualiza los datos del perfil del usuario autenticado (nombre, apellido, etc.).
 *
 * @param {Object} data - Campos del perfil a actualizar.
 * @returns {Promise<Object>} Perfil actualizado.
 * @throws {Error} Si los datos son inválidos.
 */
export const updateMe = async (data) => {
    const response = await httpClient(`${API_URL}/auth/me`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar perfil');
    return result;
};

/**
 * Actualiza el contrato laboral actualmente seleccionado por el empleado.
 *
 * @param {number} contratoId - ID del contrato a seleccionar.
 * @returns {Promise<Object>} Respuesta de confirmación.
 * @throws {Error} Si el contrato no existe o no pertenece al usuario.
 */
export const updateSelectedContract = async (contratoId) => {
    const response = await httpClient(`${API_URL}/auth/selected-contract`, {
        method: 'PUT',
        body: JSON.stringify({ contratoId }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contrato seleccionado');
    return result;
};


/**
 * @fileoverview Servicios para el mÃ³dulo de Roles, Permisos y Espacios de Trabajo.
 * @module services/rolService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== ROLES =====

/**
 * Obtiene la lista de roles del espacio de trabajo activo.
 *
 * @param {Object} [filters={}] - (search, activo, etc.)
 * @returns {Promise<Object>}
 */
export const getRoles = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/roles${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener roles');
    return response.json();
};

/**
 * Obtiene un rol por su ID con sus permisos asociados.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getRolById = async (id) => {
    const response = await httpClient(`${API_URL}/roles/${id}`);
    if (!response.ok) throw new Error('Error al obtener rol');
    return response.json();
};

/**
 * Crea un nuevo rol con los permisos especificados.
 *
 * @param {{ nombre: string, descripcion?: string, permisos: number[] }} rol
 * @returns {Promise<Object>}
 */
export const createRol = async (rol) => {
    const response = await httpClient(`${API_URL}/roles`, {
        method: 'POST',
        body: JSON.stringify(rol),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear rol');
    return result;
};

/**
 * Actualiza un rol existente y su lista de permisos.
 *
 * @param {number} id
 * @param {Object} rol
 * @returns {Promise<Object>}
 */
export const updateRol = async (id, rol) => {
    const response = await httpClient(`${API_URL}/roles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rol),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar rol');
    return result;
};

/**
 * Elimina lÃ³gicamente un rol.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteRol = async (id) => {
    const response = await httpClient(`${API_URL}/roles/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar rol');
    return result;
};

/**
 * Reactiva un rol dado de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateRol = async (id) => {
    const response = await httpClient(`${API_URL}/roles/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar rol');
    return result;
};

/**
 * Elimina mÃºltiples roles.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteRolesBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/roles/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar roles');
    return result;
};

// ===== PERMISOS =====

/**
 * Obtiene todos los permisos del sistema.
 *
 * @returns {Promise<Object[]>}
 */
export const getPermisos = async () => {
    const response = await httpClient(`${API_URL}/permisos`);
    if (!response.ok) throw new Error('Error al obtener permisos');
    return response.json();
};

/**
 * Obtiene los permisos agrupados por mÃ³dulo para renderizar checkboxes en el wizard de roles.
 *
 * @returns {Promise<Object.<string, Object[]>>} Objeto con mÃ³dulos como claves y arrays de permisos como valores.
 */
export const getPermisosGrouped = async () => {
    const response = await httpClient(`${API_URL}/permisos/grouped`);
    if (!response.ok) throw new Error('Error al obtener permisos agrupados');
    return response.json();
};

/**
 * Inicializa los permisos del sistema con los valores por defecto del seed.
 *
 * @returns {Promise<Object>} Resultado de la inicializaciÃ³n.
 */
export const initializePermisos = async () => {
    const response = await httpClient(`${API_URL}/permisos/initialize`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al inicializar permisos');
    return result;
};

// ===== ESPACIOS DE TRABAJO =====

/**
 * Obtiene la lista de espacios de trabajo del usuario autenticado.
 *
 * @param {Object} [filters={}]
 * @returns {Promise<Object>}
 */
export const getEspaciosTrabajo = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener espacios de trabajo');
    return response.json();
};

/**
 * Obtiene un espacio de trabajo por su ID.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getEspacioTrabajoById = async (id) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo/${id}`);
    if (!response.ok) throw new Error('Error al obtener espacio de trabajo');
    return response.json();
};

/**
 * Crea un nuevo espacio de trabajo.
 *
 * @param {{ nombre: string, descripcion?: string }} espacioData
 * @returns {Promise<Object>}
 */
export const createEspacioTrabajo = async (espacioData) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo`, {
        method: 'POST',
        body: JSON.stringify(espacioData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear espacio de trabajo');
    return result;
};

/**
 * Actualiza un espacio de trabajo existente.
 *
 * @param {number} id
 * @param {Object} espacioData
 * @returns {Promise<Object>}
 */
export const updateEspacioTrabajo = async (id, espacioData) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo/${id}`, {
        method: 'PUT',
        body: JSON.stringify(espacioData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar espacio de trabajo');
    return result;
};

/**
 * Elimina un espacio de trabajo.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteEspacioTrabajo = async (id) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar espacio de trabajo');
    return result;
};

/**
 * Reactiva un espacio de trabajo dado de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateEspacioTrabajo = async (id) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar espacio de trabajo');
    return result;
};

/**
 * Elimina mÃºltiples espacios de trabajo.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteEspaciosTrabajosBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/espacios-trabajo/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar espacios de trabajo');
    return result;
};

/**
 * Verifica si un empleado puede cambiar de espacio de trabajo (sin contratos activos en otro espacio).
 *
 * @param {number} empleadoId
 * @returns {Promise<{ canChange: boolean, reason?: string }>}
 */
export const canChangeEmpleadoWorkspace = async (empleadoId) => {
    const response = await httpClient(
        `${API_URL}/espacios-trabajo/validation/empleado/${empleadoId}/can-change`
    );
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

/**
 * Verifica si una empresa puede cambiar de espacio de trabajo.
 *
 * @param {number} empresaId
 * @returns {Promise<{ canChange: boolean, reason?: string }>}
 */
export const canChangeEmpresaWorkspace = async (empresaId) => {
    const response = await httpClient(
        `${API_URL}/espacios-trabajo/validation/empresa/${empresaId}/can-change`
    );
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

/**
 * Verifica si un rol puede cambiar de espacio de trabajo.
 *
 * @param {number} rolId
 * @returns {Promise<{ canChange: boolean, reason?: string }>}
 */
export const canChangeRolWorkspace = async (rolId) => {
    const response = await httpClient(
        `${API_URL}/espacios-trabajo/validation/rol/${rolId}/can-change`
    );
    if (!response.ok) throw new Error('Error al verificar cambio de espacio de trabajo');
    return response.json();
};

// ===== USUARIOS =====

/**
 * Obtiene la lista de usuarios propietarios de espacios de trabajo.
 * Requiere permisos de administrador.
 *
 * @param {Object} [filters={}]
 * @returns {Promise<Object[]>}
 */
export const getUsuarios = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/usuarios${buildQueryString(filters)}`);
    if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Error al obtener usuarios');
    }
    return response.json();
};


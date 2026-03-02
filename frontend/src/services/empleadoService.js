/**
 * @fileoverview Servicios CRUD para el módulo de Empleados.
 * Incluye operaciones individuales y masivas (bulk).
 * @module services/empleadoService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

/**
 * Obtiene la lista paginada de empleados según filtros opcionales.
 *
 * @param {Object} [filters={}] - Filtros de búsqueda (search, activo, page, limit, etc.).
 * @returns {Promise<{ data: Object[], total: number, page: number }>} Lista de empleados.
 */
export const getEmpleados = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/empleados${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener empleados');
    return response.json();
};

/**
 * Obtiene un empleado por su ID con todas sus relaciones.
 *
 * @param {number} id - ID del empleado.
 * @returns {Promise<Object>} Datos completos del empleado.
 */
export const getEmpleadoById = async (id) => {
    const response = await httpClient(`${API_URL}/empleados/${id}`);
    if (!response.ok) throw new Error('Error al obtener empleado');
    return response.json();
};

/**
 * Crea un nuevo empleado en el espacio de trabajo activo.
 *
 * @param {Object} data - Datos del nuevo empleado.
 * @returns {Promise<Object>} Empleado creado.
 * @throws {Error} Si los datos no pasan la validación del servidor.
 */
export const createEmpleado = async (data) => {
    const response = await httpClient(`${API_URL}/empleados`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear empleado');
    return result;
};

/**
 * Actualiza los datos de un empleado existente.
 *
 * @param {number} id - ID del empleado a actualizar.
 * @param {Object} data - Campos a modificar.
 * @returns {Promise<Object>} Empleado actualizado.
 */
export const updateEmpleado = async (id, data) => {
    const response = await httpClient(`${API_URL}/empleados/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar empleado');
    return result;
};

/**
 * Realiza una baja lógica (soft delete) de un empleado.
 *
 * @param {number} id - ID del empleado a desactivar.
 * @returns {Promise<Object>} Confirmación de la operación.
 */
export const deleteEmpleado = async (id) => {
    const response = await httpClient(`${API_URL}/empleados/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empleado');
    return result;
};

/**
 * Reactiva un empleado dado de baja lógicamente.
 *
 * @param {number} id - ID del empleado a reactivar.
 * @returns {Promise<Object>} Confirmación de la operación.
 */
export const reactivateEmpleado = async (id) => {
    const response = await httpClient(`${API_URL}/empleados/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar empleado');
    return result;
};

/**
 * Elimina múltiples empleados en una sola operación (bulk delete).
 *
 * @param {number[]} ids - Array de IDs de los empleados a eliminar.
 * @returns {Promise<Object>} Resultado con cantidad de registros afectados.
 */
export const deleteEmpleadosBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/empleados/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empleados');
    return result;
};


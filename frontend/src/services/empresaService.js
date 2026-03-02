/**
 * @fileoverview Servicios CRUD para el módulo de Empresas y su estructura organizacional.
 * Incluye operaciones sobre Empresas, Áreas, Departamentos y Puestos.
 * @module services/empresaService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== EMPRESAS =====

/**
 * Obtiene la lista paginada de empresas. Por defecto, page=1 y limit=10.
 *
 * @param {Object} [filters={}] - Filtros de búsqueda (search, activo, page, limit, etc.).
 * @returns {Promise<{ data: Object[], total: number }>} Lista de empresas.
 */
export const getEmpresas = async (filters = {}) => {
    const normalizedFilters = {
        page: 1,
        limit: 10,
        ...filters,
    };
    const response = await httpClient(`${API_URL}/empresas${buildQueryString(normalizedFilters)}`);
    if (!response.ok) throw new Error('Error al obtener empresas');
    return response.json();
};

/**
 * Obtiene una empresa por su ID con áreas, departamentos y puestos.
 *
 * @param {number} id - ID de la empresa.
 * @returns {Promise<Object>} Datos completos de la empresa con su estructura.
 */
export const getEmpresaById = async (id) => {
    const response = await httpClient(`${API_URL}/empresas/${id}`);
    if (!response.ok) throw new Error('Error al obtener empresa');
    return response.json();
};

/**
 * Crea una nueva empresa en el espacio de trabajo activo.
 *
 * @param {Object} data - Datos de la empresa a crear.
 * @returns {Promise<Object>} Empresa creada.
 */
export const createEmpresa = async (data) => {
    const response = await httpClient(`${API_URL}/empresas`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear empresa');
    return result;
};

/**
 * Actualiza los datos de una empresa existente.
 *
 * @param {number} id - ID de la empresa.
 * @param {Object} data - Campos a modificar.
 * @returns {Promise<Object>} Empresa actualizada.
 */
export const updateEmpresa = async (id, data) => {
    const response = await httpClient(`${API_URL}/empresas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar empresa');
    return result;
};

/**
 * Realiza una baja lógica de una empresa.
 *
 * @param {number} id - ID de la empresa a desactivar.
 * @returns {Promise<Object>} Confirmación.
 */
export const deleteEmpresa = async (id) => {
    const response = await httpClient(`${API_URL}/empresas/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empresa');
    return result;
};

/**
 * Reactiva una empresa dada de baja lógicamente.
 *
 * @param {number} id - ID de la empresa a reactivar.
 * @returns {Promise<Object>} Confirmación.
 */
export const reactivateEmpresa = async (id) => {
    const response = await httpClient(`${API_URL}/empresas/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar empresa');
    return result;
};

/**
 * Elimina múltiples empresas en una sola operación.
 *
 * @param {number[]} ids - IDs de las empresas a eliminar.
 * @returns {Promise<Object>} Resultado de la operación bulk.
 */
export const deleteEmpresasBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/empresas/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empresas');
    return result;
};

/**
 * Verifica si un ítem de la estructura organizacional (área, departamento o puesto)
 * puede ser eliminado sin violar contratos activos.
 *
 * @param {'area'|'departamento'|'puesto'} type - Tipo de ítem a verificar.
 * @param {number} id - ID del ítem.
 * @returns {Promise<{ canDelete: boolean, reason?: string }>} Resultado de la validación.
 */
export const checkCanDeleteEmpresaItem = async (type, id) => {
    const response = await httpClient(`${API_URL}/empresas/check-can-delete/${type}/${id}`);
    if (!response.ok) throw new Error('Error al verificar eliminación');
    return response.json();
};


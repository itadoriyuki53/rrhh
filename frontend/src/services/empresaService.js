/**
 * @fileoverview Servicios CRUD para el mÃ³dulo de Empresas y su estructura organizacional.
 * Incluye operaciones sobre Empresas, Ãreas, Departamentos y Puestos.
 * @module services/empresaService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== EMPRESAS =====

/**
 * Obtiene la lista paginada de empresas. Por defecto, page=1 y limit=10.
 *
 * @param {Object} [filters={}] - Filtros de bÃºsqueda (search, activo, page, limit, etc.).
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
 * Obtiene una empresa por su ID con Ã¡reas, departamentos y puestos.
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
 * Realiza una baja lÃ³gica de una empresa.
 *
 * @param {number} id - ID de la empresa a desactivar.
 * @returns {Promise<Object>} ConfirmaciÃ³n.
 */
export const deleteEmpresa = async (id) => {
    const response = await httpClient(`${API_URL}/empresas/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar empresa');
    return result;
};

/**
 * Reactiva una empresa dada de baja lÃ³gicamente.
 *
 * @param {number} id - ID de la empresa a reactivar.
 * @returns {Promise<Object>} ConfirmaciÃ³n.
 */
export const reactivateEmpresa = async (id) => {
    const response = await httpClient(`${API_URL}/empresas/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar empresa');
    return result;
};

/**
 * Elimina mÃºltiples empresas en una sola operaciÃ³n.
 *
 * @param {number[]} ids - IDs de las empresas a eliminar.
 * @returns {Promise<Object>} Resultado de la operaciÃ³n bulk.
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
 * Verifica si un Ã­tem de la estructura organizacional (Ã¡rea, departamento o puesto)
 * puede ser eliminado sin violar contratos activos.
 *
 * @param {'area'|'departamento'|'puesto'} type - Tipo de Ã­tem a verificar.
 * @param {number} id - ID del Ã­tem.
 * @returns {Promise<{ canDelete: boolean, reason?: string }>} Resultado de la validaciÃ³n.
 */
export const checkCanDeleteEmpresaItem = async (type, id) => {
    const response = await httpClient(`${API_URL}/empresas/check-can-delete/${type}/${id}`);
    if (!response.ok) throw new Error('Error al verificar eliminaciÃ³n');
    return response.json();
};


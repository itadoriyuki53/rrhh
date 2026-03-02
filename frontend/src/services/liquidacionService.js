/**
 * @fileoverview Servicios para el módulo de Liquidaciones y Conceptos Salariales.
 * @module services/liquidacionService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== LIQUIDACIONES =====

/**
 * Obtiene la lista de liquidaciones según filtros.
 *
 * @param {Object} [filters={}] - (contratoId, periodo, estaPagada, etc.)
 * @returns {Promise<Object>} Lista paginada de liquidaciones.
 */
export const getLiquidaciones = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/liquidaciones${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener liquidaciones');
    return response.json();
};

/**
 * Ejecuta el proceso de liquidación masiva de sueldos del período actual.
 *
 * @returns {Promise<Object>} Resultado del proceso (cantidad liquidaciones generadas, errores, etc.).
 */
export const ejecutarLiquidacion = async () => {
    const response = await httpClient(`${API_URL}/liquidaciones`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al ejecutar liquidación');
    return result;
};

/**
 * Obtiene una liquidación por su ID con todo el detalle de conceptos.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getLiquidacionById = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}`);
    if (!response.ok) throw new Error('Error al obtener liquidación');
    return response.json();
};

/**
 * Actualiza los datos de una liquidación (ej: marcar como pagada).
 *
 * @param {number} id
 * @param {Object} data - Campos a modificar.
 * @returns {Promise<Object>}
 */
export const updateLiquidacion = async (id, data) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar liquidación');
    return result;
};

/**
 * Marca una liquidación como pagada o pendiente de pago.
 *
 * @param {number} id - ID de la liquidación.
 * @param {boolean} estaPagada - `true` para marcar como pagada, `false` para revertir.
 * @returns {Promise<Object>} Liquidación actualizada.
 */
export const marcarLiquidacionComoPagada = async (id, estaPagada) => {
    return updateLiquidacion(id, { estaPagada });
};

/**
 * Elimina lógicamente una liquidación.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteLiquidacion = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar liquidación');
    return result;
};

/**
 * Reactiva una liquidación dada de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateLiquidacion = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar liquidación');
    return result;
};

/**
 * Elimina múltiples liquidaciones.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteLiquidacionesBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/liquidaciones/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar liquidaciones');
    return result;
};

// ===== CONCEPTOS SALARIALES =====

/**
 * Obtiene la lista de conceptos salariales del espacio de trabajo.
 *
 * @param {Object} [filters={}] - (tipo, esObligatorio, etc.)
 * @returns {Promise<Object>}
 */
export const getConceptosSalariales = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/conceptos-salariales${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener conceptos salariales');
    return response.json();
};

/**
 * Obtiene un concepto salarial por su ID.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getConceptoSalarialById = async (id) => {
    const response = await httpClient(`${API_URL}/conceptos-salariales/${id}`);
    if (!response.ok) throw new Error('Error al obtener concepto salarial');
    return response.json();
};

/**
 * Crea un nuevo concepto salarial (remunerativo o deducción).
 *
 * @param {Object} concepto - Datos del concepto.
 * @returns {Promise<Object>}
 */
export const createConceptoSalarial = async (concepto) => {
    const response = await httpClient(`${API_URL}/conceptos-salariales`, {
        method: 'POST',
        body: JSON.stringify(concepto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear concepto salarial');
    return result;
};

/**
 * Actualiza un concepto salarial existente.
 *
 * @param {number} id
 * @param {Object} concepto
 * @returns {Promise<Object>}
 */
export const updateConceptoSalarial = async (id, concepto) => {
    const response = await httpClient(`${API_URL}/conceptos-salariales/${id}`, {
        method: 'PUT',
        body: JSON.stringify(concepto),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar concepto salarial');
    return result;
};

/**
 * Elimina un concepto salarial.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteConceptoSalarial = async (id) => {
    const response = await httpClient(`${API_URL}/conceptos-salariales/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar concepto salarial');
    return result;
};

// ===== PARÁMETROS LABORALES =====

/**
 * Obtiene los parámetros laborales del espacio de trabajo activo.
 *
 * @param {Object} [filters={}] - Filtros opcionales.
 * @returns {Promise<Object[]>} Lista de parámetros.
 */
export const getParametrosLaborales = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/parametros-laborales${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener parámetros laborales');
    return response.json();
};

/**
 * Actualiza los parámetros laborales del espacio de trabajo activo.
 *
 * @param {Object[]} parametrosData - Array de objetos { tipo, valor }.
 * @returns {Promise<Object>}
 */
export const updateParametrosLaborales = async (parametrosData) => {
    const response = await httpClient(`${API_URL}/parametros-laborales`, {
        method: 'PUT',
        body: JSON.stringify(parametrosData),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar parámetros laborales');
    return result;
};


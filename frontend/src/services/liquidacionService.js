/**
 * @fileoverview Servicios para el mÃ³dulo de Liquidaciones y Conceptos Salariales.
 * @module services/liquidacionService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== LIQUIDACIONES =====

/**
 * Obtiene la lista de liquidaciones segÃºn filtros.
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
 * Ejecuta el proceso de liquidaciÃ³n masiva de sueldos del perÃ­odo actual.
 *
 * @returns {Promise<Object>} Resultado del proceso (cantidad liquidaciones generadas, errores, etc.).
 */
export const ejecutarLiquidacion = async () => {
    const response = await httpClient(`${API_URL}/liquidaciones`, { method: 'POST' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al ejecutar liquidaciÃ³n');
    return result;
};

/**
 * Obtiene una liquidaciÃ³n por su ID con todo el detalle de conceptos.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getLiquidacionById = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}`);
    if (!response.ok) throw new Error('Error al obtener liquidaciÃ³n');
    return response.json();
};

/**
 * Actualiza los datos de una liquidaciÃ³n (ej: marcar como pagada).
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
    if (!response.ok) throw new Error(result.error || 'Error al actualizar liquidaciÃ³n');
    return result;
};

/**
 * Marca una liquidaciÃ³n como pagada o pendiente de pago.
 *
 * @param {number} id - ID de la liquidaciÃ³n.
 * @param {boolean} estaPagada - `true` para marcar como pagada, `false` para revertir.
 * @returns {Promise<Object>} LiquidaciÃ³n actualizada.
 */
export const marcarLiquidacionComoPagada = async (id, estaPagada) => {
    return updateLiquidacion(id, { estaPagada });
};

/**
 * Elimina lÃ³gicamente una liquidaciÃ³n.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteLiquidacion = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar liquidaciÃ³n');
    return result;
};

/**
 * Reactiva una liquidaciÃ³n dada de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateLiquidacion = async (id) => {
    const response = await httpClient(`${API_URL}/liquidaciones/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar liquidaciÃ³n');
    return result;
};

/**
 * Elimina mÃºltiples liquidaciones.
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
 * Crea un nuevo concepto salarial (remunerativo o deducciÃ³n).
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

// ===== PARÃMETROS LABORALES =====

/**
 * Obtiene los parÃ¡metros laborales del espacio de trabajo activo.
 *
 * @param {Object} [filters={}] - Filtros opcionales.
 * @returns {Promise<Object[]>} Lista de parÃ¡metros.
 */
export const getParametrosLaborales = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/parametros-laborales${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener parÃ¡metros laborales');
    return response.json();
};

/**
 * Actualiza los parÃ¡metros laborales del espacio de trabajo activo.
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
    if (!response.ok) throw new Error(result.error || 'Error al actualizar parÃ¡metros laborales');
    return result;
};


/**
 * @fileoverview Servicios CRUD para el módulo de Contratos laborales.
 * @module services/contratoService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

/**
 * Obtiene la lista de contratos según filtros.
 *
 * @param {Object} [filters={}] - Filtros (empleadoId, estado, page, limit, etc.).
 * @returns {Promise<Object>} Lista de contratos paginada.
 */
export const getContratos = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/contratos${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener contratos');
    return response.json();
};

/**
 * Obtiene un contrato por su ID con todas sus relaciones.
 *
 * @param {number} id - ID del contrato.
 * @returns {Promise<Object>} Datos completos del contrato.
 */
export const getContratoById = async (id) => {
    const response = await httpClient(`${API_URL}/contratos/${id}`);
    if (!response.ok) throw new Error('Error al obtener contrato');
    return response.json();
};

/**
 * Crea un nuevo contrato laboral para un empleado.
 *
 * @param {Object} data - Datos del contrato (empleadoId, tipoContrato, fechaInicio, etc.).
 * @returns {Promise<Object>} Contrato creado.
 */
export const createContrato = async (data) => {
    const response = await httpClient(`${API_URL}/contratos`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear contrato');
    return result;
};

/**
 * Actualiza un contrato existente.
 *
 * @param {number} id - ID del contrato.
 * @param {Object} data - Campos a modificar.
 * @returns {Promise<Object>} Contrato actualizado.
 */
export const updateContrato = async (id, data) => {
    const response = await httpClient(`${API_URL}/contratos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contrato');
    return result;
};

/**
 * Realiza una baja lógica de un contrato.
 *
 * @param {number} id - ID del contrato.
 * @returns {Promise<Object>} Confirmación.
 */
export const deleteContrato = async (id) => {
    const response = await httpClient(`${API_URL}/contratos/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contrato');
    return result;
};

/**
 * Reactiva un contrato dado de baja.
 *
 * @param {number} id - ID del contrato.
 * @returns {Promise<Object>} Confirmación.
 */
export const reactivateContrato = async (id) => {
    const response = await httpClient(`${API_URL}/contratos/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar contrato');
    return result;
};

/**
 * Elimina múltiples contratos en una sola operación.
 *
 * @param {number[]} ids - IDs de los contratos.
 * @returns {Promise<Object>} Resultado bulk.
 */
export const deleteContratosBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/contratos/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contratos');
    return result;
};

/**
 * Obtiene los puestos que ya tienen contrato activo para un empleado específico.
 * Usado para evitar asignar dos contratos al mismo puesto.
 *
 * @param {number} empleadoId - ID del empleado.
 * @returns {Promise<Object[]>} Lista de puestos con contrato activo.
 */
export const getPuestosConContrato = async (empleadoId) => {
    const response = await httpClient(`${API_URL}/contratos/empleado/${empleadoId}/puestos-con-contrato`);
    if (!response.ok) throw new Error('Error al obtener puestos con contrato');
    return response.json();
};


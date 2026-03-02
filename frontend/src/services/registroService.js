/**
 * @fileoverview Servicios CRUD para los mÃ³dulos de Registros de Salud, Evaluaciones y Contactos.
 * @module services/registroService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

// ===== REGISTROS DE SALUD =====

/**
 * Obtiene la lista de registros de salud segÃºn filtros.
 *
 * @param {Object} [filters={}] - (empleadoId, tipoExamen, vigente, etc.)
 * @returns {Promise<Object>} Lista paginada de registros.
 */
export const getRegistrosSalud = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/registros-salud${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener registros de salud');
    return response.json();
};

/**
 * Obtiene un registro de salud por su ID.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getRegistroSaludById = async (id) => {
    const response = await httpClient(`${API_URL}/registros-salud/${id}`);
    if (!response.ok) throw new Error('Error al obtener registro de salud');
    return response.json();
};

/**
 * Crea un nuevo registro de salud para un empleado.
 *
 * @param {Object} data - Datos del examen mÃ©dico.
 * @returns {Promise<Object>} Registro creado.
 */
export const createRegistroSalud = async (data) => {
    const response = await httpClient(`${API_URL}/registros-salud`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear registro de salud');
    return result;
};

/**
 * Actualiza un registro de salud existente.
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateRegistroSalud = async (id, data) => {
    const response = await httpClient(`${API_URL}/registros-salud/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar registro de salud');
    return result;
};

/**
 * Elimina lÃ³gicamente un registro de salud.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteRegistroSalud = async (id) => {
    const response = await httpClient(`${API_URL}/registros-salud/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar registro de salud');
    return result;
};

/**
 * Reactiva un registro de salud dado de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateRegistroSalud = async (id) => {
    const response = await httpClient(`${API_URL}/registros-salud/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar registro de salud');
    return result;
};

/**
 * Elimina mÃºltiples registros de salud en un solo request.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteRegistrosSaludBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/registros-salud/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar registros de salud');
    return result;
};

// ===== EVALUACIONES =====

/**
 * Obtiene la lista de evaluaciones de desempeÃ±o.
 *
 * @param {Object} [filters={}] - (contratoId, periodo, estado, etc.)
 * @returns {Promise<Object>}
 */
export const getEvaluaciones = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/evaluaciones${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener evaluaciones');
    return response.json();
};

/**
 * Obtiene una evaluaciÃ³n por su ID.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getEvaluacionById = async (id) => {
    const response = await httpClient(`${API_URL}/evaluaciones/${id}`);
    if (!response.ok) throw new Error('Error al obtener evaluaciÃ³n');
    return response.json();
};

/**
 * Crea una nueva evaluaciÃ³n de desempeÃ±o.
 *
 * @param {Object} data - Datos de la evaluaciÃ³n.
 * @returns {Promise<Object>}
 */
export const createEvaluacion = async (data) => {
    const response = await httpClient(`${API_URL}/evaluaciones`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear evaluaciÃ³n');
    return result;
};

/**
 * Actualiza una evaluaciÃ³n existente.
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateEvaluacion = async (id, data) => {
    const response = await httpClient(`${API_URL}/evaluaciones/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar evaluaciÃ³n');
    return result;
};

/**
 * Elimina lÃ³gicamente una evaluaciÃ³n.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteEvaluacion = async (id) => {
    const response = await httpClient(`${API_URL}/evaluaciones/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar evaluaciÃ³n');
    return result;
};

/**
 * Reactiva una evaluaciÃ³n dada de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateEvaluacion = async (id) => {
    const response = await httpClient(`${API_URL}/evaluaciones/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar evaluaciÃ³n');
    return result;
};

/**
 * Elimina mÃºltiples evaluaciones.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteEvaluacionesBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/evaluaciones/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar evaluaciones');
    return result;
};

// ===== CONTACTOS =====

/**
 * Obtiene la lista de contactos familiares/emergencia de empleados.
 *
 * @param {Object} [filters={}] - (empleadoId, esFamiliar, esContactoEmergencia, etc.)
 * @returns {Promise<Object>}
 */
export const getContactos = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/contactos${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener contactos');
    return response.json();
};

/**
 * Obtiene un contacto por su ID.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getContactoById = async (id) => {
    const response = await httpClient(`${API_URL}/contactos/${id}`);
    if (!response.ok) throw new Error('Error al obtener contacto');
    return response.json();
};

/**
 * Crea un nuevo contacto para un empleado.
 *
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const createContacto = async (data) => {
    const response = await httpClient(`${API_URL}/contactos`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear contacto');
    return result;
};

/**
 * Actualiza un contacto existente.
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateContacto = async (id, data) => {
    const response = await httpClient(`${API_URL}/contactos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar contacto');
    return result;
};

/**
 * Elimina lÃ³gicamente un contacto.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteContacto = async (id) => {
    const response = await httpClient(`${API_URL}/contactos/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contacto');
    return result;
};

/**
 * Reactiva un contacto dado de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateContacto = async (id) => {
    const response = await httpClient(`${API_URL}/contactos/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar contacto');
    return result;
};

/**
 * Elimina mÃºltiples contactos.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteContactosBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/contactos/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar contactos');
    return result;
};


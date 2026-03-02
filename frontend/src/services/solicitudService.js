/**
 * @fileoverview Servicios para el módulo de Solicitudes (Vacaciones, Licencias, Horas Extras, Renuncias).
 * @module services/solicitudService
 */

import { httpClient, buildQueryString, API_URL } from './httpClient';

/**
 * Obtiene la lista de solicitudes según filtros.
 *
 * @param {Object} [filters={}] - (contratoId, tipoSolicitud, estado, page, limit, etc.)
 * @returns {Promise<Object>} Lista paginada de solicitudes con su detalle.
 */
export const getSolicitudes = async (filters = {}) => {
    const response = await httpClient(`${API_URL}/solicitudes${buildQueryString(filters)}`);
    if (!response.ok) throw new Error('Error al obtener solicitudes');
    return response.json();
};

/**
 * Obtiene una solicitud por su ID con todos sus detalles (vacaciones, licencia, etc.).
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const getSolicitudById = async (id) => {
    const response = await httpClient(`${API_URL}/solicitudes/${id}`);
    if (!response.ok) throw new Error('Error al obtener solicitud');
    return response.json();
};

/**
 * Crea una nueva solicitud de novedad.
 *
 * @param {Object} data - Datos de la solicitud (tipoSolicitud, contratoId y campos específicos del tipo).
 * @returns {Promise<Object>} Solicitud creada.
 */
export const createSolicitud = async (data) => {
    const response = await httpClient(`${API_URL}/solicitudes`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al crear solicitud');
    return result;
};

/**
 * Actualiza una solicitud existente (ej: aprobar, rechazar, editar datos).
 *
 * @param {number} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
export const updateSolicitud = async (id, data) => {
    const response = await httpClient(`${API_URL}/solicitudes/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al actualizar solicitud');
    return result;
};

/**
 * Elimina lógicamente una solicitud.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const deleteSolicitud = async (id) => {
    const response = await httpClient(`${API_URL}/solicitudes/${id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar solicitud');
    return result;
};

/**
 * Reactiva una solicitud dada de baja.
 *
 * @param {number} id
 * @returns {Promise<Object>}
 */
export const reactivateSolicitud = async (id) => {
    const response = await httpClient(`${API_URL}/solicitudes/${id}/reactivate`, { method: 'PATCH' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al reactivar solicitud');
    return result;
};

/**
 * Elimina múltiples solicitudes.
 *
 * @param {number[]} ids
 * @returns {Promise<Object>}
 */
export const deleteSolicitudesBulk = async (ids) => {
    const response = await httpClient(`${API_URL}/solicitudes/bulk`, {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Error al eliminar solicitudes');
    return result;
};

/**
 * Consulta los días de vacaciones disponibles para un contrato en un período fiscal.
 *
 * @param {number} contratoId - ID del contrato laboral.
 * @param {number} [periodo] - Año fiscal (ej: 2024). Si no se provee, usa el actual.
 * @returns {Promise<{ diasCorrespondientes: number, diasTomados: number, diasDisponibles: number }>}
 */
export const getDiasDisponiblesVacaciones = async (contratoId, periodo) => {
    const params = periodo ? `?periodo=${periodo}` : '';
    const response = await httpClient(
        `${API_URL}/solicitudes/vacaciones/diasDisponibles/${contratoId}${params}`
    );
    if (!response.ok) throw new Error('Error al obtener días de vacaciones');
    return response.json();
};

/**
 * Calcula la cantidad de días hábiles entre dos fechas para una solicitud de vacaciones.
 *
 * @param {string} fechaInicio - Fecha inicio en YYYY-MM-DD.
 * @param {string} fechaFin - Fecha fin en YYYY-MM-DD.
 * @returns {Promise<{ diasSolicitud: number }>}
 */
export const getDiasSolicitadosVacaciones = async (fechaInicio, fechaFin) => {
    const params = new URLSearchParams({ fechaInicio, fechaFin });
    const response = await httpClient(
        `${API_URL}/solicitudes/vacaciones/diasSolicitados?${params.toString()}`
    );
    if (!response.ok) throw new Error('Error al calcular días solicitados');
    return response.json();
};


/**
 * @fileoverview Helper de respuestas HTTP estándar.
 * Centraliza la construcción de respuestas de error y éxito para
 * mantener consistencia en todos los controllers de la API.
 * @module helpers/respuestas
 */

/**
 * Envía una respuesta de error HTTP estándar.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {number} status - Código HTTP de error (400, 403, 404, 500, etc.)
 * @param {string} mensaje - Mensaje de error descriptivo
 * @returns {object} Respuesta HTTP con `{ error: mensaje }`
 */
const error = (res, status, mensaje) => {
    return res.status(status).json({ error: mensaje });
};

/**
 * Envía una respuesta 400 Bad Request.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {string} mensaje - Mensaje de error
 * @returns {object} Respuesta HTTP 400
 */
const badRequest = (res, mensaje) => error(res, 400, mensaje);

/**
 * Envía una respuesta 401 Unauthorized.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {string} [mensaje='No autorizado'] - Mensaje de error
 * @returns {object} Respuesta HTTP 401
 */
const unauthorized = (res, mensaje = 'No autorizado') => error(res, 401, mensaje);

/**
 * Envía una respuesta 403 Forbidden.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {string} mensaje - Mensaje de error
 * @returns {object} Respuesta HTTP 403
 */
const forbidden = (res, mensaje) => error(res, 403, mensaje);

/**
 * Envía una respuesta 404 Not Found.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {string} [entidad='Recurso'] - Nombre de la entidad no encontrada
 * @returns {object} Respuesta HTTP 404
 */
const notFound = (res, entidad = 'Recurso') => error(res, 404, `${entidad} no encontrado`);

/**
 * Envía una respuesta 500 Internal Server Error.
 * Se recomienda usar esto solo cuando el error es inesperado.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {Error} err - Objeto de error capturado
 * @returns {object} Respuesta HTTP 500
 */
const serverError = (res, err) => error(res, 500, err.message || 'Error interno del servidor');

/**
 * Maneja errores de Sequelize de forma estándar.
 * Detecta errores de validación y restricciones únicas para dar mensajes más claros.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {Error} err - Error capturado en el bloque catch
 * @returns {object} Respuesta HTTP apropiada según el tipo de error
 */
const manejarErrorSequelize = (res, err) => {
    if (err.name === 'SequelizeValidationError') {
        const mensajes = err.errors.map(e => e.message).join(', ');
        return badRequest(res, mensajes);
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
        const campo = err.errors?.[0]?.path || 'campo';
        return badRequest(res, `El valor del campo "${campo}" ya está en uso.`);
    }
    return serverError(res, err);
};

/**
 * Envía una respuesta 200 OK.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {any} data - Datos a enviar en la respuesta
 * @returns {object} Respuesta HTTP 200
 */
const ok = (res, data) => res.status(200).json(data);

/**
 * Envía una respuesta 201 Created.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {any} data - Datos a enviar en la respuesta
 * @returns {object} Respuesta HTTP 201
 */
const created = (res, data) => res.status(201).json(data);

module.exports = {
    error,
    badRequest,
    unauthorized,
    forbidden,
    notFound,
    serverError,
    manejarErrorSequelize,
    ok,
    created,
};

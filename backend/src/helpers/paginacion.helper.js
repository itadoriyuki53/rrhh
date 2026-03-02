/**
 * @fileoverview Helper de paginación estándar.
 * Provee funciones utilitarias para construir respuestas paginadas
 * de forma consistente en todos los controllers.
 * @module helpers/paginacion
 */

/**
 * Parsea y retorna parámetros de paginación a partir de la query string.
 *
 * @param {object} query - Objeto `req.query` de Express
 * @param {string|number} [query.page=1] - Número de página actual (base 1)
 * @param {string|number} [query.limit=10] - Cantidad de registros por página
 * @returns {{ page: number, limit: number, offset: number }} Parámetros de paginación parseados
 */
const parsearPaginacion = (query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.max(1, parseInt(query.limit) || 10);
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

/**
 * Construye un objeto de respuesta paginada estándar.
 *
 * @param {object} result - Resultado de Sequelize `findAndCountAll`
 * @param {number} result.count - Total de registros encontrados
 * @param {Array} result.rows - Registros de la página actual
 * @param {number} page - Número de página actual
 * @param {number} limit - Registros por página
 * @param {string} [dataKey='data'] - Nombre de la clave de datos en la respuesta
 * @returns {object} Objeto de respuesta con datos y metadatos de paginación
 *
 * @example
 * const result = await Model.findAndCountAll({ ... });
 * res.json(construirRespuestaPaginada(result, page, limit));
 */
const construirRespuestaPaginada = (result, page, limit, dataKey = 'data') => {
    return {
        [dataKey]: result.rows,
        pagination: {
            total: result.count,
            page,
            limit,
            totalPages: Math.ceil(result.count / limit),
        },
    };
};

module.exports = {
    parsearPaginacion,
    construirRespuestaPaginada,
};

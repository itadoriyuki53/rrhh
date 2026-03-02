/**
 * @fileoverview Cliente HTTP base para todas las peticiones a la API del servidor.
 * Centraliza la URL base, credenciales de sesiÃ³n y construcciÃ³n de query strings.
 * @module services/httpClient
 */

/** URL base de la API obtenida de las variables de entorno o '/api' por defecto. */
const API_URL = '/api';

/**
 * Realiza una peticiÃ³n fetch incluyendo automÃ¡ticamente las cookies de sesiÃ³n
 * y el header `Content-Type: application/json`.
 *
 * @param {string} url - URL completa del endpoint.
 * @param {RequestInit} [options={}] - Opciones adicionales de fetch (method, body, etc.).
 * @returns {Promise<Response>} Promesa con la respuesta HTTP.
 */
export const httpClient = (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
};

/**
 * Construye una query string a partir de un objeto de filtros,
 * omitiendo claves con valores vacÃ­os, nulos o indefinidos.
 *
 * @param {Object} params - Objeto con pares clave-valor a serializar.
 * @returns {string} Query string con el signo "?" incluido, o "" si no hay parÃ¡metros.
 * @example
 * buildQueryString({ page: 1, search: 'juan', estado: '' });
 * // "?page=1&search=juan"
 */
export const buildQueryString = (params = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            searchParams.append(key, value);
        }
    });
    const qs = searchParams.toString();
    return qs ? `?${qs}` : '';
};

export { API_URL };


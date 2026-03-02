/**
 * @fileoverview Servicio para datos geográficos y de ubicación.
 * Consume APIs externas (REST Countries, Georef Argentina) con caché en memoria.
 * @module services/geoService
 */

/** @type {{ nacionalidades: string[]|null, provincias: Object[]|null, ciudades: Object.<string, Object[]> }} */
const cache = {
    nacionalidades: null,
    provincias: null,
    ciudades: {},
};

/**
 * Obtiene el listado de demónimos de todos los países del mundo (ej: "Argentino").
 * Usa caché en memoria para evitar peticiones repetidas durante la sesión.
 *
 * @returns {Promise<string[]>} Lista de gentilicios ordenados alfabéticamente.
 * Si la API externa falla, retorna un fallback con los principales países de habla hispana.
 */
export const getNacionalidades = async () => {
    if (cache.nacionalidades) return cache.nacionalidades;

    try {
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,demonyms');
        if (!response.ok) throw new Error('Error al obtener nacionalidades');
        const data = await response.json();

        const nacionalidades = data
            .map(country =>
                country.demonyms?.spa?.m ||
                country.demonyms?.spa?.f ||
                country.demonyms?.eng?.m ||
                country.name.common
            )
            .filter(Boolean)
            .sort();

        cache.nacionalidades = [...new Set(nacionalidades)];
        return cache.nacionalidades;
    } catch {
        return ['Argentino', 'Brasileño', 'Chileno', 'Paraguayo', 'Uruguayo', 'Boliviano', 'Peruano', 'Colombiano', 'Mexicano', 'Español'];
    }
};

/**
 * Obtiene las provincias de Argentina desde la API Georef del gobierno.
 * Usa caché en memoria para evitar peticiones repetidas durante la sesión.
 *
 * @returns {Promise<Array<{ id: string, nombre: string }>>} Provincias ordenadas alfabéticamente.
 * Retorna array vacío si la API externa falla.
 */
export const getProvincias = async () => {
    if (cache.provincias) return cache.provincias;

    try {
        const response = await fetch('https://apis.datos.gob.ar/georef/api/provincias?campos=id,nombre&max=50');
        if (!response.ok) throw new Error('Error al obtener provincias');
        const data = await response.json();
        cache.provincias = data.provincias.sort((a, b) => a.nombre.localeCompare(b.nombre));
        return cache.provincias;
    } catch {
        return [];
    }
};

/**
 * Obtiene los municipios de una provincia argentina desde la API Georef.
 * Usa caché por provincia para evitar peticiones repetidas.
 *
 * @param {string|number} provinciaId - ID de la provincia (Georef).
 * @returns {Promise<Array<{ id: string, nombre: string }>>} Municipios ordenados alfabéticamente.
 * Retorna array vacío si no hay provinciaId o si la API externa falla.
 */
export const getCiudades = async (provinciaId) => {
    if (!provinciaId) return [];
    if (cache.ciudades[provinciaId]) return cache.ciudades[provinciaId];

    try {
        const response = await fetch(
            `https://apis.datos.gob.ar/georef/api/municipios?provincia=${provinciaId}&campos=id,nombre&max=200`
        );
        if (!response.ok) throw new Error('Error al obtener ciudades');
        const data = await response.json();
        cache.ciudades[provinciaId] = data.municipios.sort((a, b) => a.nombre.localeCompare(b.nombre));
        return cache.ciudades[provinciaId];
    } catch {
        return [];
    }
};


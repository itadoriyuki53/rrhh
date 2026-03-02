/**
 * @fileoverview Servicio para datos geogrÃ¡ficos y de ubicaciÃ³n.
 * Consume APIs externas (REST Countries, Georef Argentina) con cachÃ© en memoria.
 * @module services/geoService
 */

/** @type {{ nacionalidades: string[]|null, provincias: Object[]|null, ciudades: Object.<string, Object[]> }} */
const cache = {
    nacionalidades: null,
    provincias: null,
    ciudades: {},
};

/**
 * Obtiene el listado de demÃ³nimos de todos los paÃ­ses del mundo (ej: "Argentino").
 * Usa cachÃ© en memoria para evitar peticiones repetidas durante la sesiÃ³n.
 *
 * @returns {Promise<string[]>} Lista de gentilicios ordenados alfabÃ©ticamente.
 * Si la API externa falla, retorna un fallback con los principales paÃ­ses de habla hispana.
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
        return ['Argentino', 'BrasileÃ±o', 'Chileno', 'Paraguayo', 'Uruguayo', 'Boliviano', 'Peruano', 'Colombiano', 'Mexicano', 'EspaÃ±ol'];
    }
};

/**
 * Obtiene las provincias de Argentina desde la API Georef del gobierno.
 * Usa cachÃ© en memoria para evitar peticiones repetidas durante la sesiÃ³n.
 *
 * @returns {Promise<Array<{ id: string, nombre: string }>>} Provincias ordenadas alfabÃ©ticamente.
 * Retorna array vacÃ­o si la API externa falla.
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
 * Usa cachÃ© por provincia para evitar peticiones repetidas.
 *
 * @param {string|number} provinciaId - ID de la provincia (Georef).
 * @returns {Promise<Array<{ id: string, nombre: string }>>} Municipios ordenados alfabÃ©ticamente.
 * Retorna array vacÃ­o si no hay provinciaId o si la API externa falla.
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


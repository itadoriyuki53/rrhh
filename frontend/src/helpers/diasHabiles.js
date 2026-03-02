/**
 * @fileoverview Utilidades para validaciÃ³n y cÃ¡lculo de dÃ­as hÃ¡biles laborales en Argentina.
 * Usa un JSON local de feriados para validaciones sÃ­ncronas en formularios.
 * @module helpers/diasHabiles
 */

import feriadosData from '../data/feriados.json';

/**
 * Lista unificada de todos los feriados (fijos + mÃ³viles aproximados).
 * Formato de cada elemento: "MM-DD" (ej: "01-01", "05-25").
 * Se construye una sola vez al cargar el mÃ³dulo.
 *
 * @type {string[]}
 */
const TODOS_FERIADOS = [
    ...feriadosData.feriados_fijos,
    ...feriadosData.feriados_moviles_aproximados,
];

/**
 * Verifica si una fecha dada es un dÃ­a hÃ¡bil laboral argentino.
 * Un dÃ­a hÃ¡bil es de lunes a viernes (excluyendo sÃ¡bados, domingos y feriados).
 *
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 * @returns {boolean} `true` si es dÃ­a hÃ¡bil, `false` en caso contrario.
 * @example
 * esDiaHabilSincrono('2024-01-01'); // false (AÃ±o Nuevo)
 * esDiaHabilSincrono('2024-01-02'); // true  (martes hÃ¡bil)
 */
export const esDiaHabilSincrono = (fechaStr) => {
    if (!fechaStr) return false;

    const fecha = new Date(fechaStr + 'T00:00:00');
    const diaSemana = fecha.getDay();

    // 0 = Domingo, 6 = SÃ¡bado
    if (diaSemana === 0 || diaSemana === 6) return false;

    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const mesdia = `${month}-${day}`;

    return !TODOS_FERIADOS.includes(mesdia);
};

/**
 * Obtiene una descripciÃ³n legible de por quÃ© una fecha no es hÃ¡bil.
 * FunciÃ³n de uso interno para mensajes de error informativos.
 *
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 * @returns {string} DescripciÃ³n de la razÃ³n (ej: "es sÃ¡bado", "es feriado (Navidad)").
 */
const obtenerRazonNoHabil = (fechaStr) => {
    if (!fechaStr) return 'fecha no proporcionada';

    const fecha = new Date(fechaStr + 'T00:00:00');
    const diaSemana = fecha.getDay();

    if (diaSemana === 0) return 'es domingo';
    if (diaSemana === 6) return 'es sÃ¡bado';

    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const mesdia = `${month}-${day}`;

    if (TODOS_FERIADOS.includes(mesdia)) {
        const descripcion = feriadosData.descripcion?.[mesdia] || 'feriado';
        return `es feriado (${descripcion})`;
    }

    return 'no es dÃ­a hÃ¡bil';
};

/**
 * Valida que una fecha sea un dÃ­a hÃ¡bil laboral. Lanza un Error con mensaje
 * descriptivo si la validaciÃ³n falla. DiseÃ±ada para usar en handlers de formulario.
 *
 * @param {string} fecha - Fecha en formato YYYY-MM-DD.
 * @param {string} nombreCampo - Nombre del campo para incluir en el mensaje de error.
 * @throws {Error} Si la fecha estÃ¡ vacÃ­a o no es un dÃ­a hÃ¡bil.
 * @example
 * validarDiaHabil('2024-01-06', 'Fecha de inicio'); // lanza Error "...es sÃ¡bado"
 * validarDiaHabil('2024-01-08', 'Fecha de inicio'); // no lanza (lunes hÃ¡bil)
 */
export const validarDiaHabil = (fecha, nombreCampo) => {
    if (!fecha) {
        throw new Error(`${nombreCampo} es requerida`);
    }

    if (!esDiaHabilSincrono(fecha)) {
        const razon = obtenerRazonNoHabil(fecha);
        throw new Error(
            `${nombreCampo} debe ser un dÃ­a hÃ¡bil (lunes a viernes, excluyendo feriados). La fecha seleccionada ${razon}.`
        );
    }
};


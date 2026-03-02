/**
 * @fileoverview Utilidades para validación y cálculo de días hábiles laborales en Argentina.
 * Usa un JSON local de feriados para validaciones síncronas en formularios.
 * @module helpers/diasHabiles
 */

import feriadosData from '../data/feriados.json';

/**
 * Lista unificada de todos los feriados (fijos + móviles aproximados).
 * Formato de cada elemento: "MM-DD" (ej: "01-01", "05-25").
 * Se construye una sola vez al cargar el módulo.
 *
 * @type {string[]}
 */
const TODOS_FERIADOS = [
    ...feriadosData.feriados_fijos,
    ...feriadosData.feriados_moviles_aproximados,
];

/**
 * Verifica si una fecha dada es un día hábil laboral argentino.
 * Un día hábil es de lunes a viernes (excluyendo sábados, domingos y feriados).
 *
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 * @returns {boolean} `true` si es día hábil, `false` en caso contrario.
 * @example
 * esDiaHabilSincrono('2024-01-01'); // false (Año Nuevo)
 * esDiaHabilSincrono('2024-01-02'); // true  (martes hábil)
 */
export const esDiaHabilSincrono = (fechaStr) => {
    if (!fechaStr) return false;

    const fecha = new Date(fechaStr + 'T00:00:00');
    const diaSemana = fecha.getDay();

    // 0 = Domingo, 6 = Sábado
    if (diaSemana === 0 || diaSemana === 6) return false;

    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const mesdia = `${month}-${day}`;

    return !TODOS_FERIADOS.includes(mesdia);
};

/**
 * Obtiene una descripción legible de por qué una fecha no es hábil.
 * Función de uso interno para mensajes de error informativos.
 *
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD.
 * @returns {string} Descripción de la razón (ej: "es sábado", "es feriado (Navidad)").
 */
const obtenerRazonNoHabil = (fechaStr) => {
    if (!fechaStr) return 'fecha no proporcionada';

    const fecha = new Date(fechaStr + 'T00:00:00');
    const diaSemana = fecha.getDay();

    if (diaSemana === 0) return 'es domingo';
    if (diaSemana === 6) return 'es sábado';

    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const mesdia = `${month}-${day}`;

    if (TODOS_FERIADOS.includes(mesdia)) {
        const descripcion = feriadosData.descripcion?.[mesdia] || 'feriado';
        return `es feriado (${descripcion})`;
    }

    return 'no es día hábil';
};

/**
 * Valida que una fecha sea un día hábil laboral. Lanza un Error con mensaje
 * descriptivo si la validación falla. Diseñada para usar en handlers de formulario.
 *
 * @param {string} fecha - Fecha en formato YYYY-MM-DD.
 * @param {string} nombreCampo - Nombre del campo para incluir en el mensaje de error.
 * @throws {Error} Si la fecha está vacía o no es un día hábil.
 * @example
 * validarDiaHabil('2024-01-06', 'Fecha de inicio'); // lanza Error "...es sábado"
 * validarDiaHabil('2024-01-08', 'Fecha de inicio'); // no lanza (lunes hábil)
 */
export const validarDiaHabil = (fecha, nombreCampo) => {
    if (!fecha) {
        throw new Error(`${nombreCampo} es requerida`);
    }

    if (!esDiaHabilSincrono(fecha)) {
        const razon = obtenerRazonNoHabil(fecha);
        throw new Error(
            `${nombreCampo} debe ser un día hábil (lunes a viernes, excluyendo feriados). La fecha seleccionada ${razon}.`
        );
    }
};


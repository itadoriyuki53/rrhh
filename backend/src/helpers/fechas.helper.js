/**
 * @fileoverview Helper para el manejo de fechas.
 * Proporciona utilidades para validar días hábiles (considerando feriados)
 * y parsear fechas ignorando el desfase de zona horaria.
 * @module helpers/fechas.helper
 */

const feriadosData = require('../data/feriados.json');

/**
 * Valida si una fecha es un día hábil (lunes a viernes, excluyendo feriados argentinos)
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {boolean} true si es día hábil, false si no
 */
const esDiaHabil = (fechaStr) => {
    if (!fechaStr) return false;

    const fecha = new Date(fechaStr + 'T00:00:00');
    const diaSemana = fecha.getDay();

    // Validar fin de semana
    if (diaSemana === 0 || diaSemana === 6) {
        return false; // Domingo o Sábado
    }

    // Extraer mes-día en formato MM-DD
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const mesdia = `${month}-${day}`;

    // Combinar feriados fijos y móviles
    const todosFeriados = [
        ...feriadosData.feriados_fijos,
        ...feriadosData.feriados_moviles_aproximados
    ];

    // Validar si es feriado
    if (todosFeriados.includes(mesdia)) {
        return false; // Es feriado
    }

    return true; // Es día hábil
};

/**
 * Parsea una fecha en formato YYYY-MM-DD a objeto Date local (sin ajuste de timezone)
 * @param {string} fechaStr - Fecha en formato YYYY-MM-DD
 * @returns {Date} Objeto Date
 */
const parseLocalDate = (fechaStr) => {
    if (!fechaStr) return null;
    return new Date(fechaStr + 'T00:00:00');
};

module.exports = {
    esDiaHabil,
    parseLocalDate
};

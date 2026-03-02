/**
 * @fileoverview Helper para la detección de solapamientos temporales.
 * Contiene funciones para verificar intersecciones entre rangos de fechas y horas,
 * facilitando la validación de licencias, vacaciones y horas extras.
 * @module helpers/solapamiento.helper
 */

const { Op } = require('sequelize');

/**
 * Verifica si dos rangos de fechas se solapan
 * @param {string|Date} inicio1 - Inicio del primer rango
 * @param {string|Date} fin1 - Fin del primer rango
 * @param {string|Date} inicio2 - Inicio del segundo rango
 * @param {string|Date} fin2 - Fin del segundo rango
 * @returns {boolean} - true si se solapan
 */
const fechasSeSolapan = (inicio1, fin1, inicio2, fin2) => {
    const i1 = new Date(inicio1);
    const f1 = new Date(fin1);
    const i2 = new Date(inicio2);
    const f2 = new Date(fin2);

    // Se solapan si: inicio1 <= fin2 AND fin1 >= inicio2
    return i1 <= f2 && f1 >= i2;
};

/**
 * Verifica si una fecha está dentro de un rango (inclusive)
 * @param {string|Date} fecha - La fecha a verificar
 * @param {string|Date} inicio - Inicio del rango
 * @param {string|Date} fin - Fin del rango
 * @returns {boolean} - true si la fecha está en el rango
 */
const fechaEnRango = (fecha, inicio, fin) => {
    const f = new Date(fecha);
    const i = new Date(inicio);
    const fi = new Date(fin);
    return f >= i && f <= fi;
};

/**
 * Verifica si dos rangos de horas se solapan (mismo día)
 * @param {string} inicio1 - Hora inicio 1 (HH:MM)
 * @param {string} fin1 - Hora fin 1 (HH:MM)
 * @param {string} inicio2 - Hora inicio 2 (HH:MM)
 * @param {string} fin2 - Hora fin 2 (HH:MM)
 * @returns {boolean} - true si se solapan
 */
const horasSeSolapan = (inicio1, fin1, inicio2, fin2) => {
    const toMinutes = (time) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const i1 = toMinutes(inicio1);
    const f1 = toMinutes(fin1);
    const i2 = toMinutes(inicio2);
    const f2 = toMinutes(fin2);

    // Se solapan si: inicio1 < fin2 AND fin1 > inicio2
    return i1 < f2 && f1 > i2;
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string|Date} inicio - Fecha de inicio
 * @param {string|Date} fin - Fecha de fin
 * @returns {number} - Número de días (inclusive)
 */
const calcularDiasEntre = (inicio, fin) => {
    const i = new Date(inicio);
    const f = new Date(fin);
    const diffTime = Math.abs(f - i);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Genera condición Sequelize para solapamiento de fechas
 * @param {string} fechaInicio - Campo de fecha inicio a comparar
 * @param {string} fechaFin - Campo de fecha fin a comparar
 * @returns {Object} - Condición Op.or para Sequelize
 */
const condicionSolapamientoFechas = (fechaInicio, fechaFin) => ({
    [Op.or]: [
        // Caso 1: Nueva solicitud empieza durante una existente
        {
            fechaInicio: { [Op.lte]: fechaInicio },
            fechaFin: { [Op.gte]: fechaInicio }
        },
        // Caso 2: Nueva solicitud termina durante una existente
        {
            fechaInicio: { [Op.lte]: fechaFin },
            fechaFin: { [Op.gte]: fechaFin }
        },
        // Caso 3: Nueva solicitud contiene completamente una existente
        {
            fechaInicio: { [Op.gte]: fechaInicio },
            fechaFin: { [Op.lte]: fechaFin }
        }
    ]
});

/**
 * Genera condición Sequelize para verificar si fecha está en rango
 * @param {string} fecha - Fecha a verificar
 * @returns {Object} - Condición para Sequelize
 */
const condicionFechaEnRango = (fecha) => ({
    fechaInicio: { [Op.lte]: fecha },
    fechaFin: { [Op.gte]: fecha }
});

/**
 * Genera condición Sequelize para solapamiento de horas
 * @param {string} fecha - Fecha de las horas extras
 * @param {string} horaInicio - Hora de inicio
 * @param {string} horaFin - Hora de fin
 * @returns {Object} - Condición para Sequelize
 */
const condicionSolapamientoHoras = (fecha, horaInicio, horaFin) => ({
    fecha,
    [Op.and]: [
        { horaInicio: { [Op.lt]: horaFin } }, // empieza antes de que termine la nueva
        { horaFin: { [Op.gt]: horaInicio } }  // termina después de que empieza la nueva
    ]
});

module.exports = {
    fechasSeSolapan,
    fechaEnRango,
    horasSeSolapan,
    calcularDiasEntre,
    condicionSolapamientoFechas,
    condicionFechaEnRango,
    condicionSolapamientoHoras
};

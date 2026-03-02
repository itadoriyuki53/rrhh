/**
 * @fileoverview Servicio de cálculos relacionados con empleados.
 * Provee funciones de utilidad para calcular días efectivos trabajados
 * y antigüedad, utilizados en los cálculos de vacaciones y liquidaciones.
 * @module services/empleadoService
 */

const { parseLocalDate } = require('../helpers/fechas.helper');

/**
 * Calcula los días efectivos trabajados por un empleado desde el inicio del contrato.
 * Descuenta los días cubiertos por licencias no aprobadas (injustificadas, rechazadas, pendientes).
 *
 * @param {string} fechaInicio - Fecha de inicio del contrato (YYYY-MM-DD)
 * @param {object[]} licencias - Array de licencias no aprobadas del contrato
 * @param {string} licencias[].fechaInicio - Fecha de inicio de la licencia
 * @param {string} licencias[].fechaFin - Fecha de fin de la licencia
 * @returns {number} Días efectivos trabajados (mínimo 0)
 */
const calcularDiasEfectivos = (fechaInicio, licencias) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicio = parseLocalDate(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const MS_POR_DIA = 1000 * 60 * 60 * 24;
    const diasTotales = Math.floor((hoy - inicio) / MS_POR_DIA);

    let diasNoTrabajados = 0;

    for (const licencia of licencias) {
        const desde = parseLocalDate(licencia.fechaInicio);
        const hasta = parseLocalDate(licencia.fechaFin);

        desde.setHours(0, 0, 0, 0);
        hasta.setHours(0, 0, 0, 0);

        // Calcular intersección con el período desde inicio del contrato hasta hoy
        const inicioEfectivo = new Date(Math.max(desde, inicio));
        const finEfectivo = new Date(Math.min(hasta, hoy));

        // Si no hay intersección, ignorar
        if (inicioEfectivo > finEfectivo) continue;

        // Días de licencia efectivamente transcurridos (inclusive ambos extremos)
        diasNoTrabajados +=
            Math.floor((finEfectivo - inicioEfectivo) / MS_POR_DIA) + 1;
    }

    return Math.max(diasTotales - diasNoTrabajados, 0);
};

/**
 * Calcula la antigüedad en años cumplidos desde la fecha de inicio del contrato.
 *
 * @param {string} fechaInicio - Fecha de inicio del contrato (YYYY-MM-DD)
 * @returns {number} Antigüedad en años completos cumplidos
 *
 * @example
 * calcularAntiguedadEnAnios('2020-03-15'); // → 5 (si hoy es 2025-06-01)
 */
const calcularAntiguedadEnAnios = (fechaInicio) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const inicio = parseLocalDate(fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    let anios = hoy.getFullYear() - inicio.getFullYear();

    const cumplioEsteAnio =
        hoy.getMonth() > inicio.getMonth() ||
        (hoy.getMonth() === inicio.getMonth() && hoy.getDate() >= inicio.getDate());

    if (!cumplioEsteAnio) anios--;

    return anios;
};

module.exports = {
    calcularDiasEfectivos,
    calcularAntiguedadEnAnios,
};

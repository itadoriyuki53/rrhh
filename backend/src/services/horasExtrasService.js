/**
 * @fileoverview Servicio de validación y lógica de negocio para horas extras.
 * Maneja la validación de solapamientos de horas dentro del mismo día y
 * conflictos con vacaciones y licencias aprobadas.
 * @module services/horasExtrasService
 */

const { Solicitud, HorasExtras, Vacaciones, Licencia } = require('../models');

const { Op } = require('sequelize');
const { condicionSolapamientoHoras, condicionFechaEnRango } = require('../helpers/solapamiento.helper');

/**
 * Valida creación/edición de horas extras
 * @param {number} contratoId - ID del contrato
 * @param {object} datos - Datos de la solicitud
 * @param {number|null} solicitudIdActual - ID de solicitud actual (para edición)
 * @returns {object} - { valido: boolean, error?: string }
 */
const validarHorasExtras = async (contratoId, datos, solicitudIdActual = null) => {
    const { fecha, horaInicio, horaFin } = datos;

    // Condición para excluir la solicitud actual (para edición)
    const excludeCondition = solicitudIdActual
        ? { id: { [Op.ne]: solicitudIdActual } }
        : {};

    // 1. Verificar si hay horas extras pendientes
    const pendiente = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'horas_extras',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: HorasExtras,
            as: 'horasExtras',
            where: { estado: 'pendiente' }
        }]
    });

    if (pendiente) {
        return { valido: false, error: 'Ya existe una solicitud de horas extras pendiente para este contrato. Revísala antes de continuar.' };
    }

    // 2. Verificar solapamiento de horas con HH.EE. aprobadas del mismo día
    const horasExtrasAprobadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'horas_extras',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: HorasExtras,
            as: 'horasExtras',
            where: {
                estado: 'aprobada',
                ...condicionSolapamientoHoras(fecha, horaInicio, horaFin)
            }
        }]
    });

    if (horasExtrasAprobadas) {
        return { valido: false, error: 'Las horas se solapan con otra solicitud de horas extras aprobada del mismo día. Por favor, elige otro período.' };
    }

    // 3. Verificar que la fecha no tenga vacaciones aprobadas
    const vacacionesAprobadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'vacaciones',
            activo: true
        },
        include: [{
            model: Vacaciones,
            as: 'vacaciones',
            where: {
                estado: 'aprobada',
                fechaInicio: { [Op.lte]: fecha },
                fechaFin: { [Op.gte]: fecha }
            }
        }]
    });

    if (vacacionesAprobadas) {
        return { valido: false, error: 'No se pueden solicitar horas extras en una fecha con vacaciones aprobadas. Por favor, elige otro período.' };
    }

    // 4. Verificar que la fecha no tenga licencia justificada
    const licenciaJustificada = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'licencia',
            activo: true
        },
        include: [{
            model: Licencia,
            as: 'licencia',
            where: {
                estado: 'justificada',
                fechaInicio: { [Op.lte]: fecha },
                fechaFin: { [Op.gte]: fecha }
            }
        }]
    });

    if (licenciaJustificada) {
        return { valido: false, error: 'No se pueden solicitar horas extras en una fecha con licencia justificada. Por favor, elige otro período.' };
    }

    return { valido: true };
};

module.exports = {
    validarHorasExtras
};

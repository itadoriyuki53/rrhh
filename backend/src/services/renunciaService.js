/**
 * @fileoverview Servicio de validación y lógica de negocio para renuncias.
 * Maneja la validación de pre-condiciones (ausencias activas), el cálculo de
 * fecha de baja efectiva y la validación para aprobación/procesamiento.
 * @module services/renunciaService
 */

const { Solicitud, Renuncia, Vacaciones, Licencia } = require('../models');

const { Op } = require('sequelize');

/**
 * Calcula la fecha de baja efectiva (HOY + 15 días de preaviso)
 * @returns {string} - Fecha en formato YYYY-MM-DD
 */
const calcularFechaBajaEfectiva = () => {
    const hoy = new Date();
    hoy.setDate(hoy.getDate() + 15);
    return hoy.toISOString().split('T')[0];
};

/**
 * Verifica si HOY el empleado tiene ausencia aprobada
 * @param {number} contratoId - ID del contrato
 * @returns {object} - { tieneAusencia: boolean, tipo?: string }
 */
const verificarAusenciaHoy = async (contratoId) => {
    const hoy = new Date().toISOString().split('T')[0];

    // Verificar vacaciones aprobadas que incluyan HOY
    const vacacionesHoy = await Solicitud.findOne({
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
                fechaInicio: { [Op.lte]: hoy },
                fechaFin: { [Op.gte]: hoy }
            }
        }]
    });

    if (vacacionesHoy) {
        return { tieneAusencia: true, tipo: 'vacaciones aprobadas' };
    }

    // Verificar licencia justificada que incluya HOY
    const licenciaHoy = await Solicitud.findOne({
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
                fechaInicio: { [Op.lte]: hoy },
                fechaFin: { [Op.gte]: hoy }
            }
        }]
    });

    if (licenciaHoy) {
        return { tieneAusencia: true, tipo: 'licencia justificada' };
    }

    return { tieneAusencia: false };
};

/**
 * Valida creación de renuncia
 * @param {number} contratoId - ID del contrato
 * @param {number|null} solicitudIdActual - ID de solicitud actual (para edición)
 * @returns {object} - { valido: boolean, error?: string, fechaBajaEfectiva?: string }
 */
const validarRenuncia = async (contratoId, solicitudIdActual = null) => {
    // Condición para excluir la solicitud actual (para edición)
    const excludeCondition = solicitudIdActual
        ? { id: { [Op.ne]: solicitudIdActual } }
        : {};

    // 1. Verificar si hay renuncia pendiente
    const pendiente = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'renuncia',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: Renuncia,
            as: 'renuncia',
            where: { estado: 'pendiente' }
        }]
    });

    if (pendiente) {
        return { valido: false, error: 'Ya existe una renuncia pendiente para este empleado. Revísala antes de continuar.' };
    }

    // 2. Verificar que HOY no tenga ausencia aprobada
    const ausencia = await verificarAusenciaHoy(contratoId);
    if (ausencia.tieneAusencia) {
        return {
            valido: false,
            error: `No se puede presentar renuncia mientras el empleado tiene ${ausencia.tipo}. Por favor, elige otro período.`
        };
    }

    // 3. Calcular fecha de baja efectiva
    return {
        valido: true,
        fechaBajaEfectiva: calcularFechaBajaEfectiva()
    };
};

/**
 * Valida aprobación/procesamiento de renuncia
 * @param {number} contratoId - ID del contrato
 * @returns {object} - { valido: boolean, error?: string }
 */
const validarAprobacion = async (contratoId) => {
    const ausencia = await verificarAusenciaHoy(contratoId);
    if (ausencia.tieneAusencia) {
        return {
            valido: false,
            error: `No se puede procesar la renuncia mientras el empleado tiene ${ausencia.tipo}. Por favor, elige otro período.`
        };
    }
    return { valido: true };
};

module.exports = {
    validarRenuncia,
    validarAprobacion,
    calcularFechaBajaEfectiva,
    verificarAusenciaHoy
};

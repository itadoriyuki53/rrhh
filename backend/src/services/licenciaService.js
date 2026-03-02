/**
 * @fileoverview Servicio de validación y lógica de negocio para licencias.
 * Maneja la validación de solapamientos, verificación de licencias no aprobadas
 * y acciones post-justificación (impacto en fecha de baja por renuncia).
 * @module services/licenciaService
 */

const { Solicitud, Licencia, Vacaciones, HorasExtras, Renuncia } = require('../models');

const { Op } = require('sequelize');
const { condicionSolapamientoFechas, condicionFechaEnRango, calcularDiasEntre } = require('../helpers/solapamiento.helper');

/**
 * Obtiene licencias que NO cuentan como días trabajados
 */
const getLicenciasNoAprobadas = async (contrato) => {
    const solicitudes = await Solicitud.findAll({
        where: {
            contratoId: contrato.id,
            tipoSolicitud: 'licencia',
            activo: true,
        },
        include: [{
            model: Licencia,
            as: 'licencia',
            where: {
                estado: {
                    [Op.in]: ['injustificada', 'rechazada', 'pendiente'],
                },
            },
        }],
    });

    return solicitudes.map(s => s.licencia);
};

/**
 * Valida creación/edición de licencia
 * @param {number} contratoId - ID del contrato
 * @param {object} datos - Datos de la solicitud
 * @param {number|null} solicitudIdActual - ID de solicitud actual (para edición)
 * @returns {object} - { valido: boolean, error?: string }
 */
const validarLicencia = async (contratoId, datos, solicitudIdActual = null) => {
    const { fechaInicio, fechaFin } = datos;

    // Condición para excluir la solicitud actual (para edición)
    const excludeCondition = solicitudIdActual
        ? { id: { [Op.ne]: solicitudIdActual } }
        : {};

    // 1. Verificar si hay licencia pendiente
    const pendiente = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'licencia',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: Licencia,
            as: 'licencia',
            where: { estado: 'pendiente' }
        }]
    });

    if (pendiente) {
        return { valido: false, error: 'Ya existe una solicitud de licencia / inasistencia pendiente para este contrato. Revísala antes de continuar.' };
    }

    // 2. Verificar solapamiento con licencias justificadas
    const licenciasJustificadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'licencia',
            activo: true,
            ...excludeCondition
        },
        include: [{
            model: Licencia,
            as: 'licencia',
            where: {
                estado: 'justificada',
                ...condicionSolapamientoFechas(fechaInicio, fechaFin)
            }
        }]
    });

    if (licenciasJustificadas) {
        return { valido: false, error: 'Las fechas se solapan con una licencia justificada existente. Por favor, elige otro período.' };
    }

    // 3. Verificar solapamiento con vacaciones aprobadas
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
                ...condicionSolapamientoFechas(fechaInicio, fechaFin)
            }
        }]
    });

    if (vacacionesAprobadas) {
        return { valido: false, error: 'Las fechas se solapan con vacaciones aprobadas existentes. Por favor, elige otro período.' };
    }

    // 4. Verificar solapamiento con horas extras aprobadas
    const horasExtrasAprobadas = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'horas_extras',
            activo: true
        },
        include: [{
            model: HorasExtras,
            as: 'horasExtras',
            where: {
                estado: 'aprobada',
                fecha: {
                    [Op.between]: [fechaInicio, fechaFin]
                }
            }
        }]
    });

    if (horasExtrasAprobadas) {
        return { valido: false, error: 'Las fechas incluyen un día con horas extras aprobadas. Por favor, elige otro período.' };
    }

    return { valido: true };
};

/**
 * Ejecuta acciones al justificar licencia
 * @param {number} contratoId - ID del contrato
 * @param {number} diasJustificados - Cantidad de días de licencia
 * @param {object} transaction - Transacción de Sequelize
 */
const onAprobacion = async (contratoId, diasJustificados, transaction) => {
    // Si hay renuncia aprobada, sumar días a fechaBajaEfectiva
    const renunciaAprobada = await Solicitud.findOne({
        where: {
            contratoId,
            tipoSolicitud: 'renuncia',
            activo: true
        },
        include: [{
            model: Renuncia,
            as: 'renuncia',
            where: { estado: 'aceptada' }
        }]
    });

    if (renunciaAprobada && renunciaAprobada.renuncia) {
        const fechaBaja = new Date(renunciaAprobada.renuncia.fechaBajaEfectiva);
        fechaBaja.setDate(fechaBaja.getDate() + diasJustificados);

        await renunciaAprobada.renuncia.update({
            fechaBajaEfectiva: fechaBaja.toISOString().split('T')[0]
        }, { transaction });
    }
};

module.exports = {
    validarLicencia,
    onAprobacion,
    getLicenciasNoAprobadas
};

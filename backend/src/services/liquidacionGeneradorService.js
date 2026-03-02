/**
 * @fileoverview Servicio de generación de liquidaciones.
 * Encapsula la lógica de alto nivel para generar liquidaciones de sueldo
 * individuales y en lote (cron job mensual).
 * Depende de `liquidacionService.js` para los cálculos de conceptos.
 * @module services/liquidacionGeneradorService
 */

const { Contrato, Liquidacion, Empleado } = require('../models');
const { calcularLiquidacionContrato } = require('./liquidacionService');
const { parseLocalDate } = require('../helpers/fechas.helper');

/**
 * Genera una liquidación para un contrato en un rango de fechas específico.
 * No verifica duplicados; quien llama debe hacerlo si es necesario.
 *
 * @param {object} contrato - Instancia de Contrato (con empleado cargado)
 * @param {string} fechaInicioStr - Fecha de inicio del período (YYYY-MM-DD)
 * @param {string} fechaFinStr - Fecha de fin del período (YYYY-MM-DD)
 * @param {object|null} [transaction=null] - Transacción de Sequelize opcional
 * @returns {Promise<object>} Instancia de Liquidacion creada
 */
const generarLiquidacionContratoIndividual = async (contrato, fechaInicioStr, fechaFinStr, transaction = null) => {
    const datosLiquidacion = await calcularLiquidacionContrato(contrato, fechaInicioStr, fechaFinStr);

    return await Liquidacion.create({
        contratoId: contrato.id,
        fechaInicio: fechaInicioStr,
        fechaFin: fechaFinStr,
        basico: datosLiquidacion.basico,
        antiguedad: datosLiquidacion.antiguedad,
        presentismo: datosLiquidacion.presentismo,
        horasExtras: datosLiquidacion.horasExtras,
        vacaciones: datosLiquidacion.vacaciones,
        sac: datosLiquidacion.sac,
        inasistencias: datosLiquidacion.inasistencias,
        totalBruto: datosLiquidacion.totalBruto,
        totalRetenciones: datosLiquidacion.totalRetenciones,
        vacacionesNoGozadas: datosLiquidacion.vacacionesNoGozadas,
        neto: datosLiquidacion.neto,
        detalleRemunerativo: datosLiquidacion.detalleRemunerativo,
        detalleRetenciones: datosLiquidacion.detalleRetenciones,
        estaPagada: false,
        activo: true,
    }, { transaction });
};

/**
 * Genera la liquidación final de un contrato al producirse una renuncia.
 * Determina automáticamente el período desde la última liquidación hasta la fecha de baja.
 *
 * @param {number} contratoId - ID del contrato a liquidar
 * @param {string} fechaFinStr - Fecha de baja efectiva (YYYY-MM-DD)
 * @param {object|null} [transaction=null] - Transacción de Sequelize opcional
 * @returns {Promise<object|null>} Instancia de Liquidacion creada, o `null` si ya estaba liquidado
 * @throws {Error} Si el contrato no existe
 */
const generarLiquidacionFinal = async (contratoId, fechaFinStr, transaction = null) => {
    const contrato = await Contrato.findByPk(contratoId, {
        include: [{
            model: Empleado,
            as: 'empleado',
            attributes: ['id', 'espacioTrabajoId']
        }],
        transaction
    });

    if (!contrato) throw new Error('Contrato no encontrado');

    // Determinar fecha de inicio: day after última liquidación, o inicio de contrato
    const ultimaLiquidacion = await Liquidacion.findOne({
        where: { contratoId: contrato.id },
        order: [['fechaFin', 'DESC']],
        transaction
    });

    let fechaInicioLiquidacion;
    if (ultimaLiquidacion) {
        const fechaUltimaFin = parseLocalDate(ultimaLiquidacion.fechaFin);
        fechaInicioLiquidacion = new Date(fechaUltimaFin);
        fechaInicioLiquidacion.setDate(fechaInicioLiquidacion.getDate() + 1);
    } else {
        fechaInicioLiquidacion = parseLocalDate(contrato.fechaInicio);
    }

    const fechaInicioStr = fechaInicioLiquidacion.toISOString().split('T')[0];

    // Evitar liquidar si ya está cubierto hasta o más allá de la fecha de baja
    if (fechaInicioStr > fechaFinStr) {
        console.log(`[liquidacionGenerador] Contrato ${contratoId} ya liquidado hasta ${fechaFinStr} o posterior.`);
        return null;
    }

    return await generarLiquidacionContratoIndividual(contrato, fechaInicioStr, fechaFinStr, transaction);
};

/**
 * Ejecuta el proceso de liquidación mensual automática para todos los contratos activos.
 * Genera una liquidación por el mes transcurrido para cada contrato en estado `en_curso`.
 * Utilizado por el cron job de liquidaciones.
 *
 * @returns {Promise<void>}
 */
const liquidarSueldos = async () => {
    try {
        console.log('[liquidacionGenerador] Ejecutando cron de liquidaciones automáticas...');

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Obtener todos los contratos activos en curso
        const contratosActivos = await Contrato.findAll({
            where: { estado: 'en_curso', activo: true },
            include: [{
                model: Empleado,
                as: 'empleado',
                attributes: ['espacioTrabajoId']
            }]
        });

        let liquidacionesGeneradas = 0;

        for (const contrato of contratosActivos) {
            try {
                // Determinar período a liquidar
                const ultimaLiquidacion = await Liquidacion.findOne({
                    where: { contratoId: contrato.id },
                    order: [['fechaFin', 'DESC']],
                });

                const fechaInicioContrato = parseLocalDate(contrato.fechaInicio);

                let fechaInicioLiquidacion;
                if (ultimaLiquidacion) {
                    const fechaUltimaFin = parseLocalDate(ultimaLiquidacion.fechaFin);
                    fechaInicioLiquidacion = new Date(fechaUltimaFin);
                    fechaInicioLiquidacion.setDate(fechaInicioLiquidacion.getDate() + 1);
                } else {
                    fechaInicioLiquidacion = new Date(fechaInicioContrato);
                }

                // Calcular fecha fin: un mes después menos un día
                const fechaFinLiquidacion = new Date(fechaInicioLiquidacion);
                fechaFinLiquidacion.setMonth(fechaFinLiquidacion.getMonth() + 1);
                fechaFinLiquidacion.setDate(fechaFinLiquidacion.getDate() - 1);

                const fechaInicioStr = fechaInicioLiquidacion.toISOString().split('T')[0];
                const fechaFinStr = fechaFinLiquidacion.toISOString().split('T')[0];

                // Verificar si ya existe liquidación para este período
                const liquidacionExistente = await Liquidacion.findOne({
                    where: { contratoId: contrato.id, fechaInicio: fechaInicioStr, fechaFin: fechaFinStr },
                });

                if (liquidacionExistente) continue;

                await generarLiquidacionContratoIndividual(contrato, fechaInicioStr, fechaFinStr);
                liquidacionesGeneradas++;
                console.log(`[liquidacionGenerador] Generada para contrato ${contrato.id}: ${fechaInicioStr} - ${fechaFinStr}`);
            } catch (err) {
                console.error(`[liquidacionGenerador] Error en contrato ${contrato.id}:`, err.message);
            }
        }

        const resumen = liquidacionesGeneradas > 0
            ? `${liquidacionesGeneradas} liquidaciones generadas`
            : 'No hay liquidaciones pendientes';
        console.log(`[liquidacionGenerador] Cron completado: ${resumen}`);

    } catch (err) {
        console.error('[liquidacionGenerador] Error general en cron:', err);
    }
};

module.exports = {
    generarLiquidacionContratoIndividual,
    generarLiquidacionFinal,
    liquidarSueldos,
};

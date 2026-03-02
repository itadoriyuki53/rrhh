/**
 * @fileoverview Cron job de actualización de estados de contratos.
 * Ejecuta diariamente la actualización de los estados (pendiente, en curso, finalizado)
 * basándose en la fecha actual.
 * @module jobs/contrato.cron
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const Contrato = require('../models/Contrato');

/**
 * Cron: ejecuta todos los días a las 00:00.
 * Actualiza el estado de los contratos según la fecha actual.
 */
cron.schedule('0 0 * * *', async () => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Contratos que aún no comienzan
        await Contrato.update(
            { estado: 'pendiente' },
            {
                where: {
                    fechaInicio: { [Op.gt]: hoy },
                    estado: { [Op.ne]: 'pendiente' }
                }
            }
        );

        // Contratos que están en curso
        await Contrato.update(
            { estado: 'en_curso' },
            {
                where: {
                    fechaInicio: { [Op.lte]: hoy },
                    [Op.or]: [
                        { fechaFin: null },
                        { fechaFin: { [Op.gte]: hoy } }
                    ],
                    estado: { [Op.ne]: 'en_curso' }
                }
            }
        );

        // Contratos que ya finalizaron
        await Contrato.update(
            { estado: 'finalizado' },
            {
                where: {
                    fechaFin: { [Op.lt]: hoy },
                    estado: { [Op.ne]: 'finalizado' }
                }
            }
        );
    } catch (error) {
        console.error('[cron] Error en cron de actualización de contratos:', error);
    }
});

module.exports = {
    startContratoCron: () => {
        console.log('✅ Cron de contratos iniciado');
    }
};

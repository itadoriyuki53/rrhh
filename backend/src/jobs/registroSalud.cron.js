/**
 * @fileoverview Cron job de validación de vigencia de registros de salud.
 * Ejecuta diariamente la verificación de la fecha de vencimiento.
 * @module jobs/registroSalud.cron
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const RegistroSalud = require('../models/RegistroSalud');

/**
 * Cron: ejecuta todos los días a las 00:00.
 * Marca como no vigentes los registros de salud cuya fecha de vencimiento ya pasó.
 */
cron.schedule('0 0 * * *', async () => {
    try {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const [affectedCount] = await RegistroSalud.update(
            { vigente: false },
            {
                where: {
                    vigente: true,
                    fechaVencimiento: {
                        [Op.lt]: hoy,
                    },
                },
            }
        );

        if (affectedCount > 0) {
            console.log(`[cron] Se vencieron ${affectedCount} registros de salud.`);
        }
    } catch (error) {
        console.error('[cron] Error al actualizar registros de salud:', error);
    }
});

module.exports = {
    startRegistroSaludCron: () => {
        console.log('✅ Cron de registros de salud iniciado');
    }
};
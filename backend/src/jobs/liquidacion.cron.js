/**
 * @fileoverview Cron job de liquidaciones mensuales.
 * Ejecuta diariamente la generación automática de liquidaciones
 * para todos los contratos activos que completen su mes.
 * @module jobs/liquidacion.cron
 */

const cron = require('node-cron');
const { liquidarSueldos } = require('../services/liquidacionGeneradorService');

/**
 * Cron: ejecuta todos los días a las 00:00 UTC.
 * Genera liquidaciones mensuales para contratos en curso.
 */
cron.schedule('0 0 * * *', async () => {
    await liquidarSueldos();
});

module.exports = {
    startLiquidacionCron: () => {
        console.log('[cron] Cron de liquidaciones iniciado');
    },
};

/**
 * @fileoverview Cron job de procesamiento automático de renuncias.
 * Ejecuta diariamente la transición a 'procesada' de renuncias
 * cuya `fechaBajaEfectiva` ya haya llegado.
 * @module jobs/renuncia.cron
 */

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Renuncia, Solicitud, Contrato } = require('../models');
const { generarLiquidacionFinal } = require('../services/liquidacionGeneradorService');

/**
 * Cron: ejecuta todos los días a las 01:00.
 * Procesa automáticamente las renuncias aceptadas que alcanzan su fecha de baja efectiva.
 * Actualiza el contrato y genera la liquidación final.
 */
cron.schedule('0 1 * * *', async () => {
    try {
        console.log('[cron] Ejecutando procesamiento automático de renuncias...');

        const hoy = new Date();
        const hoyStr = hoy.toISOString().split('T')[0];

        // Buscar renuncias aceptadas cuya fecha de baja efectiva ya llegó o pasó
        const renunciasAceptadas = await Renuncia.findAll({
            where: {
                estado: 'aceptada',
                fechaBajaEfectiva: { [Op.lte]: hoyStr }
            },
            include: [{
                model: Solicitud,
                as: 'solicitud',
                where: { activo: true }
            }]
        });

        if (renunciasAceptadas.length > 0) {
            console.log(`[cron] Se encontraron ${renunciasAceptadas.length} renuncias para procesar.`);
        }

        for (const renuncia of renunciasAceptadas) {
            try {
                // 1. Marcar renuncia como procesada
                await renuncia.update({ estado: 'procesada' });

                // 2. Actualizar fecha fin del contrato al día de hoy
                await Contrato.update(
                    { fechaFin: hoyStr },
                    {
                        where: { id: renuncia.solicitud.contratoId },
                        individualHooks: true
                    }
                );

                // 3. Generar liquidación final hasta hoy
                await generarLiquidacionFinal(renuncia.solicitud.contratoId, hoyStr);

                console.log(`[cron] Renuncia ${renuncia.id} procesada para contrato ${renuncia.solicitud.contratoId}`);
            } catch (error) {
                console.error(`[cron] Error al procesar renuncia ${renuncia.id}:`, error);
            }
        }
    } catch (error) {
        console.error('[cron] Error en cron de renuncias:', error);
    }
});

module.exports = {
    startRenunciaCron: () => {
        console.log('✅ Cron de renuncias iniciado');
    }
};

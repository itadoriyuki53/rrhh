/**
 * @fileoverview Controller de Parámetros Laborales.
 * Gestiona las configuraciones de reglas de negocio específicas para cada Espacio de Trabajo.
 * Actualmente centraliza la gestión del límite de ausencias injustificadas.
 * @module controllers/parametroLaboralController
 */

const { ParametroLaboral } = require('../models');

// Helpers
const { badRequest, serverError, ok } = require('../helpers/respuestas.helper');

/**
 * Obtiene los parámetros laborales configurados para un espacio de trabajo específico.
 * Si el parámetro solicitado no existe, lo inicializa automáticamente con valores por defecto.
 *
 * @param {import('express').Request} req - Request con `query.espacioTrabajoId`
 * @param {import('express').Response} res - Response con el valor del límite de ausencias
 * @returns {Promise<void>}
 */
const get = async (req, res) => {
    try {
        const { espacioTrabajoId } = req.query;

        if (!espacioTrabajoId) {
            return badRequest(res, 'espacioTrabajoId es requerido');
        }

        // Buscar el parámetro de límite de ausencia para este espacio
        let parametro = await ParametroLaboral.findOne({
            where: {
                espacioTrabajoId: parseInt(espacioTrabajoId),
                tipo: 'limite_ausencia_injustificada'
            }
        });

        // Si no existe, crear con valor por defecto (mecanismo de auto-inicialización)
        if (!parametro) {
            parametro = await ParametroLaboral.create({
                tipo: 'limite_ausencia_injustificada',
                valor: '1',
                descripcion: 'Límite de ausencias injustificadas permitidas por mes',
                esObligatorio: true,
                espacioTrabajoId: parseInt(espacioTrabajoId)
            });
        }

        // Devolver en formato compatible con frontend
        res.json({
            limiteAusenciaInjustificada: parseInt(parametro.valor)
        });
    } catch (error) {
        console.error('Error al obtener parámetros laborales:', error);
        return serverError(res, error);
    }
};

/**
 * Actualiza los parámetros laborales persistidos para un espacio de trabajo.
 * Soporta la lógica de "upsert" (actualiza si existe, crea si no).
 *
 * @param {import('express').Request} req - Request con `espacioTrabajoId` y nuevos valores en el body
 * @param {import('express').Response} res - Response con mensaje de confirmación y nuevos valores
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        const { limiteAusenciaInjustificada, espacioTrabajoId } = req.body;

        if (!espacioTrabajoId) {
            return badRequest(res, 'espacioTrabajoId es requerido');
        }

        // Buscar el parámetro existente
        let parametro = await ParametroLaboral.findOne({
            where: {
                espacioTrabajoId: parseInt(espacioTrabajoId),
                tipo: 'limite_ausencia_injustificada'
            }
        });

        if (!parametro) {
            // Crear si no existe
            parametro = await ParametroLaboral.create({
                tipo: 'limite_ausencia_injustificada',
                valor: limiteAusenciaInjustificada !== undefined ? limiteAusenciaInjustificada.toString() : '1',
                descripcion: 'Límite de ausencias injustificadas permitidas por mes',
                esObligatorio: true,
                espacioTrabajoId: parseInt(espacioTrabajoId)
            });
        } else {
            // Actualizar
            if (limiteAusenciaInjustificada !== undefined) {
                parametro.valor = limiteAusenciaInjustificada.toString();
            }
            await parametro.save();
        }

        res.json({
            message: 'Parámetros laborales actualizados exitosamente',
            limiteAusenciaInjustificada: parseInt(parametro.valor)
        });
    } catch (error) {
        console.error('Error al actualizar parámetros laborales:', error);
        return badRequest(res, error.message);
    }
};

module.exports = {
    get,
    update,
};

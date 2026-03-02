/**
 * @fileoverview Controller de Conceptos Salariales.
 * Maneja la gestión de los conceptos que integran la liquidación de sueldos
 * (remunerativos, deducciones), permitiendo su personalización por espacio de trabajo.
 * @module controllers/conceptoSalarialController
 */

const { ConceptoSalarial } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok, created } = require('../helpers/respuestas.helper');

/**
 * Obtiene todos los conceptos salariales con filtros opcionales.
 * 
 * @param {import('express').Request} req - Request con query params: `tipo`, `activo`, `espacioTrabajoId`
 * @param {import('express').Response} res - Response con lista de conceptos
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { tipo, activo, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        const where = {};

        if (tipo) where.tipo = tipo;

        if (activo !== undefined) {
            where.activo = activo === 'true' || activo === true || activo === '1';
        }

        if (espacioTrabajoId) {
            where.espacioTrabajoId = parseInt(espacioTrabajoId);
        }

        const result = await ConceptoSalarial.findAndCountAll({
            where,
            order: [['nombre', 'ASC']],
            limit,
            offset
        });

        return ok(res, construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error al obtener conceptos salariales:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene un concepto salarial por su ID único.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el concepto o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return notFound(res, 'Concepto salarial');
        }

        return ok(res, concepto);
    } catch (error) {
        console.error('Error al obtener concepto salarial:', error);
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo concepto salarial asociado a un espacio de trabajo.
 *
 * @param {import('express').Request} req - Request con `nombre`, `tipo`, `esPorcentaje`, `valor`, `espacioTrabajoId`
 * @param {import('express').Response} res - Response con el concepto creado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    try {
        const { nombre, tipo, esPorcentaje, valor, espacioTrabajoId } = req.body;

        // Validar campos requeridos
        if (!nombre || !tipo || valor === undefined || !espacioTrabajoId) {
            return badRequest(res, 'Nombre, tipo, valor y espacioTrabajoId son requeridos');
        }

        const concepto = await ConceptoSalarial.create({
            nombre,
            tipo,
            esPorcentaje: esPorcentaje || false,
            valor,
            espacioTrabajoId: parseInt(espacioTrabajoId),
            activo: true,
        });

        return created(res, { message: 'Concepto salarial creado exitosamente', concepto });
    } catch (error) {
        console.error('Error al crear concepto salarial:', error);
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza los datos de un concepto salarial existente.
 *
 * @param {import('express').Request} req - Request con `params.id` y campos opcionales del body
 * @param {import('express').Response} res - Response con el concepto actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, tipo, esPorcentaje, valor, activo, espacioTrabajoId } = req.body;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return notFound(res, 'Concepto salarial');
        }

        if (nombre !== undefined) concepto.nombre = nombre;
        if (tipo !== undefined) concepto.tipo = tipo;
        if (esPorcentaje !== undefined) concepto.esPorcentaje = esPorcentaje;
        if (valor !== undefined) concepto.valor = valor;
        if (activo !== undefined) concepto.activo = activo;
        if (espacioTrabajoId !== undefined) concepto.espacioTrabajoId = parseInt(espacioTrabajoId);

        await concepto.save();

        return ok(res, { message: 'Concepto salarial actualizado exitosamente', concepto });
    } catch (error) {
        console.error('Error al actualizar concepto salarial:', error);
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Elimina físicamente un concepto salarial.
 * Valida que no se intente eliminar conceptos base del sistema (obligatorios).
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response confirmando la eliminación
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const concepto = await ConceptoSalarial.findByPk(id);

        if (!concepto) {
            return notFound(res, 'Concepto salarial');
        }

        // Validar que no sea un concepto obligatorio (seed)
        const conceptosObligatorios = ['Jubilación', 'Obra Social', 'PAMI', 'Cuota Sindical'];
        if (conceptosObligatorios.includes(concepto.nombre)) {
            return badRequest(res, 'No se puede eliminar un concepto obligatorio');
        }

        await concepto.destroy();

        return ok(res, { message: 'Concepto salarial eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar concepto salarial:', error);
        return serverError(res, error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
};

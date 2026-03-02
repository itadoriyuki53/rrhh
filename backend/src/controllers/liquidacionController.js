/**
 * @fileoverview Controller de Liquidaciones.
 * Maneja las operaciones CRUD para liquidaciones de sueldo.
 * Utiliza el servicio de generación de liquidaciones y helpers
 * de permisos y workspace para la separación de responsabilidades.
 * @module controllers/liquidacionController
 */

const { Liquidacion, Contrato, Empleado, Usuario, EspacioTrabajo, Puesto } = require('../models');
const { Op } = require('sequelize');
const { liquidarSueldos } = require('../services/liquidacionGeneradorService');

// Helpers
const { resolverScopeContratos } = require('../helpers/workspace.helper');
const { parsearPaginacion } = require('../helpers/paginacion.helper');
const { forbidden, notFound, badRequest, serverError } = require('../helpers/respuestas.helper');
const { tienePermiso } = require('../helpers/permisos.helper');

// ──────────────────────────────────────────────────────────────────────────────
// INCLUDES DE SEQUELIZE (reutilizables)
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Include estándar para cargar el contrato con empleado, usuario y espacio de trabajo.
 * @constant {object[]}
 */
const includeContrato = [{
    model: Contrato,
    as: 'contrato',
    include: [
        {
            model: Empleado,
            as: 'empleado',
            include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
                { model: EspacioTrabajo, as: 'espacioTrabajo', attributes: ['id', 'nombre'] }
            ]
        },
        { model: Puesto, as: 'puestos', through: { attributes: [] } }
    ],
    attributes: ['id', 'tipoContrato', 'fechaInicio', 'fechaFin', 'estado'],
}];

// ──────────────────────────────────────────────────────────────────────────────
// CONTROLLERS
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Obtiene todas las liquidaciones con filtros opcionales y paginación.
 * Aplica scope de acceso según el tipo de usuario en sesión.
 *
 * @param {import('express').Request} req - Request con query params:
 *   `empleadoId`, `espacioTrabajoId`, `contratoId`, `fechaDesde`, `fechaHasta`,
 *   `estado`, `activo`, `estaPagada`, `page`, `limit`
 * @param {import('express').Response} res - Response con lista paginada de liquidaciones
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const {
            empleadoId, espacioTrabajoId, contratoId,
            fechaDesde, fechaHasta, estado,
            activo, estaPagada,
        } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        const where = {};

        if (activo !== undefined) {
            where.activo = activo === 'true' || activo === '1';
        }
        if (estado) where.estado = estado;
        if (estaPagada !== undefined) {
            where.estaPagada = estaPagada === 'true' || estaPagada === '1';
        }
        if (fechaDesde || fechaHasta) {
            where.fechaInicio = {};
            if (fechaDesde) where.fechaInicio[Op.gte] = fechaDesde;
            if (fechaHasta) where.fechaInicio[Op.lte] = fechaHasta;
        }

        // Resolver scope de contratos accesibles
        const scope = await resolverScopeContratos(
            req.session,
            { empleadoId, espacioTrabajoId, contratoId },
            'liquidaciones'
        );

        if (scope.respuestaVacia) {
            return res.json({ liquidaciones: [], total: 0, page, totalPages: 0 });
        }

        if (scope.contratoIds !== null) {
            where.contratoId = { [Op.in]: scope.contratoIds };
        }

        const { count, rows } = await Liquidacion.findAndCountAll({
            where,
            include: includeContrato,
            order: [['estaPagada', 'ASC'], ['fechaInicio', 'DESC']],
            limit,
            offset,
        });

        res.json({
            liquidaciones: rows,
            total: count,
            page,
            totalPages: Math.ceil(count / limit),
        });
    } catch (err) {
        console.error('[liquidacionController.getAll]', err);
        serverError(res, err);
    }
};

/**
 * Obtiene una liquidación por ID.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con la liquidación o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const liquidacion = await Liquidacion.findByPk(req.params.id, { include: includeContrato });
        if (!liquidacion) return notFound(res, 'Liquidación');
        res.json(liquidacion);
    } catch (err) {
        console.error('[liquidacionController.getById]', err);
        serverError(res, err);
    }
};

/**
 * Actualiza los campos de una liquidación existente.
 * Solo modificable por usuarios con permiso `actualizar`.
 *
 * @param {import('express').Request} req - Request con `params.id` y body con campos:
 *   `basico`, `antiguedad`, `presentismo`, `horasExtras`, `vacaciones`, `sac`,
 *   `inasistencias`, `totalBruto`, `totalRetenciones`, `vacacionesNoGozadas`,
 *   `neto`, `detalleConceptos`, `detalleRemunerativo`, `detalleRetenciones`,
 *   `estado`, `estaPagada`
 * @param {import('express').Response} res - Response con la liquidación actualizada
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'liquidaciones', 'actualizar'))) {
            return forbidden(res, 'No tiene permiso para editar liquidaciones');
        }

        const liquidacion = await Liquidacion.findByPk(req.params.id);
        if (!liquidacion) return notFound(res, 'Liquidación');

        // Actualizar solo los campos presentes en el body
        const camposActualizables = [
            'basico', 'antiguedad', 'presentismo', 'horasExtras', 'vacaciones', 'sac',
            'inasistencias', 'totalBruto', 'totalRetenciones', 'vacacionesNoGozadas',
            'neto', 'detalleConceptos', 'detalleRemunerativo', 'detalleRetenciones',
            'estado', 'estaPagada',
        ];

        camposActualizables.forEach(campo => {
            if (req.body[campo] !== undefined) {
                liquidacion[campo] = req.body[campo];
            }
        });

        await liquidacion.save();

        const liquidacionActualizada = await Liquidacion.findByPk(req.params.id, { include: includeContrato });
        res.json({ message: 'Liquidación actualizada exitosamente', liquidacion: liquidacionActualizada });
    } catch (err) {
        console.error('[liquidacionController.update]', err);
        serverError(res, err);
    }
};

/**
 * Desactiva (soft delete) una liquidación.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con mensaje de confirmación
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'liquidaciones', 'eliminar'))) {
            return forbidden(res, 'No tiene permiso para desactivar liquidaciones');
        }

        const liquidacion = await Liquidacion.findByPk(req.params.id);
        if (!liquidacion) return notFound(res, 'Liquidación');

        liquidacion.activo = false;
        await liquidacion.save();

        res.json({ message: 'Liquidación eliminada exitosamente' });
    } catch (err) {
        console.error('[liquidacionController.remove]', err);
        serverError(res, err);
    }
};

/**
 * Reactiva una liquidación previamente desactivada.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con la liquidación reactivada
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const liquidacion = await Liquidacion.findByPk(req.params.id);
        if (!liquidacion) return notFound(res, 'Liquidación');

        liquidacion.activo = true;
        await liquidacion.save();

        const liquidacionActualizada = await Liquidacion.findByPk(req.params.id, { include: includeContrato });
        res.json({ message: 'Liquidación reactivada exitosamente', liquidacion: liquidacionActualizada });
    } catch (err) {
        console.error('[liquidacionController.reactivate]', err);
        serverError(res, err);
    }
};

/**
 * Desactiva múltiples liquidaciones en una sola operación (bulk soft delete).
 *
 * @param {import('express').Request} req - Request con body `{ ids: number[] }`
 * @param {import('express').Response} res - Response con mensaje de confirmación
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'liquidaciones', 'eliminar'))) {
            return forbidden(res, 'No tiene permiso para desactivar liquidaciones en lote');
        }

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        await Liquidacion.update({ activo: false }, { where: { id: { [Op.in]: ids } } });
        res.json({ message: `${ids.length} liquidaciones eliminadas exitosamente` });
    } catch (err) {
        console.error('[liquidacionController.bulkRemove]', err);
        serverError(res, err);
    }
};

/**
 * Ejecuta manualmente el proceso de liquidación de sueldos para todos los contratos activos.
 * Requiere permiso de crear o actualizar en el módulo liquidaciones.
 *
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response con mensaje de confirmación
 * @returns {Promise<void>}
 */
const ejecutarLiquidacion = async (req, res) => {
    try {
        const puedeCear = await tienePermiso(req.session, 'liquidaciones', 'crear');
        const puedeActualizar = await tienePermiso(req.session, 'liquidaciones', 'actualizar');

        if (!puedeCear && !puedeActualizar) {
            return forbidden(res, 'No tiene permiso para ejecutar liquidaciones');
        }

        await liquidarSueldos();
        res.json({ message: 'Liquidaciones ejecutadas exitosamente' });
    } catch (err) {
        console.error('[liquidacionController.ejecutarLiquidacion]', err);
        serverError(res, err);
    }
};

// ──────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ──────────────────────────────────────────────────────────────────────────────

module.exports = {
    getAll,
    getById,
    update,
    remove,
    reactivate,
    bulkRemove,
    ejecutarLiquidacion,
};

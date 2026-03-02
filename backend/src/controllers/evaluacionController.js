/**
 * @fileoverview Controller de Evaluaciones de Desempeño.
 * Gestiona el proceso de evaluación de los empleados por parte de sus superiores o pares.
 * Soporta la creación masiva de evaluaciones por periodo y la gestión de feedback/puntuación.
 * @module controllers/evaluacionController
 */

const { Evaluacion, Contrato, Empleado, Puesto, Empresa, Departamento, Area, Usuario, EspacioTrabajo, Rol, Permiso } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok, forbidden } = require('../helpers/respuestas.helper');
const { tienePermiso, respuestaPermisoDenegado } = require('../helpers/permisos.helper');
const { resolverScopeContratos } = require('../helpers/workspace.helper');



/**
 * Generador de configuración de inclusión para cargar detalles completos de un contrato.
 * Utilizado para cargar tanto al evaluado como a los evaluadores.
 *
 * @param {string} alias - Alias de la relación en el modelo Evaluacion
 * @returns {object} Configuración de inclusión para Sequelize
 */
const includeContratoDetalle = (alias) => ({
    model: Contrato,
    as: alias,
    include: [
        {
            model: Empleado,
            as: 'empleado',
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    attributes: ['nombre', 'apellido']
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre']
                }
            ]
        },
        {
            model: Puesto,
            as: 'puestos',
            through: { attributes: [] },
            include: [{
                model: Departamento,
                as: 'departamento',
                include: [{
                    model: Area,
                    as: 'area',
                    include: [{
                        model: Empresa,
                        as: 'empresa'
                    }]
                }]
            }]
        }
    ]
});

/**
 * Obtiene todas las evaluaciones con filtros avanzados y paginación.
 * Implementa lógica de visibilidad según el rol del usuario (Admin ve todo, Empleado ve las suyas).
 *
 * @param {import('express').Request} req - Request con query params de filtrado
 * @param {import('express').Response} res - Response con lista paginada de evaluaciones
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { activo, periodo, tipoEvaluacion, estado, escala, puntajeMin, puntajeMax, espacioTrabajoId, evaluadoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        // Resolver Scope de Contratos (quién puede ver a quién)
        const scope = await resolverScopeContratos(req.session, { empleadoId: evaluadoId, espacioTrabajoId }, 'evaluaciones');
        if (scope.respuestaVacia) {
            return res.json(construirRespuestaPaginada({ count: 0, rows: [] }, page, limit));
        }

        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo !== 'all') {
            where.activo = true;
        }

        if (periodo) where.periodo = periodo;
        if (tipoEvaluacion) where.tipoEvaluacion = tipoEvaluacion;
        if (estado) where.estado = estado;
        if (escala) where.escala = escala;

        if (puntajeMin || puntajeMax) {
            where.puntaje = {};
            if (puntajeMin) where.puntaje[Op.gte] = parseFloat(puntajeMin);
            if (puntajeMax) where.puntaje[Op.lte] = parseFloat(puntajeMax);
        }

        // Aplicar IDs de contratos del evaluado resueltos por el scope
        if (scope.contratoIds) {
            where.contratoEvaluadoId = { [Op.in]: scope.contratoIds };
        }

        const result = await Evaluacion.findAndCountAll({
            where,
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ],
            order: [
                [sequelize.literal(`CASE 
                    WHEN \`Evaluacion\`.\`estado\` = 'pendiente' THEN 1 
                    WHEN \`Evaluacion\`.\`estado\` = 'en_curso' THEN 2 
                    WHEN \`Evaluacion\`.\`estado\` = 'finalizada' THEN 3 
                    WHEN \`Evaluacion\`.\`estado\` = 'firmada' THEN 4 
                    ELSE 5 END`), 'ASC'],
                ['fecha', 'DESC']
            ],
            limit,
            offset,
            distinct: true,
        });

        res.json(construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error en evaluacionController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene una evaluación por su ID único.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con la evaluación o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const evaluacion = await Evaluacion.findByPk(req.params.id, {
            include: [
                includeContratoDetalle('contratoEvaluado'),
                includeContratoDetalle('evaluadores')
            ]
        });

        if (!evaluacion) {
            return notFound(res, 'Evaluación');
        }

        res.json(evaluacion);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea nuevas evaluaciones de desempeño. 
 * Soporta la creación masiva para múltiples contratos evaluados simultáneamente bajo un mismo periodo.
 * Valida consistencia de espacio de trabajo entre evaluado y evaluadores.
 *
 * @param {import('express').Request} req - Request con lista de `contratosEvaluadosIds` y `evaluadoresIds`
 * @param {import('express').Response} res - Response confirmando la cantidad de evaluaciones creadas
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'evaluaciones', 'crear'))) {
            await transaction.rollback();
            return respuestaPermisoDenegado(res, 'evaluaciones', 'crear');
        }
        const {
            periodo, tipoEvaluacion, fecha, evaluadoresIds, contratosEvaluadosIds,
            estado, puntaje, escala, feedback, reconocidoPorEmpleado, fechaReconocimiento, notas
        } = req.body;

        // Validaciones básicas
        if (!contratosEvaluadosIds || !Array.isArray(contratosEvaluadosIds) || contratosEvaluadosIds.length === 0) {
            await transaction.rollback();
            return badRequest(res, 'Debe seleccionar al menos un contrato a evaluar');
        }

        if (!evaluadoresIds || !Array.isArray(evaluadoresIds) || evaluadoresIds.length === 0) {
            await transaction.rollback();
            return badRequest(res, 'Debe seleccionar al menos un evaluador');
        }

        // Validar intersección: un contrato no puede sea evaluador y evaluado a la vez
        const intersection = contratosEvaluadosIds.filter(id => evaluadoresIds.includes(id));
        if (intersection.length > 0) {
            await transaction.rollback();
            return badRequest(res, 'Un contrato no puede ser evaluador y evaluado simultáneamente');
        }

        // Validar evaluadores
        const evaluadores = await Contrato.findAll({
            where: { id: evaluadoresIds },
            include: [{ model: Empleado, as: 'empleado', attributes: ['espacioTrabajoId'] }]
        });

        if (evaluadores.length !== evaluadoresIds.length) {
            await transaction.rollback();
            return badRequest(res, 'Uno o más evaluadores no existen');
        }

        const espacioIdReferencia = evaluadores[0].empleado.espacioTrabajoId;

        // Crear evaluaciones en lote
        const evaluacionesCreadas = [];
        for (const contratoEvaluadoId of contratosEvaluadosIds) {
            const contratoEvaluado = await Contrato.findByPk(contratoEvaluadoId, {
                include: [{ model: Empleado, as: 'empleado', attributes: ['espacioTrabajoId'] }]
            });

            if (!contratoEvaluado) throw new Error(`Contrato evaluado ${contratoEvaluadoId} no encontrado`);
            if (contratoEvaluado.empleado.espacioTrabajoId !== espacioIdReferencia) {
                throw new Error(`Inconsistencia de espacio de trabajo para el contrato ${contratoEvaluadoId}`);
            }

            const nuevaEvaluacion = await Evaluacion.create({
                periodo, tipoEvaluacion, fecha, contratoEvaluadoId,
                estado: estado || 'pendiente', puntaje, escala, feedback,
                reconocidoPorEmpleado: reconocidoPorEmpleado || false,
                fechaReconocimiento: reconocidoPorEmpleado ? (fechaReconocimiento || new Date().toISOString().split('T')[0]) : null,
                notas: notas || null,
            }, { transaction });

            await nuevaEvaluacion.setEvaluadores(evaluadoresIds, { transaction });
            evaluacionesCreadas.push(nuevaEvaluacion);
        }

        await transaction.commit();
        res.status(201).json({ message: `${evaluacionesCreadas.length} evaluación(es) creada(s) correctamente` });

    } catch (error) {
        await transaction.rollback();
        return serverError(res, error);
    }
};

/**
 * Actualiza los datos de una evaluación existente.
 * Permite cambiar el estado (Pendiente -> Finalizada -> Firmada), evaluadores y feedback.
 *
 * @param {import('express').Request} req - Request con ID y datos a actualizar
 * @param {import('express').Response} res - Response con la evaluación actualizada
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
        if (!(await tienePermiso(req.session, 'evaluaciones', 'actualizar'))) {
            await transaction.rollback();
            return respuestaPermisoDenegado(res, 'evaluaciones', 'actualizar');
        }
        const { id } = req.params;
        const {
            periodo, tipoEvaluacion, fecha, evaluadoresIds, contratoEvaluadoId,
            estado, puntaje, escala, feedback, reconocidoPorEmpleado, fechaReconocimiento, notas
        } = req.body;

        const evaluacion = await Evaluacion.findByPk(id);
        if (!evaluacion) {
            await transaction.rollback();
            return notFound(res, 'Evaluación');
        }

        const targetEvaluadoId = contratoEvaluadoId || evaluacion.contratoEvaluadoId;
        const contratoEvaluado = await Contrato.findByPk(targetEvaluadoId, {
            include: [{ model: Empleado, as: 'empleado', attributes: ['espacioTrabajoId'] }]
        });
        if (!contratoEvaluado) {
            await transaction.rollback();
            return badRequest(res, 'Contrato a evaluar no encontrado');
        }

        // Lógica de fecha reconocimiento
        const updatedReconocido = reconocidoPorEmpleado !== undefined ? reconocidoPorEmpleado : evaluacion.reconocidoPorEmpleado;
        let newFechaReconocimiento = evaluacion.fechaReconocimiento;

        if (updatedReconocido && !evaluacion.fechaReconocimiento) {
            newFechaReconocimiento = fechaReconocimiento || new Date().toISOString().split('T')[0];
        } else if (!updatedReconocido) {
            newFechaReconocimiento = null;
        } else if (fechaReconocimiento !== undefined) {
            newFechaReconocimiento = fechaReconocimiento;
        }

        await evaluacion.update({
            periodo, tipoEvaluacion, fecha, contratoEvaluadoId: targetEvaluadoId,
            estado, puntaje, escala, feedback,
            reconocidoPorEmpleado: updatedReconocido,
            fechaReconocimiento: newFechaReconocimiento,
            notas: notas !== undefined ? notas : evaluacion.notas,
        }, { transaction });

        if (evaluadoresIds) {
            await evaluacion.setEvaluadores(evaluadoresIds, { transaction });
        }

        await transaction.commit();
        const evaluacionActualizada = await Evaluacion.findByPk(id, {
            include: [includeContratoDetalle('contratoEvaluado'), includeContratoDetalle('evaluadores')]
        });
        res.json(evaluacionActualizada);
    } catch (error) {
        await transaction.rollback();
        return serverError(res, error);
    }
};

/**
 * Desactiva una evaluación (eliminación lógica).
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'evaluaciones', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'evaluaciones', 'eliminar');
        }
        const evaluacion = await Evaluacion.findByPk(req.params.id);
        if (!evaluacion) return notFound(res, 'Evaluación');

        await evaluacion.update({ activo: false });
        res.json({ message: 'Evaluación desactivada correctamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples evaluaciones en lote.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'evaluaciones', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'evaluaciones', 'eliminar');
        }
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        await Evaluacion.update({ activo: false }, { where: { id: { [Op.in]: ids } } });
        res.json({ message: `${ids.length} evaluación(es) desactivada(s)` });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva una evaluación previamente desactivada.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const evaluacion = await Evaluacion.findByPk(req.params.id);
        if (!evaluacion) return notFound(res, 'Evaluación');

        await evaluacion.update({ activo: true });
        const evaluacionReactivada = await Evaluacion.findByPk(req.params.id, {
            include: [includeContratoDetalle('contratoEvaluado'), includeContratoDetalle('evaluadores')]
        });
        res.json(evaluacionReactivada);
    } catch (error) {
        return serverError(res, error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    remove,
    bulkRemove,
    reactivate,
};

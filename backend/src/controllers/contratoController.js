/**
 * @fileoverview Controller de Contratos Laborales.
 * Gestiona el ciclo de vida de los contratos de los empleados, incluyendo la asignación de puestos,
 * definición de salarios, estados contractuales y roles de acceso al sistema.
 * @module controllers/contratoController
 */

const { Contrato, Empleado, Puesto, Departamento, Area, Empresa, ContratoPuesto, Rol, Usuario, EspacioTrabajo, Evaluacion, Solicitud, Liquidacion } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok, created } = require('../helpers/respuestas.helper');
const { resolverScopeContratos } = require('../helpers/workspace.helper');

/**
 * Define las relaciones estándar para incluir en las consultas de contratos.
 * Incluye empleado, usuario, espacio de trabajo, rol y la jerarquia completa de puestos.
 * @constant {object[]}
 */
const includeRelations = [
    {
        model: Empleado,
        as: 'empleado',
        include: [
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'nombre', 'apellido']
            },
            {
                model: EspacioTrabajo,
                as: 'espacioTrabajo',
                attributes: ['id', 'nombre']
            }
        ]
    },
    {
        model: Rol,
        as: 'rol',
        required: false
    },
    {
        model: Puesto,
        as: 'puestos',
        through: { attributes: [] }, // No incluir campos de la tabla junction
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
];

/**
 * Obtiene todos los contratos con soporte para filtros de búsqueda y paginación.
 * Aplica lógica de visibilidad según el espacio de trabajo del usuario en sesión.
 *
 * @param {import('express').Request} req - Request con query params: `empleadoId`, `tipoContrato`, `estado`, `search`, `activo`, `salarioMin`, `salarioMax`
 * @param {import('express').Response} res - Response con lista paginada de contratos
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { empleadoId, tipoContrato, estado, search, activo, salarioMin, salarioMax, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        // Resolver Scope de Contratos según usuario en sesión
        const scope = await resolverScopeContratos(req.session, { empleadoId, espacioTrabajoId }, 'contratos');
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

        // Aplicar IDs de contratos resueltos por el scope
        if (scope.contratoIds) {
            where.id = { [Op.in]: scope.contratoIds };
        }

        if (tipoContrato) where.tipoContrato = tipoContrato;
        if (estado) where.estado = estado;

        if (salarioMin || salarioMax) {
            where.salario = {};
            if (salarioMin) where.salario[Op.gte] = parseFloat(salarioMin);
            if (salarioMax) where.salario[Op.lte] = parseFloat(salarioMax);
        }

        const result = await Contrato.findAndCountAll({
            where,
            include: includeRelations,
            order: [
                [sequelize.literal(`CASE 
                    WHEN \`Contrato\`.\`estado\` = 'pendiente' THEN 1 
                    WHEN \`Contrato\`.\`estado\` = 'en_curso' THEN 2 
                    WHEN \`Contrato\`.\`estado\` = 'finalizado' THEN 3 
                    ELSE 4 END`), 'ASC'],
                ['fechaInicio', 'DESC']
            ],
            limit,
            offset,
            distinct: true,
        });

        // Filtrar por nombre de empleado si hay búsqueda (filtro post-query por simplicidad con includes complejos)
        if (search) {
            const searchLower = search.toLowerCase();
            result.rows = result.rows.filter(contrato => {
                const empleado = contrato.empleado;
                if (!empleado || !empleado.usuario) return false;
                const fullName = `${empleado.usuario.nombre} ${empleado.usuario.apellido}`.toLowerCase();
                const documento = empleado.numeroDocumento?.toLowerCase() || '';
                return fullName.includes(searchLower) || documento.includes(searchLower);
            });
            result.count = result.rows.length; // Ajustar count para la paginación local si aplica
        }

        return ok(res, construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error en contratoController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene los detalles de un contrato específico por ID.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el contrato o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: includeRelations,
        });

        if (!contrato) {
            return notFound(res, 'Contrato');
        }

        return ok(res, contrato);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo contrato para un empleado.
 * Realiza múltiples validaciones: existencia del empleado, consistencia de puestos y empresa,
 * pertenencia al mismo espacio de trabajo y ausencia de solapamientos de cargos activos.
 *
 * @param {import('express').Request} req - Request con datos del contrato y array de `puestoIds`
 * @param {import('express').Response} res - Response con el nuevo contrato creado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { empleadoId, puestoIds, ...contratoData } = req.body;

        if (!puestoIds || !Array.isArray(puestoIds) || puestoIds.length === 0) {
            await transaction.rollback();
            return badRequest(res, 'Debe seleccionar al menos un puesto');
        }

        // Obtener todos los puestos con sus empresas
        const puestos = await Puesto.findAll({
            where: { id: puestoIds },
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
        });

        if (puestos.length !== puestoIds.length) {
            await transaction.rollback();
            return badRequest(res, 'Uno o más puestos no existen');
        }

        // Validar que el empleado exista y obtener su espacio de trabajo
        const empleado = await Empleado.findByPk(empleadoId);
        if (!empleado) {
            await transaction.rollback();
            return badRequest(res, 'El empleado seleccionado no existe');
        }

        const espacioId = empleado.espacioTrabajoId;

        // Validar que todos los puestos pertenecen al mismo espacio de trabajo que el empleado
        for (const puesto of puestos) {
            const puestoEspacioId = puesto.departamento?.area?.empresa?.espacioTrabajoId;
            if (puestoEspacioId !== espacioId) {
                await transaction.rollback();
                return badRequest(res, `El puesto "${puesto.nombre}" pertenece a un espacio de trabajo diferente al del empleado.`);
            }
        }

        // Si hay rol, validar que sea del mismo espacio
        if (contratoData.rolId) {
            const rol = await Rol.findByPk(contratoData.rolId);
            if (!rol || rol.espacioTrabajoId !== espacioId) {
                await transaction.rollback();
                return badRequest(res, 'El rol seleccionado no pertenece al mismo espacio de trabajo que el empleado.');
            }
        }

        // Validar que todos los puestos pertenecen a la misma empresa
        const empresaIds = [...new Set(puestos.map(p => p.departamento?.area?.empresa?.id))];
        if (empresaIds.length > 1) {
            await transaction.rollback();
            return badRequest(res, 'Todos los puestos deben pertenecer a la misma empresa. Para asignar puestos de diferentes empresas, cree contratos separados.');
        }

        // Validar que el empleado no tenga ya un contrato activo (y no finalizado) para alguno de estos puestos
        const contratosExistentes = await ContratoPuesto.findAll({
            where: { puestoId: puestoIds },
            include: [{
                model: Contrato,
                as: 'contrato',
                where: {
                    empleadoId: empleadoId,
                    activo: true,
                    estado: { [Op.ne]: 'finalizado' } // Permitir si el contrato anterior está finalizado
                }
            }]
        });

        if (contratosExistentes.length > 0) {
            const puestosConContrato = contratosExistentes.map(cp => cp.puestoId);
            const puestosNombres = puestos
                .filter(p => puestosConContrato.includes(p.id))
                .map(p => p.nombre)
                .join(', ');

            await transaction.rollback();
            return badRequest(res, `El empleado ya tiene un contrato activo (no finalizado) para el/los puesto(s): ${puestosNombres}`);
        }

        // Crear el contrato
        const contrato = await Contrato.create({
            ...contratoData,
            empleadoId
        }, { transaction });

        // Asociar los puestos al contrato
        await ContratoPuesto.bulkCreate(
            puestoIds.map(puestoId => ({
                contratoId: contrato.id,
                puestoId: puestoId
            })),
            { transaction }
        );

        await transaction.commit();

        // Obtener el contrato con todas las relaciones
        const contratoConRelaciones = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        return created(res, contratoConRelaciones);
    } catch (error) {
        await transaction.rollback();
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza los datos de un contrato existente.
 * Permite cambiar salarios, fechas, estados y puestos asociados (con transacciones).
 * No permite editar contratos que ya se encuentran en estado 'finalizado'.
 *
 * @param {import('express').Request} req - Request con `params.id` y datos a actualizar
 * @param {import('express').Response} res - Response con el contrato actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { puestoIds, ...contratoData } = req.body;
        const contrato = await Contrato.findByPk(req.params.id);

        if (!contrato) {
            await transaction.rollback();
            return notFound(res, 'Contrato');
        }

        // No permitir editar contratos finalizados
        if (contrato.estado === 'finalizado') {
            await transaction.rollback();
            return badRequest(res, 'No se puede editar un contrato finalizado. Solo puede visualizarlo o desactivarlo.');
        }

        // Si cambia el rol, validar espacio
        if (contratoData.rolId && contratoData.rolId !== contrato.rolId) {
            const contratoConEmpleado = await Contrato.findByPk(contrato.id, {
                include: [{ model: Empleado, as: 'empleado' }]
            });
            const rol = await Rol.findByPk(contratoData.rolId);
            if (!rol || rol.espacioTrabajoId !== contratoConEmpleado.empleado.espacioTrabajoId) {
                return badRequest(res, 'El rol seleccionado no pertenece al mismo espacio de trabajo que el contrato.');
            }
        }

        // Actualizar datos básicos del contrato
        await contrato.update(contratoData, { transaction });

        // Si se proporcionan puestos, actualizar la asociación (solo si hay al menos uno)
        if (puestoIds && Array.isArray(puestoIds) && puestoIds.length > 0) {
            // Obtener puestos para validar empresa y espacio
            const puestos = await Puesto.findAll({
                where: { id: puestoIds },
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
            });

            // Validar espacio de trabajo (el empleado no cambia en el update, así que usamos el del contrato)
            const contratoConEmpleado = await Contrato.findByPk(contrato.id, {
                include: [{ model: Empleado, as: 'empleado' }]
            });
            const espacioId = contratoConEmpleado.empleado.espacioTrabajoId;

            for (const puesto of puestos) {
                const puestoEspacioId = puesto.departamento?.area?.empresa?.espacioTrabajoId;
                if (puestoEspacioId !== espacioId) {
                    await transaction.rollback();
                    return res.status(400).json({
                        error: `El puesto "${puesto.nombre}" pertenece a un espacio de trabajo diferente al del contrato.`
                    });
                }
            }

            // Validar misma empresa
            const empresaIds = [...new Set(puestos.map(p => p.departamento?.area?.empresa?.id))];
            if (empresaIds.length > 1) {
                await transaction.rollback();
                return badRequest(res, 'Todos los puestos deben pertenecer a la misma empresa.');
            }

            // Validar que no haya conflictos con otros contratos activos del mismo empleado
            const contratosExistentes = await ContratoPuesto.findAll({
                where: { puestoId: puestoIds },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: {
                        id: { [Op.ne]: contrato.id }, // Excluir el contrato actual
                        empleadoId: contrato.empleadoId,
                        activo: true,
                        estado: { [Op.ne]: 'finalizado' }
                    }
                }]
            });

            if (contratosExistentes.length > 0) {
                const puestosConContrato = contratosExistentes.map(cp => cp.puestoId);
                const puestosNombres = puestos
                    .filter(p => puestosConContrato.includes(p.id))
                    .map(p => p.nombre)
                    .join(', ');

                await transaction.rollback();
                return badRequest(res, `El empleado ya tiene otro contrato activo para el/los puesto(s): ${puestosNombres}`);
            }

            // Eliminar asociaciones anteriores
            await ContratoPuesto.destroy({
                where: { contratoId: contrato.id },
                transaction
            });

            // Crear nuevas asociaciones
            await ContratoPuesto.bulkCreate(
                puestoIds.map(puestoId => ({
                    contratoId: contrato.id,
                    puestoId: puestoId
                })),
                { transaction }
            );
        }

        await transaction.commit();

        const contratoActualizado = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        return ok(res, contratoActualizado);
    } catch (error) {
        await transaction.rollback();
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Desactiva un contrato (eliminación lógica).
 * Valida que no existan entidades activas dependientes (evaluaciones, solicitudes o liquidaciones).
 * De existir, impide la desactivación para mantener la integridad referencial.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response confirmando la desactivación
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id);

        if (!contrato) {
            return notFound(res, 'Contrato');
        }

        // --- Verificaciones de entidades asociadas activas ---
        const evaluadosActivos = await Evaluacion.count({ where: { contratoEvaluadoId: contrato.id, activo: true } });
        if (evaluadosActivos > 0) {
            return badRequest(res, `No se puede desactivar el contrato porque tiene ${evaluadosActivos} evaluación(es) de desempeño activa(s) como evaluado. Primero desactive las evaluaciones.`);
        }

        const evaluadoresActivos = await Evaluacion.count({
            where: { activo: true },
            include: [{
                model: Contrato,
                as: 'evaluadores',
                where: { id: contrato.id },
                attributes: []
            }]
        });
        if (evaluadoresActivos > 0) {
            return badRequest(res, `No se puede desactivar el contrato porque es evaluador en ${evaluadoresActivos} evaluación(es) de desempeño activa(s). Primero desactive las evaluaciones o asigne otro evaluador.`);
        }

        const solicitudesActivas = await Solicitud.count({ where: { contratoId: contrato.id, activo: true } });
        if (solicitudesActivas > 0) {
            return badRequest(res, `No se puede desactivar el contrato porque tiene ${solicitudesActivas} solicitud(es) activa(s). Primero desactive las solicitudes.`);
        }

        const liquidacionesActivas = await Liquidacion.count({ where: { contratoId: contrato.id, activo: true } });
        if (liquidacionesActivas > 0) {
            return badRequest(res, `No se puede desactivar el contrato porque tiene ${liquidacionesActivas} liquidación(es) activa(s). Primero desactive las liquidaciones.`);
        }

        await contrato.update({ activo: false });
        return ok(res, { message: 'Contrato desactivado correctamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva un contrato previamente desactivado.
 * Valida que no se generen conflictos de puestos activos para el mismo empleado.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el contrato reactivado
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const contrato = await Contrato.findByPk(req.params.id, {
            include: [{
                model: Puesto,
                as: 'puestos',
                through: { attributes: [] }
            }]
        });

        if (!contrato) {
            return notFound(res, 'Contrato');
        }

        const puestoIds = contrato.puestos.map(p => p.id);

        if (puestoIds.length > 0) {
            // Validar que el empleado no tenga ya otro contrato activo (y no finalizado) para alguno de estos puestos
            const contratosExistentes = await ContratoPuesto.findAll({
                where: { puestoId: puestoIds },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: {
                        empleadoId: contrato.empleadoId,
                        activo: true,
                        estado: { [Op.ne]: 'finalizado' },
                        id: { [Op.ne]: contrato.id } // Excluir el contrato actual
                    }
                }]
            });

            if (contatosExistentes.length > 0) {
                const puestosConContrato = contratosExistentes.map(cp => cp.puestoId);
                const puestosNombres = contrato.puestos
                    .filter(p => puestosConContrato.includes(p.id))
                    .map(p => p.nombre)
                    .join(', ');

                return badRequest(res, `El empleado ya tiene un contrato activo (no finalizado) para el/los puesto(s): ${puestosNombres}`);
            }
        }

        await contrato.update({ activo: true });

        const contratoReactivado = await Contrato.findByPk(contrato.id, {
            include: includeRelations,
        });

        return ok(res, contratoReactivado);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples contratos en lote.
 * Realiza las mismas validaciones de integridad que la desactivación individual.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        for (const id of ids) {
            const evaluadosActivos = await Evaluacion.count({ where: { contratoEvaluadoId: id, activo: true } });
            if (evaluadosActivos > 0) {
                return badRequest(res, `No se puede desactivar un contrato seleccionado porque tiene ${evaluadosActivos} evaluación(es) activa(s) como evaluado. Primero desactive las evaluaciones.`);
            }

            const evaluadoresActivos = await Evaluacion.count({
                where: { activo: true },
                include: [{
                    model: Contrato,
                    as: 'evaluadores',
                    where: { id: id },
                    attributes: []
                }]
            });
            if (evaluadoresActivos > 0) {
                return badRequest(res, `No se puede desactivar un contrato seleccionado porque es evaluador en ${evaluadoresActivos} evaluación(es) activa(s). Primero desactive las evaluaciones o asigne otro evaluador.`);
            }

            const solicitudesActivas = await Solicitud.count({ where: { contratoId: id, activo: true } });
            if (solicitudesActivas > 0) {
                return badRequest(res, `No se puede desactivar el contrato porque tiene ${solicitudesActivas} solicitud(es) activa(s). Primero desactive las solicitudes.`);
            }

            const liquidacionesActivas = await Liquidacion.count({ where: { contratoId: id, activo: true } });
            if (liquidacionesActivas > 0) {
                return badRequest(res, `No se puede desactivar el contrato porque tiene ${liquidacionesActivas} liquidación(es) activa(s). Primero desactive las liquidaciones.`);
            }
        }

        await Contrato.update(
            { activo: false },
            { where: { id: ids } }
        );

        return ok(res, { message: `${ids.length} contrato(s) desactivado(s) correctamente` });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Obtiene los IDs de los puestos que ya tienen un contrato activo (no finalizado)
 * para un empleado específico. Útil para filtrado en el frontend.
 *
 * @param {import('express').Request} req - Request con `params.empleadoId`
 * @param {import('express').Response} res - Response con array de `puestoIds`
 * @returns {Promise<void>}
 */
const getPuestosConContrato = async (req, res) => {
    try {
        const { empleadoId } = req.params;

        const contratosActivos = await Contrato.findAll({
            where: {
                empleadoId: parseInt(empleadoId),
                activo: true,
                estado: { [Op.ne]: 'finalizado' } // Excluir contratos finalizados
            },
            include: [{
                model: Puesto,
                as: 'puestos',
                through: { attributes: [] }
            }]
        });

        // Extraer IDs de puestos con contrato activo (no finalizado)
        const puestoIds = contratosActivos.flatMap(c => c.puestos.map(p => p.id));

        return ok(res, { puestoIds: [...new Set(puestoIds)] });
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
    reactivate,
    bulkRemove,
    getPuestosConContrato,
};

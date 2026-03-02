/**
 * @fileoverview Controller de Empresas y Estructura Organizacional.
 * Maneja la gestión jerárquica de la organización (Empresa -> Áreas -> Departamentos -> Puestos),
 * asegurando la integridad referencial con los contratos laborales vigentes.
 * @module controllers/empresaController
 */

const { Empresa, Area, Departamento, Puesto, Contrato, EspacioTrabajo, Empleado, ContratoPuesto, Usuario } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok, created } = require('../helpers/respuestas.helper');
const { resolverScopeContratos } = require('../helpers/workspace.helper');

/**
 * Define la estructura de inclusión profunda para recuperar la jerarquía organizacional completa.
 * Incluye áreas, departamentos, puestos y los contratos activos asociados a cada puesto.
 * @constant {object[]}
 */
const includeStructure = [{
    model: Area,
    as: 'areas',
    include: [{
        model: Departamento,
        as: 'departamentos',
        include: [{
            model: Puesto,
            as: 'puestos',
            include: [{
                model: Contrato,
                as: 'contratos',
                through: { attributes: [] },
                where: { activo: true },
                required: false,
                include: [{
                    model: Empleado,
                    as: 'empleado',
                    include: [{
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['activo']
                    }]
                }]
            }]
        }]
    }]
}];

/**
 * Obtiene todas las empresas registradas con soporte para filtros de búsqueda y paginación.
 * Restringe los resultados según el Espacio de Trabajo asignado al usuario en sesión.
 *
 * @param {import('express').Request} req - Request con query params: `search`, `activo`, `industria`, `espacioTrabajoId`, etc.
 * @param {import('express').Response} res - Response con lista paginada de empresas
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { search, activo, email, telefono, industria, direccion, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo !== 'all') {
            where.activo = true;
        }

        if (search) where.nombre = { [Op.like]: `%${search}%` };
        if (email) where.email = { [Op.like]: `%${email}%` };
        if (telefono) where.telefono = { [Op.like]: `%${telefono}%` };
        if (industria) where.industria = { [Op.like]: `%${industria}%` };
        if (direccion) where.direccion = { [Op.like]: `%${direccion}%` };

        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (espacioTrabajoId) {
            where.espacioTrabajoId = espacioTrabajoId;
        } else if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                where.espacioTrabajoId = empleadoSesion.espacioTrabajoId;
            } else {
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });

                if (espaciosPropios.length > 0) {
                    where.espacioTrabajoId = { [Op.in]: espaciosPropios.map(e => e.id) };
                } else {
                    where.espacioTrabajoId = -1;
                }
            }
        }

        const result = await Empresa.findAndCountAll({
            where,
            include: [{
                model: EspacioTrabajo,
                as: 'espacioTrabajo',
                attributes: ['id', 'nombre']
            }],
            order: [['nombre', 'ASC']],
            limit,
            offset,
        });

        return ok(res, construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error en empresaController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene los detalles de una empresa específica incluyendo su estructura jerárquica completa.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con la empresa o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        if (!empresa) {
            return notFound(res, 'Empresa');
        }

        return ok(res, empresa);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea una nueva empresa y opcionalmente su estructura inicial (Áreas, Departamentos, Puestos).
 * Valida que el email de la empresa sea único dentro del Espacio de Trabajo.
 *
 * @param {import('express').Request} req - Request con datos de la empresa y estructura jerárquica
 * @param {import('express').Response} res - Response con la empresa creada
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    try {
        let { nombre, email, telefono, industria, direccion, areas, espacioTrabajoId } = req.body;

        if (!espacioTrabajoId) {
            return badRequest(res, 'Debe pertenecer a un espacio de trabajo para crear una empresa');
        }

        // Validar unicidad de email dentro del mismo espacioTrabajo
        if (email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId, email }
            });
            if (emailExistente) {
                return badRequest(res, 'El email ya está registrado en este espacio de trabajo');
            }
        }

        const nuevaEmpresa = await Empresa.create({
            nombre,
            email,
            telefono,
            industria,
            direccion,
            areas,
            espacioTrabajoId
        }, {
            include: includeStructure
        });

        return created(res, nuevaEmpresa);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Desactiva una empresa (eliminación lógica).
 * Valida que ninguno de sus puestos jerárquicos tenga contratos laborales activos asociados.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response confirmando la desactivación
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        if (!empresa) {
            return res.status(404).json({ error: 'Empresa no encontrada' });
        }

        // Obtener todos los puestos de esta empresa
        const puestoIds = [];
        empresa.areas?.forEach(area => {
            area.departamentos?.forEach(depto => {
                depto.puestos?.forEach(puesto => {
                    puestoIds.push(puesto.id);
                });
            });
        });

        // Verificar si hay contratos activos asociados a los puestos de esta empresa
        if (puestoIds.length > 0) {
            const contratosActivos = await ContratoPuesto.count({
                where: { puestoId: puestoIds },
                include: [{
                    model: Contrato,
                    as: 'contrato',
                    where: { activo: true }
                }]
            });

            if (contratosActivos > 0) {
                return badRequest(res, `No se puede desactivar la empresa "${empresa.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.`);
            }
        }

        await empresa.update({ activo: false });
        return ok(res, { message: 'Empresa desactivada correctamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples empresas en lote (eliminación lógica).
 * Aplica validaciones de integridad individual para cada empresa.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const removeBulk = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        for (const id of ids) {
            const empresa = await Empresa.findByPk(id, {
                include: includeStructure
            });

            if (!empresa) continue;

            const puestoIds = [];
            empresa.areas?.forEach(area => {
                area.departamentos?.forEach(depto => {
                    depto.puestos?.forEach(puesto => {
                        puestoIds.push(puesto.id);
                    });
                });
            });

            if (puestoIds.length > 0) {
                const contratosActivos = await ContratoPuesto.count({
                    where: { puestoId: puestoIds },
                    include: [{
                        model: Contrato,
                        as: 'contrato',
                        where: { activo: true }
                    }]
                });

                if (contratosActivos > 0) {
                    return badRequest(res, `No se puede desactivar la empresa "${empresa.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s).`);
                }
            }
        }

        await Empresa.update(
            { activo: false },
            { where: { id: { [Op.in]: ids } } }
        );

        return ok(res, { message: `${ids.length} empresa(s) desactivada(s) correctamente` });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva una empresa previamente desactivada.
 * Valida la unicidad del email activo en el espacio de trabajo.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con la empresa reactivada
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const empresa = await Empresa.findByPk(req.params.id);

        if (!empresa) {
            return notFound(res, 'Empresa');
        }

        if (empresa.email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId: empresa.espacioTrabajoId, email: empresa.email, id: { [Op.ne]: empresa.id } }
            });
            if (emailExistente) {
                return badRequest(res, 'El email ya está registrado en este espacio de trabajo');
            }
        }

        await empresa.update({ activo: true });

        const empresaReactivada = await Empresa.findByPk(req.params.id, {
            include: includeStructure
        });

        return ok(res, empresaReactivada);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Actualiza los datos de una empresa y sincroniza su estructura organizacional (Áreas, Departamentos, Puestos).
 * Implementa lógica de UPSERT para nodos jerárquicos y previene la eliminación de nodos
 * que tengan contratos laborales activos asociados.
 *
 * @param {import('express').Request} req - Request con ID y nueva estructura jerárquica
 * @param {import('express').Response} res - Response con la empresa actualizada
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, industria, direccion, areas, espacioTrabajoId } = req.body;

        if (!espacioTrabajoId) {
            return badRequest(res, 'El espacio de trabajo es requerido');
        }

        const empresa = await Empresa.findByPk(id);
        if (!empresa) {
            return notFound(res, 'Empresa');
        }

        if (email) {
            const emailExistente = await Empresa.findOne({
                where: { espacioTrabajoId, email, id: { [Op.ne]: id } }
            });
            if (emailExistente) {
                return badRequest(res, 'El email ya está registrado en este espacio de trabajo');
            }
        }

        await empresa.update({ nombre, email, telefono, industria, direccion });

        if (areas !== undefined) {
            // Sincronización compleja de estructura (upsert de nodos)
            const areasExistentes = await Area.findAll({
                where: { empresaId: id },
                include: [{ model: Departamento, as: 'departamentos', include: [{ model: Puesto, as: 'puestos' }] }]
            });

            const areasToKeep = new Set();
            const deptosToKeep = new Set();
            const puestosToKeep = new Set();

            if (areas && areas.length > 0) {
                for (const areaData of areas) {
                    const { departamentos, id: areaId, ...areaRest } = areaData;
                    let area;
                    if (areaId) {
                        area = await Area.findByPk(areaId);
                        if (area && area.empresaId === parseInt(id)) {
                            await area.update(areaRest);
                            areasToKeep.add(areaId);
                        } else {
                            area = await Area.create({ ...areaRest, empresaId: id });
                            areasToKeep.add(area.id);
                        }
                    } else {
                        area = await Area.create({ ...areaRest, empresaId: id });
                        areasToKeep.add(area.id);
                    }

                    if (departamentos && departamentos.length > 0) {
                        for (const deptoData of departamentos) {
                            const { puestos, id: deptoId, ...deptoRest } = deptoData;
                            let depto;
                            if (deptoId) {
                                depto = await Departamento.findByPk(deptoId);
                                if (depto && depto.areaId === area.id) {
                                    await depto.update(deptoRest);
                                    deptosToKeep.add(deptoId);
                                } else {
                                    depto = await Departamento.create({ ...deptoRest, areaId: area.id });
                                    deptosToKeep.add(depto.id);
                                }
                            } else {
                                depto = await Departamento.create({ ...deptoRest, areaId: area.id });
                                deptosToKeep.add(depto.id);
                            }

                            if (puestos && puestos.length > 0) {
                                for (const puestoData of puestos) {
                                    const { id: puestoId, ...puestoRest } = puestoData;
                                    if (puestoId) {
                                        const puesto = await Puesto.findByPk(puestoId);
                                        if (puesto && puesto.departamentoId === depto.id) {
                                            await puesto.update(puestoRest);
                                            puestosToKeep.add(puestoId);
                                        } else {
                                            const newPuesto = await Puesto.create({ ...puestoRest, departamentoId: depto.id });
                                            puestosToKeep.add(newPuesto.id);
                                        }
                                    } else {
                                        const newPuesto = await Puesto.create({ ...puestoRest, departamentoId: depto.id });
                                        puestosToKeep.add(newPuesto.id);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            // Validar eliminación de nodos huérfanos con contratos activos
            const errorsLinked = [];
            for (const areaExistente of areasExistentes) {
                const areaBeingDeleted = !areasToKeep.has(areaExistente.id);
                for (const deptoExistente of areaExistente.departamentos || []) {
                    const deptoBeingDeleted = !deptosToKeep.has(deptoExistente.id) || areaBeingDeleted;
                    for (const puestoExistente of deptoExistente.puestos || []) {
                        const puestoBeingDeleted = !puestosToKeep.has(puestoExistente.id) || deptoBeingDeleted;
                        if (puestoBeingDeleted) {
                            const linkedContracts = await ContratoPuesto.count({
                                where: { puestoId: puestoExistente.id },
                                include: [{ model: Contrato, as: 'contrato', where: { activo: true } }]
                            });
                            if (linkedContracts > 0) {
                                if (areaBeingDeleted) errorsLinked.push(`Área "${areaExistente.nombre}" vinculada a contratos activos`);
                                else if (deptoBeingDeleted) errorsLinked.push(`Departamento "${deptoExistente.nombre}" vinculado a contratos activos`);
                                else errorsLinked.push(`Puesto "${puestoExistente.nombre}" vinculado a contratos activos`);
                            }
                        }
                    }
                }
            }

            if (errorsLinked.length > 0) return badRequest(res, errorsLinked.join('. '));

            // Ejecutar eliminación física de nodos no vinculados que ya no están en la estructura
            for (const areaExistente of areasExistentes) {
                for (const deptoExistente of areaExistente.departamentos || []) {
                    for (const puestoExistente of deptoExistente.puestos || []) {
                        if (!puestosToKeep.has(puestoExistente.id)) await puestoExistente.destroy();
                    }
                    if (!deptosToKeep.has(deptoExistente.id)) {
                        if (await Puesto.count({ where: { departamentoId: deptoExistente.id } }) === 0) await deptoExistente.destroy();
                    }
                }
                if (!areasToKeep.has(areaExistente.id)) {
                    if (await Departamento.count({ where: { areaId: areaExistente.id } }) === 0) await areaExistente.destroy();
                }
            }
        }

        const empresaActualizada = await Empresa.findByPk(id, { include: includeStructure });
        return ok(res, empresaActualizada);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Verifica si es seguro eliminar un nodo jerárquico (Área, Departamento o Puesto).
 * Analiza si el nodo o sus descendientes tienen contratos laborales activos asociados.
 *
 * @param {import('express').Request} req - Request con `params.type` ('area','departamento','puesto') e `params.id`
 * @param {import('express').Response} res - Response con booleano `canDelete` y mensaje informativo
 * @returns {Promise<void>}
 */
const checkCanDelete = async (req, res) => {
    try {
        const { type, id } = req.params;
        let puestosToCheck = [];
        let contextName = '';

        if (type === 'puesto') {
            const puesto = await Puesto.findByPk(id);
            if (!puesto) return ok(res, { canDelete: true });
            puestosToCheck = [puesto];
            contextName = `El puesto "${puesto.nombre}"`;
        } else if (type === 'departamento') {
            const depto = await Departamento.findByPk(id, { include: [{ model: Puesto, as: 'puestos' }] });
            if (!depto) return ok(res, { canDelete: true });
            puestosToCheck = depto.puestos || [];
            contextName = `El departamento "${depto.nombre}"`;
        } else if (type === 'area') {
            const area = await Area.findByPk(id, { include: [{ model: Departamento, as: 'departamentos', include: [{ model: Puesto, as: 'puestos' }] }] });
            if (!area) return ok(res, { canDelete: true });
            puestosToCheck = (area.departamentos || []).flatMap(d => d.puestos || []);
            contextName = `El área "${area.nombre}"`;
        } else return badRequest(res, 'Tipo inválido');

        const linkedPuestos = [];
        for (const puesto of puestosToCheck) {
            const count = await ContratoPuesto.count({ where: { puestoId: puesto.id }, include: [{ model: Contrato, as: 'contrato', where: { activo: true } }] });
            if (count > 0) linkedPuestos.push({ nombre: puesto.nombre, contratos: count });
        }

        if (linkedPuestos.length > 0) {
            const message = type === 'puesto' ? `${contextName} tiene ${linkedPuestos[0].contratos} contrato(s) activo(s)` : `${contextName} contiene puestos con contratos activos`;
            return ok(res, { canDelete: false, message });
        }
        return ok(res, { canDelete: true });
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
    removeBulk,
    reactivate,
    checkCanDelete,
};

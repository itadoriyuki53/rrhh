/**
 * @fileoverview Controller de Contactos de Empleados.
 * Maneja la gestión de familiares y contactos de emergencia asociados a los empleados,
 * aplicando reglas de visibilidad según el rol (Admin, Propietario o Empleado).
 * @module controllers/contactoController
 */

const { Contacto, Empleado, Usuario, EspacioTrabajo, Contrato, Rol, Permiso } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, forbidden, notFound, serverError, manejarErrorSequelize, ok, created } = require('../helpers/respuestas.helper');
const { tienePermiso, respuestaPermisoDenegado } = require('../helpers/permisos.helper');

/**
 * Include estándar para cargar la relación con el empleado y sus datos básicos.
 * @constant {object[]}
 */
const includeEmpleado = [{
    model: Empleado,
    as: 'empleado',
    include: [
        { model: Usuario, as: 'usuario', attributes: ['nombre', 'apellido'] },
        { model: EspacioTrabajo, as: 'espacioTrabajo', attributes: ['id', 'nombre'] }
    ]
}];

/**
 * Obtiene todos los contactos con filtros de búsqueda y paginación.
 * Aplica lógica de scope para restringir los resultados según el acceso del usuario.
 *
 * @param {import('express').Request} req - Request con query params de filtrado
 * @param {import('express').Response} res - Response con lista paginada de contactos
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { nombre, empleadoId, activo, dni, parentesco, tipo, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);
        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo !== 'all') {
            where.activo = true;
        }

        if (nombre) where.nombreCompleto = { [Op.like]: `%${nombre}%` };
        if (dni) where.dni = { [Op.like]: `%${dni}%` };
        if (parentesco) where.parentesco = parentesco;
        if (tipo === 'Familiar') where.esFamiliar = true;
        if (tipo === 'Emergencia') where.esContactoEmergencia = true;

        // --- Filtrado por Espacio de Trabajo y Permisos ---
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                // ES EMPLEADO — verificar permisos de escritura (equivale a "puede ver todos del workspace")
                const tieneGestion = await tienePermiso(req.session, 'contactos', 'crear') ||
                    await tienePermiso(req.session, 'contactos', 'actualizar') ||
                    await tienePermiso(req.session, 'contactos', 'eliminar');

                if (tieneGestion) {
                    const empleadosWorkspace = await Empleado.findAll({
                        where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                        attributes: ['id']
                    });
                    const idsWs = empleadosWorkspace.map(e => e.id);

                    if (empleadoId) {
                        if (!idsWs.includes(parseInt(empleadoId))) {
                            return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                        }
                        where.empleadoId = empleadoId;
                    } else {
                        where.empleadoId = { [Op.in]: idsWs };
                    }

                    if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                    }
                } else {
                    if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                    }
                    where.empleadoId = empleadoSesion.id;
                }
            } else {
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });
                const espaciosIds = espaciosPropios.map(e => e.id);

                let targetEspacios = espaciosIds;
                if (espacioTrabajoId) {
                    if (!espaciosIds.includes(parseInt(espacioTrabajoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                    }
                    targetEspacios = [parseInt(espacioTrabajoId)];
                }

                const empleadosDeWorkspaces = await Empleado.findAll({
                    where: { espacioTrabajoId: { [Op.in]: targetEspacios } },
                    attributes: ['id']
                });
                const idsPermitidos = empleadosDeWorkspaces.map(e => e.id);

                if (empleadoId) {
                    if (!idsPermitidos.includes(parseInt(empleadoId))) {
                        return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                    }
                    where.empleadoId = empleadoId;
                } else if (idsPermitidos.length > 0) {
                    where.empleadoId = { [Op.in]: idsPermitidos };
                } else {
                    where.empleadoId = -1;
                }
            }
        } else {
            if (empleadoId) where.empleadoId = empleadoId;
            if (espacioTrabajoId) {
                const empleadosWs = await Empleado.findAll({ where: { espacioTrabajoId }, attributes: ['id'] });
                const ids = empleadosWs.map(e => e.id);
                if (empleadoId && !ids.includes(parseInt(empleadoId))) {
                    return res.json({ data: [], pagination: { total: 0, page: 1, limit, totalPages: 0 } });
                }
                if (!empleadoId) where.empleadoId = { [Op.in]: ids };
            }
        }

        const result = await Contacto.findAndCountAll({
            where,
            include: includeEmpleado,
            order: [['nombreCompleto', 'ASC']],
            limit,
            offset,
        });

        return ok(res, construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error(error);
        return serverError(res, error);
    }
};

/**
 * Obtiene un contacto por su ID.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el contacto o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const contacto = await Contacto.findByPk(req.params.id, { include: includeEmpleado });

        if (!contacto) {
            return notFound(res, 'Contacto');
        }

        return ok(res, contacto);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Verifica si ya existe un contacto activo con el mismo DNI para un empleado específico.
 *
 * @param {number} empleadoId - ID del empleado
 * @param {string} dni - DNI a verificar
 * @param {number|null} [excludeId=null] - ID de contacto a excluir de la búsqueda (para actualizaciones)
 * @returns {Promise<boolean>} True si existe el duplicado
 */
const checkDuplicateDNI = async (empleadoId, dni, excludeId = null) => {
    const where = { empleadoId, dni, activo: true };
    if (excludeId) where.id = { [Op.ne]: excludeId };
    const existing = await Contacto.findOne({ where });
    return existing !== null;
};

/**
 * Crea un nuevo contacto asociado a un empleado.
 * Valida permisos de creación y evita duplicados por DNI.
 *
 * @param {import('express').Request} req - Request con los datos del contacto
 * @param {import('express').Response} res - Response con el contacto creado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    try {
        // Verificar permiso de creación
        if (!(await tienePermiso(req.session, 'contactos', 'crear'))) {
            return respuestaPermisoDenegado(res, 'contactos', 'crear');
        }

        const { empleadoId, dni } = req.body;

        const isDuplicate = await checkDuplicateDNI(empleadoId, dni);
        if (isDuplicate) {
            return badRequest(res, `Ya existe un contacto con el DNI ( ${dni} ) para el empleado`);
        }

        const contacto = await Contacto.create(req.body);

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        return created(res, contactoWithRelations);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza los datos de un contacto existente.
 * Valida permisos de actualización y evita duplicados por DNI.
 *
 * @param {import('express').Request} req - Request con `params.id` y datos a actualizar
 * @param {import('express').Response} res - Response con el contacto actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        // Verificar permiso de edición
        if (!(await tienePermiso(req.session, 'contactos', 'actualizar'))) {
            return respuestaPermisoDenegado(res, 'contactos', 'actualizar');
        }

        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return notFound(res, 'Contacto');
        }

        const { empleadoId, dni } = req.body;

        const isDuplicate = await checkDuplicateDNI(
            empleadoId || contacto.empleadoId,
            dni || contacto.dni,
            contacto.id
        );
        if (isDuplicate) {
            return badRequest(res, `Ya existe un contacto con el DNI ( ${dni} ) para el empleado`);
        }

        await contacto.update(req.body);

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        return ok(res, contactoWithRelations);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Realiza una desactivación lógica (soft delete) del contacto.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'contactos', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'contactos', 'eliminar');
        }

        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return notFound(res, 'Contacto');
        }

        await contacto.update({ activo: false });
        return ok(res, { message: 'Contacto desactivado correctamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva un contacto previamente desactivado.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el contacto reactivado
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const contacto = await Contacto.findByPk(req.params.id);
        if (!contacto) {
            return notFound(res, 'Contacto');
        }

        await contacto.update({ activo: true });

        const contactoWithRelations = await Contacto.findByPk(contacto.id, { include: includeEmpleado });
        return ok(res, contactoWithRelations);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples contactos en una sola operación (eliminación lógica en lote).
 *
 * @param {import('express').Request} req - Request con body conteniendo un array de `ids`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        // Verificar permiso de eliminación
        if (!(await tienePermiso(req.session, 'contactos', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'contactos', 'eliminar');
        }

        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        await Contacto.update({ activo: false }, { where: { id: ids } });
        return ok(res, { message: `${ids.length} contacto(s) desactivado(s) correctamente` });
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
};

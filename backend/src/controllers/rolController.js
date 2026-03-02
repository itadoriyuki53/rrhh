/**
 * @fileoverview Controller de Roles de Usuario.
 * Gestiona la agrupación de permisos en perfiles (Roles) dentro de cada Espacio de Trabajo.
 * Permite la asignación granular de capacidades a los diferentes tipos de empleados.
 * @module controllers/rolController
 */

const { Rol, Permiso, EspacioTrabajo, Empleado, Contrato } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok } = require('../helpers/respuestas.helper');

/**
 * Obtiene todos los roles registrados con soporte para paginación y filtros de búsqueda.
 * Restringe los resultados según el Espacio de Trabajo asignado al usuario en sesión.
 *
 * @param {import('express').Request} req - Request con query params: `search`, `activo`, `espacioTrabajoId`, `page`, `limit`
 * @param {import('express').Response} res - Response con lista paginada de roles y sus permisos
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { search = '', activo, descripcion, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);
        const whereClause = {};

        if (search) {
            whereClause[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { descripcion: { [Op.like]: `%${search}%` } },
            ];
        }

        if (activo === 'false') {
            whereClause.activo = false;
        } else if (activo !== 'all' && activo !== undefined) {
            whereClause.activo = true;
        }

        if (descripcion) whereClause.descripcion = { [Op.like]: `%${descripcion}%` };

        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (espacioTrabajoId) {
            whereClause.espacioTrabajoId = espacioTrabajoId;
        } else if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });
            if (empleadoSesion) {
                whereClause.espacioTrabajoId = empleadoSesion.espacioTrabajoId;
            } else {
                const espaciosPropios = await EspacioTrabajo.findAll({ where: { propietarioId: usuarioSesionId }, attributes: ['id'] });
                if (espaciosPropios.length > 0) {
                    whereClause.espacioTrabajoId = { [Op.in]: espaciosPropios.map(e => e.id) };
                } else {
                    whereClause.espacioTrabajoId = -1;
                }
            }
        }

        const result = await Rol.findAndCountAll({
            where: whereClause,
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre'],
                },
            ],
            limit,
            offset,
            order: [['nombre', 'ASC']],
            distinct: true
        });

        res.json(construirRespuestaPaginada(result, page, limit, 'roles'));
    } catch (error) {
        console.error('Error al obtener roles:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene un rol específico por su ID incluyendo su colección completa de permisos.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el rol o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const rol = await Rol.findByPk(id, {
            include: [
                {
                    model: Permiso,
                    as: 'permisos',
                    through: { attributes: [] },
                    attributes: ['id', 'modulo', 'accion', 'descripcion'],
                },
            ],
        });

        if (!rol) return notFound(res, 'Rol');
        res.json(rol);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo rol en un Espacio de Trabajo con una lista inicial de permisos.
 *
 * @param {import('express').Request} req - Request con datos del rol y array de IDs de permisos
 * @param {import('express').Response} res - Response con el rol creado y sus permisos asociados
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    try {
        let { nombre, descripcion, permisos = [], espacioTrabajoId } = req.body;

        if (!nombre) return badRequest(res, 'El nombre del rol es requerido');
        if (!espacioTrabajoId) return badRequest(res, 'El espacio de trabajo es requerido');

        const nuevoRol = await Rol.create({ nombre, descripcion, activo: true, espacioTrabajoId });

        if (permisos.length > 0) {
            await nuevoRol.setPermisos(permisos);
        }

        const rolConPermisos = await Rol.findByPk(nuevoRol.id, {
            include: [{ model: Permiso, as: 'permisos', through: { attributes: [] }, attributes: ['id', 'modulo', 'accion', 'descripcion'] }],
        });

        res.status(201).json(rolConPermisos);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza la información de un rol y sincroniza su lista de permisos.
 *
 * @param {import('express').Request} req - Request con ID y campos a actualizar
 * @param {import('express').Response} res - Response con el rol actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, permisos } = req.body;

        const rol = await Rol.findByPk(id);
        if (!rol) return notFound(res, 'Rol');

        if (nombre !== undefined) rol.nombre = nombre;
        if (descripcion !== undefined) rol.descripcion = descripcion;
        await rol.save();

        if (permisos !== undefined) {
            await rol.setPermisos(permisos);
        }

        const rolActualizado = await Rol.findByPk(id, {
            include: [{ model: Permiso, as: 'permisos', through: { attributes: [] }, attributes: ['id', 'modulo', 'accion', 'descripcion'] }],
        });

        res.json(rolActualizado);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Desactiva un rol (eliminación lógica).
 * Valida que el rol no se encuentre asignado a ningún contrato laboral activo en el sistema.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteRol = async (req, res) => {
    try {
        const { id } = req.params;
        const rol = await Rol.findByPk(id);
        if (!rol) return notFound(res, 'Rol');

        const contratosActivos = await Contrato.count({ where: { rolId: rol.id, activo: true } });
        if (contratosActivos > 0) {
            return badRequest(res, `El rol "${rol.nombre}" tiene ${contratosActivos} contrato(s) activo(s).`);
        }

        rol.activo = false;
        await rol.save();
        res.json({ message: 'Rol desactivado exitosamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva un rol previamente desactivado.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const { id } = req.params;
        const rol = await Rol.findByPk(id);
        if (!rol) return notFound(res, 'Rol');

        rol.activo = true;
        await rol.save();
        res.json({ message: 'Rol reactivado exitosamente', rol });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples roles en lote.
 * Realiza verificaciones de integridad referencial para cada rol individualmente.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return badRequest(res, 'IDs requeridos');

        for (const id of ids) {
            const contratosActivos = await Contrato.count({ where: { rolId: id, activo: true } });
            if (contratosActivos > 0) return badRequest(res, 'Uno de los roles tiene contratos activos asociados.');
        }

        await Rol.update({ activo: false }, { where: { id: ids } });
        res.json({ message: `${ids.length} roles desactivados exitosamente` });
    } catch (error) {
        return serverError(res, error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteRol,
    reactivate,
    deleteBulk,
};

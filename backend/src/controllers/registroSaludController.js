/**
 * @fileoverview Controller de Registros de Salud.
 * Gestiona el historial médico laboral de los empleados, incluyendo exámenes pre-ocupacionales,
 * periódicos y certificados de aptitud. Controla la vigencia de los mismos y su vinculación con licencias.
 * @module controllers/registroSaludController
 */

const { RegistroSalud, Empleado, Usuario, EspacioTrabajo, Contrato, Rol, Permiso, Licencia, Solicitud } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, ok, forbidden } = require('../helpers/respuestas.helper');
const { tienePermiso, respuestaPermisoDenegado } = require('../helpers/permisos.helper');
const { resolverScopeContratos } = require('../helpers/workspace.helper');



/**
 * Configuración de inclusión para recuperar la información del empleado vinculada al registro.
 * @constant {object[]}
 */
const includeEmpleado = [{
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
}];

/**
 * Obtiene la lista de registros de salud con soporte para filtros y paginación.
 * Filtra automáticamente los resultados según el Espacio de Trabajo y el rol del usuario.
 *
 * @param {import('express').Request} req - Request con query params: `search`, `tipoExamen`, `vigente`, `empleadoId`, etc.
 * @param {import('express').Response} res - Response con lista paginada de registros
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { search, activo, tipoExamen, resultado, empleadoId, vigente, espacioTrabajoId } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        // Resolver Scope de Contratos (para determinar visibilidad de empleados)
        const scope = await resolverScopeContratos(req.session, { empleadoId, espacioTrabajoId }, 'registros_salud');
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

        if (tipoExamen) where.tipoExamen = tipoExamen;
        if (resultado) where.resultado = resultado;
        if (vigente) where.vigente = vigente === 'true';

        // Aplicar IDs de empleados resueltos por el scope
        if (scope.contratoIds) {
            // Obtener empleadoIds de esos contratoIds
            const contratos = await Contrato.findAll({ where: { id: { [Op.in]: scope.contratoIds } }, attributes: ['empleadoId'] });
            const empIds = [...new Set(contratos.map(c => c.empleadoId))];
            where.empleadoId = { [Op.in]: empIds };
        }

        const result = await RegistroSalud.findAndCountAll({
            where,
            include: includeEmpleado,
            order: [['vigente', 'DESC'], ['fechaRealizacion', 'DESC']],
            limit,
            offset,
        });

        res.json(construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error en registroSaludController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene un registro de salud específico por su ID.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el registro o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const registro = await RegistroSalud.findByPk(req.params.id, {
            include: includeEmpleado
        });

        if (!registro) {
            return notFound(res, 'Registro de salud');
        }

        res.json(registro);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo registro de salud para un empleado.
 * Los registros pueden incluir archivos adjuntos (comprobantes/certificados).
 *
 * @param {import('express').Request} req - Request con datos del examen/certificado
 * @param {import('express').Response} res - Response con el registro creado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'registros_salud', 'crear'))) {
            return respuestaPermisoDenegado(res, 'registros_salud', 'crear');
        }

        const { tipoExamen, resultado, fechaRealizacion, fechaVencimiento, comprobante, comprobanteNombre, comprobanteTipo, comprobantes, empleadoId } = req.body;

        if (!empleadoId) return badRequest(res, 'Debe seleccionar un empleado');

        const empleado = await Empleado.findByPk(empleadoId);
        if (!empleado) return notFound(res, 'Empleado');

        const nuevoRegistro = await RegistroSalud.create({
            tipoExamen, resultado, fechaRealizacion, fechaVencimiento,
            comprobante: comprobante || null,
            comprobanteNombre: comprobanteNombre || null,
            comprobanteTipo: comprobanteTipo || null,
            comprobantes: comprobantes || [],
            empleadoId,
        });

        const registroConEmpleado = await RegistroSalud.findByPk(nuevoRegistro.id, { include: includeEmpleado });
        res.status(201).json(registroConEmpleado);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza la información de un registro de salud existente.
 *
 * @param {import('express').Request} req - Request con ID y campos a actualizar
 * @param {import('express').Response} res - Response con registro actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'registros_salud', 'actualizar'))) {
            return respuestaPermisoDenegado(res, 'registros_salud', 'actualizar');
        }

        const { id } = req.params;
        const { tipoExamen, resultado, fechaRealizacion, fechaVencimiento, comprobante, comprobanteNombre, comprobanteTipo, comprobantes, empleadoId } = req.body;

        const registro = await RegistroSalud.findByPk(id);
        if (!registro) return notFound(res, 'Registro de salud');

        if (empleadoId && !(await Empleado.findByPk(empleadoId))) return notFound(res, 'Empleado');

        await registro.update({
            tipoExamen, resultado, fechaRealizacion, fechaVencimiento,
            comprobante: comprobante || null,
            comprobanteNombre: comprobanteNombre || null,
            comprobanteTipo: comprobanteTipo || null,
            comprobantes: comprobantes || [],
            empleadoId: empleadoId || registro.empleadoId,
        });

        const registroActualizado = await RegistroSalud.findByPk(id, { include: includeEmpleado });
        res.json(registroActualizado);
    } catch (error) {
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Desactiva un registro de salud (eliminación lógica).
 * Valida que el registro no sea el sustento de una licencia médica activa en el sistema.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'registros_salud', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'registros_salud', 'eliminar');
        }

        const registro = await RegistroSalud.findByPk(req.params.id);
        if (!registro) return notFound(res, 'Registro de salud');

        const licenciasActivas = await Licencia.count({
            include: [{ model: Solicitud, as: 'solicitud', where: { activo: true } }],
            where: { registroSaludId: registro.id }
        });
        if (licenciasActivas > 0) {
            return badRequest(res, `El registro tiene ${licenciasActivas} licencia(s) activa(s).`);
        }

        await registro.update({ activo: false });
        res.json({ message: 'Registro de salud desactivado correctamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples registros de salud en lote.
 * Realiza verificaciones de integridad referencial para cada registro.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        if (!(await tienePermiso(req.session, 'registros_salud', 'eliminar'))) {
            return respuestaPermisoDenegado(res, 'registros_salud', 'eliminar');
        }
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) return badRequest(res, 'IDs requeridos');

        for (const id of ids) {
            const licenciasActivas = await Licencia.count({
                include: [{ model: Solicitud, as: 'solicitud', where: { activo: true } }],
                where: { registroSaludId: id }
            });
            if (licenciasActivas > 0) return badRequest(res, 'Un registro posee licencias activas.');
        }

        await RegistroSalud.update({ activo: false }, { where: { id: { [Op.in]: ids } } });
        res.json({ message: `${ids.length} registro(s) desactivado(s)` });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva un registro de salud previamente desactivado.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const registro = await RegistroSalud.findByPk(req.params.id);
        if (!registro) return notFound(res, 'Registro de salud');

        await registro.update({ activo: true });
        res.json(await RegistroSalud.findByPk(req.params.id, { include: includeEmpleado }));
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

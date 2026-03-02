/**
 * @fileoverview Controller de Empleados.
 * Gestiona las operaciones CRUD para empleados, operando sobre un modelo de tabla dividida
 * (Usuario para autenticación y Empleado para datos legajales y laborales).
 * Implementa control de acceso estricto por Espacio de Trabajo.
 * @module controllers/empleadoController
 */

const { Empleado, Usuario, RegistroSalud, Contrato, EspacioTrabajo, sequelize, Contacto } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, manejarErrorSequelize, unauthorized, ok, created } = require('../helpers/respuestas.helper');

/**
 * Obtiene la lista de empleados con filtros de búsqueda y paginación.
 * Combina filtros de la tabla de Usuarios (nombre, email) y Empleados (documento, nacionalidad).
 * Restringe los resultados según el Espacio de Trabajo al que el usuario tiene acceso.
 *
 * @param {import('express').Request} req - Request con query params: `nombre`, `apellido`, `email`, `documento`, `activo`, `page`, `limit`
 * @param {import('express').Response} res - Response con lista aplanada de empleados y paginación
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { nombre, apellido, email, nacionalidad, genero, estadoCivil, activo, documento } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);

        // Filtros para la tabla Empleado
        const whereEmpleado = {};
        // Filtros para la tabla Usuario
        const whereUsuario = {};

        // Filtro de activo
        if (activo === 'false') {
            whereUsuario.activo = false;
        } else if (activo !== 'all') {
            whereUsuario.activo = true;
        }

        // Filtros que ahora viven en Empleado
        if (nacionalidad) whereEmpleado.nacionalidadId = nacionalidad;
        if (genero) whereEmpleado.genero = genero;
        if (estadoCivil) whereEmpleado.estadoCivil = estadoCivil;
        if (documento) whereEmpleado.numeroDocumento = { [Op.like]: `${documento}%` };

        // Filtros de texto en Usuario
        if (nombre) whereUsuario.nombre = { [Op.like]: `%${nombre}%` };
        if (apellido) whereUsuario.apellido = { [Op.like]: `%${apellido}%` };
        if (email) whereUsuario.email = { [Op.like]: `%${email}%` };

        // Restricción de Espacio de Trabajo
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (req.query.espacioTrabajoId) {
            whereEmpleado.espacioTrabajoId = req.query.espacioTrabajoId;
        } else if (!esAdmin) {
            const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

            if (empleadoSesion) {
                whereEmpleado.espacioTrabajoId = empleadoSesion.espacioTrabajoId;
            } else {
                const espaciosPropios = await EspacioTrabajo.findAll({
                    where: { propietarioId: usuarioSesionId },
                    attributes: ['id']
                });

                if (espaciosPropios.length > 0) {
                    whereEmpleado.espacioTrabajoId = { [Op.in]: espaciosPropios.map(e => e.id) };
                } else {
                    whereEmpleado.espacioTrabajoId = -1;
                }
            }
        }

        const result = await Empleado.findAndCountAll({
            where: whereEmpleado,
            include: [
                {
                    model: Usuario,
                    as: 'usuario',
                    where: whereUsuario,
                    attributes: ['id', 'nombre', 'apellido', 'email', 'activo', 'esEmpleado']
                },
                {
                    model: EspacioTrabajo,
                    as: 'espacioTrabajo',
                    attributes: ['id', 'nombre']
                }
            ],
            order: [
                [{ model: Usuario, as: 'usuario' }, 'apellido', 'ASC'],
                [{ model: Usuario, as: 'usuario' }, 'nombre', 'ASC']
            ],
            limit,
            offset,
        });

        const flatRows = result.rows.map(emp => {
            const plainEmp = emp.get({ plain: true });
            const usuario = plainEmp.usuario || {};
            return {
                ...plainEmp,
                ...usuario,
                usuarioActivo: usuario.activo,
                id: plainEmp.id,
                usuarioId: usuario.id
            };
        });

        return ok(res, construirRespuestaPaginada({ count: result.count, rows: flatRows }, page, limit));
    } catch (error) {
        console.error('Error en empleadoController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene los detalles de un empleado específico por su ID.
 * Retorna una estructura aplanada combinando datos de legajo y acceso.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el empleado aplanado o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{
                model: Usuario,
                as: 'usuario',
                attributes: { exclude: ['contrasena'] }
            }]
        });

        if (!empleado) {
            return notFound(res, 'Empleado');
        }

        // Aplanar
        const plainEmp = empleado.get({ plain: true });
        const usuario = plainEmp.usuario || {};

        const result = {
            ...plainEmp,
            ...usuario,
            id: plainEmp.id,
            usuarioId: usuario.id,
            usuarioActivo: usuario.activo
        };

        return ok(res, result);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo empleado, gestionando la transacción para asegurar
 * la creación coordinada tanto del Usuario como del Empleado.
 * Valida la unicidad de documentos (DNI, CUIL) dentro del Espacio de Trabajo.
 *
 * @param {import('express').Request} req - Request con datos combinados de usuario y empleado
 * @param {import('express').Response} res - Response con el nuevo empleado creado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Extraer campos que van a Usuario vs Empleado
        let {
            nombre, apellido, email, contrasena,
            // Datos personales ahora van a Empleado
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId,
            espacioTrabajoId, // Extraer explícitamente
            ...otrosDatosEmpleado
        } = req.body;

        if (!espacioTrabajoId) {
            throw new Error('No se pudo determinar el espacio de trabajo para crear el empleado');
        }

        // Validar unicidad de documento dentro del mismo espacioTrabajo y tipoDocumento
        if (numeroDocumento && tipoDocumento) {
            const docExistente = await Empleado.findOne({
                where: { espacioTrabajoId, tipoDocumento, numeroDocumento }
            });
            if (docExistente) {
                await t.rollback();
                return badRequest(res, `El número de documento ya está registrado para el tipo ${tipoDocumento} en este espacio de trabajo`);
            }
        }

        // Validar unicidad de CUIL dentro del mismo espacioTrabajo
        if (cuil) {
            const cuilExistente = await Empleado.findOne({
                where: { espacioTrabajoId, cuil }
            });
            if (cuilExistente) {
                await t.rollback();
                return badRequest(res, 'El CUIL ya está registrado en este espacio de trabajo');
            }
        }

        // 1. Crear Usuario (Solo Auth + Nombre)
        const rawPassword = contrasena || 'Sistema123!';

        const usuario = await Usuario.create({
            nombre,
            apellido,
            email,
            contrasena: rawPassword,
            esEmpleado: true,
            esAdministrador: false,
            activo: true,
            creadoPorRrhh: true
        }, { transaction: t });

        // 2. Crear Empleado (Datos personales + Dirección + Vinculación)
        const nuevoEmpleado = await Empleado.create({
            ...otrosDatosEmpleado,
            usuarioId: usuario.id,
            espacioTrabajoId: espacioTrabajoId,
            // Datos personales
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            // Dirección
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId
        }, { transaction: t });

        await t.commit();

        // Responder con estructura aplanada
        return created(res, {
            ...nuevoEmpleado.get({ plain: true }),
            ...usuario.get({ plain: true }), // Mezclar datos de usuario
            id: nuevoEmpleado.id, // Preservar ID empleado
            usuarioId: usuario.id
        });

    } catch (error) {
        await t.rollback();
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Actualiza la información de un empleado y su usuario asociado bajo una transacción.
 * Verifica conflictos de duplicidad para email y documentos de identidad.
 *
 * @param {import('express').Request} req - Request con `params.id` y campos a actualizar
 * @param {import('express').Response} res - Response con datos actualizados
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id);

        if (!empleado) {
            return notFound(res, 'Empleado');
        }

        // Separar datos
        const {
            nombre, apellido, email,
            // Datos personales ahora en Empleado
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId, espacioTrabajoId,
            ...empleadoData
        } = req.body;

        const currentEspacio = espacioTrabajoId || empleado.espacioTrabajoId;
        const currentTipo = tipoDocumento || empleado.tipoDocumento;
        const currentDoc = numeroDocumento || empleado.numeroDocumento;

        if (currentDoc && currentTipo) {
            const docExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: currentEspacio,
                    tipoDocumento: currentTipo,
                    numeroDocumento: currentDoc,
                    id: { [Op.ne]: empleado.id }
                }
            });
            if (docExistente) {
                await t.rollback();
                return badRequest(res, `El número de documento ya está registrado para el tipo ${currentTipo} en este espacio de trabajo`);
            }
        }

        const currentCuil = cuil !== undefined ? cuil : empleado.cuil;
        if (currentCuil) {
            const cuilExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: currentEspacio,
                    cuil: currentCuil,
                    id: { [Op.ne]: empleado.id }
                }
            });
            if (cuilExistente) {
                await t.rollback();
                return badRequest(res, 'El CUIL ya está registrado en este espacio de trabajo');
            }
        }

        // Actualizar Empleado (Datos personales + Dirección + Otros)
        await empleado.update({
            ...empleadoData,
            telefono, tipoDocumento, numeroDocumento, cuil, fechaNacimiento, nacionalidadId, genero, estadoCivil,
            calle, numero, piso, departamento, codigoPostal, provinciaId, ciudadId
        }, { transaction: t });

        // Actualizar Usuario asociado (Solo Auth + Nombre)
        const usuario = await Usuario.findByPk(empleado.usuarioId);
        if (usuario) {
            await usuario.update({
                nombre, apellido, email
            }, { transaction: t });
        }

        await t.commit();

        // Recargar para devolver datos frescos
        const empleadoUpdated = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });

        const plainEmp = empleadoUpdated.get({ plain: true });
        const plainUser = plainEmp.usuario || {};

        return ok(res, {
            ...plainEmp,
            ...plainUser,
            id: plainEmp.id,
            usuarioId: plainUser.id
        });

    } catch (error) {
        await t.rollback();
        return manejarErrorSequelize(res, error);
    }
};

/**
 * Desactiva un empleado (eliminación lógica).
 * Desactiva el registro de Usuario asociado. Valida que no existan entidades
 * auxiliares activas (Contratos, Contactos, Registros de Salud) antes de proceder.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response confirmando la desactivación
 * @returns {Promise<void>}
 */
const remove = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });

        if (!empleado) {
            return notFound(res, 'Empleado');
        }

        // Verificar registros activos (manteniendo lógica anterior)
        const registrosActivos = await RegistroSalud.count({
            where: { empleadoId: empleado.id, activo: true }
        });
        const contratosActivos = await Contrato.count({
            where: { empleadoId: empleado.id, activo: true }
        });
        const contactosActivos = await Contacto.count({
            where: { empleadoId: empleado.id, activo: true }
        });

        if (registrosActivos > 0) {
            return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${registrosActivos} registro(s) de salud activo(s). Primero desactive los registros de salud.`);
        }

        if (contratosActivos > 0) {
            return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.`);
        }

        if (contactosActivos > 0) {
            return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contactosActivos} contacto(s) activo(s). Primero desactive los contactos.`);
        }

        // Desactivar Usuario
        await Usuario.update({ activo: false }, { where: { id: empleado.usuarioId }, transaction: t });

        await t.commit();
        return ok(res, { message: 'Empleado desactivado correctamente' });
    } catch (error) {
        await t.rollback();
        return serverError(res, error);
    }
};

/**
 * Reactiva un empleado previamente desactivado.
 * Valida que no se generen conflictos de duplicidad (email o documentos) con otros usuarios activos.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el empleado reactivado
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        const empleado = await Empleado.findByPk(req.params.id, {
            include: [{ model: Usuario, as: 'usuario' }]
        });
        if (!empleado) return notFound(res, 'Empleado');

        // 1. Validar unicidad de email activo
        const emailDuplicado = await Usuario.findOne({
            where: {
                email: empleado.usuario.email,
                activo: true,
                id: { [Op.ne]: empleado.usuarioId }
            }
        });
        if (emailDuplicado) {
            await t.rollback();
            return badRequest(res, 'Ya existe un usuario activo con este email');
        }

        // 2. Validar unicidad de documento activo en el mismo espacio
        if (empleado.numeroDocumento && empleado.tipoDocumento) {
            const docExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: empleado.espacioTrabajoId,
                    tipoDocumento: empleado.tipoDocumento,
                    numeroDocumento: empleado.numeroDocumento,
                    id: { [Op.ne]: empleado.id }
                },
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    where: { activo: true }
                }]
            });
            if (docExistente) {
                await t.rollback();
                return badRequest(res, `El número de documento ya está registrado para el tipo ${empleado.tipoDocumento} en este espacio de trabajo`);
            }
        }

        // 3. Validar unicidad de CUIL activo en el mismo espacio
        if (empleado.cuil) {
            const cuilExistente = await Empleado.findOne({
                where: {
                    espacioTrabajoId: empleado.espacioTrabajoId,
                    cuil: empleado.cuil,
                    id: { [Op.ne]: empleado.id }
                },
                include: [{
                    model: Usuario,
                    as: 'usuario',
                    where: { activo: true }
                }]
            });
            if (cuilExistente) {
                await t.rollback();
                return badRequest(res, 'El CUIL ya está registrado en este espacio de trabajo');
            }
        }

        await Usuario.update({ activo: true }, { where: { id: empleado.usuarioId }, transaction: t });

        await t.commit();
        return ok(res, empleado);
    } catch (error) {
        await t.rollback();
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples empleados en lote.
 * Realiza verificaciones de integridad individual para asegurar que ninguno
 * tenga entidades dependientes activas antes de proceder.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const bulkRemove = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !ids.length) return badRequest(res, 'IDs requeridos');

        // --- Verificaciones de entidades asociadas activas para cada empleado ---
        for (const id of ids) {
            const empleado = await Empleado.findByPk(id, {
                include: [{ model: Usuario, as: 'usuario' }]
            });
            if (!empleado) continue;

            const registrosActivos = await RegistroSalud.count({ where: { empleadoId: id, activo: true } });
            if (registrosActivos > 0) {
                return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${registrosActivos} registro(s) de salud activo(s). Primero desactive los registros de salud.`);
            }

            const contratosActivos = await Contrato.count({
                where: { empleadoId: id, activo: true }
            });
            if (contratosActivos > 0) {
                return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contratosActivos} contrato(s) activo(s). Primero desactive los contratos.`);
            }

            const contactosActivos = await Contacto.count({ where: { empleadoId: id, activo: true } });
            if (contactosActivos > 0) {
                return badRequest(res, `No se puede desactivar el empleado "${empleado.usuario.nombre}" porque tiene ${contactosActivos} contacto(s) activo(s). Primero desactive los contactos.`);
            }
        }

        await Usuario.update({ activo: false }, { where: { id: { [Op.in]: ids } } });

        return ok(res, { message: 'Empleados desactivados' });
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

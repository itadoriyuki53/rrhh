/**
 * @fileoverview Controller de Espacios de Trabajo.
 * Gestiona los contenedores lógicos que aíslan la información de diferentes clientes o unidades de negocio.
 * Incluye la lógica de inicialización automatizada de datos maestros (roles, permisos, conceptos) 
 * al crear un nuevo espacio.
 * @module controllers/espacioTrabajoController
 */

const { EspacioTrabajo, Usuario, ConceptoSalarial, ParametroLaboral, Rol, Permiso, Empleado, Empresa, Contrato, RegistroSalud, Contacto, ContratoPuesto, Puesto, Departamento, Area, sequelize } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { parsearPaginacion, construirRespuestaPaginada } = require('../helpers/paginacion.helper');
const { badRequest, notFound, serverError, ok, created } = require('../helpers/respuestas.helper');

/**
 * Obtiene todos los espacios de trabajo con filtros y paginación.
 * Aplica reglas de visibilidad: los administradores globales ven todo, 
 * los usuarios normales ven sus espacios propios y aquel donde son empleados.
 *
 * @param {import('express').Request} req - Request con query params: `nombre`, `activo`, `descripcion`, `propietarioId`
 * @param {import('express').Response} res - Response con lista paginada de espacios
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const { nombre, propietario, propietarioId, activo, descripcion, fechaCreacion } = req.query;
        const { page, limit, offset } = parsearPaginacion(req.query);
        const where = {};

        // Filtro de activo
        if (activo === 'false') {
            where.activo = false;
        } else if (activo !== 'all') {
            where.activo = true;
        }

        if (nombre) where.nombre = { [Op.like]: `%${nombre}%` };
        if (descripcion) where.descripcion = { [Op.like]: `%${descripcion}%` };

        if (fechaCreacion) {
            const parts = fechaCreacion.split('-');
            if (parts.length === 3) {
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1;
                const day = parseInt(parts[2]);
                const startDate = new Date(year, month, day, 0, 0, 0, 0);
                const endDate = new Date(year, month, day, 23, 59, 59, 999);
                where.createdAt = { [Op.between]: [startDate, endDate] };
            }
        }

        // --- Lógica de permisos ---
        const usuarioId = req.session.usuarioId || req.session.empleadoId;
        const esAdmin = req.session.esAdministrador;

        if (!esAdmin) {
            const emp = await Empleado.findOne({ where: { usuarioId } });
            if (emp && emp.espacioTrabajoId) {
                where[Op.or] = [
                    { propietarioId: usuarioId },
                    { id: emp.espacioTrabajoId }
                ];
            } else {
                where.propietarioId = usuarioId;
            }
        } else if (propietario || propietarioId) {
            where.propietarioId = propietario || propietarioId;
        }

        const result = await EspacioTrabajo.findAndCountAll({
            where,
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset,
        });

        return ok(res, construirRespuestaPaginada(result, page, limit));
    } catch (error) {
        console.error('Error en espacioTrabajoController.getAll:', error);
        return serverError(res, error);
    }
};

/**
 * Obtiene un espacio de trabajo por su ID.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res - Response con el espacio o 404
 * @returns {Promise<void>}
 */
const getById = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id, {
            include: [
                {
                    model: Usuario,
                    as: 'propietario',
                    attributes: ['id', 'nombre', 'apellido', 'email'],
                },
            ],
        });

        if (!espacio) {
            return notFound(res, 'Espacio de trabajo');
        }

        return ok(res, espacio);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Crea un nuevo espacio de trabajo y lo inicializa con datos por defecto.
 * El proceso se ejecuta en una transacción y genera automáticamente:
 * 1. Conceptos salariales obligatorios (Jubilación, Obra Social, etc.)
 * 2. Parámetros laborales base.
 * 3. Roles predefinidos (CEO, RRHH, Operativo) con sus respectivos permisos.
 *
 * @param {import('express').Request} req - Request con los datos básicos del espacio
 * @param {import('express').Response} res - Response con el espacio creado e inicializado
 * @returns {Promise<void>}
 */
const create = async (req, res) => {
    const t = await sequelize.transaction();
    try {
        // Asignar automáticamente el propietario como el usuario en sesión
        const usuarioId = req.session.usuarioId || req.session.empleadoId;

        const espacioData = {
            ...req.body,
            propietarioId: usuarioId,
        };

        const espacio = await EspacioTrabajo.create(espacioData, { transaction: t });

        // --- Generar Datos Obligatorios ---

        // 1. Conceptos Salariales
        const conceptosDefault = [
            { nombre: 'Jubilación', tipo: 'deduccion', esPorcentaje: true, valor: 11, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'Obra Social', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'PAMI', tipo: 'deduccion', esPorcentaje: true, valor: 3, esObligatorio: true, espacioTrabajoId: espacio.id },
            { nombre: 'Cuota Sindical', tipo: 'deduccion', esPorcentaje: true, valor: 2.5, esObligatorio: true, espacioTrabajoId: espacio.id },
        ];
        await ConceptoSalarial.bulkCreate(conceptosDefault, { transaction: t });

        // 2. Parámetros Laborales
        await ParametroLaboral.create({
            tipo: 'limite_ausencia_injustificada',
            valor: '1',
            descripcion: 'Límite de ausencias injustificadas permitidas por mes',
            esObligatorio: true,
            espacioTrabajoId: espacio.id
        }, { transaction: t });

        // 3. Roles por Defecto
        const allPermisos = await Permiso.findAll({ transaction: t });

        const getPermisosIds = (criterios) => {
            return allPermisos.filter(p => {
                return criterios.some(c => {
                    if (typeof c === 'string') return p.modulo === c;
                    return p.modulo === c.modulo && c.acciones.includes(p.accion);
                });
            }).map(p => p.id);
        };

        // 3.1 Director Ejecutivo (CEO) - Todos los permisos
        const rolCEO = await Rol.create({
            nombre: 'Director Ejecutivo',
            descripcion: 'Acceso total al sistema (CEO)',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        if (allPermisos.length > 0) {
            await rolCEO.setPermisos(allPermisos.map(p => p.id), { transaction: t });
        }

        // 3.2 Administrador de RRHH
        const rolRRHH = await Rol.create({
            nombre: 'Administrador de RRHH',
            descripcion: 'Gestión de RRHH y Reportes',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        const permisosRRHH = getPermisosIds([
            'empleados', 'contratos', 'registros_salud', 'evaluaciones', 'contactos', 'solicitudes',
            { modulo: 'empresas', acciones: ['leer'] },
            { modulo: 'reportes', acciones: ['leer'] },
            { modulo: 'liquidaciones', acciones: ['leer', 'actualizar'] }
        ]);

        if (permisosRRHH.length > 0) {
            await rolRRHH.setPermisos(permisosRRHH, { transaction: t });
        }

        // 3.3 Personal Operativo
        const rolOperativo = await Rol.create({
            nombre: 'Personal Operativo',
            descripcion: 'Acceso de lectura limitado',
            esObligatorio: true,
            espacioTrabajoId: espacio.id,
            activo: true
        }, { transaction: t });

        const permisosOperativo = getPermisosIds([
            { modulo: 'registros_salud', acciones: ['leer'] },
            { modulo: 'evaluaciones', acciones: ['leer'] },
            { modulo: 'contactos', acciones: ['leer'] },
            { modulo: 'solicitudes', acciones: ['leer'] },
            { modulo: 'liquidaciones', acciones: ['leer'] }
        ]);

        if (permisosOperativo.length > 0) {
            await rolOperativo.setPermisos(permisosOperativo, { transaction: t });
        }

        await t.commit();

        const espacioCompleto = await EspacioTrabajo.findByPk(espacio.id, {
            include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
        });

        return created(res, espacioCompleto);
    } catch (error) {
        await t.rollback();
        return serverError(res, error);
    }
};

/**
 * Actualiza los datos de un espacio de trabajo.
 *
 * @param {import('express').Request} req - Request con ID y campos a actualizar
 * @param {import('express').Response} res - Response con el espacio actualizado
 * @returns {Promise<void>}
 */
const update = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return notFound(res, 'Espacio de trabajo');
        }

        const { propietarioId, ...updateData } = req.body;
        await espacio.update(updateData);

        const espacioActualizado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
        });

        return ok(res, espacioActualizado);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva un espacio de trabajo (eliminación lógica).
 * Valida que no existan entidades activas asociadas (empresas, empleados, roles, conceptos, parámetros).
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteEspacio = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);

        if (!espacio) {
            return notFound(res, 'Espacio de trabajo');
        }

        // --- Verificaciones de entidades asociadas activas ---
        const empresasActivas = await Empresa.count({ where: { espacioTrabajoId: espacio.id, activo: true } });
        if (empresasActivas > 0) {
            return badRequest(res, `El espacio tiene ${empresasActivas} empresa(s) activa(s).`);
        }

        const empleadosActivos = await Empleado.count({
            where: { espacioTrabajoId: espacio.id },
            include: [{ model: Usuario, as: 'usuario', where: { activo: true } }]
        });
        if (empleadosActivos > 0) {
            return badRequest(res, `El espacio tiene ${empleadosActivos} empleado(s) activo(s).`);
        }

        const rolesActivos = await Rol.count({ where: { espacioTrabajoId: espacio.id, activo: true } });
        if (rolesActivos > 0) {
            return badRequest(res, `El espacio tiene ${rolesActivos} rol(es) activo(s).`);
        }

        const conceptosActivos = await ConceptoSalarial.count({ where: { espacioTrabajoId: espacio.id, activo: true } });
        if (conceptosActivos > 0) {
            return badRequest(res, `El espacio tiene ${conceptosActivos} concepto(s) salarial(es) activo(s).`);
        }

        await espacio.update({ activo: false });
        return ok(res, { message: 'Espacio de trabajo desactivado exitosamente' });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Desactiva múltiples espacios de trabajo en lote.
 *
 * @param {import('express').Request} req - Request con array de `ids` en el body
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const deleteBulk = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return badRequest(res, 'Se requiere un array de IDs');
        }

        for (const id of ids) {
            const espacio = await EspacioTrabajo.findByPk(id);
            if (!espacio) continue;

            const empresasActivas = await Empresa.count({ where: { espacioTrabajoId: id, activo: true } });
            if (empresasActivas > 0) return badRequest(res, `Espacio "${espacio.nombre}" tiene empresas activas.`);

            const empleadosActivos = await Empleado.count({
                where: { espacioTrabajoId: id },
                include: [{ model: Usuario, as: 'usuario', where: { activo: true } }]
            });
            if (empleadosActivos > 0) return badRequest(res, `Espacio "${espacio.nombre}" tiene empleados activos.`);
        }

        await EspacioTrabajo.update({ activo: false }, { where: { id: ids } });
        return ok(res, { message: `${ids.length} espacio(s) desactivado(s)` });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Reactiva un espacio de trabajo previamente desactivado.
 *
 * @param {import('express').Request} req - Request con `params.id`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const reactivate = async (req, res) => {
    try {
        const espacio = await EspacioTrabajo.findByPk(req.params.id);
        if (!espacio) return notFound(res, 'Espacio de trabajo');

        await espacio.update({ activo: true });
        const espacioReactivado = await EspacioTrabajo.findByPk(espacio.id, {
            include: [{ model: Usuario, as: 'propietario', attributes: ['id', 'nombre', 'apellido', 'email'] }],
        });
        return ok(res, espacioReactivado);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Verifica si un empleado es elegible para cambiar de espacio de trabajo.
 * No debe tener ningún historial de contratos, registros de salud o contactos asociados.
 *
 * @param {import('express').Request} req - Request con `params.empleadoId`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const canChangeEmpleadoWorkspace = async (req, res) => {
    try {
        const { empleadoId } = req.params;
        if (await Contrato.count({ where: { empleadoId } }) > 0) return ok(res, { canChange: false, reason: 'El empleado tiene contratos' });
        if (await RegistroSalud.count({ where: { empleadoId } }) > 0) return ok(res, { canChange: false, reason: 'El empleado tiene registros de salud' });
        if (await Contacto.count({ where: { empleadoId } }) > 0) return ok(res, { canChange: false, reason: 'El empleado tiene contactos' });
        return ok(res, { canChange: true });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Verifica si una empresa puede ser migrada de espacio de trabajo.
 * No debe tener contratos vinculados a ninguno de sus puestos jerárquicos.
 *
 * @param {import('express').Request} req - Request con `params.empresaId`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const canChangeEmpresaWorkspace = async (req, res) => {
    try {
        const { empresaId } = req.params;
        const puestos = await Puesto.findAll({ include: [{ model: Departamento, as: 'departamento', required: true, include: [{ model: Area, as: 'area', required: true, where: { empresaId } }] }] });
        const puestoIds = puestos.map(p => p.id);
        if (puestoIds.length > 0 && await ContratoPuesto.count({ where: { puestoId: puestoIds } }) > 0) {
            return ok(res, { canChange: false, reason: 'La empresa tiene contratos vinculados' });
        }
        return ok(res, { canChange: true });
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Verifica si un rol personalizado puede ser movido a otro espacio de trabajo.
 * No debe estar asignado a ningún contrato (activo o inactivo).
 *
 * @param {import('express').Request} req - Request con `params.rolId`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const canChangeRolWorkspace = async (req, res) => {
    try {
        const { rolId } = req.params;
        if (await Contrato.count({ where: { rolId } }) > 0) return ok(res, { canChange: false, reason: 'El rol está asignado a contratos' });
        return ok(res, { canChange: true });
    } catch (error) {
        return serverError(res, error);
    }
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    deleteEspacio,
    deleteBulk,
    reactivate,
    canChangeEmpleadoWorkspace,
    canChangeEmpresaWorkspace,
    canChangeRolWorkspace,
};

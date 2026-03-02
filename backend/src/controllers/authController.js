/**
 * @fileoverview Controller de Autenticación.
 * Maneja el inicio de sesión, registro público de usuarios, gestión de sesiones,
 * cambio de contraseñas y actualización de perfil del usuario actual.
 * @module controllers/authController
 */

const { Usuario, Empleado, Contrato, Rol, Permiso } = require('../models');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');

// Helpers
const { badRequest, unauthorized, forbidden, notFound, serverError, manejarErrorSequelize, ok, created } = require('../helpers/respuestas.helper');

/**
 * Inicia sesión de un usuario.
 * Valida credenciales, crea la sesión en Express y carga los datos
 * de empleado, espacio de trabajo y permisos asociados al contrato seleccionado.
 *
 * @param {import('express').Request} req - Request con `email`, `contrasena` y `recordarme`
 * @param {import('express').Response} res - Response con datos del usuario y sesión
 * @returns {Promise<void>}
 */
const login = async (req, res) => {
    try {
        const { email, contrasena, recordarme } = req.body;

        // Validación básica
        if (!email || !contrasena) {
            return badRequest(res, 'Email y contraseña son requeridos');
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({
            where: { email, activo: true }
        });

        if (!usuario) {
            return unauthorized(res, 'Credenciales inválidas');
        }

        // Verificar contraseña
        const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);
        if (!isMatch) {
            return unauthorized(res, 'Credenciales inválidas');
        }

        // Crear sesión
        req.session.usuarioId = usuario.id;
        req.session.empleadoId = usuario.id; // Retrocompatibilidad temporal: ID de usuario
        req.session.esAdministrador = usuario.esAdministrador;

        // Si "recordarme" está activo, extender duración de la cookie
        if (recordarme) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días
        }

        // Buscar un empleo asociado para mezclar datos (compatibilidad frontend)
        const emp = await Empleado.findOne({
            where: {
                usuarioId: usuario.id
            }
        });

        // Lógica de contrato seleccionado por defecto
        if (emp && !emp.ultimoContratoSeleccionadoId) {
            const ultimoContrato = await Contrato.findOne({
                where: { empleadoId: emp.id, activo: true },
                order: [['fechaInicio', 'DESC'], ['createdAt', 'DESC']]
            });
            if (ultimoContrato) {
                await emp.update({ ultimoContratoSeleccionadoId: ultimoContrato.id });
                emp.ultimoContratoSeleccionadoId = ultimoContrato.id;
            }
        }

        // Construir respuesta userData
        const userData = usuario.get({ plain: true });
        delete userData.contrasena;

        if (emp) {
            const empData = emp.get({ plain: true });

            // Cargar Rol y Permisos del contrato seleccionado
            if (empData.ultimoContratoSeleccionadoId) {
                const contrato = await Contrato.findByPk(empData.ultimoContratoSeleccionadoId, {
                    include: [{
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'nombre'],
                        include: [{
                            model: Permiso,
                            as: 'permisos',
                            through: { attributes: [] },
                            attributes: ['id', 'modulo', 'accion']
                        }]
                    }]
                });

                if (contrato && contrato.rol) {
                    userData.rol = contrato.rol;
                }
            }

            // Mezclar datos de empleado en el objeto usuario (para compatibilidad con frontend actual)
            Object.assign(userData, {
                empleadoId: empData.id,
                espacioTrabajoId: empData.espacioTrabajoId,
                telefono: empData.telefono,
                tipoDocumento: empData.tipoDocumento,
                numeroDocumento: empData.numeroDocumento,
                cuil: empData.cuil,
                fechaNacimiento: empData.fechaNacimiento,
                nacionalidadId: empData.nacionalidadId,
                genero: empData.genero,
                estadoCivil: empData.estadoCivil,
                calle: empData.calle,
                numero: empData.numero,
                piso: empData.piso,
                departamento: empData.departamento,
                codigoPostal: empData.codigoPostal,
                provinciaId: empData.provinciaId,
                ciudadId: empData.ciudadId,
                ultimoContratoSeleccionadoId: empData.ultimoContratoSeleccionadoId,
            });
        }

        // Guardar sesión y retornar datos
        req.session.save((err) => {
            if (err) {
                console.error('Error al guardar sesión:', err);
                return serverError(res, new Error('Error al iniciar sesión'));
            }

            return ok(res, {
                message: 'Inicio de sesión exitoso',
                usuario: userData
            });
        });

    } catch (error) {
        console.error('Error en login:', error);
        return serverError(res, error);
    }
};

/**
 * Cierra la sesión del usuario actual.
 * Destruye la sesión de Express y limpia la cookie del cliente.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {void}
 */
const logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error al cerrar sesión:', err);
            return serverError(res, new Error('Error al cerrar sesión'));
        }
        res.clearCookie('connect.sid');
        return ok(res, { message: 'Sesión cerrada exitosamente' });
    });
};

/**
 * Registra un nuevo usuario de forma pública.
 * Por defecto se registra como no empleado y no administrador.
 * Incluye validaciones de complejidad de contraseña y unicidad de email.
 *
 * @type {Array<import('express').RequestHandler>}
 */
const register = [
    // Validaciones
    body('email').isEmail().withMessage('Email inválido'),
    body('contrasena')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('apellido').notEmpty().withMessage('El apellido es requerido'),

    async (req, res) => {
        try {
            // Validar errores
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return badRequest(res, errors.array()[0].msg);
            }

            const usuarioData = {
                nombre: req.body.nombre,
                apellido: req.body.apellido,
                email: req.body.email,
                contrasena: req.body.contrasena,
                esEmpleado: false, // Registro público
                esAdministrador: false,
                activo: true,
            };

            // Crear usuario
            const nuevoUsuario = await Usuario.create(usuarioData);

            return created(res, {
                message: 'Registro exitoso',
                usuario: {
                    id: nuevoUsuario.id,
                    nombre: nuevoUsuario.nombre,
                    apellido: nuevoUsuario.apellido,
                    email: nuevoUsuario.email,
                    esAdministrador: false,
                    esEmpleado: false,
                    activo: true,
                    createdAt: nuevoUsuario.createdAt,
                    updatedAt: nuevoUsuario.updatedAt,
                }
            });

        } catch (error) {
            console.error('Error en registro:', error);
            return manejarErrorSequelize(res, error);
        }
    }
];

/**
 * Obtiene la información del usuario actualmente autenticado.
 * Enriquece los datos del usuario con información de empleado, 
 * espacio de trabajo y permisos del rol asociado al contrato seleccionado.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const getCurrentUser = async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || req.session.empleadoId;

        if (!usuarioId) {
            return unauthorized(res);
        }

        const usuario = await Usuario.findByPk(usuarioId, {
            attributes: { exclude: ['contrasena'] },
        });

        if (!usuario) {
            return notFound(res, 'Usuario');
        }

        const result = usuario.get({ plain: true });

        // Buscar empleado asociado por separado (evita problemas con limit en hasMany)
        const empleado = await Empleado.findOne({ where: { usuarioId } });
        if (empleado) {
            // Lógica de contrato seleccionado por defecto si es nulo
            if (!empleado.ultimoContratoSeleccionadoId) {
                const ultimoContrato = await Contrato.findOne({
                    where: { empleadoId: empleado.id, activo: true },
                    order: [['fechaInicio', 'DESC'], ['createdAt', 'DESC']]
                });
                if (ultimoContrato) {
                    await empleado.update({ ultimoContratoSeleccionadoId: ultimoContrato.id });
                    empleado.ultimoContratoSeleccionadoId = ultimoContrato.id;
                }
            }

            const emp = empleado.get({ plain: true });

            // Cargar Rol y Permisos del contrato seleccionado
            if (emp.ultimoContratoSeleccionadoId) {
                const contrato = await Contrato.findByPk(emp.ultimoContratoSeleccionadoId, {
                    include: [{
                        model: Rol,
                        as: 'rol',
                        attributes: ['id', 'nombre'],
                        include: [{
                            model: Permiso,
                            as: 'permisos',
                            through: { attributes: [] }, // Tabla intermedia
                            attributes: ['id', 'modulo', 'accion']
                        }]
                    }]
                });

                if (contrato && contrato.rol) {
                    result.rol = contrato.rol;
                }
            }

            Object.assign(result, {
                empleadoId: emp.id,
                espacioTrabajoId: emp.espacioTrabajoId,
                telefono: emp.telefono,
                tipoDocumento: emp.tipoDocumento,
                numeroDocumento: emp.numeroDocumento,
                cuil: emp.cuil,
                fechaNacimiento: emp.fechaNacimiento,
                nacionalidadId: emp.nacionalidadId,
                genero: emp.genero,
                estadoCivil: emp.estadoCivil,
                calle: emp.calle,
                numero: emp.numero,
                piso: emp.piso,
                departamento: emp.departamento,
                codigoPostal: emp.codigoPostal,
                provinciaId: emp.provinciaId,
                ciudadId: emp.ciudadId,
                ultimoContratoSeleccionadoId: emp.ultimoContratoSeleccionadoId,
            });
        }

        return ok(res, result);

    } catch (error) {
        console.error('Error al obtener usuario:', error);
        return serverError(res, error);
    }
};

/**
 * Actualiza la contraseña del usuario.
 * Permite a los administradores cambiar cualquier contraseña sin validar la actual.
 * Los usuarios normales deben proporcionar su contraseña actual para cambiarla.
 *
 * @type {Array<import('express').RequestHandler>}
 */
const updatePassword = [
    body('nuevaContrasena')
        .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
        .matches(/[A-Z]/).withMessage('La contraseña debe contener al menos una mayúscula')
        .matches(/[0-9]/).withMessage('La contraseña debe contener al menos un número')
        .matches(/[@$!%*?&#]/).withMessage('La contraseña debe contener al menos un carácter especial'),

    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return badRequest(res, errors.array()[0].msg);
            }

            const { usuarioId, contrasenaActual, nuevaContrasena } = req.body;
            const usuarioIdSesion = req.session.usuarioId || req.session.empleadoId;
            const esAdmin = req.session.esAdministrador;

            const targetId = usuarioId || usuarioIdSesion;

            // Verificar permisos
            if (targetId !== usuarioIdSesion && !esAdmin) {
                return forbidden(res, 'No tiene permisos para cambiar esta contraseña');
            }

            const usuario = await Usuario.findByPk(targetId);
            if (!usuario) {
                return notFound(res, 'Usuario');
            }

            // Si no es admin y está cambiando su propia contraseña, verificar la actual
            if (!esAdmin && targetId === usuarioIdSesion) {
                if (!contrasenaActual) {
                    return badRequest(res, 'Debe proporcionar la contraseña actual');
                }

                const isMatch = await bcrypt.compare(contrasenaActual, usuario.contrasena);
                if (!isMatch) {
                    return unauthorized(res, 'Contraseña actual incorrecta');
                }
            }

            usuario.contrasena = nuevaContrasena;
            await usuario.save(); // Hook hashea

            return ok(res, { message: 'Contraseña actualizada exitosamente' });

        } catch (error) {
            console.error('Error al actualizar contraseña:', error);
            return serverError(res, error);
        }
    }
];

/**
 * Actualiza el contrato seleccionado actualmente por el empleado.
 * Valida que el contrato pertenezca efectivamente al empleado en sesión.
 *
 * @param {import('express').Request} req - Request con `contratoId`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateSelectedContract = async (req, res) => {
    try {
        const { contratoId } = req.body;
        const usuarioSesionId = req.session.usuarioId || req.session.empleadoId;

        if (!usuarioSesionId) return unauthorized(res);

        const emp = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

        if (!emp) {
            return notFound(res, 'Empleado');
        }

        if (contratoId) {
            // Validar que el contrato sea del empleado
            const contrato = await Contrato.findOne({
                where: {
                    id: contratoId,
                    empleadoId: emp.id
                }
            });

            if (!contrato) {
                return forbidden(res, 'Contrato no válido o no pertenece al empleado');
            }

            await emp.update({ ultimoContratoSeleccionadoId: contratoId });
        }

        return ok(res, { success: true, contratoId });

    } catch (error) {
        console.error('Error updating selected contract:', error);
        return serverError(res, error);
    }
};

/**
 * Actualiza la información básica del perfil del usuario autenticado (nombre, apellido, email).
 * Valida que el nuevo email no esté en uso por otro usuario.
 *
 * @param {import('express').Request} req - Request con `nombre`, `apellido`, `email`
 * @param {import('express').Response} res
 * @returns {Promise<void>}
 */
const updateMe = async (req, res) => {
    try {
        const usuarioId = req.session.usuarioId || req.session.empleadoId;
        if (!usuarioId) return unauthorized(res);

        const { nombre, apellido, email } = req.body;

        if (!nombre?.trim()) return badRequest(res, 'El nombre es requerido');
        if (!apellido?.trim()) return badRequest(res, 'El apellido es requerido');
        if (!email?.trim()) return badRequest(res, 'El email es requerido');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return badRequest(res, 'Email inválido');

        const usuario = await Usuario.findByPk(usuarioId);
        if (!usuario) return notFound(res, 'Usuario');

        // Verificar email único (ignorando el propio)
        if (email.toLowerCase() !== usuario.email.toLowerCase()) {
            const existing = await Usuario.findOne({ where: { email } });
            if (existing) return badRequest(res, 'El email ya está registrado por otro usuario');
        }

        await usuario.update({ nombre: nombre.trim(), apellido: apellido.trim(), email: email.trim() });

        return ok(res, {
            message: 'Perfil actualizado correctamente', usuario: {
                id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, email: usuario.email
            }
        });
    } catch (error) {
        console.error('Error al actualizar perfil:', error);
        return serverError(res, error);
    }
};

module.exports = {
    login,
    logout,
    register,
    getCurrentUser,
    updatePassword,
    updateSelectedContract,
    updateMe,
};

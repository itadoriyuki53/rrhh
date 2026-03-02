/**
 * @fileoverview Middlewares de autenticación y autorización.
 * Provee middlewares de Express para:
 * - Verificar que el usuario esté autenticado (sesión activa).
 * - Verificar roles de administrador.
 * - Verificar permisos granulares por módulo y acción.
 * @module middlewares/authMiddleware
 */

const { Empleado, Contrato, Rol, Permiso } = require('../models');

/**
 * Verifica que el usuario tenga una sesión activa.
 * Retorna 401 si no hay sesión iniciada.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.empleadoId) {
        return next();
    }
    return res.status(401).json({
        error: 'No autorizado. Debe iniciar sesión.'
    });
};

/**
 * Verifica que el usuario sea administrador global.
 * Retorna 403 si no tiene el flag `esAdministrador` en sesión.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const isAdmin = (req, res, next) => {
    if (req.session && req.session.esAdministrador) {
        return next();
    }
    return res.status(403).json({
        error: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
    });
};

/**
 * Verifica que el usuario pueda editar el empleado indicado en `req.params.id`.
 * Permite el acceso si es admin global, o si está editando su propio perfil.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const canEditEmployee = (req, res, next) => {
    const empleadoIdTarget = parseInt(req.params.id);
    const empleadoIdSesion = req.session.empleadoId;
    const esAdmin = req.session.esAdministrador;

    if (esAdmin) return next();
    if (empleadoIdTarget === empleadoIdSesion) return next();

    return res.status(403).json({
        error: 'No tiene permisos para acceder a esta información.'
    });
};

/**
 * Verifica que el usuario NO sea un empleado (es propietario o externo).
 * Retorna 403 si el flag `esEmpleado` está activo en sesión.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
const isNotEmployee = (req, res, next) => {
    const esEmpleado = req.session.esEmpleado;
    if (!esEmpleado) return next();

    return res.status(403).json({
        error: 'No tiene permisos para acceder a esta información.'
    });
};

/**
 * Middleware de permisos por módulo y acción.
 *
 * Reglas de acceso:
 * - Admin global → siempre pasa.
 * - No empleado (propietario/externo) → siempre pasa.
 * - Empleado sin contrato seleccionado → pasa (sin restricción configurada).
 * - Empleado con rol pero sin permisos para el módulo → pasa (no configurado).
 * - Empleado con permisos para el módulo pero sin la acción solicitada → **403**.
 *
 * @param {string} modulo - Nombre del módulo (ej: 'empleados', 'solicitudes')
 * @param {string} accion - Acción a verificar ('leer', 'crear', 'actualizar', 'eliminar')
 * @returns {import('express').RequestHandler} Middleware async de Express
 */
const requirePermiso = (modulo, accion) => async (req, res, next) => {
    try {
        if (req.session.esAdministrador) return next();

        const usuarioId = req.session.usuarioId || req.session.empleadoId;
        const empleado = await Empleado.findOne({ where: { usuarioId } });

        // No es empleado (propietario/externo) → puede pasar
        if (!empleado) return next();

        // Es empleado sin contrato seleccionado → pasa (sin permisos configurados)
        if (!empleado.ultimoContratoSeleccionadoId) return next();

        const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
            include: [{
                model: Rol,
                as: 'rol',
                include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }]
            }]
        });

        // Sin rol asignado al contrato → pasa (sin restricción configurada)
        if (!contrato?.rol) return next();

        const permisosDelModulo = (contrato.rol.permisos || []).filter(
            p => p.modulo === modulo
        );

        // El módulo no tiene permisos configurados en este rol → pasa
        if (permisosDelModulo.length === 0) return next();

        // El módulo SÍ tiene permisos: verificar que incluya la acción solicitada
        const tiene = permisosDelModulo.some(p => p.accion === accion);

        if (!tiene) {
            return res.status(403).json({
                error: `No tiene permiso para "${accion}" en el módulo "${modulo}".`
            });
        }

        return next();
    } catch (err) {
        console.error('[requirePermiso] Error:', err);
        return res.status(500).json({ error: err.message });
    }
};

module.exports = {
    isAuthenticated,
    isNotEmployee,
    isAdmin,
    canEditEmployee,
    requirePermiso,
};

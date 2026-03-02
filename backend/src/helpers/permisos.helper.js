/**
 * @fileoverview Helper de verificación de permisos de usuario.
 * Provee funciones reutilizables para verificar si un usuario tiene
 * permisos específicos sobre un módulo, evitando duplicación de lógica
 * entre controllers.
 * @module helpers/permisos
 */

const { Empleado, Contrato, Rol, Permiso } = require('../models');

/**
 * Verifica si el usuario en sesión tiene un permiso específico sobre un módulo.
 *
 * Reglas de acceso:
 * - Admin global → siempre tiene acceso.
 * - No empleado (propietario/externo) → siempre tiene acceso.
 * - Empleado sin contrato seleccionado → tiene acceso (sin restricción configurada).
 * - Empleado con rol pero sin permisos para el módulo → tiene acceso (no configurado).
 * - Empleado con permisos para el módulo pero sin la acción solicitada → denegado.
 *
 * @param {object} session - Objeto de sesión de Express (`req.session`)
 * @param {string} modulo - Nombre del módulo a verificar (ej: 'solicitudes', 'empleados')
 * @param {string} accion - Acción a verificar (ej: 'leer', 'crear', 'actualizar', 'eliminar')
 * @returns {Promise<boolean>} `true` si tiene permiso, `false` si no
 */
const tienePermiso = async (session, modulo, accion) => {
    // Admin global siempre pasa
    if (session.esAdministrador) return true;

    const usuarioId = session.usuarioId || session.empleadoId;
    const empleado = await Empleado.findOne({ where: { usuarioId } });

    // No es empleado (propietario/externo) → pasa siempre
    if (!empleado) return true;

    // Es empleado sin contrato seleccionado → pasa (sin restricción configurada)
    if (!empleado.ultimoContratoSeleccionadoId) return true;

    const contrato = await Contrato.findByPk(empleado.ultimoContratoSeleccionadoId, {
        include: [{
            model: Rol,
            as: 'rol',
            include: [{ model: Permiso, as: 'permisos', through: { attributes: [] } }]
        }]
    });

    // Sin rol asignado al contrato → pasa (sin restricción configurada)
    if (!contrato?.rol) return true;

    const permisosDelModulo = (contrato.rol.permisos || []).filter(
        p => p.modulo === modulo
    );

    // El módulo no tiene permisos configurados en este rol → pasa
    if (permisosDelModulo.length === 0) return true;

    // Verificar si tiene la acción específica
    return permisosDelModulo.some(p => p.accion === accion);
};

/**
 * Respuesta estándar de error 403 para permisos insuficientes.
 *
 * @param {object} res - Objeto de respuesta de Express
 * @param {string} modulo - Nombre del módulo
 * @param {string} accion - Acción denegada
 * @returns {object} Respuesta HTTP 403 con mensaje de error
 */
const respuestaPermisoDenegado = (res, modulo, accion) => {
    return res.status(403).json({
        error: `No tiene permiso para "${accion}" en el módulo "${modulo}".`
    });
};

module.exports = {
    tienePermiso,
    respuestaPermisoDenegado,
};

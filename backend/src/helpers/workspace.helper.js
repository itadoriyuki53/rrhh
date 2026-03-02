/**
 * @fileoverview Helper de resolución de scope de workspace.
 * Centraliza la lógica de filtrado por espacio de trabajo para evitar
 * duplicación entre controllers. Determina a qué contratos tiene acceso
 * un usuario según su rol (admin, propietario, empleado con/sin permisos).
 * @module helpers/workspace
 */

const { Empleado, Contrato, EspacioTrabajo } = require('../models');
const { Op } = require('sequelize');
const { tienePermiso } = require('./permisos.helper');

/**
 * Objeto de respuesta vacía estándar para paginación.
 * @constant {object}
 */
const RESPUESTA_VACIA_PAGINADA = {
    data: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }
};

/**
 * Resuelve los IDs de contratos accesibles según el usuario en sesión.
 *
 * Casos de uso:
 * - **Admin global**: puede filtrar por cualquier empleadoId o espacioTrabajoId.
 * - **Propietario**: ve todos los empleados de sus espacios de trabajo.
 * - **Empleado con permisos de gestión**: ve todos los del mismo workspace.
 * - **Empleado sin permisos**: solo ve sus propios contratos.
 *
 * @param {object} session - Objeto de sesión de Express (`req.session`)
 * @param {object} [filtros={}] - Filtros opcionales de la request
 * @param {string|number} [filtros.empleadoId] - Filtrar por empleado específico
 * @param {string|number} [filtros.espacioTrabajoId] - Filtrar por espacio de trabajo
 * @param {string|number} [filtros.contratoId] - Filtrar directamente por contrato (solo admin)
 * @param {string} [modulo='solicitudes'] - Módulo sobre el que se verifican permisos de gestión
 * @returns {Promise<{contratoIds: number[]|null, error: boolean, respuestaVacia: boolean}>}
 *   - `contratoIds`: array de IDs de contratos accesibles, o `null` si no aplica filtro (admin sin criterio)
 *   - `respuestaVacia`: `true` si el resultado debe ser vacío (sin acceso)
 *   - `error`: `true` si ocurrió un error inesperado
 */
const resolverScopeContratos = async (session, filtros = {}, modulo = 'solicitudes') => {
    const { empleadoId, espacioTrabajoId, contratoId } = filtros;
    const usuarioSesionId = session.usuarioId || session.empleadoId;
    const esAdmin = session.esAdministrador;

    // ──────────────────────────────────────────────────────────────
    // ADMIN GLOBAL — puede ver todo, con filtros opcionales
    // ──────────────────────────────────────────────────────────────
    if (esAdmin) {
        if (contratoId) {
            return { contratoIds: [parseInt(contratoId)], respuestaVacia: false };
        }

        if (!empleadoId && !espacioTrabajoId) {
            // Sin filtros: no restringir contratos
            return { contratoIds: null, respuestaVacia: false };
        }

        let whereContrato = {};
        if (empleadoId) whereContrato.empleadoId = empleadoId;

        if (espacioTrabajoId) {
            const empleadosWs = await Empleado.findAll({
                where: { espacioTrabajoId },
                attributes: ['id']
            });
            const idsWs = empleadosWs.map(e => e.id);

            if (empleadoId && !idsWs.includes(parseInt(empleadoId))) {
                return { contratoIds: [], respuestaVacia: true };
            }
            if (!empleadoId) whereContrato.empleadoId = { [Op.in]: idsWs };
        }

        const contratos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
        return { contratoIds: contratos.map(c => c.id), respuestaVacia: false };
    }

    // ──────────────────────────────────────────────────────────────
    // NO ADMIN — resolver según tipo de usuario
    // ──────────────────────────────────────────────────────────────
    const empleadoSesion = await Empleado.findOne({ where: { usuarioId: usuarioSesionId } });

    if (empleadoSesion) {
        // ── ES EMPLEADO ──
        // Determinar si tiene permisos de gestión (puede ver todos del workspace)
        const tieneGestion =
            await tienePermiso(session, modulo, 'crear') ||
            await tienePermiso(session, modulo, 'actualizar') ||
            await tienePermiso(session, modulo, 'eliminar');

        if (tieneGestion) {
            // Puede ver los datos de todos los empleados de su workspace
            const empleadosWs = await Empleado.findAll({
                where: { espacioTrabajoId: empleadoSesion.espacioTrabajoId },
                attributes: ['id']
            });
            const idsEmpleadosWs = empleadosWs.map(e => e.id);

            // Validar que el empleadoId filtrado pertenezca al workspace
            if (empleadoId && !idsEmpleadosWs.includes(parseInt(empleadoId))) {
                return { contratoIds: [], respuestaVacia: true };
            }

            // Validar que el espacioTrabajoId sea el propio del empleado
            if (espacioTrabajoId && parseInt(espacioTrabajoId) !== empleadoSesion.espacioTrabajoId) {
                return { contratoIds: [], respuestaVacia: true };
            }

            const whereContrato = empleadoId
                ? { empleadoId }
                : { empleadoId: { [Op.in]: idsEmpleadosWs } };

            const contratos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
            return { contratoIds: contratos.map(c => c.id), respuestaVacia: false };

        } else {
            // Solo ve sus propios contratos
            if (empleadoId && parseInt(empleadoId) !== empleadoSesion.id) {
                return { contratoIds: [], respuestaVacia: true };
            }

            const contratos = await Contrato.findAll({
                where: { empleadoId: empleadoSesion.id },
                attributes: ['id']
            });
            return { contratoIds: contratos.map(c => c.id), respuestaVacia: false };
        }

    } else {
        // ── ES PROPIETARIO (no empleado) ──
        const espaciosPropios = await EspacioTrabajo.findAll({
            where: { propietarioId: usuarioSesionId },
            attributes: ['id']
        });
        const espaciosIds = espaciosPropios.map(e => e.id);

        // Validar que el espacioTrabajoId solicitado sea propio
        let targetEspacios = espaciosIds;
        if (espacioTrabajoId) {
            if (!espaciosIds.includes(parseInt(espacioTrabajoId))) {
                return { contratoIds: [], respuestaVacia: true };
            }
            targetEspacios = [parseInt(espacioTrabajoId)];
        }

        const empleadosDeWorkspaces = await Empleado.findAll({
            where: { espacioTrabajoId: { [Op.in]: targetEspacios } },
            attributes: ['id']
        });
        const idsPermitidos = empleadosDeWorkspaces.map(e => e.id);

        // Validar que el empleadoId solicitado pertenezca a sus workspaces
        if (empleadoId && !idsPermitidos.includes(parseInt(empleadoId))) {
            return { contratoIds: [], respuestaVacia: true };
        }

        const whereContrato = empleadoId
            ? { empleadoId }
            : { empleadoId: { [Op.in]: idsPermitidos } };

        const contratos = await Contrato.findAll({ where: whereContrato, attributes: ['id'] });
        const ids = contratos.map(c => c.id);

        // Si no hay contratos accesibles, retornar ID inválido para no romper la query
        return { contratoIds: ids.length > 0 ? ids : [-1], respuestaVacia: false };
    }
};

module.exports = {
    resolverScopeContratos,
    RESPUESTA_VACIA_PAGINADA,
};

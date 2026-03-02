/**
 * @fileoverview Controller de Permisos.
 * Gestiona el catálogo maestro de permisos del sistema (Matriz Modulo x Acción).
 * Incluye lógica de inicialización para asegurar que todos los módulos tengan sus permisos base definidos.
 * @module controllers/permisoController
 */

const { Permiso, Rol } = require('../models');
const { Op } = require('sequelize');

// Helpers
const { serverError, ok } = require('../helpers/respuestas.helper');

/**
 * Obtiene todos los permisos registrados en el sistema.
 * Ordenados alfabéticamente por módulo y luego por acción.
 *
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response con lista plana de permisos
 * @returns {Promise<void>}
 */
const getAll = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            order: [['modulo', 'ASC'], ['accion', 'ASC']],
        });

        res.json(permisos);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Obtiene los permisos agrupados jerárquicamente por módulo.
 * Estructura ideal para renderizar paneles de configuración de roles en el frontend.
 *
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response con objeto agrupador: `{ modulo: Permiso[] }`
 * @returns {Promise<void>}
 */
const getGroupedByModule = async (req, res) => {
    try {
        const permisos = await Permiso.findAll({
            order: [['modulo', 'ASC'], ['accion', 'ASC']],
        });

        // Agrupar por módulo
        const grouped = permisos.reduce((acc, permiso) => {
            if (!acc[permiso.modulo]) {
                acc[permiso.modulo] = [];
            }
            acc[permiso.modulo].push(permiso);
            return acc;
        }, {});

        res.json(grouped);
    } catch (error) {
        return serverError(res, error);
    }
};

/**
 * Inicializa y sincroniza los permisos del sistema según la matriz de módulos definida.
 * Este endpoint es auto-curativo: crea los permisos faltantes y elimina los obsoletos
 * o aquellos que violan reglas de seguridad (p.ej. permisos de escritura en Reportes).
 *
 * @param {import('express').Request} req - Request
 * @param {import('express').Response} res - Response con resumen de la inicialización
 * @returns {Promise<void>}
 */
const initializePermisos = async (req, res) => {
    try {
        const modulos = [
            { key: 'empleados', label: 'Empleados' },
            { key: 'empresas', label: 'Empresas' },
            { key: 'contratos', label: 'Contratos' },
            { key: 'registros_salud', label: 'Registros de Salud' },
            { key: 'evaluaciones', label: 'Evaluaciones' },
            { key: 'contactos', label: 'Contactos' },
            { key: 'solicitudes', label: 'Solicitudes' },
            { key: 'liquidaciones', label: 'Liquidaciones' },
            { key: 'roles', label: 'Roles y Permisos' },
            { key: 'reportes', label: 'Reportes' },
        ];

        const acciones = [
            { key: 'crear', label: 'Crear' },
            { key: 'leer', label: 'Leer' },
            { key: 'actualizar', label: 'Actualizar' },
            { key: 'eliminar', label: 'Eliminar' },
        ];

        // 1. Limpieza de permisos obsoletos o prohibidos por diseño
        await Permiso.destroy({
            where: {
                [Op.or]: [
                    // Liquidaciones: Solo lectura y actualización permitidas
                    { modulo: 'liquidaciones', accion: { [Op.in]: ['crear', 'eliminar'] } },
                    // Módulos desaparecidos o integrados
                    { modulo: 'conceptos_salariales' },
                    // Reportes: Solo lectura permitida
                    { modulo: 'reportes', accion: { [Op.ne]: 'leer' } }
                ]
            }
        });

        const permisosCreados = [];

        for (const modulo of modulos) {
            for (const accion of acciones) {
                // Aplicar restricciones de seguridad en la creación
                if (modulo.key === 'liquidaciones' && (accion.key === 'crear' || accion.key === 'eliminar')) continue;
                if (modulo.key === 'reportes' && accion.key !== 'leer') continue;

                const [permiso, created] = await Permiso.findOrCreate({
                    where: {
                        modulo: modulo.key,
                        accion: accion.key,
                    },
                    defaults: {
                        descripcion: `${accion.label} ${modulo.label}`,
                    },
                });

                if (created) {
                    permisosCreados.push(permiso);
                }
            }
        }

        res.json({
            message: `Inicialización completada. ${permisosCreados.length} permisos nuevos creados.`,
            permisosCreados,
        });
    } catch (error) {
        return serverError(res, error);
    }
};

module.exports = {
    getAll,
    getGroupedByModule,
    initializePermisos,
};

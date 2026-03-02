/**
 * @fileoverview Modelo de Permiso.
 * Define acciones atómicas (leer, crear, actualizar, eliminar, exportar)
 * sobre los diferentes módulos funcionales de la plataforma.
 * @module models/Permiso
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permiso = sequelize.define('Permiso', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** 
     * @type {string} Módulo funcional sobre el que aplica el permiso. 
     * Valores: 'empleados', 'empresas', 'contratos', 'registros_salud', 'evaluaciones', 'contactos', 'solicitudes', 'liquidaciones', 'roles', 'reportes'.
     */
    modulo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El módulo es requerido' },
            isIn: {
                args: [[
                    'empleados',
                    'empresas',
                    'contratos',
                    'registros_salud',
                    'evaluaciones',
                    'contactos',
                    'solicitudes',
                    'liquidaciones',
                    'roles',
                    'reportes',
                ]],
                msg: 'Módulo no válido',
            },
        },
    },
    /** 
     * @type {string} Operación permitida.
     * Valores: 'crear' (POST), 'leer' (GET), 'actualizar' (PUT/PATCH), 'eliminar' (DELETE).
     */
    accion: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La acción es requerida' },
            isIn: {
                args: [['crear', 'leer', 'actualizar', 'eliminar']],
                msg: 'Acción no válida',
            },
        },
    },
    /** @type {string} Explicación amigable del permiso para la UI. */
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    tableName: 'permisos',
    timestamps: true,
    indexes: [
        /** Regla de Negocio: No pueden existir dos permisos idénticos para el mismo módulo y acción. */
        {
            unique: true,
            fields: ['modulo', 'accion'],
            name: 'unique_modulo_accion',
        },
    ],
});

module.exports = Permiso;

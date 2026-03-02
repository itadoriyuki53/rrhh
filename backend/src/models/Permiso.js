/**
 * @fileoverview Modelo de Permiso.
 * Define acciones atómicas (leer, crear, actualizar, eliminar, exportar)
 * sobre los diferentes módulos funcionales de la plataforma.
 * @module models/Permiso
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Permiso = sequelize.define('Permiso', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
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
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
}, {
    tableName: 'permisos',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['modulo', 'accion'],
            name: 'unique_modulo_accion',
        },
    ],
});

module.exports = Permiso;

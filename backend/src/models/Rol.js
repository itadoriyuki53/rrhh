/**
 * @fileoverview Modelo de Rol.
 * Define conjuntos de permisos dentro de un Espacio de Trabajo específico.
 * Se asigna a los contratos de los empleados para controlar el acceso granular.
 * @module models/Rol
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del Espacio de Trabajo propietario del rol. */
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    /** @type {string} Nombre del rol (ej: 'Gerente', 'Operador'). Único por Espacio. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del rol es requerido' },
            len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' },
        },
    },
    /** @type {string} Resumen de facultades asociadas al rol. */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    /** @type {boolean} Flag para roles predefinidos por el sistema. Default: false. */
    esObligatorio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Estado lógico del rol. */
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
}, {
    tableName: 'roles',
    timestamps: true,
    indexes: [
        /** Regla de Negocio: No se permiten duplicar nombres de roles dentro del mismo espacio. */
        {
            unique: true,
            fields: ['espacioTrabajoId', 'nombre'],
            name: 'unique_rol_nombre_per_espacio'
        }
    ]
});

module.exports = Rol;

/**
 * @fileoverview Tabla de unión Rol-Permiso.
 * Implementa la relación Muchos a Muchos entre roles y capacidades del sistema.
 * @module models/RolPermiso
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolPermiso = sequelize.define('RolPermiso', {
    /** @type {number} ID único autoincremental de la asociación */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del Rol que recibe el permiso. */
    rolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    /** @type {number} ID del Permiso otorgado al rol. */
    permisoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'permisos',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
}, {
    tableName: 'rol_permisos',
    timestamps: true,
    indexes: [
        /** Regla de Negocio: No se pueden duplicar permisos dentro de un mismo rol. */
        {
            unique: true,
            fields: ['rolId', 'permisoId'],
            name: 'unique_rol_permiso',
        },
    ],
});

module.exports = RolPermiso;

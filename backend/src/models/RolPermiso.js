/**
 * @fileoverview Tabla de unión Rol-Permiso.
 * Implementa la relación Muchos a Muchos entre roles y capacidades del sistema.
 * @module models/RolPermiso
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RolPermiso = sequelize.define('RolPermiso', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    rolId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'roles',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
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
        {
            unique: true,
            fields: ['rolId', 'permisoId'],
            name: 'unique_rol_permiso',
        },
    ],
});

module.exports = RolPermiso;

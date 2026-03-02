/**
 * @fileoverview Modelo de Rol.
 * Define conjuntos de permisos dentro de un Espacio de Trabajo específico.
 * Se asigna a los contratos de los empleados para controlar el acceso granular.
 * @module models/Rol
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Rol = sequelize.define('Rol', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del rol es requerido' },
            len: { args: [1, 100], msg: 'El nombre debe tener entre 1 y 100 caracteres' },
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    esObligatorio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false,
    },
}, {
    tableName: 'roles',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['espacioTrabajoId', 'nombre'],
            name: 'unique_rol_nombre_per_espacio'
        }
    ]
});

module.exports = Rol;

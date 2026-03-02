/**
 * @fileoverview Modelo de Espacio de Trabajo.
 * Define la entidad de nivel superior para el soporte multi-tenant, permitiendo
 * que distintos grupos de empresas operen de forma aislada.
 * @module models/EspacioTrabajo
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EspacioTrabajo = sequelize.define('EspacioTrabajo', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
        },
    },
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: 'La descripción no puede exceder 1000 caracteres' },
        },
    },
    propietarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id',
        },
        validate: {
            notEmpty: { msg: 'El propietario es requerido' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'espacios_trabajo',
    timestamps: true,
});

module.exports = EspacioTrabajo;

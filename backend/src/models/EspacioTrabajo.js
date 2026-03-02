/**
 * @fileoverview Modelo de Espacio de Trabajo.
 * Define la entidad de nivel superior para el soporte multi-tenant, permitiendo
 * que distintos grupos de empresas operen de forma aislada.
 * @module models/EspacioTrabajo
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const EspacioTrabajo = sequelize.define('EspacioTrabajo', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {string} Nombre del entorno multi-tenant. 2-100 chars. Requerido. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
        },
    },
    /** @type {string} Comentarios o propósitos del espacio. Max 1000 chars. */
    descripcion: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: 'La descripción no puede exceder 1000 caracteres' },
        },
    },
    /** @type {number} ID del Usuario creador/dueño del espacio. */
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
    /** @type {boolean} Estado lógico de disponibilidad del espacio. Default: true. */
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

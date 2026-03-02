/**
 * @fileoverview Modelo de Área.
 * Organiza la estructura jerárquica de una Empresa en divisiones funcionales (ej: Administración, Producción).
 * @module models/Area
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Area = sequelize.define('Area', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {string} Nombre del área funcional (ej: 'Administración'). Requerido. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del área es requerido' },
        },
    },
    /** @type {string} Descripción detallada de las responsabilidades del área. Max 500 chars. */
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción del área no puede exceder 500 caracteres' },
        },
    },
    /** @type {number} Relación con la Empresa a la que pertenece. */
    empresaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'empresas',
            key: 'id',
        },
    },
}, {
    tableName: 'areas',
    timestamps: true,
});

module.exports = Area;

/**
 * @fileoverview Modelo de Departamento.
 * Representa una unidad operativa específica dentro de un Área (ej: Contabilidad, Ventas).
 * @module models/Departamento
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Departamento = sequelize.define('Departamento', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {string} Nombre de la unidad operativa (ej: 'Tesorería'). Requerido. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del departamento es requerido' },
        },
    },
    /** @type {string} Alcance y funciones del departamento. Max 500 chars. */
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción del departamento no puede exceder 500 caracteres' },
        },
    },
    /** @type {number} Relación con el Área a la que pertenece. */
    areaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'areas',
            key: 'id',
        },
    },
}, {
    tableName: 'departamentos',
    timestamps: true,
});

module.exports = Departamento;

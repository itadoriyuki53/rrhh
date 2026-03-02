/**
 * @fileoverview Modelo de Puesto.
 * Define los cargos y responsabilidades asignables a los contratos laborales.
 * @module models/Puesto
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Puesto = sequelize.define('Puesto', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {string} Título del cargo (ej: 'Analista Contable'). Requerido. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del puesto es requerido' },
        },
    },
    /** @type {string} Requerimientos y responsabilidades del puesto. Max 500 chars. */
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción del puesto no puede exceder 500 caracteres' },
        },
    },
    /** @type {number} Relación con el Departamento al que pertenece. */
    departamentoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'departamentos',
            key: 'id',
        },
    },
}, {
    tableName: 'puestos',
    timestamps: true,
});

module.exports = Puesto;

/**
 * @fileoverview Modelo de Departamento.
 * Representa una unidad operativa específica dentro de un Área (ej: Contabilidad, Ventas).
 * @module models/Departamento
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Departamento = sequelize.define('Departamento', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre del departamento es requerido' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción del departamento no puede exceder 500 caracteres' },
        },
    },
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

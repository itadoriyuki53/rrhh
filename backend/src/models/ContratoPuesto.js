/**
 * @fileoverview Tabla de unión Contrato-Puesto.
 * Implementa la relación Muchos a Muchos entre los contratos laborales y los puestos de la organización.
 * @module models/ContratoPuesto
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContratoPuesto = sequelize.define('ContratoPuesto', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    contratoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contratos',
            key: 'id',
        },
    },
    puestoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'puestos',
            key: 'id',
        },
    },
}, {
    tableName: 'contratos_puestos',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['contratoId', 'puestoId'],
            name: 'unique_contrato_puesto',
        },
    ],
});

module.exports = ContratoPuesto;

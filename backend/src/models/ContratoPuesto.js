/**
 * @fileoverview Tabla de unión Contrato-Puesto.
 * Implementa la relación Muchos a Muchos entre los contratos laborales y los puestos de la organización.
 * @module models/ContratoPuesto
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContratoPuesto = sequelize.define('ContratoPuesto', {
    /** @type {number} ID único autoincremental de la asociación. */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del Contrato laboral. */
    contratoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contratos',
            key: 'id',
        },
    },
    /** @type {number} ID del Puesto asignado. */
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
        /** Regla de Negocio: Un contrato no puede estar vinculado dos veces al mismo puesto. */
        {
            unique: true,
            fields: ['contratoId', 'puestoId'],
            name: 'unique_contrato_puesto',
        },
    ],
});

module.exports = ContratoPuesto;

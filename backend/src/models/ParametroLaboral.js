/**
 * @fileoverview Modelo de Parámetro Laboral.
 * Almacena configuraciones variables del sistema (ej: tope de inasistencias para presentismo).
 * Permite personalizar el comportamiento de los cálculos por Espacio de Trabajo.
 * @module models/ParametroLaboral
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParametroLaboral = sequelize.define('ParametroLaboral', {
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
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de parámetro es requerido' },
        },
    },
    valor: {
        type: DataTypes.STRING(255), // Guardamos como string para flexibilidad
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El valor es requerido' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    esObligatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    tableName: 'parametros_laborales',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['espacioTrabajoId', 'tipo'], // Evitar duplicados del mismo tipo en un espacio
        },
    ]
});

module.exports = ParametroLaboral;

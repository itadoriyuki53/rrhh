/**
 * @fileoverview Modelo de Concepto Salarial.
 * Define los componentes (Haberes/Deducciones) que integran un recibo de sueldo.
 * Pueden ser porcentuales o de monto fijo, globales o por espacio de trabajo.
 * @module models/ConceptoSalarial
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TIPOS_CONCEPTO = ['remunerativo', 'deduccion'];

const ConceptoSalarial = sequelize.define('ConceptoSalarial', {
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
            notEmpty: { msg: 'El nombre del concepto es requerido' },
            len: { args: [3, 100], msg: 'El nombre debe tener entre 3 y 100 caracteres' },
        },
    },
    tipo: {
        type: DataTypes.ENUM(...TIPOS_CONCEPTO),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de concepto es requerido' },
            isIn: {
                args: [TIPOS_CONCEPTO],
                msg: 'Tipo de concepto inválido',
            },
        },
    },
    esPorcentaje: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    valor: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El valor es requerido' },
            isDecimal: { msg: 'El valor debe ser un número válido' },
            min: { args: [0], msg: 'El valor no puede ser negativo' },
        },
    },
    esObligatorio: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'conceptos_salariales',
    timestamps: true,
});

module.exports = ConceptoSalarial;

/**
 * @fileoverview Modelo de Liquidación de Sueldo.
 * Almacena el resultado final del cálculo de haberes y deducciones de un período.
 * Contiene los totales (Bruto, Retenciones, Neto) y el desglose en formato JSON.
 * @module models/Liquidacion
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Liquidacion = sequelize.define('Liquidacion', {
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
        validate: {
            notEmpty: { msg: 'El contrato es requerido' },
        },
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio del período es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de fin del período es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    // Conceptos remunerativos
    basico: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El básico debe ser un número válido' },
            min: { args: [0], msg: 'El básico no puede ser negativo' },
        },
    },
    antiguedad: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'La antigüedad debe ser un número válido' },
            min: { args: [0], msg: 'La antigüedad no puede ser negativa' },
        },
    },
    presentismo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El presentismo debe ser un número válido' },
            min: { args: [0], msg: 'El presentismo no puede ser negativo' },
        },
    },
    horasExtras: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las horas extras deben ser un número válido' },
            min: { args: [0], msg: 'Las horas extras no pueden ser negativas' },
        },
    },
    vacaciones: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las vacaciones deben ser un número válido' },
            min: { args: [0], msg: 'Las vacaciones no pueden ser negativas' },
        },
    },
    sac: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El SAC debe ser un número válido' },
            min: { args: [0], msg: 'El SAC no puede ser negativo' },
        },
    },
    // Descuentos
    inasistencias: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las inasistencias deben ser un número válido' },
            min: { args: [0], msg: 'Las inasistencias no pueden ser negativas' },
        },
    },
    // Totales
    totalBruto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El total bruto debe ser un número válido' },
        },
    },
    totalRetenciones: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El total de retenciones debe ser un número válido' },
            min: { args: [0], msg: 'El total de retenciones no puede ser negativo' },
        },
    },
    vacacionesNoGozadas: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las vacaciones no gozadas deben ser un número válido' },
            min: { args: [0], msg: 'Las vacaciones no gozadas no pueden ser negativas' },
        },
    },
    neto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El neto debe ser un número válido' },
        },
    },
    // Detalle de conceptos aplicados (JSON array)
    detalleRemunerativo: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('detalleRemunerativo');
            if (!rawValue) return [];
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch {
                    return [];
                }
            }
            return rawValue;
        },
    },
    detalleRetenciones: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('detalleRetenciones');
            if (!rawValue) return [];
            if (typeof rawValue === 'string') {
                try {
                    return JSON.parse(rawValue);
                } catch {
                    return [];
                }
            }
            return rawValue;
        },
    },
    estaPagada: {
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
    tableName: 'liquidaciones',
    timestamps: true,
});

module.exports = Liquidacion;

/**
 * @fileoverview Modelo de Liquidación de Sueldo.
 * Almacena el resultado final del cálculo de haberes y deducciones de un período.
 * Contiene los totales (Bruto, Retenciones, Neto) y el desglose en formato JSON.
 * @module models/Liquidacion
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Liquidacion = sequelize.define('Liquidacion', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} Relación con el contrato liquidado. Requerido. */
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
    /** @type {string} Fecha de inicio del período liquidado (YYYY-MM-DD). */
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio del período es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {string} Fecha de fin del período liquidado (YYYY-MM-DD). */
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de fin del período es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {number} Monto correspondiente al Salario Básico del contrato. */
    basico: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El básico debe ser un número válido' },
            min: { args: [0], msg: 'El básico no puede ser negativo' },
        },
    },
    /** @type {number} Monto por adicional de antigüedad (e.g. 1% anual). */
    antiguedad: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'La antigüedad debe ser un número válido' },
            min: { args: [0], msg: 'La antigüedad no puede ser negativa' },
        },
    },
    /** @type {number} Monto por adicional de asistencia perfecta. */
    presentismo: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El presentismo debe ser un número válido' },
            min: { args: [0], msg: 'El presentismo no puede ser negativo' },
        },
    },
    /** @type {number} Monto total por horas extras laboradas (50% y 100%). */
    horasExtras: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las horas extras deben ser un número válido' },
            min: { args: [0], msg: 'Las horas extras no pueden ser negativas' },
        },
    },
    /** @type {number} Monto de vacaciones gozadas durante el período. */
    vacaciones: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las vacaciones deben ser un número válido' },
            min: { args: [0], msg: 'Las vacaciones no pueden ser negativas' },
        },
    },
    /** @type {number} Monto de Sueldo Anual Complementario (Aguinaldo). */
    sac: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El SAC debe ser un número válido' },
            min: { args: [0], msg: 'El SAC no puede ser negativo' },
        },
    },
    /** @type {number} Monto a descontar por días no trabajados sin justificación. */
    inasistencias: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las inasistencias deben ser un número válido' },
            min: { args: [0], msg: 'Las inasistencias no pueden ser negativas' },
        },
    },
    /** @type {number} Suma de todos los conceptos remunerativos antes de retenciones. */
    totalBruto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El total bruto debe ser un número válido' },
        },
    },
    /** @type {number} Suma de descuentos obligatorios (Jubilación, Ley 19032, Obra Social). */
    totalRetenciones: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El total de retenciones debe ser un número válido' },
            min: { args: [0], msg: 'El total de retenciones no puede ser negativo' },
        },
    },
    /** @type {number} Monto indemnizatorio por vacaciones pendientes de goce (Indem de baja o Mayo). */
    vacacionesNoGozadas: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'Las vacaciones no gozadas deben ser un número válido' },
            min: { args: [0], msg: 'Las vacaciones no gozadas no pueden ser negativas' },
        },
    },
    /** @type {number} Monto final de bolsillo: `TotalBruto - TotalRetenciones + VacacionesNoGozadas`. */
    neto: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
        validate: {
            isDecimal: { msg: 'El neto debe ser un número válido' },
        },
    },
    /** @type {object[]} Desglose en JSON de cada concepto remunerativo aplicado. */
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
    /** @type {object[]} Desglose en JSON de cada retención o descuento aplicado. */
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
    /** @type {boolean} Indica si la liquidación fue abonada y conciliada. */
    estaPagada: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Estado lógico del registro. */
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

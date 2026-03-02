/**
 * @fileoverview Modelo de Horas Extras.
 * Representa la jornada suplementaria laborada (50% o 100%).
 * Se vincula a una Solicitud y se utiliza en el cálculo de la liquidación.
 * @module models/HorasExtras
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Tipos de horas extra
const TIPOS_HORAS_EXTRA = [
    '50',  // días hábiles
    '100', // fines de semana / feriados
];

// Estados de horas extras
const ESTADOS_HORAS_EXTRAS = [
    'pendiente',
    'aprobada',
    'rechazada',
];

const HorasExtras = sequelize.define('HorasExtras', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    solicitudId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'solicitudes',
            key: 'id',
        },
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La hora de inicio es requerida' },
        },
    },
    horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La hora de fin es requerida' },
        },
    },
    cantidadHoras: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        validate: {
            min: { args: [0.01], msg: 'La cantidad de horas debe ser mayor a 0' },
        },
    },
    tipoHorasExtra: {
        type: DataTypes.ENUM(...TIPOS_HORAS_EXTRA),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de horas extra es requerido' },
            isIn: {
                args: [TIPOS_HORAS_EXTRA],
                msg: 'Tipo de horas extra inválido',
            },
        },
    },
    motivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'El motivo no puede exceder 500 caracteres' },
        },
    },
    urlJustificativo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isUrl: { msg: 'Debe ser una URL válida' },
            len: { args: [0, 100], msg: 'La URL no puede exceder 100 caracteres' },
        },
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_HORAS_EXTRAS),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS_HORAS_EXTRAS],
                msg: 'Estado inválido',
            },
        },
    },
}, {
    tableName: 'horas_extras',
    timestamps: true,
});

// Hook para validar horas y calcular cantidad
HorasExtras.addHook('beforeValidate', (horasExtras) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar que la fecha no sea futura
    if (horasExtras.fecha) {
        const fecha = parseLocalDate(horasExtras.fecha);
        fecha.setHours(0, 0, 0, 0);
        if (fecha > today) {
            throw new Error('La fecha no puede ser futura');
        }
    }

    // Validar que hora fin sea mayor a hora inicio y calcular cantidad
    if (horasExtras.horaInicio && horasExtras.horaFin) {
        const [inicioH, inicioM] = horasExtras.horaInicio.split(':').map(Number);
        const [finH, finM] = horasExtras.horaFin.split(':').map(Number);

        const inicioMinutos = inicioH * 60 + inicioM;
        const finMinutos = finH * 60 + finM;

        if (finMinutos <= inicioMinutos) {
            throw new Error('La hora de fin debe ser mayor a la hora de inicio');
        }

        // Calcular cantidad de horas
        const diffMinutos = finMinutos - inicioMinutos;
        horasExtras.cantidadHoras = (diffMinutos / 60).toFixed(2);
    }
});

module.exports = HorasExtras;

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
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} Relación Única (1:1) con el encabezado de Solicitud. */
    solicitudId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: 'solicitudes',
            key: 'id',
        },
    },
    /** @type {string} Día en que se realizó la jornada extra (YYYY-MM-DD). Regla: No futura. */
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {string} Hora de comienzo (HH:mm:ss). */
    horaInicio: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La hora de inicio es requerida' },
        },
    },
    /** @type {string} Hora de finalización (HH:mm:ss). Debe ser posterior a horaInicio. */
    horaFin: {
        type: DataTypes.TIME,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La hora de fin es requerida' },
        },
    },
    /** @type {number} Duración total en horas (ej: 2.50). Calculado automáticamente por hooks. */
    cantidadHoras: {
        type: DataTypes.DECIMAL(4, 2),
        allowNull: false,
        validate: {
            min: { args: [0.01], msg: 'La cantidad de horas debe ser mayor a 0' },
        },
    },
    /** 
     * @type {'50'|'100'} Recargo aplicado.
     * Valores: '50' (Lunes 00hs a Sábado 13hs), '100' (Sábado 13hs en adelante, Domingos y Feriados).
     */
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
    /** @type {string} Justificación de la necesidad operativa de la jornada extra. Max 500 chars. */
    motivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'El motivo no puede exceder 500 caracteres' },
        },
    },
    /** @type {string} Link a repositorio externo con comprobante de ingreso/egreso. Max 100 chars. */
    urlJustificativo: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isUrl: { msg: 'Debe ser una URL válida' },
            len: { args: [0, 100], msg: 'La URL no puede exceder 100 caracteres' },
        },
    },
    /** 
     * @type {'pendiente'|'aprobada'|'rechazada'} Estado de autorización.
     * Valores: 'pendiente', 'aprobada', 'rechazada'.
     */
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

/**
 * Hook de Reglas de Negocio para Horas Extras.
 * 1. Impide la carga de jornadas extras en fechas futuras.
 * 2. Valida la cronología de horas (Fin > Inicio).
 * 3. Calcula la duración decimal exacta de la jornada para liquidación.
 */
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

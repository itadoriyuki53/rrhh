/**
 * @fileoverview Modelo de Vacaciones.
 * Gestiona el período de descanso anual remunerado.
 * Se vincula a una Solicitud y controla el período fiscal correspondiente.
 * @module models/Vacaciones
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Estados de vacaciones
const ESTADOS_VACACIONES = [
    'pendiente',
    'aprobada',
    'rechazada',
];

const Vacaciones = sequelize.define('Vacaciones', {
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
    periodo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El período es requerido' },
            isInt: { msg: 'El período debe ser un año válido' },
        },
    },
    diasCorrespondientes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días correspondientes deben ser mayor a 0' },
            max: { args: [35], msg: 'Los días correspondientes no pueden superar 35' },
        },
    },
    diasTomados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Los días tomados no pueden ser negativos' },
            max: { args: [35], msg: 'Los días tomados no pueden superar 35' },
        },
    },
    diasDisponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Los días disponibles no pueden ser negativos' },
            max: { args: [35], msg: 'Los días disponibles no pueden superar 35' },
        },
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de fin es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaRegreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de regreso es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    notificadoEl: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    diasSolicitud: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días solicitados deben ser mayor a 0' },
            max: { args: [35], msg: 'Los días solicitados no pueden superar 35' },
        },
    },
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción no puede exceder 500 caracteres' },
        },
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_VACACIONES),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS_VACACIONES],
                msg: 'Estado inválido',
            },
        },
    },
}, {
    tableName: 'vacaciones',
    timestamps: true,
});

// Hook para validar fechas
Vacaciones.addHook('beforeValidate', (vacaciones) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (vacaciones.fechaInicio) {
        const fechaInicio = parseLocalDate(vacaciones.fechaInicio);
        fechaInicio.setHours(0, 0, 0, 0);
        if (fechaInicio < today) {
            throw new Error('La fecha de inicio no puede ser anterior a hoy');
        }

        // Validar día hábil
        if (!esDiaHabil(vacaciones.fechaInicio)) {
            throw new Error('La fecha de inicio debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
    }

    if (vacaciones.fechaFin && vacaciones.fechaInicio) {
        const inicio = parseLocalDate(vacaciones.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = parseLocalDate(vacaciones.fechaFin);
        fin.setHours(0, 0, 0, 0);

        if (fin <= inicio) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }

        // Validar día hábil
        if (!esDiaHabil(vacaciones.fechaFin)) {
            throw new Error('La fecha de fin debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }

        // Calcular días solicitados (incluyendo inicio y fin)
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        vacaciones.diasSolicitud = diffDays;
    }

    // Validar que días solicitados no superen días disponibles
    if (vacaciones.diasSolicitud && vacaciones.diasDisponibles) {
        if (vacaciones.diasSolicitud > vacaciones.diasDisponibles) {
            throw new Error('Los días solicitados no pueden superar los días disponibles');
        }
    }

    // Validar notificadoEl no sea futura
    if (vacaciones.notificadoEl) {
        const notificado = parseLocalDate(vacaciones.notificadoEl);
        notificado.setHours(0, 0, 0, 0);
        if (notificado > today) {
            throw new Error('La fecha de notificación no puede ser futura');
        }

        // Validar día hábil
        if (!esDiaHabil(vacaciones.notificadoEl)) {
            throw new Error('La fecha de notificación debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
    }
});

// Hook para auto-completar notificadoEl cuando se aprueba
Vacaciones.addHook('beforeUpdate', (vacaciones) => {
    // Si cambia a 'aprobada' y no tiene notificadoEl, asignar hoy
    if (vacaciones.changed('estado') && vacaciones.estado === 'aprobada' && !vacaciones.notificadoEl) {
        vacaciones.notificadoEl = new Date().toISOString().split('T')[0];
    }
});

module.exports = Vacaciones;

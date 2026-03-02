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
    /** @type {number} Año fiscal al que corresponden los días devengados. */
    periodo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El período es requerido' },
            isInt: { msg: 'El período debe ser un año válido' },
        },
    },
    /** @type {number} Total de días de vacaciones según antigüedad legal para el período. Max 35. */
    diasCorrespondientes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días correspondientes deben ser mayor a 0' },
            max: { args: [35], msg: 'Los días correspondientes no pueden superar 35' },
        },
    },
    /** @type {number} Acumulador de días ya gozados de este período específico. */
    diasTomados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Los días tomados no pueden ser negativos' },
            max: { args: [35], msg: 'Los días tomados no pueden superar 35' },
        },
    },
    /** @type {number} Saldo de días remanentes para el período. */
    diasDisponibles: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [0], msg: 'Los días disponibles no pueden ser negativos' },
            max: { args: [35], msg: 'Los días disponibles no pueden superar 35' },
        },
    },
    /** 
     * @type {string} Fecha efectiva de inicio de vacaciones (YYYY-MM-DD).
     * Regla: Debe ser día hábil.
     */
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** 
     * @type {string} Último día de vacaciones (YYYY-MM-DD).
     * Regla: Debe ser día hábil.
     */
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de fin es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {string} Fecha en que el empleado retoma tareas habituales (YYYY-MM-DD). */
    fechaRegreso: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de regreso es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {string} Fecha en que RRHH notificó formalmente la concesión (YYYY-MM-DD). */
    notificadoEl: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {number} Duración en días de esta solicitud puntual. */
    diasSolicitud: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días solicitados deben ser mayor a 0' },
            max: { args: [35], msg: 'Los días solicitados no pueden superar 35' },
        },
    },
    /** @type {string} Motivos o comentarios sobre la fecha elegida. Max 500 chars. */
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción no puede exceder 500 caracteres' },
        },
    },
    /** 
     * @type {'pendiente'|'aprobada'|'rechazada'} Estado de aprobación.
     * Valores: 'pendiente', 'aprobada', 'rechazada'.
     */
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

/**
 * Hook de Reglas de Negocio para Vacaciones.
 * 1. Valida que la fecha de inicio no sea anterior a hoy.
 * 2. Valida que inicio y fin sean días hábiles laborales.
 * 3. Valida consistencia de fechas (Fin > Inicio).
 * 4. Calcula automáticamente la duración de la solicitud.
 * 5. Controla que no se soliciten más días de los disponibles para el período.
 * 6. Valida que la notificación no sea fecha futura y sea día hábil.
 */
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

/**
 * @fileoverview Modelo de Renuncia.
 * Gestiona la desvinculación voluntaria del empleado, incluyendo preavisos
 * y fechas de baja efectivas. Dispara la liquidación final vía cron.
 * @module models/Renuncia
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Estados de renuncia
const ESTADOS_RENUNCIA = [
    'pendiente',
    'aceptada',
    'procesada',
];

const Renuncia = sequelize.define('Renuncia', {
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
    /** 
     * @type {string} Fecha en que el empleado envía el telegrama o comunica la baja (YYYY-MM-DD).
     * Regla: No puede ser futura. Debe ser día hábil.
     */
    fechaNotificacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de notificación es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** 
     * @type {string} Último día de trabajo efectivo (YYYY-MM-DD).
     * Regla: Debe ser >= fechaNotificacion. Auto-corrección a día hábil.
     */
    fechaBajaEfectiva: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    /** @type {string} Razones de la desvinculación. Max 500 chars. */
    motivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'El motivo no puede exceder 500 caracteres' },
        },
    },
    /** @type {string} Link a repositorio externo con la imagen del telegrama ley. Max 100 chars. */
    urlComprobante: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isUrl: { msg: 'Debe ser una URL válida' },
            len: { args: [0, 100], msg: 'La URL no puede exceder 100 caracteres' },
        },
    },
    /** 
     * @type {'pendiente'|'aceptada'|'procesada'} Estado administrativo de la baja.
     * Valores: 'pendiente', 'aceptada' (por RRHH), 'procesada' (liquidación final generada).
     */
    estado: {
        type: DataTypes.ENUM(...ESTADOS_RENUNCIA),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS_RENUNCIA],
                msg: 'Estado inválido',
            },
        },
    },
}, {
    tableName: 'renuncias',
    timestamps: true,
});

/**
 * Hook de Reglas de Negocio para Renuncias.
 * 1. Valida que la fecha de notificación no sea futura y sea laboral.
 * 2. Asegura que la baja no sea anterior a la notificación.
 * 3. Automatización: Si la baja cae en fin de semana, la mueve al siguiente lunes hábil.
 */
Renuncia.addHook('beforeValidate', (renuncia) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Validar que la fecha de notificación no sea futura
    if (renuncia.fechaNotificacion) {
        const fechaNotificacion = parseLocalDate(renuncia.fechaNotificacion);
        fechaNotificacion.setHours(0, 0, 0, 0);
        if (fechaNotificacion > today) {
            throw new Error('La fecha de notificación no puede ser futura');
        }

        // Validar día hábil
        if (!esDiaHabil(renuncia.fechaNotificacion)) {
            throw new Error('La fecha de notificación debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
    }

    // Validar que fecha de baja sea >= fecha de notificación (si se proporciona)
    if (renuncia.fechaBajaEfectiva && renuncia.fechaNotificacion) {
        const notificacion = parseLocalDate(renuncia.fechaNotificacion);
        notificacion.setHours(0, 0, 0, 0);
        const baja = parseLocalDate(renuncia.fechaBajaEfectiva);
        baja.setHours(0, 0, 0, 0);

        if (baja < notificacion) {
            throw new Error('La fecha de baja efectiva debe ser mayor o igual a la fecha de notificación');
        }

        // Validar día hábil
        while (!esDiaHabil(baja.toISOString().split('T')[0])) {
            baja.setDate(baja.getDate() + 1);
        }
        renuncia.fechaBajaEfectiva = baja.toISOString().split('T')[0];
    }
});

module.exports = Renuncia;

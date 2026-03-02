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
    fechaNotificacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de notificación es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaBajaEfectiva: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Optional - set when processing
    },
    motivo: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'El motivo no puede exceder 500 caracteres' },
        },
    },
    urlComprobante: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isUrl: { msg: 'Debe ser una URL válida' },
            len: { args: [0, 100], msg: 'La URL no puede exceder 100 caracteres' },
        },
    },
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

// Hook para validar fechas
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

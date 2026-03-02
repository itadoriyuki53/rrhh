/**
 * @fileoverview Modelo de Licencia.
 * Representa ausencias justificadas o injustificadas (Inasistencias).
 * Se vincula a una Solicitud y opcionalmente a un RegistroSalud para justificación médica.
 * @module models/Licencia
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Motivos legales de licencia/inasistencia
const MOTIVOS_LEGALES = [
    'matrimonio',
    'nacimiento_hijo',
    'fallecimiento_conyugue_hijo_padres',
    'fallecimiento_hermano',
    'examen_estudio',
    'accidente_trabajo_art',
    'enfermedad_inculpable',
    'maternidad',
    'excedencia',
    'donacion_sangre',
    'citacion_judicial',
    'presidente_mesa',
    'mudanza',
    'cumpleanos',
    'tramites_personales',
    'compensatorio_franco',
];

// Estados de licencia
const ESTADOS_LICENCIA = [
    'pendiente',
    'justificada',
    'injustificada',
    'rechazada',
];

const Licencia = sequelize.define('Licencia', {
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
    esLicencia: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'true = Licencia, false = Inasistencia',
    },
    motivoLegal: {
        type: DataTypes.ENUM(...MOTIVOS_LEGALES),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El motivo legal es requerido' },
            isIn: {
                args: [MOTIVOS_LEGALES],
                msg: 'Motivo legal inválido',
            },
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
    diasSolicitud: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: { args: [1], msg: 'Los días solicitados deben ser mayor a 0' },
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
    descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La descripción no puede exceder 500 caracteres' },
        },
    },
    registroSaludId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'registros_salud',
            key: 'id',
        },
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS_LICENCIA),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS_LICENCIA],
                msg: 'Estado inválido',
            },
        },
    },
}, {
    tableName: 'licencias',
    timestamps: true,
});

// Hook para validar fechas y calcular días
Licencia.addHook('beforeValidate', (licencia) => {
    if (licencia.fechaFin && licencia.fechaInicio) {
        const inicio = parseLocalDate(licencia.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = parseLocalDate(licencia.fechaFin);
        fin.setHours(0, 0, 0, 0);

        if (fin < inicio) {
            throw new Error('La fecha de fin debe ser mayor o igual a la fecha de inicio');
        }

        // Validar días hábiles
        if (!esDiaHabil(licencia.fechaInicio)) {
            throw new Error('La fecha de inicio debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
        if (!esDiaHabil(licencia.fechaFin)) {
            throw new Error('La fecha de fin debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }

        // Calcular días (incluyendo inicio y fin)
        const diffTime = Math.abs(fin - inicio);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        licencia.diasSolicitud = diffDays;
    }

    // Validar que registroSaludId solo se use con motivos específicos
    if (licencia.registroSaludId) {
        const motivosConRegistroSalud = ['enfermedad_inculpable', 'accidente_trabajo_art'];
        if (!motivosConRegistroSalud.includes(licencia.motivoLegal)) {
            throw new Error('El registro de salud solo puede asociarse a licencias por enfermedad inculpable o ART');
        }
    }
});

module.exports = Licencia;


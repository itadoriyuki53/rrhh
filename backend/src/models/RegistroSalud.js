/**
 * @fileoverview Modelo de Registro de Salud.
 * Administra los exámenes médicos (pre-ocupacionales, periódicos, etc.) de los empleados,
 * controlando su vigencia, resultados y documentos respaldatorios.
 * @module models/RegistroSalud
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Tipos de examen médico
const TIPOS_EXAMEN = [
    'pre_ocupacional',
    'periodico',
    'post_ocupacional',
    'retorno_trabajo',
];

// Resultados posibles
const RESULTADOS = [
    'apto',
    'apto_preexistencias',
    'no_apto',
];

const RegistroSalud = sequelize.define('RegistroSalud', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    tipoExamen: {
        type: DataTypes.ENUM(...TIPOS_EXAMEN),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de examen es requerido' },
            isIn: {
                args: [TIPOS_EXAMEN],
                msg: 'Tipo de examen inválido',
            },
        },
    },
    resultado: {
        type: DataTypes.ENUM(...RESULTADOS),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El resultado es requerido' },
            isIn: {
                args: [RESULTADOS],
                msg: 'Resultado inválido',
            },
        },
    },
    fechaRealizacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de realización es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de vencimiento es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    vigente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    comprobantes: {
        type: DataTypes.JSON, // Array of { data, nombre, tipo }
        allowNull: true,
        defaultValue: [],
        get() {
            const rawValue = this.getDataValue('comprobantes');
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
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'empleados',
            key: 'id'
        }
    },
}, {
    tableName: 'registros_salud',
    timestamps: true,
});

// Hook para validar que fechaVencimiento no sea anterior a fechaRealizacion
RegistroSalud.addHook('beforeValidate', (registro) => {
    // Solo validar si es un registro nuevo o si cambiaron las fechas
    const isNew = registro.isNewRecord;
    const fechaRealizacionChanged = registro.changed('fechaRealizacion');
    const fechaVencimientoChanged = registro.changed('fechaVencimiento');

    if (registro.fechaRealizacion && (isNew || fechaRealizacionChanged)) {
        const fechaRealizacion = parseLocalDate(registro.fechaRealizacion);
        fechaRealizacion.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaRealizacion > hoy) {
            throw new Error('La fecha de realización debe ser menor o igual a la fecha actual');
        }

        // Validar día hábil solo si cambió o es nuevo
        if (!esDiaHabil(registro.fechaRealizacion)) {
            throw new Error('La fecha de realización debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
    }

    if (registro.fechaVencimiento && (isNew || fechaVencimientoChanged)) {
        // Validar día hábil
        if (!esDiaHabil(registro.fechaVencimiento)) {
            throw new Error('La fecha de vencimiento debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }

        if (registro.fechaRealizacion) {
            const fechaRealizacion = parseLocalDate(registro.fechaRealizacion);
            const fechaVencimiento = parseLocalDate(registro.fechaVencimiento);
            fechaRealizacion.setHours(0, 0, 0, 0);
            fechaVencimiento.setHours(0, 0, 0, 0);

            if (fechaVencimiento < fechaRealizacion) {
                throw new Error('La fecha de vencimiento debe ser mayor o igual a la fecha de realización');
            }
        }
    }
});

RegistroSalud.addHook('beforeCreate', (registro) => {
    if (registro.fechaVencimiento) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaVencimiento = parseLocalDate(registro.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (fechaVencimiento < hoy) {
            registro.vigente = false;
        }
    }
});

RegistroSalud.addHook('beforeSave', (registro) => {
    if (registro.fechaVencimiento) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaVencimiento = parseLocalDate(registro.fechaVencimiento);
        fechaVencimiento.setHours(0, 0, 0, 0);
        if (fechaVencimiento < hoy) {
            registro.vigente = false;
        }
    }
});

module.exports = RegistroSalud;

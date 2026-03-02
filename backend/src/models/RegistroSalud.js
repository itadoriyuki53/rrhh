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
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** 
     * @type {'pre_ocupacional'|'periodico'|'post_ocupacional'|'retorno_trabajo'} Categoría del examen.
     * Valores: 'pre_ocupacional', 'periodico', 'post_ocupacional', 'retorno_trabajo'.
     */
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
    /** 
     * @type {'apto'|'apto_preexistencias'|'no_apto'} Conclusión médica.
     * Valores: 'apto', 'apto_preexistencias', 'no_apto'.
     */
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
    /** 
     * @type {string} Fecha en que se realizó el examen (YYYY-MM-DD).
     * Reglas: Requerida. No puede ser futura. Debe ser día hábil.
     */
    fechaRealizacion: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de realización es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** 
     * @type {string} Fecha de caducidad del examen (YYYY-MM-DD).
     * Reglas: Requerida. Debe ser >= fechaRealizacion. Debe ser día hábil.
     */
    fechaVencimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de vencimiento es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** 
     * @type {boolean} Indica si el examen está actualmente dentro de término.
     * Actualizado automáticamente por hooks si el vencimiento es superado.
     */
    vigente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    /** @type {object[]} Array de objetos con metadatos de archivos adjuntos { data, nombre, tipo }. */
    comprobantes: {
        type: DataTypes.JSON,
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
    /** @type {boolean} Estado lógico del registro. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
    /** @type {number} Relación con el empleado evaluado. */
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

/**
 * Reglas de Negocio y Validaciones Cruzadas.
 * 1. La fecha de realización no es futura y es día hábil.
 * 2. La fecha de vencimiento es día hábil y >= realización.
 */
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

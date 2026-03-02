/**
 * @fileoverview Modelo de Contrato.
 * Define la relación contractual entre un empleado y su puesto, incluyendo
 * tipo de contratación (Relación de dependencia, Becas, etc.), vigencia, jornada y compensación.
 * @module models/Contrato
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Tipos de contrato por categoría
const TIPOS_CONTRATO = [
    // Relación de Dependencia (Ley 20.744 – LCT)
    'tiempo_indeterminado',
    'periodo_prueba',
    'plazo_fijo',
    'eventual',
    'teletrabajo',
    // No Laborales / Extracontractuales
    'locacion_servicios',
    'monotributista',
    'responsable_inscripto',
    'honorarios',
    'contrato_obra',
    // Formativos (Educativos)
    'pasantia_educativa',
    'beca',
    'ad_honorem',
];

const Contrato = sequelize.define('Contrato', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    empleadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'empleados',
            key: 'id',
        },
        validate: {
            notEmpty: { msg: 'El empleado es requerido' },
        },
    },
    rolId: {
        type: DataTypes.INTEGER,
        allowNull: true, // Opcional, puede no tener rol de sistema asociado o ser default
        references: {
            model: 'roles', // nombre de la tabla
            key: 'id',
        },
    },
    tipoContrato: {
        type: DataTypes.ENUM(...TIPOS_CONTRATO),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de contrato es requerido' },
            isIn: {
                args: [TIPOS_CONTRATO],
                msg: 'Tipo de contrato inválido',
            },
        },
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de inicio es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
            isNotPast(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                if (value < today) {
                    throw new Error('La fecha de inicio no puede ser anterior a hoy');
                }

                // Validar día hábil
                if (!esDiaHabil(value)) {
                    throw new Error('La fecha de inicio debe ser un día hábil (lunes a viernes, excluyendo feriados)');
                }
            },
        },
    },
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
            isBusinessDay(value) {
                if (!value) return; // fechaFin es opcional

                // Validar día hábil
                if (!esDiaHabil(value)) {
                    throw new Error('La fecha de fin debe ser un día hábil (lunes a viernes, excluyendo feriados)');
                }
            },
        },
    },
    horario: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El horario es requerido' },
            len: { args: [5, 100], msg: 'El horario debe tener entre 5 y 100 caracteres' },
        },
    },
    salario: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El salario es requerido' },
            isDecimal: { msg: 'Debe ser un número válido' },
            min: {
                args: [0],
                msg: 'El salario no puede ser negativo',
            },
            max: {
                args: [999999999.99],
                msg: 'El salario no puede exceder 999,999,999.99',
            },
        },
    },
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_curso', 'finalizado'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    compensacion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La compensación no puede exceder 500 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'contratos',
    timestamps: true,
});

const actualizarEstadoContrato = (contrato) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const inicio = parseLocalDate(contrato.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    const fin = contrato.fechaFin
        ? parseLocalDate(contrato.fechaFin)
        : null;

    fin?.setHours(0, 0, 0, 0);

    if (fin && fin <= hoy) {
        contrato.estado = 'finalizado';
    } else if (inicio > hoy) {
        contrato.estado = 'pendiente';
    } else {
        contrato.estado = 'en_curso';
    }
};

Contrato.addHook('beforeCreate', actualizarEstadoContrato);
Contrato.addHook('beforeUpdate', actualizarEstadoContrato);
Contrato.addHook('beforeSave', actualizarEstadoContrato);

module.exports = Contrato;


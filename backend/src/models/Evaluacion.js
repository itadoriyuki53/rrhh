/**
 * @fileoverview Modelo de Evaluación.
 * Almacena el feedback de desempeño de un contrato, incluyendo puntajes,
 * escalas de medición y observaciones. Permite múltiples evaluadores.
 * @module models/Evaluacion
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate, esDiaHabil } = require('../helpers/fechas.helper');

// Períodos de evaluación
const PERIODOS = [
    'anual',
    'semestre_1',
    'semestre_2',
    'q1',
    'q2',
    'q3',
    'q4',
    'cierre_prueba',
    'fin_proyecto',
    'ad_hoc',
];

// Tipos de evaluación
const TIPOS_EVALUACION = [
    'autoevaluacion',
    'descendente_90',
    'pares_jefe_180',
    'ascendente_270',
    'integral_360',
    'competencias',
    'objetivos',
    'mixta',
    'potencial',
];

// Estados de evaluación
const ESTADOS = [
    'pendiente',
    'en_curso',
    'finalizada',
    'firmada',
];

// Escalas de valoración
const ESCALAS = [
    'supera_expectativas',
    'cumple',
    'necesita_mejora',
];

const Evaluacion = sequelize.define('Evaluacion', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    periodo: {
        type: DataTypes.ENUM(...PERIODOS),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El período es requerido' },
            isIn: {
                args: [PERIODOS],
                msg: 'Período inválido',
            },
        },
    },
    tipoEvaluacion: {
        type: DataTypes.ENUM(...TIPOS_EVALUACION),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de evaluación es requerido' },
            isIn: {
                args: [TIPOS_EVALUACION],
                msg: 'Tipo de evaluación inválido',
            },
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
    contratoEvaluadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contratos',
            key: 'id'
        }
    },
    estado: {
        type: DataTypes.ENUM(...ESTADOS),
        allowNull: false,
        defaultValue: 'pendiente',
        validate: {
            isIn: {
                args: [ESTADOS],
                msg: 'Estado inválido',
            },
        },
    },
    puntaje: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El puntaje es requerido' },
            min: { args: [0], msg: 'El puntaje mínimo es 0' },
            max: { args: [100], msg: 'El puntaje máximo es 100' },
        },
    },
    escala: {
        type: DataTypes.ENUM(...ESCALAS),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La escala es requerida' },
            isIn: {
                args: [ESCALAS],
                msg: 'Escala inválida',
            },
        },
    },
    feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El feedback es requerido' },
            len: { args: [10, 2000], msg: 'El feedback debe tener entre 10 y 2000 caracteres' },
        },
    },
    reconocidoPorEmpleado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    fechaReconocimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: 'Las notas no pueden superar los 1000 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'evaluaciones',
    timestamps: true,
});

// Hooks
Evaluacion.addHook('beforeValidate', (evaluacion) => {
    // Validar que la fecha no sea futura
    if (evaluacion.fecha) {
        const fechaEval = parseLocalDate(evaluacion.fecha);
        fechaEval.setHours(0, 0, 0, 0);
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        if (fechaEval > hoy) {
            throw new Error('La fecha de la evaluación no puede ser futura');
        }

        // Validar día hábil
        if (!esDiaHabil(evaluacion.fecha)) {
            throw new Error('La fecha de la evaluación debe ser un día hábil (lunes a viernes, excluyendo feriados)');
        }
    }

    // Auto-set fechaReconocimiento cuando se marca reconocidoPorEmpleado
    if (evaluacion.reconocidoPorEmpleado && !evaluacion.fechaReconocimiento) {
        evaluacion.fechaReconocimiento = new Date().toISOString().split('T')[0];
    }
    // Limpiar fechaReconocimiento si se desmarca
    if (!evaluacion.reconocidoPorEmpleado) {
        evaluacion.fechaReconocimiento = null;
    }
});

module.exports = Evaluacion;

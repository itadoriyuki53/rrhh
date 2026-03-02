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
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** 
     * @type {string} Ciclo de tiempo al que pertenece la evaluación.
     * Valores: 'anual', 'semestre_1', 'semestre_2', 'q1', 'q2', 'q3', 'q4', 'cierre_prueba', 'fin_proyecto', 'ad_hoc'.
     */
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
    /** 
     * @type {string} Metodología aplicada.
     * Valores: 'autoevaluacion', 'descendente_90', 'pares_jefe_180', 'ascendente_270', 'integral_360', 'competencias', 'objetivos', 'mixta', 'potencial'.
     */
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
    /** @type {string} Fecha de realización de la entrevista o carga (YYYY-MM-DD). Regla: No futura, día hábil. */
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
        },
    },
    /** @type {number} Relación con el contrato del empleado que recibe el feedback. */
    contratoEvaluadoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contratos',
            key: 'id'
        }
    },
    /** 
     * @type {'pendiente'|'en_curso'|'finalizada'|'firmada'} Estado del proceso.
     * Valores: 'pendiente', 'en_curso', 'finalizada' (por evaluador), 'firmada' (por empleado).
     */
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
    /** @type {number} Calificación numérica final de 0 a 100. */
    puntaje: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El puntaje es requerido' },
            min: { args: [0], msg: 'El puntaje mínimo es 0' },
            max: { args: [100], msg: 'El puntaje máximo es 100' },
        },
    },
    /** 
     * @type {string} Calificación cualitativa resumida.
     * Valores: 'supera_expectativas', 'cumple', 'necesita_mejora'.
     */
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
    /** @type {string} Cuerpo principal del feedback y áreas de mejora. 10-2000 chars. */
    feedback: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El feedback es requerido' },
            len: { args: [10, 2000], msg: 'El feedback debe tener entre 10 y 2000 caracteres' },
        },
    },
    /** @type {boolean} Flag que indica si el empleado leyó y aceptó el feedback. */
    reconocidoPorEmpleado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {string} Fecha automática de cuando el empleado reconoció el feedback. */
    fechaReconocimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    /** @type {string} Observaciones internas no visibles para el empleado o notas de RRHH. */
    notas: {
        type: DataTypes.TEXT,
        allowNull: true,
        validate: {
            len: { args: [0, 1000], msg: 'Las notas no pueden superar los 1000 caracteres' },
        },
    },
    /** @type {boolean} Estado lógico del registro. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'evaluaciones',
    timestamps: true,
});

/**
 * Hook de Reglas de Negocio para Evaluaciones.
 * 1. Prohíbe fechas de evaluación futuras o en días no laborales.
 * 2. Gestión de Auditoría: Setea fechaReconocimiento automáticamente al firmar.
 */
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

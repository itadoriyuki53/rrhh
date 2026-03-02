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
    /** @type {number} ID único autoincremental del contrato */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del empleado asociado. Requerido. */
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
    /** @type {number} ID del Rol de seguridad asignado a este contrato (opcional). */
    rolId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'roles',
            key: 'id',
        },
    },
    /** 
     * @type {string} Categoría legal del contrato.
     * Valores LCT: 'tiempo_indeterminado', 'periodo_prueba', 'plazo_fijo', 'eventual', 'teletrabajo'.
     * Valores No Laborales: 'locacion_servicios', 'monotributista', 'responsable_inscripto', 'honorarios', 'contrato_obra'.
     * Valores Formativos: 'pasantia_educativa', 'beca', 'ad_honorem'.
     */
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
    /** 
     * @type {string} Fecha de inicio de labores (YYYY-MM-DD).
     * Reglas: Requerida. No puede ser pasado. Debe ser día hábil (Lun-Vie no feriado).
     */
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
                if (!esDiaHabil(value)) {
                    throw new Error('La fecha de inicio debe ser un día hábil (lunes a viernes, excluyendo feriados)');
                }
            },
        },
    },
    /** 
     * @type {string} Fecha de finalización (YYYY-MM-DD).
     * Reglas: Opcional. Si existe, debe ser día hábil.
     */
    fechaFin: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
            isBusinessDay(value) {
                if (!value) return;
                if (!esDiaHabil(value)) {
                    throw new Error('La fecha de fin debe ser un día hábil (lunes a viernes, excluyendo feriados)');
                }
            },
        },
    },
    /** @type {string} Descripción del horario laboral (ej: 'Lunes a Viernes 09:00 a 18:00'). */
    horario: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El horario es requerido' },
            len: { args: [5, 100], msg: 'El horario debe tener entre 5 y 100 caracteres' },
        },
    },
    /** @type {number} Salario bruto pactado. Validado: Positivo hasta 999.999.999,99. */
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
    /** 
     * @type {'pendiente'|'en_curso'|'finalizado'} Estado actual del contrato. 
     * Calculado automáticamente por hooks según fechas.
     */
    estado: {
        type: DataTypes.ENUM('pendiente', 'en_curso', 'finalizado'),
        allowNull: false,
        defaultValue: 'pendiente',
    },
    /** @type {string} Beneficios extra o items de compensación no salarial. Max 500 chars. */
    compensacion: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
            len: { args: [0, 500], msg: 'La compensación no puede exceder 500 caracteres' },
        },
    },
    /** @type {boolean} Estado lógico del registro. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'contratos',
    timestamps: true,
});

/**
 * Regla de Negocio: Mantenimiento Automático de Estados.
 * Actualiza el campo 'estado' basándose en la fecha actual vs fechaInicio y fechaFin.
 * Se ejecuta antes de persistir cualquier cambio.
 * @param {Contrato} contrato - Instancia del contrato evaluado.
 */
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


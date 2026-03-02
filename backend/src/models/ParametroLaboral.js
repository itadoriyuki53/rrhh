/**
 * @fileoverview Modelo de Parámetro Laboral.
 * Almacena configuraciones variables del sistema (ej: tope de inasistencias para presentismo).
 * Permite personalizar el comportamiento de los cálculos por Espacio de Trabajo.
 * @module models/ParametroLaboral
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParametroLaboral = sequelize.define('ParametroLaboral', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del Espacio de Trabajo propietario de la configuración. */
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    /** 
     * @type {string} Identificador único del parámetro (ej: 'AGUINALDO_MES', 'PORC_JUBILACION').
     * Requerido. 
     */
    tipo: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de parámetro es requerido' },
        },
    },
    /** 
     * @type {string} Valor de la configuración. 
     * Almacenado como String para admitir diferentes tipos de datos (Int, Float, Boolean).
     */
    valor: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El valor es requerido' },
        },
    },
    /** @type {string} Explicación amigable de para qué sirve este parámetro. Max 255 chars. */
    descripcion: {
        type: DataTypes.STRING(255),
        allowNull: true,
    },
    /** @type {boolean} Flag que indica si este parámetro es crítico para el funcionamiento del módulo. */
    esObligatorio: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    },
}, {
    tableName: 'parametros_laborales',
    timestamps: true,
    indexes: [
        /** Regla de Negocio: No se permite duplicar el mismo tipo de parámetro dentro de un mismo espacio. */
        {
            unique: true,
            fields: ['espacioTrabajoId', 'tipo'],
        },
    ]
});

module.exports = ParametroLaboral;

/**
 * @fileoverview Modelo de Empresa.
 * Representa las razones sociales o sucursales físicas que operan dentro de un Espacio de Trabajo.
 * Es la base de la estructura organizacional.
 * @module models/Empresa
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empresa = sequelize.define('Empresa', {
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} ID del Espacio de Trabajo al que pertenece (Multi-tenant) */
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    /** @type {string} Nombre de la empresa o sucursal. 2-200 caracteres. Requerido. */
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' },
        },
    },
    /** 
     * @type {string} Email de contacto corporativo. 
     * Validación: Formato email, 5-100 chars. Único por Espacio de Trabajo.
     */
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El email es requerido' },
            isEmail: { msg: 'Debe ser un email válido' },
            len: { args: [5, 100], msg: 'El email debe tener entre 5 y 100 caracteres' },
        },
    },
    /** @type {string} Teléfono corporativo. Valida números, +, -, (), espacios. */
    telefono: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            len: { args: [0, 50], msg: 'El teléfono no puede exceder 50 caracteres' },
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, +, -, espacios y paréntesis',
            },
        },
    },
    /** @type {string} Sector industrial al que pertenece. 2-100 caracteres. Requerido. */
    industria: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La industria es requerida' },
            len: { args: [2, 100], msg: 'La industria debe tener entre 2 y 100 caracteres' },
        },
    },
    /** @type {string} Dirección física legal de la empresa. 5-255 caracteres. Requerido. */
    direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La dirección es requerida' },
            len: { args: [5, 255], msg: 'La dirección debe tener entre 5 y 255 caracteres' },
        },
    },
    /** @type {boolean} Estado de la empresa en el sistema. Default: true. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'empresas',
    timestamps: true,
    indexes: [
        /** Regla de Negocio: No se pueden duplicar emails de empresas dentro del mismo espacio. */
        {
            unique: true,
            fields: ['espacioTrabajoId', 'email'],
        },
    ]
});

module.exports = Empresa;

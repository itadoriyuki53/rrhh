/**
 * @fileoverview Modelo de Empresa.
 * Representa las razones sociales o sucursales físicas que operan dentro de un Espacio de Trabajo.
 * Es la base de la estructura organizacional.
 * @module models/Empresa
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Empresa = sequelize.define('Empresa', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    nombre: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' },
        },
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El email es requerido' },
            isEmail: { msg: 'Debe ser un email válido' },
            len: { args: [5, 100], msg: 'El email debe tener entre 5 y 100 caracteres' },
        },
    },
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
    industria: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La industria es requerida' },
            len: { args: [2, 100], msg: 'La industria debe tener entre 2 y 100 caracteres' },
        },
    },
    direccion: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La dirección es requerida' },
            len: { args: [5, 255], msg: 'La dirección debe tener entre 5 y 255 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'empresas',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['espacioTrabajoId', 'email'],
        },
    ]
});

module.exports = Empresa;

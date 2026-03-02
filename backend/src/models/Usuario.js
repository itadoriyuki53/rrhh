/**
 * @fileoverview Modelo de Usuario.
 * Representa la cuenta de acceso al sistema, gestionando credenciales (encriptadas con bcrypt),
 * estados de actividad y roles globales (Administrador/Empleado).
 * @module models/Usuario
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');
const { parseLocalDate } = require('../helpers/fechas.helper');

const Usuario = sequelize.define('Usuario', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
        },
    },
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El apellido es requerido' },
            len: { args: [2, 100], msg: 'El apellido debe tener entre 2 y 100 caracteres' },
        },
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El email es requerido' },
            isEmail: { msg: 'Debe ser un email válido' },
        },
    },
    contrasena: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La contraseña es requerida' },
            len: {
                args: [8, 255],
                msg: 'La contraseña debe tener al menos 8 caracteres'
            },
            is: {
                args: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/,
                msg: 'La contraseña debe contener al menos una mayúscula, un número y un carácter especial (@$!%*?&#)'
            }
        }
    },
    // Booleano para determinar si es Admin
    esAdministrador: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // Booleano para determinar si es Empleado
    esEmpleado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    // Booleano para indicar si el usuario está activo
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'usuarios',
    timestamps: true,
    hooks: {
        beforeCreate: async (usuario) => {
            if (usuario.contrasena) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
        beforeUpdate: async (usuario) => {
            if (usuario.changed('contrasena')) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
    },
});

module.exports = Usuario;

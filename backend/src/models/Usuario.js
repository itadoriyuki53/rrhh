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
    /** @type {number} ID único autoincremental del usuario */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {string} Nombres del usuario. Longitud: 2-100 caracteres. Requerido. */
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre es requerido' },
            len: { args: [2, 100], msg: 'El nombre debe tener entre 2 y 100 caracteres' },
        },
    },
    /** @type {string} Apellidos del usuario. Longitud: 2-100 caracteres. Requerido. */
    apellido: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El apellido es requerido' },
            len: { args: [2, 100], msg: 'El apellido debe tener entre 2 y 100 caracteres' },
        },
    },
    /** @type {string} Dirección de correo electrónico. Debe ser único y tener formato válido. */
    email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: { msg: 'El email es requerido' },
            isEmail: { msg: 'Debe ser un email válido' },
        },
    },
    /** 
     * @type {string} Contraseña encriptada. 
     * Validación: min 8 caracteres, al menos una mayúscula, un número y un carácter especial.
     */
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
    /** @type {boolean} Flag de administrador global (acceso total). Default: false. */
    esAdministrador: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Flag que indica si el usuario posee ficha de empleado. Default: false. */
    esEmpleado: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Estado lógico del usuario. Indica si puede iniciar sesión. Default: true. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'usuarios',
    timestamps: true,
    hooks: {
        /**
         * Encriptación de contraseña antes de la creación física del registro.
         * @param {Usuario} usuario - Instancia del usuario actual.
         */
        beforeCreate: async (usuario) => {
            if (usuario.contrasena) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
        /**
         * Encriptación de contraseña solo si fue modificada en la actualización.
         * @param {Usuario} usuario - Instancia del usuario actual.
         */
        beforeUpdate: async (usuario) => {
            if (usuario.changed('contrasena')) {
                const salt = await bcrypt.genSalt(10);
                usuario.contrasena = await bcrypt.hash(usuario.contrasena, salt);
            }
        },
    },
});

module.exports = Usuario;

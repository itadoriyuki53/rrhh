/**
 * @fileoverview Modelo de Contacto.
 * Gestiona los vínculos familiares y contactos de emergencia asociados a un empleado.
 * Incluye parentesco, datos de contacto y estatus de emergencia.
 * @module models/Contacto
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate } = require('../helpers/fechas.helper');

const Contacto = sequelize.define('Contacto', {
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
    esFamiliar: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    esContactoEmergencia: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    nombreCompleto: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre completo es requerido' },
            len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' },
        },
    },
    dni: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El DNI es requerido' },
            is: {
                args: /^(\d{8}|[MF]\d{7})$/,
                msg: 'El DNI debe ser 8 números o comenzar con M/F seguido de 7 números',
            },
        },
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        validate: {
            isDate: { msg: 'Debe ser una fecha válida' },
            isAfter: {
                args: '1899-12-31',
                msg: 'La fecha de nacimiento no es válida',
            },
            isNotFuture(value) {
                if (!value) return;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                if (value > today) {
                    throw new Error('La fecha de nacimiento no puede ser futura');
                }
            },
            isMinimumAge(value) {
                if (!value) return;
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                const birthDate = value;
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                if (age < 18) {
                    throw new Error('El contacto debe tener al menos 18 años para ser responsable');
                }
            },
        },
    },
    parentesco: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El parentesco es requerido' },
            len: { args: [2, 100], msg: 'El parentesco debe tener entre 2 y 100 caracteres' },
        },
    },
    discapacidad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    dependiente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    escolaridad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    telefonoPrincipal: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El teléfono principal es requerido' },
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, +, -, espacios y paréntesis',
            },
        },
    },
    telefonoSecundario: {
        type: DataTypes.STRING(50),
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, +, -, espacios y paréntesis',
            },
        },
    },
    direccion: {
        type: DataTypes.STRING(300),
        allowNull: true,
        validate: {
            len: { args: [0, 300], msg: 'La dirección no puede exceder 300 caracteres' },
        },
    },
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'contactos',
    timestamps: true,
});

// Hook para validar que al menos uno de los checkboxes esté seleccionado
Contacto.addHook('beforeValidate', (contacto) => {
    if (!contacto.esFamiliar && !contacto.esContactoEmergencia) {
        throw new Error('Debe seleccionar al menos una opción: Familiar o Contacto de Emergencia');
    }
});

module.exports = Contacto;

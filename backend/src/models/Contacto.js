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
    /** @type {number} ID único autoincremental */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} Relación con el empleado al que pertenece este vínculo/contacto. */
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
    /** @type {boolean} Indica si el contacto tiene un vínculo de parentesco legal. */
    esFamiliar: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Indica si el contacto debe ser notificado ante emergencias médicas. */
    esContactoEmergencia: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {string} Nombre y apellido del contacto. 2-200 caracteres. Requerido. */
    nombreCompleto: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El nombre completo es requerido' },
            len: { args: [2, 200], msg: 'El nombre debe tener entre 2 y 200 caracteres' },
        },
    },
    /** 
     * @type {string} DNI del contacto. 
     * Validación: 8 dígitos numéricos o M/F + 7 dígitos.
     */
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
    /** 
     * @type {string} Fecha de nacimiento (YYYY-MM-DD). 
     * Reglas: Opcional. No futura. Mínimo 18 años para ser responsable de contacto.
     */
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
    /** @type {string} Vínculo con el empleado (ej: 'Hijo', 'Esposo/a', 'Padre/Madre'). */
    parentesco: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El parentesco es requerido' },
            len: { args: [2, 100], msg: 'El parentesco debe tener entre 2 y 100 caracteres' },
        },
    },
    /** @type {boolean} Flag para carga de salarios familiares (Discapacidad). */
    discapacidad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Flag que indica si el familiar está a cargo del empleado. */
    dependiente: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {boolean} Flag para asignaciones por escolaridad. */
    escolaridad: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    /** @type {string} Teléfono principal de contacto. Valida números, +, -, (), espacios. */
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
    /** @type {string} Teléfono alternativo u oficina. */
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
    /** @type {string} Dirección residencial del contacto. Max 300 chars. */
    direccion: {
        type: DataTypes.STRING(300),
        allowNull: true,
        validate: {
            len: { args: [0, 300], msg: 'La dirección no puede exceder 300 caracteres' },
        },
    },
    /** @type {boolean} Estado lógico del registro. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'contactos',
    timestamps: true,
});

/**
 * Hook de Regla de Negocio para Contactos.
 * Asegura la utilidad del registro validando que sea al menos un tipo de contacto válido (Familiar o Emergencia).
 */
Contacto.addHook('beforeValidate', (contacto) => {
    if (!contacto.esFamiliar && !contacto.esContactoEmergencia) {
        throw new Error('Debe seleccionar al menos una opción: Familiar o Contacto de Emergencia');
    }
});

module.exports = Contacto;

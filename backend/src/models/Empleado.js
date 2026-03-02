/**
 * @fileoverview Modelo de Empleado.
 * Almacena la ficha personal, datos de contacto, documentos de identidad (DNI/CUIL)
 * y geolocalización legal del personal. Se vincula 1:1 con un Usuario de acceso.
 * @module models/Empleado
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { parseLocalDate } = require('../helpers/fechas.helper');

const Empleado = sequelize.define('Empleado', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'usuarios',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    espacioTrabajoId: {
        type: DataTypes.INTEGER,
        allowNull: false, // Ahora es obligatorio
        references: {
            model: 'espacios_trabajo',
            key: 'id',
        },
        onDelete: 'CASCADE',
    },
    // Información personal y contacto 
    telefono: {
        type: DataTypes.STRING(20),
        allowNull: true,
        validate: {
            is: {
                args: /^[0-9+\-\s()]*$/,
                msg: 'El teléfono solo puede contener números, +, -, espacios y paréntesis',
            },
        },
    },
    tipoDocumento: {
        type: DataTypes.ENUM('cedula', 'pasaporte'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de documento es requerido' },
            isIn: {
                args: [['cedula', 'pasaporte']],
                msg: 'El tipo de documento debe ser cedula o pasaporte',
            },
        },
    },
    numeroDocumento: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El número de documento es requerido' },
            is: {
                args: /^(\d{8}|[MF]\d{7})$/,
                msg: 'El documento debe ser 8 números o comenzar con M/F seguido de 7 números',
            },
        },
    },
    cuil: {
        type: DataTypes.STRING(13),
        allowNull: true,
        set(value) {
            this.setDataValue('cuil', value === '' ? null : value);
        },
        validate: {
            is: {
                args: /^(\d{2}-\d{8}-\d{1})?$/,
                msg: 'El CUIL debe tener el formato XX-XXXXXXXX-X',
            },
        },
    },
    fechaNacimiento: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La fecha de nacimiento es requerida' },
            isDate: { msg: 'Debe ser una fecha válida' },
            isAfter: {
                args: '1899-12-31',
                msg: 'La fecha de nacimiento no es válida',
            },
            isNotFuture(value) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                value = parseLocalDate(value);
                value.setHours(0, 0, 0, 0);
                if (value >= today) {
                    throw new Error('La fecha de nacimiento debe ser anterior a hoy');
                }
            },
        },
    },
    nacionalidadId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La nacionalidad es requerida' },
        },
    },
    genero: {
        type: DataTypes.ENUM('masculino', 'femenino', 'otro'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El género es requerido' },
            isIn: {
                args: [['masculino', 'femenino', 'otro']],
                msg: 'El género debe ser masculino, femenino u otro',
            },
        },
    },
    estadoCivil: {
        type: DataTypes.ENUM('soltero', 'casado', 'divorciado', 'viudo', 'union_convivencial'),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El estado civil es requerido' },
            isIn: {
                args: [['soltero', 'casado', 'divorciado', 'viudo', 'union_convivencial']],
                msg: 'El estado civil debe ser uno de los permitidos',
            },
        },
    },
    // Dirección legal
    calle: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La calle es requerida' },
            len: { args: [1, 200], msg: 'La calle debe tener entre 1 y 200 caracteres' },
        },
    },
    numero: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El número es requerido' },
            len: { args: [1, 20], msg: 'El número debe tener entre 1 y 20 caracteres' },
        },
    },
    piso: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El piso no puede exceder 10 caracteres' },
        },
    },
    departamento: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El departamento no puede exceder 10 caracteres' },
        },
    },
    codigoPostal: {
        type: DataTypes.STRING(10),
        allowNull: true,
        validate: {
            len: { args: [0, 10], msg: 'El código postal no puede exceder 10 caracteres' },
            is: { args: /^[A-Z0-9]*$/i, msg: 'El código postal solo puede contener letras y números' },
        },
    },
    provinciaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            notEmpty: { msg: 'La provincia es requerida' },
        },
    },
    ciudadId: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    ultimoContratoSeleccionadoId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'ID del contrato seleccionado actualmente por el empleado en la UI'
    },
}, {
    tableName: 'empleados',
    timestamps: true,
});

module.exports = Empleado;

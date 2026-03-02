/**
 * @fileoverview Modelo de Solicitud (Base).
 * Actúa como encabezado común para todas las novedades (Vacaciones, Licencias, Horas Extras, Renuncias).
 * Gestiona el flujo de estados (pendiente, aprobada, rechazada).
 * @module models/Solicitud
 */

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Tipos de solicitud
const TIPOS_SOLICITUD = [
    'vacaciones',
    'licencia',
    'horas_extras',
    'renuncia',
];

const Solicitud = sequelize.define('Solicitud', {
    /** @type {number} ID único autoincremental del encabezado de solicitud */
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
    },
    /** @type {number} Referencia al contrato laboral que genera la solicitud. */
    contratoId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'contratos',
            key: 'id',
        },
        validate: {
            notEmpty: { msg: 'El contrato es requerido' },
        },
    },
    /** 
     * @type {'vacaciones'|'licencia'|'horas_extras'|'renuncia'} Clasificación de la novedad.
     * Determina en qué tabla hija se encuentra el detalle.
     */
    tipoSolicitud: {
        type: DataTypes.ENUM(...TIPOS_SOLICITUD),
        allowNull: false,
        validate: {
            notEmpty: { msg: 'El tipo de solicitud es requerido' },
            isIn: {
                args: [TIPOS_SOLICITUD],
                msg: 'Tipo de solicitud inválido',
            },
        },
    },
    /** @type {boolean} Estado lógico del registro. */
    activo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'solicitudes',
    timestamps: true,
});

module.exports = Solicitud;

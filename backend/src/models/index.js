/**
 * @fileoverview Punto de centralización y exportación de todos los modelos de Sequelize.
 * Define la estructura relacional del sistema, incluyendo asociaciones 1:1, 1:N y M:N.
 * @module models/index
 */

const sequelize = require('../config/database');
const Usuario = require('./Usuario');
const Empleado = require('./Empleado');
const Empresa = require('./Empresa');
const Area = require('./Area');
const Departamento = require('./Departamento');
const Puesto = require('./Puesto');
const Contrato = require('./Contrato');
const ContratoPuesto = require('./ContratoPuesto');
const RegistroSalud = require('./RegistroSalud');
const Evaluacion = require('./Evaluacion');
const Contacto = require('./Contacto');
const Solicitud = require('./Solicitud');
const Licencia = require('./Licencia');
const Vacaciones = require('./Vacaciones');
const HorasExtras = require('./HorasExtras');
const Renuncia = require('./Renuncia');
const Liquidacion = require('./Liquidacion');
const ConceptoSalarial = require('./ConceptoSalarial');
const ParametroLaboral = require('./ParametroLaboral');
const Rol = require('./Rol');
const Permiso = require('./Permiso');
const RolPermiso = require('./RolPermiso');
const EspacioTrabajo = require('./EspacioTrabajo');

// ==========================================
// DEFINICIÓN DE RELACIONES
// ==========================================

// --- Usuario & Auth ---
// Usuario -> Empleado (1:1 o 1:N si se permite multiskills, pero por ahora 1:N para soportar multiples empleos)
// Un usuario puede ser empleado en varios espacios de trabajo
Usuario.hasMany(Empleado, { foreignKey: 'usuarioId', as: 'empleos', onDelete: 'CASCADE' });
Empleado.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

// Usuario -> EspacioTrabajo (Propietario)
Usuario.hasMany(EspacioTrabajo, { foreignKey: 'propietarioId', as: 'espaciosPropiedad' });
EspacioTrabajo.belongsTo(Usuario, { foreignKey: 'propietarioId', as: 'propietario' });

// --- Espacio de Trabajo Core ---
// EspacioTrabajo -> Entidades Principales
EspacioTrabajo.hasMany(Empleado, { foreignKey: 'espacioTrabajoId', as: 'empleados', onDelete: 'CASCADE' });
Empleado.belongsTo(EspacioTrabajo, { foreignKey: 'espacioTrabajoId', as: 'espacioTrabajo' });

EspacioTrabajo.hasMany(Empresa, { foreignKey: 'espacioTrabajoId', as: 'empresas', onDelete: 'CASCADE' });
Empresa.belongsTo(EspacioTrabajo, { foreignKey: 'espacioTrabajoId', as: 'espacioTrabajo' });

EspacioTrabajo.hasMany(Rol, { foreignKey: 'espacioTrabajoId', as: 'roles', onDelete: 'CASCADE' });
Rol.belongsTo(EspacioTrabajo, { foreignKey: 'espacioTrabajoId', as: 'espacioTrabajo' });

EspacioTrabajo.hasMany(ConceptoSalarial, { foreignKey: 'espacioTrabajoId', as: 'conceptos', onDelete: 'CASCADE' });
ConceptoSalarial.belongsTo(EspacioTrabajo, { foreignKey: 'espacioTrabajoId', as: 'espacioTrabajo' });

EspacioTrabajo.hasMany(ParametroLaboral, { foreignKey: 'espacioTrabajoId', as: 'parametros', onDelete: 'CASCADE' });
ParametroLaboral.belongsTo(EspacioTrabajo, { foreignKey: 'espacioTrabajoId', as: 'espacioTrabajo' });


// --- Estructura Organizacional ---
// Empresa -> Areas
Empresa.hasMany(Area, { foreignKey: 'empresaId', as: 'areas', onDelete: 'CASCADE' });
Area.belongsTo(Empresa, { foreignKey: 'empresaId', as: 'empresa' });

// Area -> Departamentos
Area.hasMany(Departamento, { foreignKey: 'areaId', as: 'departamentos', onDelete: 'CASCADE' });
Departamento.belongsTo(Area, { foreignKey: 'areaId', as: 'area' });

// Departamento -> Puestos
Departamento.hasMany(Puesto, { foreignKey: 'departamentoId', as: 'puestos', onDelete: 'CASCADE' });
Puesto.belongsTo(Departamento, { foreignKey: 'departamentoId', as: 'departamento' });

// --- Gestión de Empleados ---
// Empleado -> Contratos
Empleado.hasMany(Contrato, { foreignKey: 'empleadoId', as: 'contratos', onDelete: 'CASCADE' });
Contrato.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });

// Contrato <-> Puesto (Many-to-Many via ContratoPuesto)
Contrato.belongsToMany(Puesto, {
    through: ContratoPuesto,
    foreignKey: 'contratoId',
    otherKey: 'puestoId',
    as: 'puestos'
});
Puesto.belongsToMany(Contrato, {
    through: ContratoPuesto,
    foreignKey: 'puestoId',
    otherKey: 'contratoId',
    as: 'contratos'
});

// ContratoPuesto associations for direct access
ContratoPuesto.belongsTo(Contrato, { foreignKey: 'contratoId', as: 'contrato' });
ContratoPuesto.belongsTo(Puesto, { foreignKey: 'puestoId', as: 'puesto' });
Contrato.hasMany(ContratoPuesto, { foreignKey: 'contratoId', as: 'contratoPuestos' });
Puesto.hasMany(ContratoPuesto, { foreignKey: 'puestoId', as: 'contratoPuestos' });

// RegistroSalud -> Empleado
RegistroSalud.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
Empleado.hasMany(RegistroSalud, { foreignKey: 'empleadoId', as: 'registrosSalud' });

// Evaluacion -> Contrato (contratoEvaluado)
Evaluacion.belongsTo(Contrato, { foreignKey: 'contratoEvaluadoId', as: 'contratoEvaluado' });
Contrato.hasMany(Evaluacion, { foreignKey: 'contratoEvaluadoId', as: 'evaluacionesRecibidas' });

// Evaluacion <-> Contrato (evaluadores M:N)
Evaluacion.belongsToMany(Contrato, {
    through: 'evaluacion_evaluadores',
    foreignKey: 'evaluacionId',
    otherKey: 'evaluadorId',
    as: 'evaluadores'
});
Contrato.belongsToMany(Evaluacion, {
    through: 'evaluacion_evaluadores',
    foreignKey: 'evaluadorId',
    otherKey: 'evaluacionId',
    as: 'evaluacionesRealizadas'
});

// Contacto -> Empleado
Contacto.belongsTo(Empleado, { foreignKey: 'empleadoId', as: 'empleado' });
Empleado.hasMany(Contacto, { foreignKey: 'empleadoId', as: 'contactos', onDelete: 'CASCADE' });

// Empleado -> Contrato (Último seleccionado)
Empleado.belongsTo(Contrato, { foreignKey: 'ultimoContratoSeleccionadoId', as: 'ultimoContratoSeleccionado' });

// --- Solicitudes y Novedades ---
// Contrato -> Solicitudes
Contrato.hasMany(Solicitud, { foreignKey: 'contratoId', as: 'solicitudes', onDelete: 'CASCADE' });
Solicitud.belongsTo(Contrato, { foreignKey: 'contratoId', as: 'contrato' });

// Solicitud -> Licencia (1:1)
Solicitud.hasOne(Licencia, { foreignKey: 'solicitudId', as: 'licencia', onDelete: 'CASCADE' });
Licencia.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });

// Solicitud -> Vacaciones (1:1)
Solicitud.hasOne(Vacaciones, { foreignKey: 'solicitudId', as: 'vacaciones', onDelete: 'CASCADE' });
Vacaciones.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });

// Solicitud -> HorasExtras (1:1)
Solicitud.hasOne(HorasExtras, { foreignKey: 'solicitudId', as: 'horasExtras', onDelete: 'CASCADE' });
HorasExtras.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });

// Solicitud -> Renuncia (1:1)
Solicitud.hasOne(Renuncia, { foreignKey: 'solicitudId', as: 'renuncia', onDelete: 'CASCADE' });
Renuncia.belongsTo(Solicitud, { foreignKey: 'solicitudId', as: 'solicitud' });

// Licencia -> RegistroSalud (opcional)
Licencia.belongsTo(RegistroSalud, { foreignKey: 'registroSaludId', as: 'registroSalud' });
RegistroSalud.hasMany(Licencia, { foreignKey: 'registroSaludId', as: 'licencias' });

// Contrato -> Liquidaciones
Contrato.hasMany(Liquidacion, { foreignKey: 'contratoId', as: 'liquidaciones', onDelete: 'CASCADE' });
Liquidacion.belongsTo(Contrato, { foreignKey: 'contratoId', as: 'contrato' });


// --- Roles y Permisos ---
// Rol <-> Permiso (Many-to-Many via RolPermiso)
Rol.belongsToMany(Permiso, {
    through: RolPermiso,
    foreignKey: 'rolId',
    otherKey: 'permisoId',
    as: 'permisos'
});
Permiso.belongsToMany(Rol, {
    through: RolPermiso,
    foreignKey: 'permisoId',
    otherKey: 'rolId',
    as: 'roles'
});

// RolPermiso associations for direct access
RolPermiso.belongsTo(Rol, { foreignKey: 'rolId', as: 'rol' });
RolPermiso.belongsTo(Permiso, { foreignKey: 'permisoId', as: 'permiso' });
Rol.hasMany(RolPermiso, { foreignKey: 'rolId', as: 'rolPermisos' });
Permiso.hasMany(RolPermiso, { foreignKey: 'permisoId', as: 'rolPermisos' });

// Contrato -> Rol
Contrato.belongsTo(Rol, { foreignKey: 'rolId', as: 'rol' });
Rol.hasMany(Contrato, { foreignKey: 'rolId', as: 'contratos' });

module.exports = {
    sequelize,
    Usuario,
    Empleado,
    Empresa,
    Area,
    Departamento,
    Puesto,
    Contrato,
    ContratoPuesto,
    RegistroSalud,
    Evaluacion,
    Contacto,
    Solicitud,
    Licencia,
    Vacaciones,
    HorasExtras,
    Renuncia,
    Liquidacion,
    ConceptoSalarial,
    ParametroLaboral,
    Rol,
    Permiso,
    RolPermiso,
    EspacioTrabajo,
};

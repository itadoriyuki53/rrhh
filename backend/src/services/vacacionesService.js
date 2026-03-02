/**
 * @fileoverview Servicio de validación y cálculo de vacaciones.
 * Encapsula la lógica de negocio para solicitudes de vacaciones:
 * validaciones de solapamiento, cálculo de días correspondientes por ley
 * y acciones post-aprobación.
 * @module services/vacacionesService
 */

const { Solicitud, Vacaciones, Licencia, HorasExtras, Renuncia, Contrato } = require('../models');
const { Op } = require('sequelize');
const { condicionSolapamientoFechas } = require('../helpers/solapamiento.helper');
const { calcularDiasEfectivos, calcularAntiguedadEnAnios } = require('./empleadoService');
const { getLicenciasNoAprobadas } = require('./licenciaService');
const { esDiaHabil, parseLocalDate } = require('../helpers/fechas.helper');

/**
 * Valida si una solicitud de vacaciones puede crearse o editarse.
 * Verifica solapamientos con otras vacaciones, licencias y horas extras,
 * y que las fechas pertenezcan al período indicado.
 *
 * @param {number} contratoId - ID del contrato
 * @param {object} datos - Datos de la solicitud
 * @param {string} datos.fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} datos.fechaFin - Fecha de fin (YYYY-MM-DD)
 * @param {number|string} [datos.periodo] - Año del período vacacional
 * @param {number|null} [solicitudIdActual=null] - ID de solicitud excluida (para edición)
 * @returns {Promise<{valido: boolean, error?: string}>}
 */
const validarVacaciones = async (contratoId, datos, solicitudIdActual = null) => {
    const { fechaInicio, fechaFin, periodo } = datos;

    // Validar rango de fechas según período anual (Mayo año X → Abril año X+1)
    if (periodo && fechaInicio && fechaFin) {
        const anioPeriodo = parseInt(periodo);
        const fechaMinima = `${anioPeriodo}-05-01`;
        const fechaMaxima = `${anioPeriodo + 1}-04-30`;

        if (fechaInicio < fechaMinima || fechaInicio > fechaMaxima) {
            return {
                valido: false,
                error: `Para el período ${periodo}, la fecha de inicio debe estar entre el 01/05/${anioPeriodo} y el 30/04/${anioPeriodo + 1}`
            };
        }
        if (fechaFin < fechaMinima || fechaFin > fechaMaxima) {
            return {
                valido: false,
                error: `Para el período ${periodo}, la fecha de fin debe estar entre el 01/05/${anioPeriodo} y el 30/04/${anioPeriodo + 1}`
            };
        }
    }

    // Condición de exclusión para edición
    const excludeCondition = solicitudIdActual ? { id: { [Op.ne]: solicitudIdActual } } : {};

    // 1. Verificar vacaciones pendientes
    const pendiente = await Solicitud.findOne({
        where: { contratoId, tipoSolicitud: 'vacaciones', activo: true, ...excludeCondition },
        include: [{ model: Vacaciones, as: 'vacaciones', where: { estado: 'pendiente' } }]
    });
    if (pendiente) {
        return { valido: false, error: 'Ya existe una solicitud de vacaciones pendiente para este contrato. Revísala antes de continuar.' };
    }

    // 2. Verificar solapamiento con vacaciones aprobadas
    const vacacionesAprobadas = await Solicitud.findOne({
        where: { contratoId, tipoSolicitud: 'vacaciones', activo: true, ...excludeCondition },
        include: [{
            model: Vacaciones, as: 'vacaciones',
            where: { estado: 'aprobada', ...condicionSolapamientoFechas(fechaInicio, fechaFin) }
        }]
    });
    if (vacacionesAprobadas) {
        return { valido: false, error: 'Las fechas se solapan con vacaciones aprobadas existentes. Por favor, elige otro período.' };
    }

    // 3. Verificar solapamiento con licencias justificadas
    const licenciasJustificadas = await Solicitud.findOne({
        where: { contratoId, tipoSolicitud: 'licencia', activo: true },
        include: [{
            model: Licencia, as: 'licencia',
            where: { estado: 'justificada', ...condicionSolapamientoFechas(fechaInicio, fechaFin) }
        }]
    });
    if (licenciasJustificadas) {
        return { valido: false, error: 'Las fechas se solapan con una licencia justificada existente. Por favor, elige otro período.' };
    }

    // 4. Verificar solapamiento con horas extras aprobadas
    const horasExtrasAprobadas = await Solicitud.findOne({
        where: { contratoId, tipoSolicitud: 'horas_extras', activo: true },
        include: [{
            model: HorasExtras, as: 'horasExtras',
            where: { estado: 'aprobada', fecha: { [Op.between]: [fechaInicio, fechaFin] } }
        }]
    });
    if (horasExtrasAprobadas) {
        return { valido: false, error: 'Las fechas incluyen un día con horas extras aprobadas. Por favor, elige otro período.' };
    }

    return { valido: true };
};

/**
 * Ejecuta acciones secundarias al aprobar vacaciones.
 * Si el empleado tiene una renuncia en estado `aceptada`, suma los días
 * de vacaciones a la `fechaBajaEfectiva`.
 *
 * @param {number} contratoId - ID del contrato
 * @param {number} diasAprobados - Cantidad de días de vacaciones aprobadas
 * @param {object} transaction - Transacción de Sequelize
 * @returns {Promise<void>}
 */
const onAprobacion = async (contratoId, diasAprobados, transaction) => {
    const renunciaAprobada = await Solicitud.findOne({
        where: { contratoId, tipoSolicitud: 'renuncia', activo: true },
        include: [{ model: Renuncia, as: 'renuncia', where: { estado: 'aceptada' } }]
    });

    if (renunciaAprobada?.renuncia) {
        const fechaBaja = new Date(renunciaAprobada.renuncia.fechaBajaEfectiva);
        fechaBaja.setDate(fechaBaja.getDate() + diasAprobados);
        await renunciaAprobada.renuncia.update({
            fechaBajaEfectiva: fechaBaja.toISOString().split('T')[0]
        }, { transaction });
    }
};

/**
 * Calcula los días de vacaciones que le corresponden a un empleado según la Ley 20.744.
 * Tiene en cuenta los días efectivos trabajados y la antigüedad.
 *
 * @param {object} contrato - Instancia del contrato
 * @param {string} contrato.fechaInicio - Fecha de inicio del contrato (YYYY-MM-DD)
 * @returns {Promise<number>} Días de vacaciones correspondientes
 */
const calcularDiasCorrespondientesVacaciones = async (contrato) => {
    const licencias = await getLicenciasNoAprobadas(contrato);
    const diasEfectivos = calcularDiasEfectivos(contrato.fechaInicio, licencias);

    // Si trabajó menos de la mitad del año: 1 día por cada 20 trabajados
    if (diasEfectivos < 180) {
        return Math.floor(diasEfectivos / 20);
    }

    const antiguedad = calcularAntiguedadEnAnios(contrato.fechaInicio);

    if (antiguedad < 5) return 14;
    if (antiguedad < 10) return 21;
    if (antiguedad < 20) return 28;
    return 35;
};

/**
 * Obtiene información de días disponibles de vacaciones para un contrato.
 * Calcula los correspondientes por ley, los tomados y los disponibles.
 *
 * @param {number} contratoId - ID del contrato
 * @param {number|string} [periodo] - Año del período (default: año actual)
 * @returns {Promise<{diasCorrespondientes: number, diasTomados: number, diasDisponibles: number}>}
 * @throws {Error} Si el contrato no existe
 */
const calcularDiasDisponibles = async (contratoId, periodo) => {
    const contrato = await Contrato.findByPk(contratoId);
    if (!contrato) throw new Error('Contrato no encontrado');

    const diasCorrespondientes = await calcularDiasCorrespondientesVacaciones(contrato);
    const periodoCalculo = periodo ? parseInt(periodo) : new Date().getFullYear();

    const vacacionesAprobadas = await Solicitud.findAll({
        where: { contratoId: parseInt(contratoId), tipoSolicitud: 'vacaciones', activo: true },
        include: [{
            model: Vacaciones, as: 'vacaciones',
            where: { periodo: periodoCalculo, estado: 'aprobada' }
        }]
    });

    const diasTomados = vacacionesAprobadas.reduce((sum, sol) => {
        return sum + (sol.vacaciones?.diasSolicitud || 0);
    }, 0);

    const diasDisponibles = Math.max(0, diasCorrespondientes - diasTomados);

    return { diasCorrespondientes, diasTomados, diasDisponibles };
};

/**
 * Calcula los días hábiles entre dos fechas y la fecha de regreso al trabajo.
 *
 * @param {string} fechaInicio - Fecha de inicio (YYYY-MM-DD)
 * @param {string} fechaFin - Fecha de fin (YYYY-MM-DD)
 * @returns {{diasSolicitud: number, fechaRegreso: string}}
 * @throws {Error} Si la fecha fin es anterior a la fecha inicio
 */
const calcularDiasSolicitados = (fechaInicio, fechaFin) => {
    const inicio = parseLocalDate(fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    const fin = parseLocalDate(fechaFin);
    fin.setHours(0, 0, 0, 0);

    if (fin < inicio) {
        throw new Error('La fecha fin no puede ser anterior a la fecha inicio');
    }

    let diasSolicitud = 0;
    let cursor = new Date(inicio);

    while (cursor <= fin) {
        if (esDiaHabil(cursor.toISOString().split('T')[0])) {
            diasSolicitud++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    // Calcular fecha de regreso (primer día hábil después del período)
    let fechaRegreso = new Date(fin);
    fechaRegreso.setDate(fechaRegreso.getDate() + 1);
    while (!esDiaHabil(fechaRegreso.toISOString().split('T')[0])) {
        fechaRegreso.setDate(fechaRegreso.getDate() + 1);
    }

    return {
        diasSolicitud,
        fechaRegreso: fechaRegreso.toISOString().split('T')[0],
    };
};

module.exports = {
    validarVacaciones,
    onAprobacion,
    calcularDiasCorrespondientesVacaciones,
    calcularDiasDisponibles,
    calcularDiasSolicitados,
};

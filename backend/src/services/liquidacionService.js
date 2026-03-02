/**
 * @fileoverview Servicio de cálculo de conceptos salariales.
 * Contiene la lógica matemática y de negocio para calcular cada ítem de una liquidación:
 * básico, antigüedad, presentismo, horas extras, SAC, vacaciones y retenciones.
 * @module services/liquidacionService
 */

const { Contrato, Licencia, Vacaciones, HorasExtras, ConceptoSalarial, ParametroLaboral, Solicitud } = require('../models');
const { parseLocalDate } = require('../helpers/fechas.helper');
const { Op } = require('sequelize');

/**
 * Determina si un tipo de contrato pertenece al régimen de relación de dependencia
 * según la normativa laboral vigente y la configuración del sistema.
 * 
 * @param {string} tipoContrato - El identificador del tipo de contrato.
 * @returns {boolean} True si es relación de dependencia.
 */
const esRelacionDependencia = (tipoContrato) => {
    const tiposRelacion = [
        'tiempo_indeterminado',
        'periodo_prueba',
        'plazo_fijo',
        'eventual',
        'teletrabajo',
    ];
    return tiposRelacion.includes(tipoContrato);
};

/**
 * Asegura que un valor sea un número válido y finito.
 * Si el valor no es numérico (NaN o Infinity), retorna 0.
 * 
 * @param {any} value - El valor a validar.
 * @returns {number} El número procesado o 0.
 */
const safeNumber = (value) => {
    const num = parseFloat(value);
    return (isNaN(num) || !isFinite(num)) ? 0 : num;
};


/**
 * Obtiene la cantidad de días HÁBILES que coinciden entre un ítem (licencia/vacación) 
 * y el período de liquidación solicitado.
 * 
 * @param {string} fechaInicio - Inicio del período de liquidación (YYYY-MM-DD).
 * @param {string} fechaFin - Fin del período de liquidación (YYYY-MM-DD).
 * @param {string} fechaInicioItem - Inicio del ítem a contrastar.
 * @param {string} fechaFinItem - Fin del ítem a contrastar.
 * @returns {number} Cantidad de días hábiles de intersección.
 */
const getDiasDelPeriodo = (fechaInicio, fechaFin, fechaInicioItem, fechaFinItem) => {
    const { esDiaHabil } = require('../helpers/fechas.helper');

    const inicio = parseLocalDate(fechaInicio);
    const fin = parseLocalDate(fechaFin);
    const itemInicio = parseLocalDate(fechaInicioItem);
    const itemFin = parseLocalDate(fechaFinItem);

    // Calcular intersección de períodos
    const interseccionInicio = itemInicio > inicio ? itemInicio : inicio;
    const interseccionFin = itemFin < fin ? itemFin : fin;

    if (interseccionInicio > interseccionFin) {
        return 0; // No hay intersección
    }

    console.log('=== DEBUG getDiasDelPeriodo ===');
    console.log('Item:', fechaInicioItem, 'al', fechaFinItem);
    console.log('Período:', fechaInicio, 'al', fechaFin);
    console.log('Intersección:', interseccionInicio.toISOString().split('T')[0], 'al', interseccionFin.toISOString().split('T')[0]);

    // Contar solo días hábiles en el período de intersección
    let diasHabiles = 0;
    let cursor = new Date(interseccionInicio);

    while (cursor <= interseccionFin) {
        const fechaStr = cursor.toISOString().split('T')[0];
        const habil = esDiaHabil(fechaStr);
        console.log('  -', fechaStr, habil ? 'HÁBIL ✓' : 'NO HÁBIL ✗');
        if (habil) {
            diasHabiles++;
        }
        cursor.setDate(cursor.getDate() + 1);
    }

    console.log('Total días hábiles:', diasHabiles);
    return diasHabiles;
};

/**
 * Calcula la cantidad de días que integran un semestre específico.
 * Utilizado para el cálculo proporcional del SAC.
 * 
 * @param {string} fechaInicio - Fecha dentro del semestre a evaluar.
 * @returns {number} 181 para el primer semestre, 184 para el segundo.
 */
const getDiasSemestre = (fechaInicio) => {
    const fecha = parseLocalDate(fechaInicio);
    const mes = fecha.getMonth();

    // Junio (mes 5) o Diciembre (mes 11)
    if (mes >= 0 && mes <= 5) {
        // Primer semestre (enero-junio)
        return 181; // Aproximado
    } else {
        // Segundo semestre (julio-diciembre)
        return 184; // Aproximado
    }
};

/**
 * Calcula la cantidad de días efectivamente trabajados en un período.
 * Resta las inasistencias injustificadas del total de días corridos.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<number>} Días trabajados.
 */
const getDiasTrabajados = async (contrato, fechaInicio, fechaFin) => {
    const inicio = parseLocalDate(fechaInicio);
    const fin = parseLocalDate(fechaFin);
    const diffTime = Math.abs(fin - inicio);
    const totalDias = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    // Obtener licencias injustificadas (inasistencias)
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false, // Tanto licencias como inasistencias se marcan como injustificadas
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    return Math.max(0, totalDias - diasInasistencias);
};

/**
 * Retorna el salario básico figurante en el contrato.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @returns {number} Monto básico.
 */
const calcularBasico = (contrato) => {
    return parseFloat(contrato.salario) || 0;
};

/**
 * Calcula el adicional por antigüedad.
 * Regla: 1% por cada año completo cumplido sobre el básico.
 * Si no completa el año, se aplica un proporcional mensual de 0.083%.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaInicio - Fecha de referencia para el cálculo.
 * @returns {number} Monto de antigüedad.
 */
const calcularAntiguedad = (contrato, fechaInicio) => {
    const basico = calcularBasico(contrato);
    const inicioContrato = parseLocalDate(contrato.fechaInicio);
    const fechaCalculo = parseLocalDate(fechaInicio);

    // Calcular meses de antigüedad
    const diffTime = Math.abs(fechaCalculo - inicioContrato);
    const meses = diffTime / (1000 * 60 * 60 * 24 * 30.44); // Promedio de días por mes

    if (meses < 12) {
        // Menos de un año: 0.083% por mes
        return basico * (meses * 0.00083);
    } else {
        // Años completos: 1% por año
        const años = Math.floor(meses / 12);
        return basico * (años * 0.01);
    }
};

/**
 * Calcula el adicional por presentismo.
 * Regla: (Básico + Antigüedad) / 12.
 * Se pierde si el empleado supera el límite de inasistencias injustificadas configurado.
 * 
 * @param {number} basico - Salario básico calculado.
 * @param {number} antiguedad - Monto de antigüedad calculado.
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<number>} Monto de presentismo.
 */
const calcularPresentismo = async (basico, antiguedad, contrato, fechaInicio, fechaFin) => {
    // Obtener límite de ausencias desde parámetros laborales
    let limiteAusencias = 1;
    if (contrato.empleado && contrato.empleado.espacioTrabajoId) {
        const parametro = await ParametroLaboral.findOne({
            where: {
                espacioTrabajoId: contrato.empleado.espacioTrabajoId,
                tipo: 'limite_ausencia_injustificada'
            }
        });
        if (parametro && parametro.valor) {
            limiteAusencias = parseInt(parametro.valor, 10);
            if (isNaN(limiteAusencias)) limiteAusencias = 1;
        }
    } else {
        const parametro = await ParametroLaboral.findOne({
            where: { tipo: 'limite_ausencia_injustificada' }
        });
        if (parametro && parametro.valor) {
            limiteAusencias = parseInt(parametro.valor, 10);
            if (isNaN(limiteAusencias)) limiteAusencias = 1;
        }
    }

    // Obtener inasistencias injustificadas del período
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false, // Tanto licencias como inasistencias se marcan como injustificadas
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    // Si supera el límite, no cobra presentismo
    if (diasInasistencias > limiteAusencias) {
        return 0;
    }

    return (basico + antiguedad) / 12;
};

/**
 * Calcula el monto total de horas extras aprobadas en el período.
 * El jornal horario base incluye Básico + Antigüedad + Presentismo.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} bruto - Bruto base (Basico + Ant + Pres).
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<number>} Total de horas extras.
 */
const calcularHorasExtras = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener horas extras aprobadas del período
    const horasExtrasAprobadas = await HorasExtras.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
        },
    });

    const jornalHorario = bruto / 192;
    let totalHorasExtras = 0;

    for (const horaExtra of horasExtrasAprobadas) {
        // Verificar si la fecha está dentro del período liquidado
        const fechaHE = parseLocalDate(horaExtra.fecha);
        const inicio = parseLocalDate(fechaInicio);
        const fin = parseLocalDate(fechaFin);

        if (fechaHE >= inicio && fechaHE <= fin) {
            const porcentaje = horaExtra.tipoHorasExtra;
            const valorHora = jornalHorario * (1 + porcentaje / 100);
            totalHorasExtras += valorHora * horaExtra.cantidadHoras;
        }
    }

    return totalHorasExtras;
};

/**
 * Calcula el monto correspondiente a días de vacaciones gozadas dentro del período.
 * Utiliza el divisor 25 según normativa legal (Argentina).
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} bruto - Bruto base para el cálculo de vacaciones.
 * @param {string} fechaInicio - Inicio del período de liquidación.
 * @param {string} fechaFin - Fin del período de liquidación.
 * @returns {Promise<number>} Monto por vacaciones.
 */
const calcularVacaciones = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener vacaciones aprobadas
    const vacacionesAprobadas = await Vacaciones.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
            periodo: parseLocalDate(fechaInicio).getFullYear()
        },
    });

    let totalVacaciones = 0;

    for (const vacacion of vacacionesAprobadas) {
        // Calcular días que corresponden a este período
        const diasEnPeriodo = getDiasDelPeriodo(fechaInicio, fechaFin, vacacion.fechaInicio, vacacion.fechaFin);

        console.log('=== CALCULO VACACIONES ===');
        console.log('Período liquidación:', fechaInicio, 'al', fechaFin);
        console.log('Vacación:', vacacion.fechaInicio, 'al', vacacion.fechaFin);
        console.log('Días hábiles en período:', diasEnPeriodo);
        console.log('Monto a liquidar:', (bruto * diasEnPeriodo) / 25);

        if (diasEnPeriodo > 0) {
            totalVacaciones += (bruto * diasEnPeriodo) / 25;
        }
    }

    return totalVacaciones;
};

/**
 * Calcula el Sueldo Anual Complementario (SAC / Aguinaldo).
 * Se liquida en junio (1er semestre) y diciembre (2do semestre).
 * Si el contrato inició luego del comienzo del semestre, se calcula proporcional a días trabajados.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} bruto - Mejor sueldo bruto base del período.
 * @param {string} fechaInicio - Inicio del período de liquidación.
 * @param {string} fechaFin - Fin del período de liquidación.
 * @returns {Promise<number>} Monto del SAC.
 */
const calcularSAC = async (contrato, bruto, fechaInicio, fechaFin) => {
    const inicio = parseLocalDate(fechaInicio);
    const mes = inicio.getMonth();

    // SAC solo se paga en junio (mes 5) y diciembre (mes 11)
    if (mes !== 5 && mes !== 11) {
        return 0;
    }

    const sacCompleto = bruto / 2;

    // Determinar inicio del semestre
    const año = inicio.getFullYear();
    const inicioSemestre = mes === 5
        ? new Date(año, 0, 1) // Enero 1
        : new Date(año, 6, 1); // Julio 1

    const inicioContrato = parseLocalDate(contrato.fechaInicio);

    // Si el contrato comenzó en este semestre, calcular proporcional
    if (inicioContrato > inicioSemestre) {
        const diasTrabajados = await getDiasTrabajados(contrato, contrato.fechaInicio, fechaFin);
        const diasSemestre = getDiasSemestre(fechaInicio);

        if (isNaN(diasTrabajados) || isNaN(diasSemestre) || diasSemestre === 0) {
            return 0;
        }

        return (sacCompleto * diasTrabajados) / diasSemestre;
    }

    return sacCompleto;
};

/**
 * Calcula el monto a descontar por inasistencias injustificadas del período.
 * Basado en el bruto base y divisor 30 para el día jornal.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} bruto - Bruto base para el cálculo del descuento.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<number>} Monto a descontar.
 */
const calcularInasistencias = async (contrato, bruto, fechaInicio, fechaFin) => {
    // Obtener licencias injustificadas (sin goce de sueldo)
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false,
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    return (bruto / 30) * diasInasistencias;
};

/**
 * Calcula las retenciones obligatorias (jubilación, ley 19032, obra social) 
 * basándose en los conceptos configurados como 'deduccion' en la base de datos.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} totalBruto - Monto bruto total sobre el cual aplicar porcentajes.
 * @param {string} tipoContrato - Tipo de contrato para filtrar deducciones específicas.
 * @returns {Promise<object>} Objeto con totalRetenciones y detalleRetenciones.
 */
const calcularRetenciones = async (contrato, totalBruto, tipoContrato) => {
    let whereClause = {
        tipo: 'deduccion',
        activo: true,
    };

    if (contrato.empleado && contrato.empleado.espacioTrabajoId) {
        whereClause.espacioTrabajoId = contrato.empleado.espacioTrabajoId;
    }

    const conceptos = await ConceptoSalarial.findAll({
        where: whereClause,
    });

    let totalRetenciones = 0;
    const detalleRetenciones = [];

    for (const concepto of conceptos) {
        // Para contratos no laborales, solo aplicar Obra Social
        if (!esRelacionDependencia(tipoContrato) && concepto.nombre !== 'Obra Social') {
            continue;
        }

        let monto = 0;
        if (concepto.esPorcentaje) {
            monto = totalBruto * (parseFloat(concepto.valor) / 100);
        } else {
            monto = parseFloat(concepto.valor);
        }

        // Ensure monto is a valid number
        if (isNaN(monto) || !isFinite(monto)) {
            monto = 0;
        }

        totalRetenciones += monto;
        detalleRetenciones.push({
            nombre: concepto.nombre,
            tipo: 'deduccion',
            porcentaje: concepto.esPorcentaje ? concepto.valor : null,
            monto: parseFloat(monto.toFixed(2)),
        });
    }

    // Ensure totalRetenciones is valid
    if (isNaN(totalRetenciones) || !isFinite(totalRetenciones)) {
        totalRetenciones = 0;
    }

    return { totalRetenciones, detalleRetenciones };
};

/**
 * Calcula adicionales remunerativos específicos del espacio de trabajo 
 * configurados como 'remunerativo' en la base de datos.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} totalMontoBase - Base de cálculo para adicionales porcentuales.
 * @returns {Promise<object>} Objeto con totalAdicionales y detalleRemunerativo.
 */
const calcularRemunerativosAdicionales = async (contrato, totalMontoBase) => {
    let whereClause = {
        tipo: 'remunerativo',
        activo: true,
    };

    if (contrato.empleado && contrato.empleado.espacioTrabajoId) {
        whereClause.espacioTrabajoId = contrato.empleado.espacioTrabajoId;
    }

    const conceptos = await ConceptoSalarial.findAll({
        where: whereClause,
    });

    let totalAdicionales = 0;
    const detalleRemunerativo = [];

    for (const concepto of conceptos) {
        let monto = 0;
        if (concepto.esPorcentaje) {
            monto = totalMontoBase * (parseFloat(concepto.valor) / 100);
        } else {
            monto = parseFloat(concepto.valor);
        }

        // Ensure monto is a valid number
        if (isNaN(monto) || !isFinite(monto)) {
            monto = 0;
        }

        totalAdicionales += monto;
        detalleRemunerativo.push({
            nombre: concepto.nombre,
            tipo: 'remunerativo',
            porcentaje: concepto.esPorcentaje ? concepto.valor : null,
            monto: parseFloat(monto.toFixed(2)),
        });
    }

    // Ensure totalAdicionales is valid
    if (isNaN(totalAdicionales) || !isFinite(totalAdicionales)) {
        totalAdicionales = 0;
    }

    return { totalAdicionales, detalleRemunerativo };
};

/**
 * Determina la cantidad de días de vacaciones que corresponden por ley 
 * según la antigüedad del empleado a la fecha de liquidación.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaFinLiquidacion - Fecha de corte para evaluar antigüedad.
 * @returns {Promise<number>} Días de vacaciones correspondientes (14, 21, 28, 35).
 */
const calcularDiasCorrespondientes = async (contrato, fechaFinLiquidacion) => {
    const diasEfectivos = await getDiasTrabajados(contrato, contrato.fechaInicio, fechaFinLiquidacion);

    // Si trabajó menos de la mitad del año
    if (diasEfectivos < 180) {
        return Math.floor(diasEfectivos / 20);
    }

    const inicio = parseLocalDate(contrato.fechaInicio);
    const fecha = parseLocalDate(fechaFinLiquidacion);

    let anios = fecha.getFullYear() - inicio.getFullYear();

    const cumplioEsteAnio =
        fecha.getMonth() > inicio.getMonth() ||
        (fecha.getMonth() === inicio.getMonth() && fecha.getDate() >= inicio.getDate());

    if (!cumplioEsteAnio) {
        anios--;
    }

    // Devolver días según antigüedad (Ley 20.744 Argentina)
    if (anios < 5) return 14;
    if (anios < 10) return 21;
    if (anios < 20) return 28;
    return 35;
}

/**
 * Calcula la indemnización por vacaciones no gozadas.
 * Solo se liquida en el mes de mayo para el período que venció el 30 de abril.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {number} bruto - Bruto base para el cálculo proporcional.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<number>} Monto por vacaciones no gozadas.
 */
const calcularVacacionesNoGozadas = async (contrato, bruto, fechaInicio, fechaFin) => {
    const fecha = parseLocalDate(fechaInicio);
    const mes = fecha.getMonth();
    const año = fecha.getFullYear();

    // Solo calcular en mayo (mes 4), una vez al año
    if (mes !== 4) {
        return 0;
    }

    // Período de vacaciones: 1 mayo año anterior al 30 abril año actual
    const inicioPeriodoVacacional = new Date(año - 1, 4, 1); // Mayo 1 año anterior
    const finPeriodoVacacional = new Date(año, 3, 30); // Abril 30 año actual

    // Obtener vacaciones aprobadas del período vacacional
    const vacacionesAprobadas = await Vacaciones.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            estado: 'aprobada',
            periodo: parseLocalDate(fechaInicio).getFullYear(),
        },
    });

    // Calcular días tomados dentro del período vacacional
    let diasTomados = 0;
    for (const vacacion of vacacionesAprobadas) {
        diasTomados += getDiasDelPeriodo(
            inicioPeriodoVacacional.toISOString().split('T')[0],
            finPeriodoVacacional.toISOString().split('T')[0],
            vacacion.fechaInicio,
            vacacion.fechaFin
        );
    }

    // Días de vacaciones según antigüedad (Argentina)
    const diasCorrespondientes = await calcularDiasCorrespondientes(contrato, fechaFin);

    const diasNoGozados = Math.max(0, diasCorrespondientes - diasTomados);

    console.log('=== VACACIONES NO GOZADAS ===');
    console.log('Período vacacional:', inicioPeriodoVacacional.toISOString().split('T')[0], 'al', finPeriodoVacacional.toISOString().split('T')[0]);
    console.log('Días correspondientes según antigüedad:', diasCorrespondientes);
    console.log('Días tomados en el período:', diasTomados);
    console.log('Días no gozados:', diasNoGozados);
    console.log('Bruto:', bruto);
    console.log('Monto a pagar:', (bruto * diasNoGozados) / 25);

    if (diasNoGozados === 0) {
        return 0;
    }

    return (bruto * diasNoGozados) / 25;
};

/**
 * Orquestador principal para el cálculo de liquidaciones en REGIMEN LABORAL.
 * Suma todos los conceptos remunerativos y resta retenciones.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<object>} Objeto detallado con todos los conceptos calculados.
 */
const calcularRemunerativos = async (contrato, fechaInicio, fechaFin) => {

    const basico = calcularBasico(contrato);
    const antiguedad = calcularAntiguedad(contrato, fechaInicio);
    const presentismo = await calcularPresentismo(basico, antiguedad, contrato, fechaInicio, fechaFin);
    const bruto = basico + antiguedad + presentismo;

    const horasExtras = await calcularHorasExtras(contrato, bruto, fechaInicio, fechaFin);
    const vacaciones = await calcularVacaciones(contrato, bruto, fechaInicio, fechaFin);
    const sac = await calcularSAC(contrato, bruto, fechaInicio, fechaFin);
    const inasistencias = await calcularInasistencias(contrato, bruto, fechaInicio, fechaFin);

    // Conceptos adicionales remunerativos calculados sobre el bruto base
    const { totalAdicionales, detalleRemunerativo } = await calcularRemunerativosAdicionales(contrato, bruto);

    // Total Bruto es la suma de todo lo remunerativo menos las inasistencias
    const totalBruto = bruto + horasExtras + vacaciones + sac + totalAdicionales - inasistencias;

    const { totalRetenciones, detalleRetenciones } = await calcularRetenciones(contrato, totalBruto, contrato.tipoContrato);
    const vacacionesNoGozadas = await calcularVacacionesNoGozadas(contrato, bruto, fechaInicio, fechaFin);

    const neto = totalBruto - totalRetenciones + vacacionesNoGozadas;

    return {
        basico: safeNumber(basico),
        antiguedad: safeNumber(antiguedad),
        presentismo: safeNumber(presentismo),
        horasExtras: safeNumber(horasExtras),
        vacaciones: safeNumber(vacaciones),
        sac: safeNumber(sac),
        inasistencias: safeNumber(inasistencias),
        totalBruto: safeNumber(totalBruto),
        totalRetenciones: safeNumber(totalRetenciones),
        vacacionesNoGozadas: safeNumber(vacacionesNoGozadas),
        neto: safeNumber(neto),
        detalleRemunerativo,
        detalleRetenciones,
    };
};

/**
 * Orquestador para el cálculo de liquidaciones en REGIMEN NO LABORAL (Pasantías/Educativos).
 * No incluye conceptos de antigüedad, SAC o vacaciones, pero sí obra social.
 * 
 * @param {object} contrato - Instancia del contrato.
 * @param {string} fechaInicio - Inicio del período.
 * @param {string} fechaFin - Fin del período.
 * @returns {Promise<object>} Objeto con conceptos simplificados para pasantías.
 */
const calcularNoLaborales = async (contrato, fechaInicio, fechaFin) => {
    const basico = calcularBasico(contrato);

    // Obtener inasistencias del período
    const licencias = await Licencia.findAll({
        include: [{
            model: Solicitud,
            as: 'solicitud',
            where: {
                contratoId: contrato.id,
                activo: true,
            },
        }],
        where: {
            //esLicencia: false,
            estado: 'injustificada',
        },
    });

    let diasInasistencias = 0;
    for (const licencia of licencias) {
        diasInasistencias += getDiasDelPeriodo(fechaInicio, fechaFin, licencia.fechaInicio, licencia.fechaFin);
    }

    // Descuento: Salario base / 80 horas mensuales × cantidad de inasistencias
    const descuentoInasistencias = (basico / 80) * diasInasistencias;

    // A diferencia de los laborales, para los no laborales también calculamos adicionales sobre el básico
    const { totalAdicionales, detalleRemunerativo } = await calcularRemunerativosAdicionales(contrato, basico);

    const totalBruto = basico + totalAdicionales - descuentoInasistencias;

    // Solo Obra Social para no laborales
    const { totalRetenciones, detalleRetenciones } = await calcularRetenciones(contrato, totalBruto, contrato.tipoContrato);

    const neto = totalBruto - totalRetenciones;

    return {
        basico: safeNumber(basico),
        antiguedad: 0,
        presentismo: 0,
        horasExtras: 0,
        vacaciones: 0,
        sac: 0,
        inasistencias: safeNumber(descuentoInasistencias),
        totalBruto: safeNumber(totalBruto),
        totalRetenciones: safeNumber(totalRetenciones),
        vacacionesNoGozadas: 0,
        neto: safeNumber(neto),
        detalleRemunerativo,
        detalleRetenciones,
    };
};

/**
 * Punto de entrada principal para el cálculo de una liquidación.
 * Deriva el cálculo según el tipo de contrato del empleado.
 * 
 * @param {object} contrato - Instancia del contrato cargada con el empleado.
 * @param {string} fechaInicio - Fecha de inicio del período (YYYY-MM-DD).
 * @param {string} fechaFin - Fecha de fin del período (YYYY-MM-DD).
 * @returns {Promise<object>} Datos completos de la liquidación calculada.
 */
const calcularLiquidacionContrato = async (contrato, fechaInicio, fechaFin) => {
    if (esRelacionDependencia(contrato.tipoContrato)) {
        return await calcularRemunerativos(contrato, fechaInicio, fechaFin);
    } else {
        return await calcularNoLaborales(contrato, fechaInicio, fechaFin);
    }
};

module.exports = {
    calcularLiquidacionContrato,
    esRelacionDependencia,
    calcularBasico,
    calcularAntiguedad,
    calcularPresentismo,
    calcularHorasExtras,
    calcularVacaciones,
    calcularSAC,
    calcularInasistencias,
    calcularRetenciones,
    calcularVacacionesNoGozadas,
    getDiasDelPeriodo,
    getDiasSemestre,
    getDiasTrabajados,
};

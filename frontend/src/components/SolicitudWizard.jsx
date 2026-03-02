/**
 * @fileoverview Orquestador multi-paso para la creación y edición de cualquier tipo de solicitud.
 * @module components/SolicitudWizard
 */

import { useState, useEffect } from 'react';
import Select from 'react-select';
import StepTracker from './StepTracker';
import { getContratos, getRegistrosSalud, createSolicitud, updateSolicitud, getDiasDisponiblesVacaciones, getDiasSolicitadosVacaciones } from '../services/api';
import { validarDiaHabil, esDiaHabilSincrono } from '../helpers/diasHabiles';
import { getTodayStr, formatFullName } from '../helpers/formatters';
import { useIsDark } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

// Constants
const TIPOS_SOLICITUD = [
    { value: 'vacaciones', label: 'Vacaciones' },
    { value: 'licencia', label: 'Licencia / Inasistencia' },
    { value: 'horas_extras', label: 'Horas Extras' },
    { value: 'renuncia', label: 'Renuncia' },
];

const TIPOS_RELACION_DEPENDENCIA = [
    'tiempo_indeterminado',
    'periodo_prueba',
    'plazo_fijo',
    'eventual',
    'teletrabajo'
];

const MOTIVOS_LEGALES = [
    { value: 'matrimonio', label: 'Matrimonio (LCT Art. 168)' },
    { value: 'nacimiento_hijo', label: 'Nacimiento de hijo (Paternidad)' },
    { value: 'fallecimiento_conyugue_hijo_padres', label: 'Fallecimiento de cÃ³nyuge, hijo o padres' },
    { value: 'fallecimiento_hermano', label: 'Fallecimiento de hermano' },
    { value: 'examen_estudio', label: 'Examen / Estudio' },
    { value: 'accidente_trabajo_art', label: 'Accidente de trabajo / Enfermedad profesional (ART)' },
    { value: 'enfermedad_inculpable', label: 'Enfermedad inculpable' },
    { value: 'maternidad', label: 'Maternidad' },
    { value: 'excedencia', label: 'Estado de excedencia' },
    { value: 'donacion_sangre', label: 'DonaciÃ³n de sangre' },
    { value: 'citacion_judicial', label: 'CitaciÃ³n judicial' },
    { value: 'presidente_mesa', label: 'Presidente de mesa (electoral)' },
    { value: 'mudanza', label: 'Mudanza' },
    { value: 'cumpleanos', label: 'DÃ­a de cumpleaÃ±os' },
    { value: 'tramites_personales', label: 'TrÃ¡mites personales' },
    { value: 'compensatorio_franco', label: 'Compensatorio / Franco' },
];

const MOTIVOS_SALUD = ['accidente_trabajo_art', 'enfermedad_inculpable'];

const TIPO_EXAMEN_LABELS = {
    pre_ocupacional: 'Pre-ocupacional',
    periodico: 'PeriÃ³dico',
    post_ocupacional: 'Post-ocupacional',
    retorno_trabajo: 'Retorno al trabajo',
};

const ESTADOS_LICENCIA = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'justificada', label: 'Justificada' },
    { value: 'injustificada', label: 'Injustificada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_VACACIONES = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_HORAS_EXTRAS = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aprobada', label: 'Aprobada' },
    { value: 'rechazada', label: 'Rechazada' },
];

const ESTADOS_RENUNCIA = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'aceptada', label: 'Aceptada' },
    { value: 'procesada', label: 'Procesada' },
];

const TIPOS_HORAS_EXTRA = [
    { value: '50', label: '50% (dÃ­as hÃ¡biles)' },
    { value: '100', label: '100% (fines de semana / feriados)' },
];

const TOOLTIP_VACACIONES = `SegÃºn la **Ley de Contrato de Trabajo de Argentina (LCT)**, los dÃ­as de vacaciones se determinan por la antigÃ¼edad del trabajador:

â€¢ Hasta 5 aÃ±os de antigÃ¼edad: **14 dÃ­as corridos**
â€¢ MÃ¡s de 5 y hasta 10 aÃ±os: **21 dÃ­as corridos**
â€¢ MÃ¡s de 10 y hasta 20 aÃ±os: **28 dÃ­as corridos**
â€¢ MÃ¡s de 20 aÃ±os: **35 dÃ­as corridos**

Si el trabajador no hubiere prestado servicios durante la mitad de los dÃ­as hÃ¡biles del aÃ±o calendario, tendrÃ¡ derecho a **1 dÃ­a de vacaciones por cada 20 dÃ­as de trabajo efectivo**. 

Los dÃ­as se calculan como dÃ­as hÃ¡biles (excluyendo fines de semana y feriados nacionales).`;

const TOOLTIP_RENUNCIA = `SegÃºn la Ley de Contrato de Trabajo de Argentina (LCT), el **preaviso** es obligatorio y debe ser de 15 dÃ­as, con el fin de que la empresa busque reemplazo.`;

/**
 * Componente interno de error de campo.
 * 
 * @param {Object} props - Propiedades.
 * @param {string} [props.message] - Mensaje de error.
 */
const FieldError = ({ message }) => {
    if (!message) return null;
    return <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>{message}</span>;
};



// Helper to format decimal hours (e.g., 2.50) to human readable time (e.g., 2:30)
const formatDecimalToTime = (decimalValue) => {
    if (!decimalValue || isNaN(decimalValue)) return '0:00 hs';
    const totalMinutes = Math.round(parseFloat(decimalValue) * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${minutes.toString().padStart(2, '0')} hs`;
};

/**
 * Componente SolicitudWizard
 * 
 * Gestiona el proceso de alta y modificación de solicitudes, 
 * incluyendo validaciones de días hábiles, cálculo de vacaciones
 * y adjunto de comprobantes según el tipo.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Object} [props.solicitud] - Objeto solicitud a editar.
 * @param {Function} props.onClose - Callback para cerrar el asistente.
 * @param {Function} props.onSuccess - Callback tras guardar exitosamente.
 * @returns {JSX.Element}
 */
const SolicitudWizard = ({ solicitud, onClose, onSuccess }) => {
    const isEditing = !!solicitud;
    const [currentStep, setCurrentStep] = useState(isEditing ? 2 : 1);
    const [contratos, setContratos] = useState([]);
    const [loadingContratos, setLoadingContratos] = useState(true);
    const isDark = useIsDark();

    const [selectedContrato, setSelectedContrato] = useState(null);
    const [selectedTipo, setSelectedTipo] = useState('');

    const [formData, setFormData] = useState({
        fecha: getTodayStr(),
        fechaInicio: getTodayStr(),
        fechaNotificacion: getTodayStr()
    });

    const getAvailableTipos = () => {
        if (!selectedContrato) return TIPOS_SOLICITUD;
        const tipoContrato = selectedContrato.contrato?.tipoContrato;
        const esRelacionDependencia = TIPOS_RELACION_DEPENDENCIA.includes(tipoContrato);
        if (esRelacionDependencia) return TIPOS_SOLICITUD;
        return TIPOS_SOLICITUD.filter(tipo => tipo.value === 'licencia');
    };

    // Reset selectedTipo if it's no longer available for the new contract
    useEffect(() => {
        if (selectedContrato && selectedTipo) {
            const disponibles = getAvailableTipos().map(t => t.value);
            if (!disponibles.includes(selectedTipo)) {
                setSelectedTipo('');
                setFormData(prev => ({ ...prev, tipoSolicitud: '' }));
            }
        }
    }, [selectedContrato]);
    const [touched, setTouched] = useState({});
    const [fieldErrors, setFieldErrors] = useState({});
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showTooltipVacaciones, setShowTooltipVacaciones] = useState(false);
    const [showTooltipRenuncia, setShowTooltipRenuncia] = useState(false);

    // Registros de salud para licencias ART/enfermedad
    const [registrosSalud, setRegistrosSalud] = useState([]);
    const [loadingRegistros, setLoadingRegistros] = useState(false);

    const steps = [
        { number: 1, title: 'Tipo de Solicitud' },
        { number: 2, title: 'Datos de la Solicitud' },
    ];

    // Obtener contratos disponibles
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoadingContratos(true);
                const result = await getContratos({ activo: 'true', estado: 'en_curso', limit: 1000 });
                setContratos(result.data);
            } catch (err) {
                console.error('Error loading contratos:', err);
            } finally {
                setLoadingContratos(false);
            }
        };
        loadData();
    }, []);

    const contratoOptions = Object.values(contratos.reduce((acc, contrato) => {
        const wsName = contrato.empleado?.espacioTrabajo?.nombre || 'Sin Espacio';
        if (!acc[wsName]) acc[wsName] = { label: wsName, options: [] };

        const nombreEmpleado = formatFullName(contrato.empleado);
        const puesto = contrato.puestos && contrato.puestos.length > 0 ? contrato.puestos[0].nombre : 'Sin puesto';
        const empresa = contrato.puestos && contrato.puestos.length > 0 && contrato.puestos[0].departamento?.area?.empresa?.nombre;
        const label = `${nombreEmpleado} - ${puesto}${empresa ? ` (${empresa})` : ''}`;

        acc[wsName].options.push({
            value: contrato.id,
            label: label,
            contrato: contrato
        });
        return acc;
    }, {}));

    // Helper to find option for editing or initial values
    const findContratoOption = (id) => {
        for (const group of contratoOptions) {
            const found = group.options.find(opt => opt.value === id);
            if (found) return found;
        }
        return null;
    };

    // Initialize form
    useEffect(() => {
        if (solicitud) {
            const tipo = solicitud.tipoSolicitud;
            // The association might be named 'horasExtras' (camelCase) while tipo is 'horas_extras' (snake_case)
            // Checking all possible keys is the safest way to find the data sub-object
            const subData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia || solicitud[tipo] || {};

            // Normalize dates to YYYY-MM-DD
            const normalizeDate = (d) => {
                if (!d) return '';
                if (typeof d === 'string' && d.includes('T')) return d.split('T')[0];
                return d;
            };

            const baseData = {
                contratoId: solicitud.contratoId || '',
                tipoSolicitud: tipo || '',
                // Combine top-level and sub-data, prioritizing top-level for base fields
                fechaInicio: normalizeDate(solicitud.fechaInicio || subData.fechaInicio),
                fechaFin: normalizeDate(solicitud.fechaFin || subData.fechaFin),
                motivo: solicitud.motivo || subData.motivo || '',
                descripcion: solicitud.descripcion || subData.descripcion || '',
                documentos: solicitud.documentos || subData.documentos || [],
                estado: subData.estado || 'pendiente',
                fechaSolicitud: normalizeDate(solicitud.fechaSolicitud || getTodayStr()),
                diasHabiles: solicitud.diasHabiles || 0,

                // Fields from sub-objects
                // Licencia
                esLicencia: subData.esLicencia,
                motivoLegal: subData.motivoLegal,
                registroSaludId: subData.registroSaludId,
                urlJustificativo: subData.urlJustificativo,
                diasSolicitados: subData.diasSolicitud || subData.diasSolicitados,

                // Vacaciones
                periodo: subData.periodo,
                diasCorrespondientes: subData.diasCorrespondientes,
                diasTomados: subData.diasTomados,
                diasDisponibles: subData.diasDisponibles,
                diasSolicitud: subData.diasSolicitud,
                fechaRegreso: normalizeDate(subData.fechaRegreso),
                notificadoEl: normalizeDate(subData.notificadoEl),

                // Horas Extras
                fecha: normalizeDate(subData.fecha),
                horaInicio: subData.horaInicio || '',
                horaFin: subData.horaFin || '',
                tipoHorasExtra: subData.tipoHorasExtra ? String(subData.tipoHorasExtra) : '',
                cantidadHoras: subData.cantidadHoras || 0,

                // Renuncia
                fechaNotificacion: normalizeDate(subData.fechaNotificacion),
                fechaBajaEfectiva: normalizeDate(subData.fechaBajaEfectiva),
                urlComprobante: subData.urlComprobante,
                preaviso: subData.preaviso
            };

            setFormData(baseData);
            setSelectedTipo(tipo);

            if (solicitud.contrato) {
                const c = solicitud.contrato;
                const nombre = formatFullName(c.empleado);
                const puesto = c.puestos?.[0]?.nombre || 'Sin puesto';
                const empresa = c.puestos?.[0]?.departamento?.area?.empresa?.nombre;
                setSelectedContrato({
                    value: c.id,
                    label: `${nombre} - ${puesto}${empresa ? ` (${empresa})` : ''}`,
                    contrato: c
                });
            }
        }
    }, [solicitud]);

    // Auto-select Horas Extras type when selected
    useEffect(() => {
        if (selectedTipo === 'horas_extras' && formData.fecha) {
            setFormData(prev => ({
                ...prev,
                tipoHorasExtra: esDiaHabilSincrono(formData.fecha) ? '50' : '100'
            }));
        }
    }, [selectedTipo, formData.fecha]);

    // Cargar informaciÃ³n de vacaciones (dÃ­as disponibles, correspondientes, tomados)
    useEffect(() => {
        const loadVacationInfo = async () => {
            if (selectedTipo === 'vacaciones' && selectedContrato?.value && formData.periodo) {
                try {
                    const result = await getDiasDisponiblesVacaciones(selectedContrato.value, formData.periodo);
                    if (result) {
                        setFormData(prev => ({
                            ...prev,
                            diasCorrespondientes: result.diasCorrespondientes,
                            diasTomados: result.diasTomados,
                            diasDisponibles: result.diasDisponibles
                        }));
                    }
                } catch (err) {
                    console.error('Error loading vacation info:', err);
                }
            }
        };
        loadVacationInfo();
    }, [selectedTipo, selectedContrato, formData.periodo]);

    // Calcular dÃ­as solicitados y fecha de regreso (Vacaciones y Licencias)
    useEffect(() => {
        const calculateDays = async () => {
            if (!formData.fechaInicio || !formData.fechaFin) return;

            const inicio = new Date(formData.fechaInicio);
            const fin = new Date(formData.fechaFin);
            if (fin < inicio) return;

            if (selectedTipo === 'vacaciones') {
                try {
                    const result = await getDiasSolicitadosVacaciones(formData.fechaInicio, formData.fechaFin);
                    if (result) {
                        setFormData(prev => ({
                            ...prev,
                            diasSolicitud: result.diasSolicitud,
                            fechaRegreso: result.fechaRegreso
                        }));
                    }
                } catch (err) {
                    console.error('Error loading requested days:', err);
                }
            } else if (selectedTipo === 'licencia') {
                const diffTime = Math.abs(fin - inicio);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                setFormData(prev => ({
                    ...prev,
                    diasSolicitud: diffDays, // Usar diasSolicitud para unificar con vacaciones
                }));
            }
        };
        calculateDays();
    }, [formData.fechaInicio, formData.fechaFin, selectedTipo]);

    // Load registros de salud when motivo requires it
    useEffect(() => {
        const loadRegistros = async () => {
            // selectedContrato.contrato.empleado.id es la estructura correcta
            const empleadoId = selectedContrato?.contrato?.empleado?.id;
            if (selectedTipo === 'licencia' && MOTIVOS_SALUD.includes(formData.motivoLegal) && empleadoId) {
                try {
                    setLoadingRegistros(true);
                    // Solo filtrar por empleadoId, activo y VIGENTE
                    const result = await getRegistrosSalud({ empleadoId, activo: 'true', vigente: 'true', limit: 100 });
                    setRegistrosSalud(result.data || []);
                } catch (err) {
                    console.error('Error loading registros:', err);
                    setRegistrosSalud([]);
                } finally {
                    setLoadingRegistros(false);
                }
            } else {
                setRegistrosSalud([]);
            }
        };
        loadRegistros();
    }, [formData.motivoLegal, selectedTipo, selectedContrato]);



    const handleChange = (field, value) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };

            // Logic for Horas Extras
            if (selectedTipo === 'horas_extras') {
                // Auto-calculate duration
                if (field === 'horaInicio' || field === 'horaFin') {
                    const inicio = field === 'horaInicio' ? value : prev.horaInicio;
                    const fin = field === 'horaFin' ? value : prev.horaFin;
                    if (inicio && fin) {
                        const [h1, m1] = inicio.split(':').map(Number);
                        const [h2, m2] = fin.split(':').map(Number);
                        const diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                        if (diff > 0) {
                            newData.cantidadHoras = (diff / 60).toFixed(2);
                        } else {
                            newData.cantidadHoras = '0.00';
                        }
                    }
                }

                // Auto-select Type based on Date
                if (field === 'fecha' && value) {
                    const esHabil = esDiaHabilSincrono(value);
                    newData.tipoHorasExtra = esHabil ? '50' : '100';
                }
            }

            // Logic for Licencia
            if (selectedTipo === 'licencia') {
                if (field === 'motivoLegal' && !MOTIVOS_SALUD.includes(value)) {
                    newData.registroSaludId = null;
                }
            }

            return newData;
        });
        setError('');

        // Validar dÃ­a hÃ¡bil en tiempo real SÃNCRONO
        const camposFecha = ['fechaInicio', 'fechaFin', 'fecha', 'fechaNotificacion', 'fechaBajaEfectiva', 'notificadoEl'];
        const esHorasExtrasFecha = selectedTipo === 'horas_extras' && field === 'fecha';

        if (camposFecha.includes(field) && value && !esHorasExtrasFecha) {
            try {
                const nombresCampos = {
                    fechaInicio: 'La fecha de inicio',
                    fechaFin: 'La fecha de fin',
                    fecha: 'La fecha',
                    fechaNotificacion: 'La fecha de notificaciÃ³n',
                    fechaBajaEfectiva: 'La fecha de baja',
                    notificadoEl: 'La fecha de notificaciÃ³n'
                };
                validarDiaHabil(value, nombresCampos[field]); // âœ… SÃ­ncrono
                setFieldErrors(prev => ({ ...prev, [field]: null }));
            } catch (error) {
                setFieldErrors(prev => ({ ...prev, [field]: error.message }));
                setTouched(prev => ({ ...prev, [field]: true })); // Marcar como touched para mostrar error
            }
        } else if (esHorasExtrasFecha) {
            // Limpiar error de dÃ­a hÃ¡bil si existiera (aunque ya no se valida)
            setFieldErrors(prev => ({ ...prev, [field]: null }));
        }

        if (touched[field]) {
            validateStep2();
        }
    };

    const handleBlur = (field) => {
        setTouched(prev => ({ ...prev, [field]: true }));
        validateStep2();
    };

    const isReadOnly = () => {
        if (!isEditing) return false;
        const typeData = solicitud.licencia || solicitud.vacaciones || solicitud.horasExtras || solicitud.renuncia;
        return typeData?.estado !== 'pendiente';
    };

    const validateStep1 = () => {
        const errors = {};
        if (!selectedContrato) errors.contrato = 'Debe seleccionar un contrato';
        if (!selectedTipo) errors.tipoSolicitud = 'Debe seleccionar un tipo de solicitud';

        setFieldErrors(prev => ({ ...prev, ...errors })); // Preservar errores existentes
        if (Object.keys(errors).length > 0) {
            setTouched({ contrato: true, tipoSolicitud: true });
            setError('Por favor complete todos los campos obligatorios');
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        const errors = {};
        const today = getTodayStr();

        if (selectedTipo === 'licencia') {
            if (!formData.motivoLegal) errors.motivoLegal = 'El motivo legal es requerido';
            if (!formData.fechaInicio) errors.fechaInicio = 'La fecha de inicio es requerida';
            if (!formData.fechaFin) errors.fechaFin = 'La fecha de fin es requerida';
            if (formData.fechaFin && formData.fechaInicio && formData.fechaFin < formData.fechaInicio) {
                errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
            }
            if (formData.descripcion && formData.descripcion.length > 500) {
                errors.descripcion = 'La descripciÃ³n no puede exceder los 500 caracteres';
            }
        } else if (selectedTipo === 'vacaciones') {
            if (!formData.periodo) errors.periodo = 'El perÃ­odo es requerido';
            if (!formData.fechaInicio) errors.fechaInicio = 'La fecha de inicio es requerida';
            if (!formData.fechaFin) errors.fechaFin = 'La fecha de fin es requerida';
            // Today IS valid - only reject strictly past dates
            if (formData.fechaInicio && formData.fechaInicio < today && !isEditing) {
                errors.fechaInicio = 'La fecha de inicio no puede ser anterior a hoy';
            }
            if (formData.fechaFin && formData.fechaInicio && formData.fechaFin < formData.fechaInicio) {
                errors.fechaFin = 'La fecha de fin no puede ser anterior a la de inicio';
            }

            // Validar rango por perÃ­odo (1 de Mayo aÃ±o X al 30 de Abril aÃ±o X+1)
            if (formData.periodo && (formData.fechaInicio || formData.fechaFin)) {
                const anio = parseInt(formData.periodo);
                const minFecha = `${anio}-05-01`;
                const maxFecha = `${anio + 1}-04-30`;

                if (formData.fechaInicio && (formData.fechaInicio < minFecha || formData.fechaInicio > maxFecha)) {
                    errors.fechaInicio = `Para el perÃ­odo ${anio}, la fecha debe ser entre el 01/05/${anio} y el 30/04/${anio + 1}`;
                }
                if (formData.fechaFin && (formData.fechaFin < minFecha || formData.fechaFin > maxFecha)) {
                    errors.fechaFin = `Para el perÃ­odo ${anio}, la fecha debe ser entre el 01/05/${anio} y el 30/04/${anio + 1}`;
                }
            }

            if (formData.diasSolicitud && formData.diasDisponibles && formData.diasSolicitud > formData.diasDisponibles) {
                errors.fechaFin = `Los dÃ­as solicitados (${formData.diasSolicitud}) exceden los disponibles (${formData.diasDisponibles})`;
            }
            if (formData.descripcion && formData.descripcion.length > 500) {
                errors.descripcion = 'La descripciÃ³n no puede exceder los 500 caracteres';
            }
        } else if (selectedTipo === 'horas_extras') {
            if (!formData.fecha) errors.fecha = 'La fecha es requerida';
            if (formData.fecha && formData.fecha > today) {
                errors.fecha = 'La fecha no puede ser posterior a hoy';
            }
            if (!formData.horaInicio) errors.horaInicio = 'La hora de inicio es requerida';
            if (!formData.horaFin) errors.horaFin = 'La hora de fin es requerida';
            if (formData.horaInicio && formData.horaFin && formData.horaFin <= formData.horaInicio) {
                errors.horaFin = 'La hora de fin debe ser posterior a la de inicio';
            }
            if (!formData.tipoHorasExtra) errors.tipoHorasExtra = 'El tipo es requerido';
            if (formData.motivo && formData.motivo.length > 500) {
                errors.motivo = 'El motivo no puede exceder los 500 caracteres';
            }
        } else if (selectedTipo === 'renuncia') {
            // Usar valor de formData o valor por defecto (hoy)
            const fechaNot = formData.fechaNotificacion || getTodayStr();
            if (!fechaNot) errors.fechaNotificacion = 'La fecha de notificaciÃ³n es requerida';
            if (formData.motivo && formData.motivo.length > 500) {
                errors.motivo = 'El motivo no puede exceder los 500 caracteres';
            }
        }

        // Preservar solo los errores de dÃ­as hÃ¡biles de campos que NO estÃ¡n siendo validados ahora
        const allErrors = setFieldErrors(prev => {
            const camposFecha = ['fechaInicio', 'fechaFin', 'fecha', 'fechaNotificacion', 'fechaBajaEfectiva', 'notificadoEl'];
            const erroresDiasHabiles = {};

            // Preservar solo errores de dÃ­as hÃ¡biles en campos de fecha
            camposFecha.forEach(campo => {
                if (prev[campo] && prev[campo].includes('dÃ­a hÃ¡bil')) {
                    erroresDiasHabiles[campo] = prev[campo];
                }
            });

            // Combinar: errores de la validaciÃ³n actual + errores de dÃ­as hÃ¡biles preservados
            const combined = { ...erroresDiasHabiles, ...errors };
            return combined;
        });

        // Retornar false si hay CUALQUIER error (validaciÃ³n bÃ¡sica O dÃ­as hÃ¡biles)
        return Object.keys(errors).length === 0 && !Object.values(fieldErrors).some(err => err !== null);
    };

    const nextStep = () => {
        if (validateStep1()) {
            setCurrentStep(2);
            setError('');
            setTouched({});
            setFieldErrors({});
        }
    };

    const prevStep = () => setCurrentStep(1);

    const handleSubmit = async () => {
        // Mark all Step 2 fields as touched
        const step2Fields = selectedTipo === 'licencia'
            ? ['motivoLegal', 'fechaInicio', 'fechaFin']
            : selectedTipo === 'vacaciones'
                ? ['periodo', 'fechaInicio', 'fechaFin']
                : selectedTipo === 'horas_extras'
                    ? ['fecha', 'horaInicio', 'horaFin', 'tipoHorasExtra']
                    : ['fechaNotificacion'];

        setTouched(step2Fields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));

        if (!validateStep2()) {
            setError('Por favor complete todos los campos obligatorios');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                contratoId: selectedContrato.value,
                tipoSolicitud: selectedTipo,
                ...formData,
            };

            // Asegurar que fechaNotificacion tenga valor por defecto para renuncia
            if (selectedTipo === 'renuncia' && !payload.fechaNotificacion) {
                payload.fechaNotificacion = getTodayStr();
            }

            if (isEditing) {
                await updateSolicitud(solicitud.id, payload);
            } else {
                await createSolicitud(payload);
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
            <div className="form-group">
                <label className="form-label">Contrato *</label>
                {loadingContratos ? (
                    <div className="form-input" style={{ display: 'flex', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Cargando contratos...
                    </div>
                ) : (
                    <Select
                        options={contratoOptions}
                        value={selectedContrato}
                        onChange={setSelectedContrato}
                        onBlur={() => setTouched(prev => ({ ...prev, contrato: true }))}
                        placeholder="Buscar contrato por empleado..."
                        noOptionsMessage={() => "No se encontraron contratos"}
                        styles={buildSelectStyles(isDark)}
                        isDisabled={isEditing}
                        isClearable={!isEditing}
                        formatGroupLabel={data => (
                            <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', color: '#64748b' }}>
                                {data.label}
                            </div>
                        )}
                    />
                )}
                <FieldError message={touched.contrato && fieldErrors.contrato} />
            </div>

            <div className="form-group">
                <label className="form-label">Tipo de Solicitud *</label>
                <select
                    className={`form-input ${touched.tipoSolicitud && fieldErrors.tipoSolicitud ? 'input-error' : ''}`}
                    value={selectedTipo}
                    onChange={e => setSelectedTipo(e.target.value)}
                    onBlur={() => setTouched(prev => ({ ...prev, tipoSolicitud: true }))}
                    disabled={isEditing}
                >
                    <option value="">Seleccionar tipo de solicitud</option>
                    {getAvailableTipos().map(tipo => (
                        <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                </select>
                <FieldError message={touched.tipoSolicitud && fieldErrors.tipoSolicitud} />
            </div>
        </div>
    );

    const renderLicenciaForm = () => {
        const requiresSalud = MOTIVOS_SALUD.includes(formData.motivoLegal);

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">Tipo *</label>
                        <select
                            className="form-input"
                            value={formData.esLicencia !== false ? 'true' : 'false'}
                            onChange={e => handleChange('esLicencia', e.target.value === 'true')}
                            disabled={isReadOnly()}
                        >
                            <option value="true">Licencia</option>
                            <option value="false">Inasistencia</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Motivo Legal *</label>
                        <select
                            className={`form-input ${touched.motivoLegal && fieldErrors.motivoLegal ? 'input-error' : ''}`}
                            value={formData.motivoLegal || ''}
                            onChange={e => handleChange('motivoLegal', e.target.value)}
                            onBlur={() => handleBlur('motivoLegal')}
                            disabled={isReadOnly()}
                        >
                            <option value="">Seleccionar...</option>
                            {MOTIVOS_LEGALES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                        </select>
                        <FieldError message={touched.motivoLegal && fieldErrors.motivoLegal} />
                    </div>
                </div>

                {requiresSalud && (
                    <div className="form-group">
                        <label className="form-label">Registro de Salud</label>
                        <select
                            className="form-input"
                            value={formData.registroSaludId || ''}
                            onChange={e => handleChange('registroSaludId', e.target.value ? parseInt(e.target.value) : null)}
                            disabled={isReadOnly() || loadingRegistros}
                        >
                            <option value="">Seleccionar registro de salud...</option>
                            {registrosSalud.map(r => (
                                <option key={r.id} value={r.id}>
                                    {TIPO_EXAMEN_LABELS[r.tipoExamen] || r.tipoExamen} - {r.fechaRealizacion ? new Date(r.fechaRealizacion + 'T00:00:00').toLocaleDateString('es-AR') : 'Sin fecha'}
                                </option>
                            ))}
                        </select>
                        {loadingRegistros && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Cargando registros...</span>}
                        {!loadingRegistros && registrosSalud.length === 0 && (
                            <span style={{ fontSize: '0.75rem', color: '#f59e0b' }}>No hay registros de salud para este empleado</span>
                        )}
                    </div>
                )}

                <div className="form-grid-stacked-3">
                    <div className="form-group">
                        <label className="form-label">Fecha Inicio *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaInicio && fieldErrors.fechaInicio ? 'input-error' : ''}`}
                            value={formData.fechaInicio || ''}
                            onChange={e => handleChange('fechaInicio', e.target.value)}
                            onBlur={() => handleBlur('fechaInicio')}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaInicio && fieldErrors.fechaInicio} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Fin *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaFin && fieldErrors.fechaFin ? 'input-error' : ''}`}
                            value={formData.fechaFin || ''}
                            onChange={e => handleChange('fechaFin', e.target.value)}
                            onBlur={() => handleBlur('fechaFin')}
                            min={formData.fechaInicio || ''}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaFin && fieldErrors.fechaFin} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">DÃ­as Solicitados</label>
                        <input
                            type="number"
                            className="form-input"
                            value={formData.diasSolicitud || 0}
                            disabled
                        />
                    </div>
                </div>

                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">URL Justificativo</label>
                        <input
                            type="url"
                            className="form-input"
                            value={formData.urlJustificativo || ''}
                            onChange={e => handleChange('urlJustificativo', e.target.value)}
                            placeholder="https://..."
                            maxLength={100}
                            disabled={isReadOnly()}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estado *</label>
                        <select
                            className="form-input"
                            value={formData.estado || 'pendiente'}
                            onChange={e => handleChange('estado', e.target.value)}
                        >
                            {ESTADOS_LICENCIA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">DescripciÃ³n</label>
                    <textarea
                        className="form-input"
                        placeholder="InformaciÃ³n adicional sobre la licencia..."
                        value={formData.descripcion || ''}
                        onChange={e => handleChange('descripcion', e.target.value)}
                        rows={2}
                        maxLength={500}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.descripcion && fieldErrors.descripcion} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{(formData.descripcion || '').length}/500</span>
                </div>
            </div>
        );
    };

    const renderVacacionesForm = () => {
        const currentYear = new Date().getFullYear();
        const periodos = [
            { value: currentYear, label: currentYear.toString() },
            { value: currentYear + 1, label: (currentYear + 1).toString() },
        ];

        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                {/* Row 1: Period and days info */}
                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">PerÃ­odo *</label>
                        <select
                            className={`form-input ${touched.periodo && fieldErrors.periodo ? 'input-error' : ''}`}
                            value={formData.periodo || ''}
                            onChange={e => handleChange('periodo', parseInt(e.target.value))}
                            onBlur={() => handleBlur('periodo')}
                            disabled={isReadOnly()}
                        >
                            <option value="">AÃ±o...</option>
                            {periodos.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                        </select>
                        <FieldError message={touched.periodo && fieldErrors.periodo} />
                    </div>
                    <div className="form-group">
                        <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            DÃ­as Corresp.
                            <span
                                className="tooltip-icon"
                                onClick={() => setShowTooltipVacaciones(!showTooltipVacaciones)}
                                style={{ cursor: 'pointer' }}
                            >
                                ?
                            </span>
                        </label>
                        <input type="number" className="form-input" value={formData.diasCorrespondientes || 0} disabled />
                    </div>
                </div>
                {showTooltipVacaciones && (
                    <div className="tooltip-info" style={{ whiteSpace: 'pre-line', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                        {TOOLTIP_VACACIONES.split('**').map((part, i) =>
                            i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                        )}
                    </div>
                )}
                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">DÃ­as Tomados</label>
                        <input type="number" className="form-input" value={formData.diasTomados || 0} disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">DÃ­as Disponibles</label>
                        <input type="number" className="form-input" value={formData.diasDisponibles || 0} disabled />
                    </div>
                </div>
                {/* Row 2: Dates */}
                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">Fecha Inicio *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaInicio && fieldErrors.fechaInicio ? 'input-error' : ''}`}
                            value={formData.fechaInicio || ''}
                            onChange={e => handleChange('fechaInicio', e.target.value)}
                            onBlur={() => handleBlur('fechaInicio')}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaInicio && fieldErrors.fechaInicio} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Fin *</label>
                        <input
                            type="date"
                            className={`form-input ${touched.fechaFin && fieldErrors.fechaFin ? 'input-error' : ''}`}
                            value={formData.fechaFin || ''}
                            onChange={e => handleChange('fechaFin', e.target.value)}
                            onBlur={() => handleBlur('fechaFin')}
                            min={formData.fechaInicio || ''}
                            disabled={isReadOnly()}
                        />
                        <FieldError message={touched.fechaFin && fieldErrors.fechaFin} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Fecha Regreso</label>
                        <input type="date" className="form-input" value={formData.fechaRegreso || ''} disabled />
                    </div>
                    <div className="form-group">
                        <label className="form-label">DÃ­as Solic.</label>
                        <input type="number" className="form-input" value={formData.diasSolicitud || 0} disabled />
                    </div>
                </div>

                {/* Row 3: Notificado and Estado */}
                <div className="form-grid-stacked">
                    <div className="form-group">
                        <label className="form-label">Notificado el</label>
                        <input
                            type="date"
                            className="form-input"
                            value={formData.notificadoEl || ''}
                            onChange={e => handleChange('notificadoEl', e.target.value)}
                            max={getTodayStr()}
                            disabled={true}
                        />
                        <small style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                            Se completa automÃ¡ticamente al aprobar la solicitud
                        </small>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Estado *</label>
                        <select
                            className="form-input"
                            value={formData.estado || 'pendiente'}
                            onChange={e => handleChange('estado', e.target.value)}
                        >
                            {ESTADOS_VACACIONES.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">DescripciÃ³n</label>
                    <textarea
                        className="form-input"
                        placeholder="InformaciÃ³n adicional sobre las vacaciones..."
                        value={formData.descripcion || ''}
                        onChange={e => handleChange('descripcion', e.target.value)}
                        rows={2}
                        maxLength={500}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.descripcion && fieldErrors.descripcion} />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{(formData.descripcion || '').length}/500</span>
                </div>
            </div>
        );
    };

    const renderHorasExtrasForm = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fecha && fieldErrors.fecha ? 'input-error' : ''}`}
                        value={formData.fecha || ''}
                        onChange={e => handleChange('fecha', e.target.value)}
                        onBlur={() => handleBlur('fecha')}
                        max={getTodayStr()}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.fecha && fieldErrors.fecha} />
                </div>
                <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <input
                        type="time"
                        className={`form-input ${touched.horaInicio && fieldErrors.horaInicio ? 'input-error' : ''}`}
                        value={formData.horaInicio || ''}
                        onChange={e => handleChange('horaInicio', e.target.value)}
                        onBlur={() => handleBlur('horaInicio')}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.horaInicio && fieldErrors.horaInicio} />
                </div>
                <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <input
                        type="time"
                        className={`form-input ${touched.horaFin && fieldErrors.horaFin ? 'input-error' : ''}`}
                        value={formData.horaFin || ''}
                        onChange={e => handleChange('horaFin', e.target.value)}
                        onBlur={() => handleBlur('horaFin')}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.horaFin && fieldErrors.horaFin} />
                </div>
                <div className="form-group">
                    <label className="form-label">Cantidad Horas</label>
                    <input
                        type="text"
                        className="form-input"
                        value={formatDecimalToTime(formData.cantidadHoras)}
                        disabled
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                        (Equivale a {formData.cantidadHoras || '0.00'} hs decimales)
                    </small>
                </div>
            </div>

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Tipo de Horas Extra *</label>
                    <select
                        className={`form-input ${touched.tipoHorasExtra && fieldErrors.tipoHorasExtra ? 'input-error' : ''}`}
                        value={formData.tipoHorasExtra || ''}
                        onChange={e => handleChange('tipoHorasExtra', e.target.value)}
                        onBlur={() => handleBlur('tipoHorasExtra')}
                        disabled={true}
                    >
                        <option value="">Seleccionar...</option>
                        {TIPOS_HORAS_EXTRA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <FieldError message={touched.tipoHorasExtra && fieldErrors.tipoHorasExtra} />
                </div>
                <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                        className="form-input"
                        value={formData.estado || 'pendiente'}
                        onChange={e => handleChange('estado', e.target.value)}
                    >
                        {ESTADOS_HORAS_EXTRAS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">URL Justificativo</label>
                <input
                    type="url"
                    className="form-input"
                    value={formData.urlJustificativo || ''}
                    onChange={e => handleChange('urlJustificativo', e.target.value)}
                    placeholder="https://..."
                    maxLength={100}
                    disabled={isReadOnly()}
                />
            </div>

            <div className="form-group">
                <label className="form-label">Motivo</label>
                <textarea
                    className="form-input"
                    placeholder="Describa el motivo de las horas extras (opcional)..."
                    value={formData.motivo || ''}
                    onChange={e => handleChange('motivo', e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={isReadOnly()}
                />
                <FieldError message={touched.motivo && fieldErrors.motivo} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{(formData.motivo || '').length}/500</span>
            </div>
        </div>
    );

    const renderRenunciaForm = () => (
        <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Fecha NotificaciÃ³n *</label>
                    <input
                        type="date"
                        className={`form-input ${touched.fechaNotificacion && fieldErrors.fechaNotificacion ? 'input-error' : ''}`}
                        value={formData.fechaNotificacion || getTodayStr()}
                        onChange={e => handleChange('fechaNotificacion', e.target.value)}
                        onBlur={() => handleBlur('fechaNotificacion')}
                        max={getTodayStr()}
                        disabled={isReadOnly()}
                    />
                    <FieldError message={touched.fechaNotificacion && fieldErrors.fechaNotificacion} />
                </div>
                <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        Fecha Baja Efectiva
                        <span
                            className="tooltip-icon"
                            onClick={() => setShowTooltipRenuncia(!showTooltipRenuncia)}
                            style={{ cursor: 'pointer' }}
                        >
                            ?
                        </span>
                    </label>
                    <input
                        type="date"
                        className="form-input"
                        value={formData.fechaBajaEfectiva || ''}
                        disabled
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Se calcula automÃ¡ticamente: 15 dÃ­as desde la notificaciÃ³n (preaviso)</span>
                </div>
            </div>

            {showTooltipRenuncia && (
                <div className="tooltip-info" style={{ whiteSpace: 'pre-line', marginTop: '0.25rem', marginBottom: '0.5rem' }}>
                    {TOOLTIP_RENUNCIA.split('**').map((part, i) =>
                        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
                    )}
                </div>
            )}

            <div className="form-grid-stacked">
                <div className="form-group">
                    <label className="form-label">Estado *</label>
                    <select
                        className="form-input"
                        value={formData.estado || 'pendiente'}
                        onChange={e => handleChange('estado', e.target.value)}
                    >
                        {ESTADOS_RENUNCIA.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">URL Comprobante</label>
                    <input
                        type="url"
                        className="form-input"
                        value={formData.urlComprobante || ''}
                        onChange={e => handleChange('urlComprobante', e.target.value)}
                        placeholder="https://..."
                        maxLength={100}
                        disabled={isReadOnly()}
                    />
                </div>
            </div>

            <div className="form-group">
                <label className="form-label">Motivo</label>
                <textarea
                    className="form-input"
                    placeholder="Describa los motivos de la renuncia (opcional)..."
                    value={formData.motivo || ''}
                    onChange={e => handleChange('motivo', e.target.value)}
                    rows={2}
                    maxLength={500}
                    disabled={isReadOnly()}
                />
                <FieldError message={touched.motivo && fieldErrors.motivo} />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block' }}>{(formData.motivo || '').length}/500</span>
            </div>
        </div>
    );

    const renderStep2 = () => {
        switch (selectedTipo) {
            case 'licencia': return renderLicenciaForm();
            case 'vacaciones': return renderVacacionesForm();
            case 'horas_extras': return renderHorasExtrasForm();
            case 'renuncia': return renderRenunciaForm();
            default: return <p>Seleccione un tipo de solicitud en el paso anterior</p>;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                <div className="modal-header">
                    <h2 className="modal-title">{isEditing ? 'Editar Solicitud' : 'Nueva Solicitud'}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24 }}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-body" style={{ padding: '1.5rem' }}>
                    <StepTracker steps={steps} currentStep={currentStep} />

                    <div style={{ marginTop: '1.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                            {steps[currentStep - 1].title}
                        </h3>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                            {currentStep === 1 && 'Selecciona el contrato y tipo de solicitud'}
                            {currentStep === 2 && 'Completa los datos de la solicitud'}
                        </p>
                    </div>

                    {/* isReadOnly() && (
                        <div className="alert alert-warning" style={{ marginBottom: '1rem' }}>
                            No podÃ©s editar los datos de la solicitud porque no estÃ¡ pendiente. Solo podÃ©s cambiar su estado.
                        </div>
                    )*/}

                    {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                </div>

                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 1.5rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                        {currentStep > 1 && !isEditing && (
                            <button className="btn btn-secondary" onClick={prevStep}>Anterior</button>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
                        {currentStep < 2 ? (
                            <button className="btn btn-primary" onClick={nextStep}>Siguiente</button>
                        ) : (
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')} Solicitud
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SolicitudWizard;


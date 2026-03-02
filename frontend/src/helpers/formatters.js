/**
 * @fileoverview Funciones de formateo para presentaciÃ³n de datos en la UI.
 * Maneja fechas, moneda, texto y nombres sin dependencias externas.
 * @module helpers/formatters
 */

/**
 * Formatea una fecha DATEONLY (YYYY-MM-DD) a formato legible en espaÃ±ol argentino,
 * evitando errores de zona horaria al parsear la fecha como local.
 *
 * @param {string|null} dateString - Fecha en formato YYYY-MM-DD o ISO.
 * @returns {string} Fecha formateada como "dd de mmm de yyyy" o '-' si estÃ¡ vacÃ­a.
 * @example
 * formatDateOnly('1990-12-04'); // "04 de dic de 1990"
 */
export const formatDateOnly = (dateString) => {
    if (!dateString) return '-';

    const [year, month, day] = dateString.split('T')[0].split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const dayStr = date.toLocaleDateString('es-AR', { day: '2-digit' });
    const monthStr = date.toLocaleDateString('es-AR', { month: 'short' });
    const yearStr = date.toLocaleDateString('es-AR', { year: 'numeric' });

    return `${dayStr} de ${monthStr} de ${yearStr}`;
};

/**
 * Formatea un timestamp ISO a fecha y hora local en espaÃ±ol argentino.
 *
 * @param {string|null} dateString - Fecha ISO con hora (ej: "2024-01-15T10:30:00Z").
 * @returns {string} Fecha formateada como "dd/mm/yyyy, hh:mm" o '-' si estÃ¡ vacÃ­a.
 */
export const formatDateTime = (dateString) => {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

/**
 * Formatea un valor numÃ©rico como moneda en pesos argentinos (ARS).
 *
 * @param {number|string|null} value - Valor numÃ©rico a formatear.
 * @returns {string} Valor formateado como "$1.234,56" o '-' si estÃ¡ vacÃ­o.
 * @example
 * formatCurrency(15000); // "$15.000,00"
 */
export const formatCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '-';
    return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
    }).format(value);
};

/**
 * Trunca una cadena de texto a un largo mÃ¡ximo, agregando "..." al final.
 *
 * @param {string|null} text - Texto a truncar.
 * @param {number} [maxLength=15] - Longitud mÃ¡xima antes de truncar.
 * @returns {string} Texto truncado o '-' si estÃ¡ vacÃ­o.
 * @example
 * truncateText('AdministraciÃ³n General', 15); // "AdministraciÃ³n ..."
 */
export const truncateText = (text, maxLength = 15) => {
    if (!text) return '-';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

/**
 * Obtiene la fecha actual como string en formato YYYY-MM-DD (zona horaria local).
 *
 * @returns {string} Fecha de hoy en formato "YYYY-MM-DD".
 */
export const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Formatea el nombre completo de un empleado o usuario en formato "Apellido, Nombre".
 * Compatible con objetos anidados (ej: `contrato.empleado.usuario`) y planos.
 *
 * @param {Object|null} person - Objeto con campos nombre/apellido o con sub-objeto usuario.
 * @param {Object} [person.usuario] - Sub-objeto usuario con nombre y apellido.
 * @param {string} [person.nombre] - Nombre directo del objeto.
 * @param {string} [person.apellido] - Apellido directo del objeto.
 * @returns {string} Nombre formateado o '-' si el objeto es nulo.
 * @example
 * formatFullName({ apellido: 'GarcÃ­a', nombre: 'Juan' }); // "GarcÃ­a, Juan"
 * formatFullName({ usuario: { apellido: 'LÃ³pez', nombre: 'Ana' } }); // "LÃ³pez, Ana"
 */
export const formatFullName = (person) => {
    if (!person) return '-';
    const u = person.usuario || person;
    const apellido = u.apellido || person.apellido || 'Desconocido';
    const nombre = u.nombre || person.nombre || '';
    return nombre ? `${apellido}, ${nombre}` : apellido;
};


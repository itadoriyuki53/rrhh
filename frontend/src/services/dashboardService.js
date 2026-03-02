/**
 * @fileoverview Servicios para el Dashboard, Reportes y Feriados.
 * @module services/dashboardService
 */

import { httpClient, API_URL } from './httpClient';

/**
 * Obtiene las estadÃ­sticas generales del Dashboard para el espacio de trabajo activo.
 * Incluye totales de empleados activos, contratos en curso, solicitudes pendientes, etc.
 *
 * @returns {Promise<Object>} Objeto con las mÃ©tricas del dashboard.
 */
export const getDashboardStats = async () => {
    const response = await httpClient(`${API_URL}/dashboard/stats`);
    if (!response.ok) throw new Error('Error al obtener estadÃ­sticas del dashboard');
    return response.json();
};

/**
 * Obtiene el reporte completo de una empresa con sus mÃ©tricas de RRHH.
 *
 * @param {number} empresaId - ID de la empresa.
 * @returns {Promise<Object>} Datos del reporte de la empresa.
 */
export const getReportesEmpresa = async (empresaId) => {
    const response = await httpClient(`${API_URL}/reportes/empresa/${empresaId}`);
    if (!response.ok) throw new Error('Error al obtener reportes de empresa');
    return response.json();
};

/**
 * Obtiene el listado de feriados nacionales registrados en el sistema.
 *
 * @returns {Promise<Object[]>} Lista de feriados.
 */
export const getFeriados = async () => {
    const response = await httpClient(`${API_URL}/feriados`);
    if (!response.ok) throw new Error('Error al obtener feriados');
    return response.json();
};


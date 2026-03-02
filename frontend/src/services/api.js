/**
 * @fileoverview Barrel de re-exportación de todos los servicios de la API.
 *
 * Este archivo mantiene la retrocompatibilidad con importaciones existentes del tipo:
 *   `import { getEmpleados, getRoles } from '../services/api'`
 *
 * Para nuevos componentes, se recomienda importar directamente desde el servicio específico:
 *   `import { getEmpleados } from '../services/empleadoService'`
 *
 * @module services/api
 */

// --- Autenticación y sesión ---
export * from './authService';

// --- Datos geográficos externos ---
export * from './geoService';

// --- Módulos de RRHH ---
export * from './empleadoService';
export * from './empresaService';
export * from './contratoService';
export * from './registroService';
export * from './solicitudService';
export * from './liquidacionService';
export * from './rolService';
export * from './dashboardService';

// --- Alias de retrocompatibilidad ---
// @deprecated Usar deleteEspaciosTrabajosBulk
export { deleteEspaciosTrabajosBulk as deleteEspaciosTrabajoB } from './rolService';


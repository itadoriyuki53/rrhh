/**
 * @fileoverview Barrel de re-exportaciÃ³n de todos los servicios de la API.
 *
 * Este archivo mantiene la retrocompatibilidad con importaciones existentes del tipo:
 *   `import { getEmpleados, getRoles } from '../services/api'`
 *
 * Para nuevos componentes, se recomienda importar directamente desde el servicio especÃ­fico:
 *   `import { getEmpleados } from '../services/empleadoService'`
 *
 * @module services/api
 */

// --- AutenticaciÃ³n y sesiÃ³n ---
export * from './authService';

// --- Datos geogrÃ¡ficos externos ---
export * from './geoService';

// --- MÃ³dulos de RRHH ---
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


/**
 * @fileoverview Rutas para la gestión de parámetros laborales globales.
 * Define topes, límites y configuraciones generales del módulo de RRHH.
 * @module routes/parametroLaboralRoutes
 */

const express = require('express');
const router = express.Router();
const parametroLaboralController = require('../controllers/parametroLaboralController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'liquidaciones' (si es empleado)
router.get('/', requirePermiso('liquidaciones', 'leer'), parametroLaboralController.get);

// PUT — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.put('/', requirePermiso('liquidaciones', 'actualizar'), parametroLaboralController.update);

module.exports = router;

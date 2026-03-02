/**
 * @fileoverview Rutas para la gestión de conceptos salariales (Haberes/Deducciones).
 * Permite definir los componentes que integran las liquidaciones de sueldo.
 * @module routes/conceptoSalarialRoutes
 */

const express = require('express');
const router = express.Router();
const conceptoSalarialController = require('../controllers/conceptoSalarialController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'liquidaciones' (si es empleado)
router.get('/', requirePermiso('liquidaciones', 'leer'), conceptoSalarialController.getAll);
router.get('/:id', requirePermiso('liquidaciones', 'leer'), conceptoSalarialController.getById);

// POST — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.post('/', requirePermiso('liquidaciones', 'actualizar'), conceptoSalarialController.create);

// PUT — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.put('/:id', requirePermiso('liquidaciones', 'actualizar'), conceptoSalarialController.update);

// DELETE — requiere permiso 'actualizar' en 'liquidaciones' (si es empleado)
router.delete('/:id', requirePermiso('liquidaciones', 'actualizar'), conceptoSalarialController.remove);

module.exports = router;

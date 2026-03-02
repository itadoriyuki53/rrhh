/**
 * @fileoverview Rutas para la gestión de contratos laborales.
 * Administra la vinculación de empleados con puestos, salarios y condiciones de trabajo.
 * @module routes/contratoRoutes
 */

const express = require('express');
const router = express.Router();
const contratoController = require('../controllers/contratoController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'contratos' (si es empleado)
router.get('/', requirePermiso('contratos', 'leer'), contratoController.getAll);
router.get('/empleado/:empleadoId/puestos-con-contrato', requirePermiso('contratos', 'leer'), contratoController.getPuestosConContrato);
router.get('/:id', requirePermiso('contratos', 'leer'), contratoController.getById);

// POST — requiere permiso 'crear' en 'contratos' (si es empleado)
router.post('/', requirePermiso('contratos', 'crear'), contratoController.create);

// PUT — requiere permiso 'actualizar' en 'contratos' (si es empleado)
router.put('/:id', requirePermiso('contratos', 'actualizar'), contratoController.update);
router.patch('/:id/reactivate', requirePermiso('contratos', 'actualizar'), contratoController.reactivate);

// DELETE — requiere permiso 'eliminar' en 'contratos' (si es empleado)
router.delete('/bulk', requirePermiso('contratos', 'eliminar'), contratoController.bulkRemove);
router.delete('/:id', requirePermiso('contratos', 'eliminar'), contratoController.remove);

module.exports = router;

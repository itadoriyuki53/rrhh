/**
 * @fileoverview Rutas para la gestión central de empleados.
 * Contiene los datos personales y de contacto base del personal.
 * @module routes/empleadoRoutes
 */

const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'empleados' (si es empleado)
router.get('/', requirePermiso('empleados', 'leer'), empleadoController.getAll);
router.get('/:id', requirePermiso('empleados', 'leer'), empleadoController.getById);

// POST — requiere permiso 'crear'
router.post('/', requirePermiso('empleados', 'crear'), empleadoController.create);

// PUT — requiere permiso 'actualizar'
router.put('/:id', requirePermiso('empleados', 'actualizar'), empleadoController.update);

// PATCH — requiere permiso 'actualizar'
router.patch('/:id/reactivate', requirePermiso('empleados', 'actualizar'), empleadoController.reactivate);

// DELETE — requiere permiso 'eliminar'
router.delete('/bulk', requirePermiso('empleados', 'eliminar'), empleadoController.bulkRemove);
router.delete('/:id', requirePermiso('empleados', 'eliminar'), empleadoController.remove);

module.exports = router;

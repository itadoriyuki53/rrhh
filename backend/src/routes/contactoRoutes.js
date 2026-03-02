/**
 * @fileoverview Rutas para la gestión de contactos de emergencia y familiares de empleados.
 * @module routes/contactoRoutes
 */

const express = require('express');
const router = express.Router();
const contactoController = require('../controllers/contactoController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET - requiere permiso 'leer' en 'contactos' (si es empleado)
router.get('/', requirePermiso('contactos', 'leer'), contactoController.getAll);
router.get('/:id', requirePermiso('contactos', 'leer'), contactoController.getById);

// POST - requiere permiso 'crear'
router.post('/', requirePermiso('contactos', 'crear'), contactoController.create);

// PUT - requiere permiso 'actualizar'
router.put('/:id', requirePermiso('contactos', 'actualizar'), contactoController.update);
router.patch('/:id/reactivate', requirePermiso('contactos', 'actualizar'), contactoController.reactivate);

// DELETE - requiere permiso 'eliminar'
router.delete('/bulk', requirePermiso('contactos', 'eliminar'), contactoController.bulkRemove);
router.delete('/:id', requirePermiso('contactos', 'eliminar'), contactoController.remove);

module.exports = router;

/**
 * @fileoverview Rutas para la gestión de evaluaciones de desempeño.
 * Administra el proceso de feedback entre evaluadores y evaluados.
 * @module routes/evaluacionRoutes
 */

const express = require('express');
const router = express.Router();
const evaluacionController = require('../controllers/evaluacionController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET - requiere permiso 'leer' en 'evaluaciones'
router.get('/', requirePermiso('evaluaciones', 'leer'), evaluacionController.getAll);
router.get('/:id', requirePermiso('evaluaciones', 'leer'), evaluacionController.getById);

// POST - requiere permiso 'crear'
router.post('/', requirePermiso('evaluaciones', 'crear'), evaluacionController.create);

// PUT - requiere permiso 'actualizar'
router.put('/:id', requirePermiso('evaluaciones', 'actualizar'), evaluacionController.update);
router.patch('/:id/reactivate', requirePermiso('evaluaciones', 'actualizar'), evaluacionController.reactivate);

// DELETE - requiere permiso 'eliminar'
router.delete('/bulk', requirePermiso('evaluaciones', 'eliminar'), evaluacionController.bulkRemove);
router.delete('/:id', requirePermiso('evaluaciones', 'eliminar'), evaluacionController.remove);

module.exports = router;

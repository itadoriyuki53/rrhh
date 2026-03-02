/**
 * @fileoverview Rutas para la gestión de empresas y su estructura organizacional.
 * Gestiona empresas, áreas, departamentos y puestos de trabajo.
 * @module routes/empresaRoutes
 */

const express = require('express');
const router = express.Router();
const empresaController = require('../controllers/empresaController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'empresas' (si es empleado)
router.get('/', requirePermiso('empresas', 'leer'), empresaController.getAll);
router.get('/check-can-delete/:type/:id', requirePermiso('empresas', 'leer'), empresaController.checkCanDelete);
router.get('/:id', requirePermiso('empresas', 'leer'), empresaController.getById);

// POST — requiere permiso 'crear'
router.post('/', requirePermiso('empresas', 'crear'), empresaController.create);

// PUT — requiere permiso 'actualizar'
router.put('/:id', requirePermiso('empresas', 'actualizar'), empresaController.update);
router.patch('/:id/reactivate', requirePermiso('empresas', 'actualizar'), empresaController.reactivate);

// DELETE — requiere permiso 'eliminar'
router.delete('/bulk', requirePermiso('empresas', 'eliminar'), empresaController.removeBulk);
router.delete('/:id', requirePermiso('empresas', 'eliminar'), empresaController.remove);

module.exports = router;

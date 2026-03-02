/**
 * @fileoverview Rutas para la gestión de registros de salud y exámenes médicos.
 * @module routes/registroSaludRoutes
 */

const express = require('express');
const router = express.Router();
const registroSaludController = require('../controllers/registroSaludController');
const { isAuthenticated, requirePermiso } = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// GET — requiere permiso 'leer' en 'empresas' (si es empleado)
router.get('/', requirePermiso('leer', 'empresas'), registroSaludController.getAll);
router.get('/:id', requirePermiso('leer', 'empresas'), registroSaludController.getById);

// POST - requiere permiso 'crear' en 'empresas' (si es empleado)
router.post('/', requirePermiso('crear', 'empresas'), registroSaludController.create);

// PUT - requiere permiso 'actualizar' en 'empresas' (si es empleado)
router.put('/:id', requirePermiso('actualizar', 'empresas'), registroSaludController.update);
router.patch('/:id/reactivate', requirePermiso('actualizar', 'empresas'), registroSaludController.reactivate);

// DELETE - requiere permiso 'eliminar' en 'empresas' (si es empleado)
router.delete('/bulk', requirePermiso('eliminar', 'empresas'), registroSaludController.bulkRemove);
router.delete('/:id', requirePermiso('eliminar', 'empresas'), registroSaludController.remove);

module.exports = router;

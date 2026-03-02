/**
 * @fileoverview Rutas para la gestión administrativa de Espacios de Trabajo.
 * Estas rutas son exclusivas para usuarios con rol de administración o propietarios.
 * @module routes/espacioTrabajoRoutes
 */

const express = require('express');
const router = express.Router();
const espacioTrabajoController = require('../controllers/espacioTrabajoController');
const { isAuthenticated, isNotEmployee } = require('../middlewares/authMiddleware');

router.use(isAuthenticated);
router.use(isNotEmployee);

// GET - Rutas de validación
router.get('/validation/empleado/:empleadoId/can-change', espacioTrabajoController.canChangeEmpleadoWorkspace);
router.get('/validation/empresa/:empresaId/can-change', espacioTrabajoController.canChangeEmpresaWorkspace);
router.get('/validation/rol/:rolId/can-change', espacioTrabajoController.canChangeRolWorkspace);

// GET - Rutas de espacios de trabajo
router.get('/', espacioTrabajoController.getAll);
router.get('/:id', espacioTrabajoController.getById);

// POST - Rutas de espacios de trabajo
router.post('/', espacioTrabajoController.create);

// PUT - Rutas de espacios de trabajo
router.put('/:id', espacioTrabajoController.update);
router.patch('/:id/reactivate', espacioTrabajoController.reactivate);

// DELETE - Rutas de espacios de trabajo
router.delete('/bulk', espacioTrabajoController.deleteBulk);
router.delete('/:id', espacioTrabajoController.deleteEspacio);

module.exports = router;

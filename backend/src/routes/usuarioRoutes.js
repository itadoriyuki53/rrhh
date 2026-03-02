/**
 * @fileoverview Rutas para la gestión de usuarios del sistema (Acceso a plataforma).
 * @module routes/usuarioRoutes
 */

const express = require('express');
const router = express.Router();
const { Usuario } = require('../models');
const { Op } = require('sequelize');

// GET /api/usuarios — Listar usuarios (solo no-empleados, es decir, admins/staff)
router.get('/', async (req, res) => {
    try {
        const { soloAdmins, activo = 'true', search } = req.query;

        const where = {};

        // Por defecto, mostrar solo usuarios que NO son empleados (propietarios de espacios)
        if (soloAdmins === 'true') {
            where.esAdministrador = true;
        } else {
            // Usuarios que no son empleados (admins puros o staff)
            where.esEmpleado = false;
        }

        if (activo === 'true') {
            where.activo = true;
        } else if (activo === 'false') {
            where.activo = false;
        }

        if (search) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { apellido: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } },
            ];
        }

        const usuarios = await Usuario.findAll({
            where,
            attributes: ['id', 'nombre', 'apellido', 'email', 'esAdministrador', 'activo'],
            order: [['apellido', 'ASC'], ['nombre', 'ASC']],
        });

        return res.json({ data: usuarios });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;

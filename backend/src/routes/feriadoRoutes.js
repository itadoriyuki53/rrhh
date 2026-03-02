/**
 * @fileoverview Rutas para consulta de feriados nacionales.
 * Provee la lista de feriados fijos y móviles configurados en el sistema.
 * @module routes/feriadoRoutes
 */

const express = require('express');
const router = express.Router();
const feriadosData = require('../data/feriados.json');

// GET /api/feriados - Obtener todos los feriados
router.get('/', (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const currentDate = new Date();

        // Combinar feriados fijos y móviles
        const allFeriados = [
            ...feriadosData.feriados_fijos.map(fecha => ({
                fecha: `${currentYear}-${fecha}`,
                tipo: 'inamovible',
                nombre: feriadosData.descripcion[fecha] || 'Feriado'
            })),
            ...feriadosData.feriados_moviles_aproximados.map(fecha => ({
                fecha: `${currentYear}-${fecha}`,
                tipo: 'trasladable',
                nombre: feriadosData.descripcion[fecha] || 'Feriado'
            }))
        ];

        // Filtrar solo feriados futuros y ordenar por fecha
        const feriadosFuturos = allFeriados
            .filter(feriado => new Date(feriado.fecha) >= currentDate)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        res.json(feriadosFuturos);
    } catch (error) {
        console.error('Error al obtener feriados:', error);
        res.status(500).json({ error: 'Error al obtener feriados' });
    }
});

module.exports = router;

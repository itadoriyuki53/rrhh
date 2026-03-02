/**
 * @fileoverview Configuración principal de la aplicación Express.
 * Registra middlewares globales (CORS, sesión, parseo JSON),
 * monta todas las rutas de la API bajo el prefijo `/api`,
 * e inicializa los cron jobs automáticos del sistema.
 * @module app
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const sequelize = require('./config/database');

// ──────────────────────────────────────────────────────────────────────────────
// RUTAS
// ──────────────────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const empleadoRoutes = require('./routes/empleadoRoutes');
const empresaRoutes = require('./routes/empresaRoutes');
const contratoRoutes = require('./routes/contratoRoutes');
const registroSaludRoutes = require('./routes/registroSaludRoutes');
const evaluacionRoutes = require('./routes/evaluacionRoutes');
const contactoRoutes = require('./routes/contactoRoutes');
const solicitudRoutes = require('./routes/solicitudRoutes');
const liquidacionRoutes = require('./routes/liquidacionRoutes');
const conceptoSalarialRoutes = require('./routes/conceptoSalarialRoutes');
const parametroLaboralRoutes = require('./routes/parametroLaboralRoutes');
const feriadoRoutes = require('./routes/feriadoRoutes');
const rolRoutes = require('./routes/rolRoutes');
const permisoRoutes = require('./routes/permisoRoutes');
const espacioTrabajoRoutes = require('./routes/espacioTrabajoRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

// ──────────────────────────────────────────────────────────────────────────────
// CRON JOBS
// ──────────────────────────────────────────────────────────────────────────────
require('./jobs/contrato.cron');
require('./jobs/registroSalud.cron');
require('./jobs/liquidacion.cron');
require('./jobs/renuncia.cron');

// ──────────────────────────────────────────────────────────────────────────────
// APP
// ──────────────────────────────────────────────────────────────────────────────
const app = express();

// Middleware de CORS — permite requests del frontend en desarrollo
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true, // Necesario para envío de cookies de sesión
}));

// Parseo de cuerpo JSON y URL-encoded con límite ampliado (archivos adjuntos)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuración de sesiones con MemoryStore (suficiente en desarrollo)
app.use(session({
    secret: process.env.SESSION_SECRET || 'cataratas-rh-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    name: 'connect.sid',
    cookie: {
        secure: false,    // Cambiar a true en producción con HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas por defecto
        sameSite: 'lax',
    },
}));

// Servir documentación técnica estática desde la raíz
app.use('/docs', express.static(path.join(__dirname, '../../docs')));

// ──────────────────────────────────────────────────────────────────────────────
// RUTAS DE LA API
// ──────────────────────────────────────────────────────────────────────────────

// Rutas de autenticación (públicas, sin middleware de sesión)
app.use('/api/auth', authRoutes);

// Rutas protegidas (requieren sesión activa vía middleware en cada router)
app.use('/api/empleados', empleadoRoutes);
app.use('/api/empresas', empresaRoutes);
app.use('/api/contratos', contratoRoutes);
app.use('/api/registros-salud', registroSaludRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/contactos', contactoRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/liquidaciones', liquidacionRoutes);
app.use('/api/conceptos-salariales', conceptoSalarialRoutes);
app.use('/api/parametros-laborales', parametroLaboralRoutes);
app.use('/api/feriados', feriadoRoutes);
app.use('/api/roles', rolRoutes);
app.use('/api/permisos', permisoRoutes);
app.use('/api/espacios-trabajo', espacioTrabajoRoutes);
app.use('/api/usuarios', usuarioRoutes);

// ──────────────────────────────────────────────────────────────────────────────
// RUTA DE SALUD
// ──────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Verifica que el servidor esté funcionando correctamente.
 * @returns {{ status: string, message: string }}
 */
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'CataratasRH API funcionando' });
});

// ──────────────────────────────────────────────────────────────────────────────
// MANEJO GLOBAL DE ERRORES
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Middleware de manejo de errores no capturados.
 * Captura errores lanzados desde cualquier ruta o middleware.
 */
app.use((err, req, res, next) => {
    console.error('[app] Error no manejado:', err.stack);
    res.status(500).json({ error: 'Ocurrió un error inesperado en el servidor.' });
});

module.exports = app;

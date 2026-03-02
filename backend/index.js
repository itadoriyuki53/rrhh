/**
 * @fileoverview Punto de entrada de la aplicación.
 * Carga variables de entorno, sincroniza la base de datos,
 * ejecuta la semilla de datos (seeder) e inicia el servidor Express.
 * @module index
 */

require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');
const { runSeed } = require('./src/seeders/seed');

const PORT = process.env.PORT || 3000;

/**
 * Función de arranque del servidor.
 * Realiza la sincronización de modelos con la base de datos y activa la escucha de peticiones.
 * @returns {Promise<void>}
 */
const startServer = async () => {
    try {
        // Sincronizar base de datos (alter: true mantiene los datos existentes)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
        await sequelize.sync({ force: true });
        console.log('✅ Base de datos sincronizada');

        // Sincronizar tabla de sesiones
        if (app.sessionStore) {
            await app.sessionStore.sync();
            console.log('✅ Tabla de sesiones creada');
        }

        // Ejecutar semilla de datos (solo si no existen datos)
        await runSeed();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor CataratasRH corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
};

startServer();
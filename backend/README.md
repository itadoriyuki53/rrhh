# CataratasRH - Backend (Node.js/Express)

Bienvenido a la documentación técnica de la API REST y los procesos de servidor de **CataratasRH**. Aquí encontrarás la documentación de los controladores, servicios y modelos que gestionan el sistema.

## Estructura del API

### Controladores (Capas de Endpoint)
*   **[Autenticación (Auth)](module-controllers_authController.html)**: Controladores para login, registro y sesiones de usuario.
*   **[Gestión de Empleados](module-controllers_empleadoController.html)**: Endpoints de CRUD y consultas de personal.
*   **[Contratos y Liquidación](module-controllers_contratoController.html)**: Lógica administrativa de personal y salarios.

### Lógica de Negocio
*   **[Servicios (Service Layer)](module-services_liquidacionService.html)**: Procesos de validación complejos y lógica centralizada.
*   **[Modelos (ORM Sequelize)](module-models_index.html)**: Definición de esquemas de datos y relaciones SQL.

### Infraestructura
*   **[Middlewares de Seguridad](module-middlewares_authMiddleware.html)**: Filtros de autenticación y validación de permisos.

---
> **Nota de Arquitectura:** El backend está construido sobre Node.js utilizando Express y Sequelize. Se sigue un patrón modular para facilitar el escalado y mantenimiento de cada micro-módulo del sistema RRHH.

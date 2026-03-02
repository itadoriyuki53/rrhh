/**
 * @fileoverview Custom hooks de React para lógica reutilizable entre páginas y componentes.
 * Encapsula comportamientos comunes: observación del tema, debounce de filtros
 * y resolución de permisos por módulo.
 * @module helpers/hooks
 */

import { useState, useEffect, useRef } from 'react';

// ===== TEMA =====

/**
 * Observa la clase `dark` en `<html>` y retorna un booleano reactivo.
 * Usado en páginas que renderizan componentes de terceros (react-select) que
 * necesitan saber el tema actual para aplicar sus propios estilos.
 *
 * @returns {boolean} `true` si el tema oscuro está activo.
 * @example
 * const isDark = useIsDark();
 * const selectStyles = buildSelectStyles(isDark);
 */
export const useIsDark = () => {
    const [isDark, setIsDark] = useState(
        () => document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });
        return () => observer.disconnect();
    }, []);

    return isDark;
};

// ===== DEBOUNCE =====

/**
 * Retrasa la actualización de un valor hasta que el usuario deja de escribir.
 * Evita disparar peticiones al servidor en cada pulsación de tecla.
 *
 * @template T
 * @param {T} value - Valor a "debouncear".
 * @param {number} [delay=300] - Tiempo de espera en milisegundos.
 * @returns {T} El valor retrasado.
 * @example
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebounce(searchInput, 300);
 * useEffect(() => { loadItems(debouncedSearch); }, [debouncedSearch]);
 */
export const useDebounce = (value, delay = 300) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
};

// ===== PERMISOS DE MÓDULO =====

/**
 * Resuelve los permisos CRUD del usuario autenticado para un módulo específico.
 * Un administrador siempre tiene todos los permisos.
 * Un empleado no-admin solo tiene los permisos que su rol le otorgue.
 * Un usuario no-empleado (owner) también tiene todos los permisos.
 *
 * @param {Object|null} user - Objeto de usuario del contexto de autenticación.
 * @param {string} modulo - Nombre del módulo a verificar (ej: 'empleados', 'contratos').
 * @returns {{ canRead: boolean, canCreate: boolean, canEdit: boolean, canDelete: boolean }}
 * @example
 * const { canRead, canCreate, canEdit, canDelete } = useModulePermissions(user, 'empleados');
 */
export const useModulePermissions = (user, modulo) => {
    const isEmpleadoUser = Boolean(user?.esEmpleado && !user?.esAdministrador);
    const permisos = user?.rol?.permisos || [];

    /**
     * Verifica si el usuario tiene un permiso específico para el módulo.
     * @param {string} accion - 'leer' | 'crear' | 'actualizar' | 'eliminar'
     * @returns {boolean}
     */
    const tienePermiso = (accion) =>
        !isEmpleadoUser ||
        user?.esAdministrador ||
        permisos.some(p => p.modulo === modulo && p.accion === accion);

    return {
        isEmpleadoUser,
        canRead: tienePermiso('leer'),
        canCreate: tienePermiso('crear'),
        canEdit: tienePermiso('actualizar'),
        canDelete: tienePermiso('eliminar'),
    };
};

// ===== CLICK FUERA DE ELEMENTO =====

/**
 * Detecta clicks fuera de un elemento referenciado y ejecuta un callback.
 * Útil para cerrar dropdowns y menús contextuales.
 *
 * @param {Function} callback - Función a ejecutar cuando se hace click fuera.
 * @returns {React.RefObject} Ref para asignar al elemento a observar.
 * @example
 * const dropdownRef = useClickOutside(() => setOpen(false));
 * <div ref={dropdownRef}>...</div>
 */
export const useClickOutside = (callback) => {
    const ref = useRef(null);

    useEffect(() => {
        const handleClick = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [callback]);

    return ref;
};


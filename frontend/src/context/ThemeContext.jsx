/**
 * @fileoverview Contexto global de tema visual (claro/oscuro).
 * Persiste la preferencia del usuario en `localStorage` y sincroniza la clase
 * `dark` en `<html>` para que los estilos CSS respondan automÃ¡ticamente.
 * @module context/ThemeContext
 */

import { createContext, useState, useEffect, useContext } from 'react';

/**
 * Contexto interno del tema. No usar directamente: usar el hook `useTheme`.
 * @type {React.Context}
 */
const ThemeContext = createContext();

/**
 * Hook para acceder al contexto de tema desde cualquier componente.
 * Debe usarse dentro del Ã¡rbol envuelto por `ThemeProvider`.
 *
 * @returns {{ isDark: boolean, toggleTheme: Function, resetTheme: Function }}
 * @throws {Error} Si se llama fuera de un `ThemeProvider`.
 */
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

/**
 * Proveedor del contexto de tema visual.
 * Lee la preferencia guardada en `localStorage` al iniciar.
 * Al cambiar, actualiza `localStorage` y la clase `dark` en `document.documentElement`.
 *
 * @param {{ children: React.ReactNode }} props
 * @returns {JSX.Element}
 */
export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        return saved === 'dark';
    });

    useEffect(() => {
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDark);
    }, [isDark]);

    /**
     * Alterna entre tema claro y oscuro.
     */
    const toggleTheme = () => setIsDark(prev => !prev);

    /**
     * Resetea al tema claro (ej: al cerrar sesiÃ³n).
     */
    const resetTheme = () => setIsDark(false);

    return (
        <ThemeContext.Provider value={{ isDark, toggleTheme, resetTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export default ThemeContext;


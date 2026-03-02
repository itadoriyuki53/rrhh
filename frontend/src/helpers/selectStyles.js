/**
 * @fileoverview Estilos de react-select adaptados al tema claro/oscuro de la aplicación.
 * Centraliza la paleta de colores para que todos los Select del sistema sean consistentes.
 * @module helpers/selectStyles
 */

/**
 * Genera el objeto de estilos para componentes `react-select` adaptado al tema actual.
 * Aplica los colores del design system (#0d9488 como primario, #1e293b/#fff como fondo).
 *
 * @param {boolean} isDark - Si `true`, aplica modo oscuro.
 * @returns {Object} Objeto de estilos compatible con la prop `styles` de react-select.
 * @example
 * import { buildSelectStyles } from '../helpers/selectStyles';
 * const styles = buildSelectStyles(isDark);
 * <Select styles={styles} ... />
 */
export const buildSelectStyles = (isDark) => ({
    control: (base, state) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        borderColor: state.isFocused ? '#0d9488' : (isDark ? '#334155' : '#e2e8f0'),
        boxShadow: 'none',
        '&:hover': { borderColor: '#0d9488' },
        minHeight: '36px',
        fontSize: '0.875rem',
        borderRadius: '0.5rem',
    }),
    menu: (base) => ({
        ...base,
        backgroundColor: isDark ? '#1e293b' : 'white',
        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
        borderRadius: '0.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 9999,
    }),
    option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
            ? '#0d9488'
            : state.isFocused
                ? (isDark ? '#334155' : '#f1f5f9')
                : 'transparent',
        color: state.isSelected ? 'white' : (isDark ? '#e2e8f0' : '#1e293b'),
        fontSize: '0.875rem',
        cursor: 'pointer',
        '&:active': { backgroundColor: '#0d9488' },
    }),
    multiValue: (base) => ({
        ...base,
        backgroundColor: '#0d9488',
        borderRadius: '0.375rem',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: 'white',
        padding: '2px 6px',
        fontSize: '0.75rem',
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: 'white',
        '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)', color: 'white' },
    }),
    groupHeading: (base) => ({
        ...base,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '0.7rem',
        color: '#64748b',
    }),
    input: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.875rem' }),
    singleValue: (base) => ({ ...base, color: isDark ? '#e2e8f0' : '#1e293b' }),
    placeholder: (base) => ({ ...base, color: '#94a3b8', fontSize: '0.875rem' }),
    valueContainer: (base) => ({ ...base, padding: '0 8px' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
});


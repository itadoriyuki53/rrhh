/**
 * @fileoverview Punto de entrada de la aplicación React.
 * Monta el árbol de proveedores de contexto y el enrutador antes de renderizar `<App />`.
 *
 * Jerarquía de proveedores (exterior → interior):
 *   StrictMode → ThemeProvider → BrowserRouter → AuthProvider (dentro de App) → App
 *
 * - `ThemeProvider` debe estar fuera de `BrowserRouter` ya que no depende del router.
 * - `AuthProvider` vive dentro de `App` porque necesita acceso al router (para redirigir).
 * @module main
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ThemeProvider>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </ThemeProvider>
    </React.StrictMode>,
);


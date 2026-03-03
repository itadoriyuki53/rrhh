/**
 * @fileoverview Página de documentación técnica que unifica el acceso a JSDoc de Frontend y Backend.
 * @module pages/TechnicalDocs
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TechnicalDocs = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="landing-page-wrapper" style={{ minHeight: '100vh' }}>
            {/* Header Mirroring LandingPage Style Exactly */}
            <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-header-inner">
                    <Link to="/" className="landing-brand">
                        <img src="/logo.png" alt="CataratasRH" className="landing-brand-logo" />
                        <span className="landing-brand-name">Cataratas<span>RH</span></span>
                    </Link>

                    <button className="landing-menu-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            {menuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            )}
                        </svg>
                    </button>

                    <nav className={`landing-nav ${menuOpen ? 'open' : ''}`}>
                        <Link to="/" className="landing-nav-link" onClick={() => setMenuOpen(false)}>
                            Inicio
                        </Link>
                        <Link to="/documentacion" className="landing-nav-link active" onClick={() => setMenuOpen(false)}>
                            Documentación
                        </Link>
                        <Link to="/login" className="landing-login-btn-mobile" onClick={() => setMenuOpen(false)}>
                            Iniciar sesión
                        </Link>
                        <Link to="/login" className="landing-login-btn" onClick={() => setMenuOpen(false)}>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Iniciar sesión
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main style={{ padding: '120px 2rem 4rem' }}>
                <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
                    <div className="landing-section-header visible">
                        <div className="landing-section-tag">Documentación</div>
                        <h1 className="landing-hero-title" style={{ fontSize: '3rem', marginBottom: '1rem' }}>
                            Explora la arquitectura de <span className="highlight">CataratasRH</span>
                        </h1>
                        <p className="landing-hero-description" style={{ margin: '0 auto 3rem', maxWidth: '700px' }}>
                            Accede a la documentación técnica detallada de cada módulo del sistema,
                            generada automáticamente para desarrolladores y administradores.
                        </p>
                    </div>

                    <div className="landing-features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* Frontend Card */}
                        <a
                            href="/docs/frontend/index.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-feature-card visible"
                            style={{ textDecoration: 'none', transition: 'transform 0.3s ease' }}
                        >
                            <div className="landing-feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                                </svg>
                            </div>
                            <h3 className="landing-feature-title">Frontend (React)</h3>
                            <p className="landing-feature-description">
                                Componentes de la interfaz de usuario, hooks personalizados,
                                gestión de estado global y servicios de API del cliente.
                            </p>
                        </a>

                        {/* Backend Card */}
                        <a
                            href="/docs/backend/index.html"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="landing-feature-card visible"
                            style={{ textDecoration: 'none', transition: 'transform 0.3s ease' }}
                        >
                            <div className="landing-feature-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                                </svg>
                            </div>
                            <h3 className="landing-feature-title">Backend (Node.js)</h3>
                            <p className="landing-feature-description">
                                Definición de modelos de base de datos, controladores de la API REST,
                                middlewares de seguridad y procesos en segundo plano (cron jobs).
                            </p>
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default TechnicalDocs;

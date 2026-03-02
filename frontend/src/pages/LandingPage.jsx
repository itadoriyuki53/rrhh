/**
 * @fileoverview Página pública explicativa con presentación comercial de CataratasRH.
 * @module pages/LandingPage
 */

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/* ─── SVG Icon Components ─── */
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const UsersIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
);

const ContractIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
);

const EvalIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
);

const HealthIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75" />
    </svg>
);

const RequestIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V19.5a2.25 2.25 0 002.25 2.25h6a2.25 2.25 0 002.25-2.25V6.108" />
    </svg>
);

const ChartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);

/* ─── Data ─── */
const features = [
    {
        icon: <UsersIcon />,
        title: 'Gestión de Empleados',
        description: 'Centraliza la información de todo tu equipo: datos personales, cargos, contactos de emergencia y asignaciones organizacionales en un solo lugar.',
    },
    {
        icon: <ContractIcon />,
        title: 'Contratos y Liquidaciones',
        description: 'Administra contratos laborales, tipos de vinculación y genera liquidaciones salariales de forma ágil y transparente.',
    },
    {
        icon: <EvalIcon />,
        title: 'Evaluaciones de Desempeño',
        description: 'Realiza seguimiento del rendimiento de tus colaboradores con evaluaciones periódicas configurables y métricas claras.',
    },
    {
        icon: <HealthIcon />,
        title: 'Registros de Salud',
        description: 'Gestiona certificados médicos, licencias por enfermedad y el historial sanitario de cada empleado de forma organizada.',
    },
    {
        icon: <RequestIcon />,
        title: 'Solicitudes y Permisos',
        description: 'Simplifica el proceso de solicitudes de vacaciones, permisos y licencias con flujos de aprobación claros.',
    },
    {
        icon: <ChartIcon />,
        title: 'Reportes y Analíticas',
        description: 'Obtén métricas clave sobre dotación de personal, tipos de contrato y distribución organizacional con reportes visuales.',
    },
];

const pricingPlans = [
    {
        name: 'Básico',
        description: 'Perfecto para equipos pequeños',
        price: '$12',
        period: '/usuario/mes',
        cta: 'Comenzar Prueba',
        ctaStyle: 'outline',
        features: [
            'Hasta 10 empleados',
            'Gestión de contratos',
            'Reportes básicos',
            'Soporte por email',
        ],
    },
    {
        name: 'Profesional',
        description: 'Para equipos en crecimiento',
        price: '$24',
        period: '/usuario/mes',
        cta: 'Comenzar Prueba',
        ctaStyle: 'primary',
        featured: true,
        badge: 'Más Popular',
        features: [
            'Hasta 50 empleados',
            'Evaluaciones y salud',
            'Reportes avanzados',
            'Soporte prioritario',
            'Liquidaciones automáticas',
        ],
    },
    {
        name: 'Empresa',
        description: 'Para grandes organizaciones',
        price: 'Personalizado',
        period: '',
        cta: 'Contactar a Ventas',
        ctaStyle: 'outline',
        features: [
            'Empleados ilimitados',
            'Módulos completos',
            'Seguridad avanzada',
            'Gestor de cuenta dedicado',
            'SLA personalizado',
        ],
    },
];

/**
 * Gancho personalizado (Hook) para manejar animaciones gatilladas por el scroll.
 * Utiliza IntersectionObserver para añadir la clase 'visible' a elementos seleccionados.
 * 
 * @returns {React.MutableRefObject<null>} Referencia compartida del contenedor.
 */
function useScrollAnimation() {
    const ref = useRef(null);
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible');
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        const elements = ref.current?.querySelectorAll('.landing-animate');
        elements?.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, []);
    return ref;
}

/* ─── Main Component ─── */
/**
 * Componente LandingPage
 * 
 * Página introductoria para el proyecto CataratasRH. Explicativas visuales de features básicas.
 * No requiere autenticación y su UI no hace match riguroso a la paleta administrativa interior.
 * 
 * @returns {JSX.Element}
 */
const LandingPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const containerRef = useScrollAnimation();

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /**
     * Maneja el clic en los elementos de navegación para realizar un scroll suave a la sección.
     * 
     * @param {React.MouseEvent} e - Evento de clic.
     * @param {string} targetId - ID del elemento destino del scroll.
     * @returns {void}
     */
    const handleNavClick = (e, targetId) => {
        e.preventDefault();
        setMenuOpen(false);
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div ref={containerRef} style={{ background: 'white' }}>
            {/* ── Header ── */}
            <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-header-inner">
                    <a href="#" className="landing-brand" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                        <img src="/logo.png" alt="CataratasRH" className="landing-brand-logo" />
                        <span className="landing-brand-name">Cataratas<span>RH</span></span>
                    </a>

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
                        <a href="#caracteristicas" className="landing-nav-link" onClick={(e) => handleNavClick(e, 'caracteristicas')}>
                            Características
                        </a>
                        <a href="#precios" className="landing-nav-link" onClick={(e) => handleNavClick(e, 'precios')}>
                            Precios
                        </a>
                        <Link
                            to="/documentacion"
                            className="landing-nav-link"
                        >
                            Documentación
                        </Link>
                        <Link to="/login" className="landing-login-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                            </svg>
                            Iniciar sesión
                        </Link>
                    </nav>
                </div>
            </header>

            {/* ── Hero ── */}
            <section className="landing-hero">
                <div className="landing-hero-inner">
                    <div className="landing-hero-content">
                        <h1 className="landing-hero-title">
                            Sistema de Gestión de{' '}
                            <span className="highlight">Recursos Humanos</span>
                        </h1>
                        <p className="landing-hero-description">
                            CataratasRH centraliza y simplifica la gestión de recursos humanos de tu empresa.
                            Administra empleados, contratos, liquidaciones, evaluaciones y solicitudes de forma eficiente.
                        </p>
                        <div className="landing-hero-actions">
                            <Link to="/login" className="landing-btn-primary">
                                Comenzar ahora
                                <ArrowRightIcon />
                            </Link>
                            <a href="#caracteristicas" className="landing-btn-secondary" onClick={(e) => handleNavClick(e, 'caracteristicas')}>
                                Ver funcionalidades
                            </a>
                        </div>
                    </div>
                    <div className="landing-hero-visual">
                        <div className="landing-hero-logo-wrapper">
                            <img src="/logo.png" alt="CataratasRH Logo" className="landing-hero-logo-img" />
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats ── */}
            <section className="landing-stats">
                <div className="landing-stats-inner">
                    <div className="landing-stat landing-animate">
                        <div className="landing-stat-number">10+</div>
                        <div className="landing-stat-label">Módulos integrados</div>
                    </div>
                    <div className="landing-stat landing-animate">
                        <div className="landing-stat-number">100%</div>
                        <div className="landing-stat-label">Basado en la nube</div>
                    </div>
                    <div className="landing-stat landing-animate">
                        <div className="landing-stat-number">24/7</div>
                        <div className="landing-stat-label">Disponibilidad</div>
                    </div>
                    <div className="landing-stat landing-animate">
                        <div className="landing-stat-number">âˆž</div>
                        <div className="landing-stat-label">Escalabilidad</div>
                    </div>
                </div>
            </section>

            {/* ── Features ── */}
            <section id="caracteristicas" className="landing-features">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <div className="landing-section-tag">Funcionalidades</div>
                        <h2 className="landing-section-title">Todo lo que necesitás para gestionar tu equipo</h2>
                        <p className="landing-section-subtitle">
                            Herramientas poderosas diseñadas para optimizar la gestión de tu organización y el bienestar de tus colaboradores.
                        </p>
                    </div>
                    <div className="landing-features-grid">
                        {features.map((feature, i) => (
                            <div key={i} className="landing-feature-card landing-animate" style={{ transitionDelay: `${i * 0.1}s` }}>
                                <div className="landing-feature-icon">{feature.icon}</div>
                                <h3 className="landing-feature-title">{feature.title}</h3>
                                <p className="landing-feature-description">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Pricing ── */}
            <section id="precios" className="landing-pricing">
                <div className="landing-section-inner">
                    <div className="landing-section-header landing-animate">
                        <div className="landing-section-tag">Precios</div>
                        <h2 className="landing-section-title">Precios simples y transparentes</h2>
                        <p className="landing-section-subtitle">
                            Elegí el plan adecuado para tu equipo. Todos los planes incluyen una prueba gratuita de 14 días.
                        </p>
                    </div>
                    <div className="landing-pricing-grid">
                        {pricingPlans.map((plan, i) => (
                            <div key={i} className={`landing-price-card landing-animate ${plan.featured ? 'featured' : ''}`} style={{ transitionDelay: `${i * 0.15}s` }}>
                                {plan.badge && <div className="landing-price-badge">{plan.badge}</div>}
                                <div className="landing-price-name">{plan.name}</div>
                                <div className="landing-price-desc">{plan.description}</div>
                                <div className="landing-price-amount">
                                    <span className="amount">{plan.price}</span>
                                    {plan.period && <span className="period">{plan.period}</span>}
                                </div>
                                <button className={`landing-price-cta ${plan.ctaStyle}`}>{plan.cta}</button>
                                <ul className="landing-price-features">
                                    {plan.features.map((f, j) => (
                                        <li key={j}>
                                            <CheckIcon />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Footer ── */}
            <footer className="landing-footer">
                <div className="landing-footer-inner">
                    <div className="landing-footer-grid">
                        <div>
                            <div className="landing-footer-brand-name">Cataratas<span>RH</span></div>
                            <p className="landing-footer-brand-desc">
                                Gestión de recursos humanos moderna para equipos que se mueven rápido.
                            </p>
                        </div>
                        <div className="landing-footer-section">
                            <h4>Producto</h4>
                            <ul className="landing-footer-links">
                                <li>Funcionalidades</li>
                                <li>Precios</li>
                                <li>Seguridad</li>
                                <li>Hoja de Ruta</li>
                            </ul>
                        </div>
                        <div className="landing-footer-section">
                            <h4>Empresa</h4>
                            <ul className="landing-footer-links">
                                <li>Nosotros</li>
                                <li>Blog</li>
                                <li>Carreras</li>
                                <li>Contacto</li>
                            </ul>
                        </div>
                        <div className="landing-footer-section">
                            <h4>Conecta</h4>
                            <div className="landing-footer-social">
                                <a aria-label="Twitter">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                                    </svg>
                                </a>
                                <a href="https://github.com/joaquinkuster/rrhh" aria-label="GitHub">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 22v-4a4.8 4.8 0 00-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 004 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 18c-4.51 2-5-2-7-2" />
                                    </svg>
                                </a>
                                <a aria-label="LinkedIn">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6z" />
                                        <rect x="2" y="9" width="4" height="12" rx="0" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="4" cy="4" r="2" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                    <div className="landing-footer-bottom">
                        <p>© 2025 CataratasRH. Todos los derechos reservados.</p>
                        <div className="landing-footer-bottom-links">
                            <a href="#">Política de Privacidad</a>
                            <a href="#">Términos de Servicio</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;


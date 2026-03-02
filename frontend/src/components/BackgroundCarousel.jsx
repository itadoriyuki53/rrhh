/**
 * @fileoverview Carrusel de imágenes de fondo para pantallas de autenticación.
 * @module components/BackgroundCarousel
 */

import { useState, useEffect } from 'react';

/**
 * Componente BackgroundCarousel
 * Muestra una transición suave de imágenes de fondo en loop (login/register).
 * 
 * @returns {JSX.Element}
 */
const BackgroundCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const images = ['/carrusel/foto1.jpeg', '/carrusel/foto2.jpg', '/carrusel/foto3.jpeg'];

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length);
        }, 5000); // Cambiar cada 5 segundos

        return () => clearInterval(interval);
    }, [images.length]);

    return (
        <div className="background-carousel">
            {images.map((image, index) => (
                <div
                    key={index}
                    className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                    style={{ backgroundImage: `url(${image})` }}
                />
            ))}
            <div className="carousel-overlay" />
        </div>
    );
};

export default BackgroundCarousel;


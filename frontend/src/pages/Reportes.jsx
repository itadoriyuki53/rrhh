/**
 * @fileoverview Motor de analítica y generación de gráficos métricos.
 * @module pages/Reportes
 */

import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { getEmpresas, getEmpresaById, getContratos } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatFullName, formatDateOnly, truncateText } from '../helpers/formatters';
import { useIsDark, useModulePermissions } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

/**
 * Componente funcional para renderizar una tarjeta de contador con efectos hover.
 * 
 * @param {{value: string|number, label: string, color: string}} props - Propiedades de la tarjeta.
 * @returns {JSX.Element}
 */
const CounterCard = ({ value, label, color }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
                padding: '1.5rem 1rem',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.75rem',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
                cursor: 'default'
            }}
        >
            <div style={{
                fontSize: '1.5rem',
                fontWeight: 800,
                color: isHovered ? '#ffffff' : color,
                backgroundColor: isHovered ? color : `${color}15`,
                minWidth: '3.5rem',
                padding: '0.35rem 1.25rem',
                borderRadius: '9999px',
                border: `1px solid ${isHovered ? color : `${color}30`}`,
                display: 'inline-block',
                boxShadow: isHovered ? `0 6px 12px -2px ${color}40, 0 3px 6px -2px ${color}20` : `0 4px 6px -1px ${color}10, 0 2px 4px -1px ${color}05`,
                transition: 'all 0.3s ease'
            }}>
                {value}
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: isHovered ? 'var(--text-primary)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', transition: 'color 0.3s ease' }}>{label}</div>
        </div>
    );
};

/**
 * Gráfico de barras simple renderizado mediante SVG para distribución de datos categóricos.
 * 
 * @param {{data: Array<{label: string, value: number}>}} props - Datos a graficar.
 * @returns {JSX.Element}
 */
const BarChart = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin datos</p>;

    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 300;

    return (
        <svg width="100%" height={chartHeight + 100} style={{ display: 'block' }}>
            <text x="15" y="150" fontSize="12" fontWeight="600" fill="var(--text-secondary)" transform="rotate(-90, 15, 150)" textAnchor="middle">Empleados</text>
            <text x="50%" y={chartHeight + 90} fontSize="12" fontWeight="600" fill="var(--text-secondary)" textAnchor="middle">Tipo de Contrato</text>
            {data.map((item, index) => {
                const xPercent = ((index + 0.5) / data.length) * 100;
                const barHeight = (item.value / maxValue) * (chartHeight - 40);
                const isHovered = hoveredIndex === index;
                return (
                    <g key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ cursor: 'pointer' }}>
                        <rect x={`${xPercent - 5}%`} y={chartHeight - barHeight + 20} width="10%" height={barHeight} fill={isHovered ? '#a78bfa' : '#8b5cf6'} rx="4" style={{ transition: 'fill 0.2s' }} />
                        <text x={`${xPercent}%`} y={chartHeight - barHeight + 10} textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--text-primary)">{item.value}</text>
                        <text x={`${xPercent}%`} y={chartHeight + 50} textAnchor="middle" fontSize="11" fill="var(--text-secondary)">{item.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

// Timeline Chart Component  
const TimelineChart = ({ data }) => {
    const [hoveredIndex, setHoveredIndex] = React.useState(null);
    if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>Sin datos</p>;
    const maxValue = Math.max(...data.map(d => d.value));
    const chartHeight = 250;
    return (
        <svg width="100%" height={chartHeight + 80} style={{ display: 'block' }}>
            <text x="15" y="150" fontSize="12" fontWeight="600" fill="var(--text-secondary)" transform="rotate(-90, 15, 150)" textAnchor="middle">Contratos</text>
            <text x="50%" y={chartHeight + 75} fontSize="12" fontWeight="600" fill="var(--text-secondary)" textAnchor="middle">Mes</text>
            {data.map((item, index) => {
                const xPercent = ((index + 0.5) / data.length) * 100;
                const y = chartHeight - ((item.value / maxValue) * (chartHeight - 40)) + 20;
                const nextItem = data[index + 1];
                const nextX = nextItem ? ((index + 1.5) / data.length) * 100 : null;
                const nextY = nextItem ? chartHeight - ((nextItem.value / maxValue) * (chartHeight - 40)) + 20 : null;
                const isHovered = hoveredIndex === index;
                return (
                    <g key={index} onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} style={{ cursor: 'pointer' }}>
                        {nextItem && <line x1={`${xPercent}%`} y1={y} x2={`${nextX}%`} y2={nextY} stroke="#0d9488" strokeWidth="2" />}
                        <circle cx={`${xPercent}%`} cy={y} r={isHovered ? 6 : 4} fill={isHovered ? '#14b8a6' : '#0d9488'} style={{ transition: 'all 0.2s' }} />
                        <text x={`${xPercent}%`} y={y - 10} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--text-primary)">{item.value}</text>
                        <text x={`${xPercent}%`} y={chartHeight + 50} textAnchor="middle" fontSize="10" fill="var(--text-secondary)">{item.label}</text>
                    </g>
                );
            })}
        </svg>
    );
};

/**
 * Componente Reportes
 * 
 * Motor de analítica visual y tabulación de métricas de RRHH.
 * Genera gráficas a través de datos organizacionales y contratos consumidos.
 * Implementa render condicional mediante useModulePermissions.
 * 
 * @returns {JSX.Element}
 */
const Reportes = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { isEmpleadoUser, canRead } = useModulePermissions(user, 'reportes');

    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
    const [empresaData, setEmpresaData] = useState(null);
    const [contratos, setContratos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const isDark = useIsDark();



    const selectStyles = buildSelectStyles(isDark);

    const primaryColor = '#0d9488';

    // Redirigir si no tiene permiso de lectura
    useEffect(() => {
        if (user && isEmpleadoUser && !canRead) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isEmpleadoUser, canRead, navigate]);

    /**
     * Carga la lista de empresas disponibles para el filtrado de reportes.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadEmpresas = async () => {
        try {
            const result = await getEmpresas({ activo: 'true', limit: 100 });
            setEmpresas(result.data);
            // Auto-select first company
            if (result.data.length > 0) {
                setSelectedEmpresaId(result.data[0].id.toString());
            } else {
                setLoading(false);
            }
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        loadEmpresas();
    }, []);

    // Load company data when selection changes
    useEffect(() => {
        if (!selectedEmpresaId) return;

        const loadEmpresaData = async () => {
            try {
                setLoading(true);
                setEmpresaData(null);
                setContratos([]);
                const [empresa, contratosResult] = await Promise.all([
                    getEmpresaById(selectedEmpresaId),
                    getContratos({ limit: 1000 })
                ]);
                // Filter contracts by company
                const filteredContratos = contratosResult.data.filter(c =>
                    empresa.areas?.some(a =>
                        a.departamentos?.some(d =>
                            d.puestos?.some(p =>
                                p.contratos?.some(pc => pc.id === c.id)
                            )
                        )
                    )
                );
                setEmpresaData(empresa);
                setContratos(filteredContratos);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEmpresaData();
    }, [selectedEmpresaId]);

    // Calculate statistics - only count active employees with "en_curso" contracts
    const totalAreas = empresaData?.areas?.length || 0;
    const totalDepartamentos = empresaData?.areas?.reduce((acc, area) => acc + (area.departamentos?.length || 0), 0) || 0;
    const totalPuestos = empresaData?.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) => acc2 + (depto.puestos?.length || 0), 0) || 0), 0) || 0;
    const totalEmpleados = empresaData?.areas?.reduce((acc, area) =>
        acc + (area.departamentos?.reduce((acc2, depto) =>
            acc2 + (depto.puestos?.reduce((acc3, puesto) =>
                acc3 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0), 0) || 0), 0) || 0;

    // Employees by contract type - only en_curso contracts
    const contratosEnCurso = contratos.filter(c => c.estado === 'en_curso');
    const formatContractType = (type) => {
        const types = {
            'tiempo_indeterminado': 'Tiempo Indeterminado',
            'plazo_fijo': 'Plazo Fijo',
            'periodo_prueba': 'Período de Prueba',
            'pasantia_educativa': 'Pasantía Educativa',
            'eventual': 'Eventual',
            'temporada': 'Temporada'
        };
        return types[type] || type;
    };

    const empleadosPorTipoContrato = contratosEnCurso.reduce((acc, contrato) => {
        const tipo = formatContractType(contrato.tipoContrato) || 'Sin especificar';
        acc[tipo] = (acc[tipo] || 0) + 1;
        return acc;
    }, {});

    const contratoTypeChartData = Object.entries(empleadosPorTipoContrato).map(([tipo, count]) => ({
        label: tipo,
        value: count
    }));

    // Contract history by month - all contracts
    const contratosPorMes = contratos.reduce((acc, contrato) => {
        if (!contrato.fechaInicio) return acc;
        const date = new Date(contrato.fechaInicio);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
        return acc;
    }, {});

    const timelineChartData = Object.entries(contratosPorMes)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, count]) => ({
            label: month,
            value: count
        }));

    // Recent contracts (last 10)
    const contratosRecientes = [...contratos]
        .sort((a, b) => new Date(b.fechaInicio) - new Date(a.fechaInicio))
        .slice(0, 10);



    // Helper functions for employee counts - only en_curso contracts
    const getAreaEmployeeCount = (area) => {
        return area.departamentos?.reduce((acc, depto) =>
            acc + (depto.puestos?.reduce((acc2, puesto) =>
                acc2 + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0), 0) || 0;
    };

    const getDeptoEmployeeCount = (depto) => {
        return depto.puestos?.reduce((acc, puesto) =>
            acc + (puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0), 0) || 0;
    };

    const getPuestoEmployeeCount = (puesto) => {
        return puesto.contratos?.filter(c => c.activo && c.estado === 'en_curso')?.length || 0;
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reportes</h1>
                    <p className="page-subtitle">Análisis y estadísticas por empresa</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Company Filter */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                    <h3 className="card-title">Filtro de Empresa</h3>
                </div>
                <div style={{ padding: '1rem' }}>
                    <div style={{ maxWidth: '400px' }}>
                        <Select
                            value={empresas.find(e => e.id.toString() === selectedEmpresaId) ? { value: selectedEmpresaId, label: empresas.find(e => e.id.toString() === selectedEmpresaId).nombre } : null}
                            onChange={(option) => setSelectedEmpresaId(option ? option.value : '')}
                            options={empresas.map(empresa => ({ value: empresa.id.toString(), label: empresa.nombre }))}
                            placeholder="Seleccione una empresa..."
                            isClearable={false}
                            styles={selectStyles}
                            menuPortalTarget={document.body}
                            noOptionsMessage={() => 'Sin resultados'}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="loading"><div className="spinner"></div></div>
            ) : empresas.length === 0 ? (
                <div className="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6.75h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                    </svg>
                    <h3>No hay empresas disponibles</h3>
                    <p>Aún no hay empresas registradas en el sistema para generar reportes.</p>
                </div>
            ) : !empresaData ? (
                <div className="empty-state">
                    <p>Selecciona una empresa para ver los reportes</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="card" style={{ marginBottom: '1.5rem' }}>
                        <div className="card-header">
                            <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <h3 className="card-title" style={{ margin: 0 }}>Resumen Estructural</h3>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Vista general de la conformación de la empresa</p>
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button
                                        onClick={() => alert('Exportar PDF en desarrollo')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                        </svg>
                                        PDF
                                    </button>
                                    <button
                                        onClick={() => alert('Exportar Excel en desarrollo')}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            padding: '0.5rem 0.9rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '600',
                                            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" style={{ width: 14, height: 14 }}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M13.125 12h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125M20.625 12c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5M12 14.625v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 14.625c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125m0 1.5v-1.5m0 0c0-.621.504-1.125 1.125-1.125m0 0h7.5" />
                                        </svg>
                                        Excel
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--card-bg)', borderTop: '1px solid var(--border-color)', borderRadius: '0 0 0.5rem 0.5rem' }}>
                            <div style={{ borderRight: '1px solid var(--border-color)' }}><CounterCard value={totalAreas} label="Áreas" color={primaryColor} /></div>
                            <div style={{ borderRight: '1px solid var(--border-color)' }}><CounterCard value={totalDepartamentos} label="Departamentos" color="#22c55e" /></div>
                            <div style={{ borderRight: '1px solid var(--border-color)' }}><CounterCard value={totalPuestos} label="Puestos" color="#3b82f6" /></div>
                            <div><CounterCard value={totalEmpleados} label="Empleados" color="#8b5cf6" /></div>
                        </div>
                    </div>

                    {/* Reports Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        {/* Organizational Distribution Tree */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24, color: 'var(--primary-color)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
                                    </svg>
                                    <div>
                                        <h3 className="card-title" style={{ margin: 0 }}>Distribución Organizacional</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Jerarquía de áreas, departamentos y puestos</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', flex: 1, maxHeight: '500px', overflowY: 'auto' }}>
                                {!empresaData.areas || empresaData.areas.length === 0 ? (
                                    <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem' }}>Sin estructura definida</p>
                                ) : (
                                    <div style={{ paddingLeft: '0.5rem' }}>
                                        {empresaData.areas.map((area, areaIndex) => (
                                            <div key={area.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: areaIndex === empresaData.areas.length - 1 ? 0 : '1rem' }}>
                                                {/* Vertical line */}
                                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', bottom: area.departamentos?.length > 0 ? '0.75rem' : 0, width: '2px', background: primaryColor }} />
                                                {/* Horizontal line */}
                                                <div style={{ position: 'absolute', left: 0, top: '0.75rem', width: '1rem', height: '2px', background: primaryColor }} />

                                                {/* Area row */}
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: primaryColor, flexShrink: 0 }} />
                                                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{area.nombre}</span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: `${primaryColor}15`, color: primaryColor, borderRadius: '1rem', fontWeight: 500 }}>
                                                        {area.departamentos?.length || 0} Depto(s)
                                                    </span>
                                                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.5rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem', fontWeight: 500 }}>
                                                        {getAreaEmployeeCount(area)} Empleado(s) activos
                                                    </span>
                                                </div>

                                                {/* Departments */}
                                                {area.departamentos?.map((depto, deptoIndex) => (
                                                    <div key={depto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: deptoIndex === area.departamentos.length - 1 ? 0 : '0.5rem' }}>
                                                        {/* Vertical line for puestos */}
                                                        {depto.puestos?.length > 0 && (
                                                            <div style={{ position: 'absolute', left: '0.75rem', top: '0.4rem', bottom: '0.4rem', width: '2px', background: '#22c55e' }} />
                                                        )}
                                                        {/* Horizontal line */}
                                                        <div style={{ position: 'absolute', left: 0, top: '0.4rem', width: '1.25rem', height: '2px', background: '#22c55e' }} />

                                                        {/* Department row */}
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: depto.puestos?.length > 0 ? '0.4rem' : 0, flexWrap: 'wrap' }}>
                                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                                                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{depto.nombre}</span>
                                                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#22c55e20', color: '#22c55e', borderRadius: '1rem' }}>
                                                                {depto.puestos?.length || 0} Puesto(s)
                                                            </span>
                                                            <span style={{ fontSize: '0.65rem', padding: '0.1rem 0.4rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                                {getDeptoEmployeeCount(depto)} Empleado(s) activos
                                                            </span>
                                                        </div>

                                                        {/* Positions */}
                                                        {depto.puestos?.map((puesto, puestoIndex) => (
                                                            <div key={puesto.id} style={{ position: 'relative', paddingLeft: '1.5rem', marginBottom: puestoIndex === depto.puestos.length - 1 ? 0 : '0.25rem' }}>
                                                                {/* Horizontal line */}
                                                                <div style={{ position: 'absolute', left: '0.25rem', top: '0.4rem', width: '1rem', height: '2px', background: 'var(--text-secondary)', opacity: 0.3 }} />

                                                                {/* Position row */}
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-secondary)', opacity: 0.5, flexShrink: 0 }} />
                                                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{puesto.nombre}</span>
                                                                    <span style={{ fontSize: '0.6rem', padding: '0.1rem 0.35rem', background: '#8b5cf615', color: '#8b5cf6', borderRadius: '1rem' }}>
                                                                        {getPuestoEmployeeCount(puesto)} Empleado(s) activos
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Employees by Contract Type Chart */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24, color: 'var(--primary-color)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                                    </svg>
                                    <div>
                                        <h3 className="card-title" style={{ margin: 0 }}>Empleados por Tipo de Contrato</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Distribución de empleados activos según el acuerdo vigente</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', flex: 1 }}>
                                <BarChart data={contratoTypeChartData} />
                            </div>
                        </div>

                        {/* Evolution Monthly Chart */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24, color: 'var(--primary-color)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z" />
                                    </svg>
                                    <div>
                                        <h3 className="card-title" style={{ margin: 0 }}>Evolución Mensual</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Historial de nuevos contratos iniciados</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ padding: '1rem', flex: 1 }}>
                                <TimelineChart data={timelineChartData} />
                            </div>
                        </div>

                        {/* Recent Contracts Table */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div className="card-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 24, height: 24, color: 'var(--primary-color)' }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                                    </svg>
                                    <div>
                                        <h3 className="card-title" style={{ margin: 0 }}>Últimos Registros</h3>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Contratos más recientes cargados en el sistema</p>
                                    </div>
                                </div>
                            </div>
                            <div style={{ margin: 0, padding: '1rem', flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
                                <table className="table" style={{ border: '1px solid var(--border-color)', borderRadius: '0.5rem', width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                    <thead style={{ background: 'var(--bg-color)', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Empleado</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tipo</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Inicio</th>
                                            <th style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Salario</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {contratosRecientes.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                                    No hay contratos registrados
                                                </td>
                                            </tr>
                                        ) : (
                                            contratosRecientes.map((contrato) => (
                                                <tr key={contrato.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                                                        <strong>{truncateText(formatFullName(contrato.empleado), 15)}</strong>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                                                        <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '1rem', whiteSpace: 'nowrap' }}>
                                                            {formatContractType(contrato.tipoContrato) || '-'}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>{formatDateOnly(contrato.fechaInicio)}</td>
                                                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}>
                                                        <span style={{ fontWeight: 600 }}>${contrato.salario?.toLocaleString('es-AR') || '-'}</span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )
            }
        </div >
    );
};

export default Reportes;


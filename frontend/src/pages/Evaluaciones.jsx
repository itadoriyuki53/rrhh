import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
    getEvaluaciones,
    deleteEvaluacion,
    deleteEvaluacionesBulk,
    getEvaluacionById,
    reactivateEvaluacion,
    getEmpleados,
    getEspaciosTrabajo,
} from '../services/api';
import EvaluacionWizard from '../components/EvaluacionWizard';
import EvaluacionDetail from '../components/EvaluacionDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import { truncateText } from '../utils/formatters';

const buildSelectStyles = (isDark) => ({
    control: (b, s) => ({ ...b, backgroundColor: isDark ? '#1e293b' : 'white', borderColor: s.isFocused ? '#0d9488' : (isDark ? '#334155' : '#e2e8f0'), boxShadow: 'none', '&:hover': { borderColor: '#0d9488' }, minHeight: '36px', fontSize: '0.875rem', borderRadius: '0.5rem' }),
    menu: (b) => ({ ...b, backgroundColor: isDark ? '#1e293b' : 'white', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, borderRadius: '0.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 9999 }),
    option: (b, s) => ({ ...b, backgroundColor: s.isSelected ? '#0d9488' : s.isFocused ? (isDark ? '#334155' : '#f1f5f9') : 'transparent', color: s.isSelected ? 'white' : (isDark ? '#e2e8f0' : '#1e293b'), fontSize: '0.875rem', cursor: 'pointer' }),
    groupHeading: (b) => ({ ...b, fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.7rem', color: '#64748b' }),
    input: (b) => ({ ...b, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.875rem' }),
    singleValue: (b) => ({ ...b, color: isDark ? '#e2e8f0' : '#1e293b' }),
    placeholder: (b) => ({ ...b, color: '#94a3b8', fontSize: '0.875rem' }),
    valueContainer: (b) => ({ ...b, padding: '0 8px' }),
    menuPortal: (b) => ({ ...b, zIndex: 9999 }),
});

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const PERIODO_LABELS = {
    anual: 'Anual',
    semestre_1: '1er Semestre',
    semestre_2: '2do Semestre',
    q1: 'Q1',
    q2: 'Q2',
    q3: 'Q3',
    q4: 'Q4',
    cierre_prueba: 'Cierre Período de Prueba',
    fin_proyecto: 'Fin de Proyecto',
    ad_hoc: 'Ad-hoc / Extraordinaria',
};

const TIPO_EVALUACION_LABELS = {
    autoevaluacion: 'Autoevaluación',
    descendente_90: '90° (Descendente)',
    pares_jefe_180: '180° (Pares + Jefe)',
    ascendente_270: '270° (Ascendente)',
    integral_360: '360° (Integral)',
    competencias: 'Por Competencias',
    objetivos: 'Por Objetivos',
    mixta: 'Mixta',
    potencial: 'Potencial',
};

const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    en_curso: 'En curso',
    finalizada: 'Finalizada',
    firmada: 'Firmada',
};

const ESTADO_COLORS = {
    pendiente: '#6b7280',
    en_curso: '#3b82f6',
    finalizada: '#22c55e',
    firmada: '#8b5cf6',
};

const ESCALA_LABELS = {
    supera_expectativas: 'Supera Expectativas',
    cumple: 'Cumple',
    necesita_mejora: 'Necesita Mejora',
};

const ESCALA_COLORS = {
    supera_expectativas: '#22c55e',
    cumple: '#3b82f6',
    necesita_mejora: '#ef4444',
};

const PERIODO_FILTER = [
    { value: 'anual', label: 'Anual' },
    { value: 'semestre_1', label: '1er Semestre' },
    { value: 'semestre_2', label: '2do Semestre' },
    { value: 'q1', label: 'Q1' },
    { value: 'q2', label: 'Q2' },
    { value: 'q3', label: 'Q3' },
    { value: 'q4', label: 'Q4' },
    { value: 'cierre_prueba', label: 'Cierre Período de Prueba' },
    { value: 'fin_proyecto', label: 'Fin de Proyecto' },
    { value: 'ad_hoc', label: 'Ad-hoc' },
];

const ESTADO_FILTER = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'en_curso', label: 'En curso' },
    { value: 'finalizada', label: 'Finalizada' },
    { value: 'firmada', label: 'Firmada' },
];

const Evaluaciones = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Permisos del módulo empresas
    const isEmpleadoUser = user?.esEmpleado && !user?.esAdministrador;
    const userPermisos = user?.rol?.permisos || [];
    const canRead = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'leer');
    const canCreate = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'crear');
    const canEdit = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'actualizar');
    const canDelete = !isEmpleadoUser || user?.esAdministrador || userPermisos.some(p => p.modulo === 'evaluaciones' && p.accion === 'eliminar');

    // Data State
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Filters
    const [filterActivo, setFilterActivo] = useState('true');
    const [filterPeriodo, setFilterPeriodo] = useState('');
    const [filterEstado, setFilterEstado] = useState('');
    const [filterEspacio, setFilterEspacio] = useState(null);
    const [filterEvaluado, setFilterEvaluado] = useState(null);
    const [filterPuntajeMin, setFilterPuntajeMin] = useState('');
    const [filterPuntajeMax, setFilterPuntajeMax] = useState('');
    const [filterEscala, setFilterEscala] = useState('');

    // Filter lists
    const [empleadosList, setEmpleadosList] = useState([]);
    const [espaciosList, setEspaciosList] = useState([]);
    const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Column Visibility
    const [visibleColumns, setVisibleColumns] = useState({
        empleadoEvaluado: true,
        espacio: false,
        puntaje: false,
        escala: true,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Modal State
    const [showForm, setShowForm] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Delete Confirmation
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Theme observer
    useEffect(() => {
        const obs = new MutationObserver(() => setIsDark(document.documentElement.classList.contains('dark')));
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => obs.disconnect();
    }, []);

    // Redirigir si no tiene permiso de lectura
    useEffect(() => {
        if (user && isEmpleadoUser && !canRead) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isEmpleadoUser, canRead, navigate]);

    // Load filter data
    useEffect(() => {
        const load = async () => {
            try {
                const [empRes, espRes] = await Promise.all([
                    getEmpleados({ limit: 500, activo: 'true' }),
                    getEspaciosTrabajo({ limit: 200, activo: 'true' }),
                ]);
                setEmpleadosList(empRes.data || []);
                setEspaciosList(espRes.data || []);
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    // Permisos y restricciones
    const isRestricted = user?.esEmpleado && !user?.esAdministrador;
    const hasFullAccess = user?.esAdministrador || (user?.rol?.permisos?.some(p => p.modulo === 'evaluaciones' && ['crear', 'actualizar', 'eliminar'].includes(p.accion)));
    const isSingleEmployee = (empleadosList.length === 1 && isRestricted) || (isRestricted && !hasFullAccess);
    const isSingleWorkspace = espaciosList.length === 1 && isRestricted;

    // Auto-select espacio y evaluado para usuarios restringidos
    useEffect(() => {
        if (isRestricted) {
            if (espaciosList.length === 1 && !filterEspacio) {
                setFilterEspacio({ value: espaciosList[0].id, label: espaciosList[0].nombre });
            }
            if (!filterEvaluado) {
                if (empleadosList.length === 1) {
                    const emp = empleadosList[0];
                    const label = `${emp.usuario?.apellido || emp.apellido}, ${emp.usuario?.nombre || emp.nombre}`;
                    setFilterEvaluado({ value: emp.id, label });
                } else if (!hasFullAccess && user?.empleadoId) {
                    const myEmp = empleadosList.find(e => e.id === user.empleadoId);
                    if (myEmp) {
                        const label = `${myEmp.usuario?.apellido || myEmp.apellido}, ${myEmp.usuario?.nombre || myEmp.nombre}`;
                        setFilterEvaluado({ value: myEmp.id, label });
                    }
                }
            }
        }
    }, [user, espaciosList, empleadosList, filterEspacio, filterEvaluado, isRestricted, hasFullAccess]);

    // Build select options
    const empleadoOptions = Object.values(
        (empleadosList).reduce((acc, emp) => {
            const ws = emp.espacioTrabajo?.nombre || 'Sin Espacio';
            if (!acc[ws]) acc[ws] = { label: ws, options: [] };
            const ap = emp.usuario?.apellido || emp.apellido || '';
            const nm = emp.usuario?.nombre || emp.nombre || '';
            acc[ws].options.push({ value: emp.id, label: `${ap}, ${nm}` });
            return acc;
        }, {})
    );
    const espacioOptions = espaciosList.map(e => ({ value: e.id, label: e.nombre }));
    const selectStyles = buildSelectStyles(isDark);

    // Load Items
    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                periodo: filterPeriodo,
                estado: filterEstado,
                activo: filterActivo,
                page,
                limit,
            };
            if (filterEspacio) params.espacioTrabajoId = filterEspacio.value;
            if (filterEvaluado) params.evaluadoId = filterEvaluado.value;
            if (filterPuntajeMin) params.puntajeMin = filterPuntajeMin;
            if (filterPuntajeMax) params.puntajeMax = filterPuntajeMax;
            if (filterEscala) params.escala = filterEscala;
            const result = await getEvaluaciones(params);
            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterPeriodo, filterEstado, filterActivo, page, limit, filterEspacio, filterEvaluado, filterPuntajeMin, filterPuntajeMax, filterEscala]);

    useEffect(() => { loadItems(); }, [loadItems]);

    // Handlers
    const clearFilters = () => {
        setFilterActivo('true');
        setFilterPeriodo('');
        setFilterEstado('');
        if (!isSingleWorkspace) setFilterEspacio(null);
        if (!isSingleEmployee) setFilterEvaluado(null);
        setFilterPuntajeMin('');
        setFilterPuntajeMax('');
        setFilterEscala('');
        setPage(1);
    };

    const hasActiveFilters = filterActivo !== 'true' || filterPeriodo || filterEstado || (!isSingleWorkspace && filterEspacio) || (!isSingleEmployee && filterEvaluado) || filterPuntajeMin || filterPuntajeMax || filterEscala;

    // Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(items.filter(item => item.estado !== 'firmada').map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const selectableItems = items.filter(item => item.estado !== 'firmada');
    const allSelected = selectableItems.length > 0 && selectableItems.every(item => selectedIds.has(item.id));
    const someSelected = items.some(item => selectedIds.has(item.id)) && !allSelected;

    // Column Toggle
    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    // CRUD Handlers
    const handleCreate = () => {
        setEditingItem(null);
        setShowForm(true);
        setError('');
        setSuccess('');
    };

    const handleEdit = async (item) => {
        try {
            const fullItem = await getEvaluacionById(item.id);
            setEditingItem(fullItem);
            setShowForm(true);
            setError('');
            setSuccess('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleView = async (item) => {
        try {
            const fullItem = await getEvaluacionById(item.id);
            setSelectedItem(fullItem);
            setShowDetail(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingItem(null);
    };

    const handleFormSuccess = () => {
        handleCloseForm();
        if (editingItem) {
            setSuccess('Evaluación actualizada correctamente');
        } else {
            setSuccess('Evaluación creada correctamente');
        }
        loadItems();
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEvaluacion(itemToDelete.id);
            setSuccess('Evaluación desactivada correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmOpen(false);
            setItemToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setConfirmOpen(false);
        setItemToDelete(null);
    };

    const handleBulkDeleteClick = () => {
        if (selectedIds.size === 0) return;
        setConfirmBulkOpen(true);
    };

    const handleConfirmBulkDelete = async () => {
        try {
            await deleteEvaluacionesBulk(Array.from(selectedIds));
            setSuccess(`${selectedIds.size} evaluación(es) desactivada(s) correctamente`);
            setSelectedIds(new Set());
            loadItems();
        } catch (err) {
            setError(err.message);
        } finally {
            setConfirmBulkOpen(false);
        }
    };

    const handleReactivate = async (item) => {
        try {
            await reactivateEvaluacion(item.id);
            setSuccess('Evaluación reactivada correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        }
    };

    const showingInactive = filterActivo === 'false';

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Evaluaciones</h1>
                    <p className="page-subtitle">Gestiona las evaluaciones de desempeño</p>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
                    {error}
                    <button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}
            {success && (
                <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
                    {success}
                    <button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
                </div>
            )}

            {/* Card */}
            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Evaluaciones</h3>
                        <span className="selection-indicator">
                            {selectedIds.size} de {total} seleccionados
                        </span>
                    </div>
                    <div className="header-actions">
                        {selectedIds.size > 0 && !showingInactive && canDelete && (
                            <button className="btn btn-danger" onClick={handleBulkDeleteClick}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                                Desactivar seleccionados
                            </button>
                        )}
                        {canCreate && (
                            <button className="btn btn-primary" onClick={handleCreate}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nueva Evaluación
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filters-inputs">
                        <div className="filter-group" style={{ minWidth: '160px' }}>
                            <Select isDisabled={isSingleWorkspace} options={espacioOptions} value={filterEspacio} onChange={opt => { setFilterEspacio(opt); setPage(1); }} placeholder="Espacio..." isClearable={!isSingleWorkspace} styles={selectStyles} menuPortalTarget={document.body} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group" style={{ minWidth: '200px' }}>
                            <Select isDisabled={isSingleEmployee} options={empleadoOptions} value={filterEvaluado} onChange={opt => { setFilterEvaluado(opt); setPage(1); }} placeholder="Evaluado..." isClearable={!isSingleEmployee} styles={selectStyles} menuPortalTarget={document.body} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterPeriodo} onChange={(e) => { setFilterPeriodo(e.target.value); setPage(1); }}>
                                <option value="">Todos los períodos</option>
                                {PERIODO_FILTER.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}>
                                <option value="">Todos los estados</option>
                                {ESTADO_FILTER.map(e => (
                                    <option key={e.value} value={e.value}>{e.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterEscala} onChange={(e) => { setFilterEscala(e.target.value); setPage(1); }}>
                                <option value="">Escala</option>
                                <option value="supera_expectativas">Supera Expectativas</option>
                                <option value="cumple">Cumple</option>
                                <option value="necesita_mejora">Necesita Mejora</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <input type="number" className="filter-input" placeholder="Puntaje mín." value={filterPuntajeMin} onChange={e => { setFilterPuntajeMin(e.target.value); setPage(1); }} style={{ width: '200px' }} min="0" max="100" />
                        </div>
                        <div className="filter-group">
                            <input type="number" className="filter-input" placeholder="Puntaje máx." value={filterPuntajeMax} onChange={e => { setFilterPuntajeMax(e.target.value); setPage(1); }} style={{ width: '200px' }} min="0" max="100" />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterActivo} onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }}>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                    </div>
                    <div className="filters-actions">
                        <div className="column-selector-wrapper">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnSelector(!showColumnSelector)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Columnas
                            </button>
                            {showColumnSelector && (
                                <div className="column-selector-dropdown">
                                    {Object.entries({ empleadoEvaluado: 'Evaluado', espacio: 'Espacio', puntaje: 'Puntaje', escala: 'Escala' }).map(([key, label]) => (
                                        <label key={key} className="column-option">
                                            <input type="checkbox" checked={visibleColumns[key]} onChange={() => toggleColumn(key)} />
                                            <span>{label}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="loading"><div className="spinner"></div></div>
                ) : items.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                        </svg>
                        <h3>No hay evaluaciones {showingInactive ? 'inactivas' : ''}</h3>
                        <p>{showingInactive ? 'No hay evaluaciones desactivadas' : 'Crea una nueva evaluación para comenzar'}</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={handleSelectAll} />
                                        </th>
                                        <th>Período</th>
                                        <th>Tipo</th>
                                        {visibleColumns.empleadoEvaluado && <th>Evaluado</th>}
                                        {visibleColumns.espacio && <th>Espacio</th>}
                                        <th style={{ textAlign: 'center' }}>Estado</th>
                                        {visibleColumns.puntaje && <th style={{ textAlign: 'center' }}>Puntaje</th>}
                                        {visibleColumns.escala && <th style={{ textAlign: 'center' }}>Escala</th>}
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                            <td><input type="checkbox" disabled={item.estado === 'firmada'} checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                            <td>
                                                <strong>{truncateText(PERIODO_LABELS[item.periodo] || item.periodo, 15)}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                    {formatDate(item.fecha)}
                                                </div>
                                            </td>
                                            <td>{truncateText(TIPO_EVALUACION_LABELS[item.tipoEvaluacion] || item.tipoEvaluacion, 15)}</td>
                                            {visibleColumns.empleadoEvaluado && (
                                                <td>
                                                    {item.contratoEvaluado?.empleado ? (
                                                        <>
                                                            <strong>{truncateText(item.contratoEvaluado.empleado.usuario.apellido + ', ' + item.contratoEvaluado.empleado.usuario.nombre, 15)}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {truncateText(item.contratoEvaluado.puestos?.[0]?.nombre || 'Sin puesto', 15)}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin evaluado</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.espacio && <td>{truncateText(item.contratoEvaluado?.empleado?.espacioTrabajo?.nombre || '-')}</td>}
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '0.3rem',
                                                    fontSize: '0.8rem',
                                                    padding: '0.2rem 0.5rem',
                                                    borderRadius: '9999px',
                                                    background: `${ESTADO_COLORS[item.estado]}20`,
                                                    color: ESTADO_COLORS[item.estado],
                                                    fontWeight: 600
                                                }}>
                                                    {ESTADO_LABELS[item.estado] || item.estado}
                                                </span>
                                            </td>
                                            {visibleColumns.puntaje && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <strong>{item.puntaje}</strong>
                                                </td>
                                            )}
                                            {visibleColumns.escala && (
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        fontSize: '0.8rem',
                                                        padding: '0.2rem 0.5rem',
                                                        borderRadius: '9999px',
                                                        background: `${ESCALA_COLORS[item.escala]}20`,
                                                        color: ESCALA_COLORS[item.escala],
                                                        fontWeight: 600
                                                    }}>
                                                        {ESCALA_LABELS[item.escala] || item.escala}
                                                    </span>
                                                </td>
                                            )}
                                            <td>
                                                <div className="table-actions">
                                                    {showingInactive ? (
                                                        canEdit && (
                                                            <button className="btn btn-success btn-sm" onClick={() => handleReactivate(item)} title="Reactivar">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                                </svg>
                                                                Reactivar
                                                            </button>
                                                        )
                                                    ) : (
                                                        <>
                                                            <button className="btn btn-info btn-sm" onClick={() => handleView(item)} title="Ver">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                Ver
                                                            </button>
                                                            {canEdit && item.estado !== 'firmada' && (
                                                                <button className="btn btn-warning btn-sm" onClick={() => handleEdit(item)} title="Editar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                    Editar
                                                                </button>
                                                            )}
                                                            {canDelete && item.estado !== 'firmada' && (
                                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(item)} title="Desactivar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                    Desactivar
                                                                </button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                <span>Filas por página:</span>
                                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="pagination-select">
                                    {ROWS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <span className="pagination-total">
                                    {((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}
                                </span>
                            </div>
                            <div className="pagination-controls">
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(1)}>«</button>
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
                                <span className="pagination-page">Página {page} de {totalPages || 1}</span>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>›</button>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>»</button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modals */}
            {showForm && (
                <EvaluacionWizard evaluacion={editingItem} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
            )}

            {showDetail && selectedItem && (
                <EvaluacionDetail
                    evaluacion={selectedItem}
                    onClose={() => { setShowDetail(false); setSelectedItem(null); }}
                    onEdit={(eval_) => {
                        setShowDetail(false);
                        setSelectedItem(null);
                        setEditingItem(eval_);
                        setShowForm(true);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Desactivar evaluación"
                message={itemToDelete ? `¿Estás seguro de desactivar esta evaluación? Podrás reactivarla más tarde.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Desactivar"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={confirmBulkOpen}
                title="Desactivar evaluaciones"
                message={`¿Estás seguro de desactivar ${selectedIds.size} evaluación(es)? Podrás reactivarlas más tarde.`}
                onConfirm={handleConfirmBulkDelete}
                onCancel={() => setConfirmBulkOpen(false)}
                confirmText="Desactivar todos"
                variant="danger"
            />
        </div>
    );
};

export default Evaluaciones;

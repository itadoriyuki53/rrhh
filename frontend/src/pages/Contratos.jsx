/**
 * @fileoverview Panel de administración y visualización de contratos laborales.
 * @module pages/Contratos
 */

import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';
import {
    getContratos, deleteContrato, deleteContratosBulk,
    getContratoById, reactivateContrato,
    getEmpleados, getEspaciosTrabajo, getCurrentUser,
} from '../services/api';
import { formatDateOnly, formatCurrency, truncateText } from '../helpers/formatters';
import { useIsDark, useModulePermissions } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';
import ContratoWizard from '../components/ContratoWizard';
import ContratoDetail from '../components/ContratoDetail';
import ConfirmDialog from '../components/ConfirmDialog';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

const TIPOS_CONTRATO_LABELS = {
    tiempo_indeterminado: 'Tiempo Indeterminado', periodo_prueba: 'PerÃ­odo de Prueba',
    plazo_fijo: 'Plazo Fijo', eventual: 'Eventual', teletrabajo: 'Teletrabajo',
    locacion_servicios: 'LocaciÃ³n de Servicios', monotributista: 'Monotributista',
    responsable_inscripto: 'Responsable Inscripto', honorarios: 'Honorarios',
    contrato_obra: 'Contrato de Obra', pasantia_educativa: 'PasantÃ­a Educativa',
    beca: 'Beca', ad_honorem: 'Ad honorem',
};

const TIPOS_CONTRATO_FILTER = Object.entries(TIPOS_CONTRATO_LABELS).map(([value, label]) => ({ value, label }));



/**
 * Componente Contratos
 * 
 * Panel de administración de contratos de la plataforma. Configuración de hooks como useIsDark base, 
 * useModulePermissions para lecto/escritura y callbacks para control del flujo de estados.
 * 
 * @returns {JSX.Element}
 */
const Contratos = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();

    const { isEmpleadoUser, canRead, canCreate, canEdit, canDelete } = useModulePermissions(user, 'contratos');

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterActivo, setFilterActivo] = useState('true');
    const [filterTipoContrato, setFilterTipoContrato] = useState('');
    const [filterEspacio, setFilterEspacio] = useState(null);
    const [filterEmpleado, setFilterEmpleado] = useState(null);
    const [filterEstado, setFilterEstado] = useState('');
    const [filterSalarioMin, setFilterSalarioMin] = useState('');
    const [filterSalarioMax, setFilterSalarioMax] = useState('');
    const [salarioMinInput, setSalarioMinInput] = useState('');
    const [salarioMaxInput, setSalarioMaxInput] = useState('');
    const [empleadosList, setEmpleadosList] = useState([]);
    const [espaciosList, setEspaciosList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const isDark = useIsDark();
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [visibleColumns, setVisibleColumns] = useState({ espacio: false, tipoContrato: true, estado: true, salario: true });
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [showWizard, setShowWizard] = useState(false);
    const [modoMultiple, setModoMultiple] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [empleadoPreseleccionado, setEmpleadoPreseleccionado] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);



    // Redirigir si no tiene permiso de lectura
    useEffect(() => {
        if (user && isEmpleadoUser && !canRead) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isEmpleadoUser, canRead, navigate]);

    useEffect(() => {
        const load = async () => {
            try {
                const [empRes, espRes, userMe] = await Promise.all([
                    getEmpleados({ limit: 500, activo: 'true' }),
                    getEspaciosTrabajo({ limit: 200, activo: 'true' }),
                    getCurrentUser(),
                ]);
                setEmpleadosList(empRes.data || []);
                setEspaciosList(espRes.data || []);
                setCurrentUser(userMe);

                if (userMe && userMe.esEmpleado) {
                    const espacios = espRes.data || [];
                    if (userMe.espacioTrabajoId) {
                        const miEspacio = espacios.find(e => e.id === userMe.espacioTrabajoId);
                        if (miEspacio) {
                            setFilterEspacio({ value: miEspacio.id, label: miEspacio.nombre });
                        }
                    }
                }
            } catch (e) { console.error(e); }
        };
        load();
    }, []);

    const empleadoOptions = Object.values(
        (empleadosList).reduce((acc, emp) => {
            const ws = emp.espacioTrabajo?.nombre || 'Sin Espacio';
            if (!acc[ws]) acc[ws] = { label: ws, options: [] };
            const ap = emp.usuario?.apellido || emp.apellido || '';
            const nm = emp.usuario?.nombre || emp.nombre || '';
            const doc = emp.numeroDocumento || '';
            acc[ws].options.push({ value: emp.id, label: `${ap}, ${nm}${doc ? ` - ${doc}` : ''}` });
            return acc;
        }, {})
    );

    const espacioOptions = espaciosList.map(e => ({ value: e.id, label: e.nombre }));
    const selectStyles = buildSelectStyles(isDark);

    useEffect(() => {
        if (location.state?.empleadoPreseleccionado) {
            setEmpleadoPreseleccionado(location.state.empleadoPreseleccionado);
            setShowWizard(true);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, navigate, location.pathname]);

    // Debounce Search (Salario Minimo y Maximo)
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterSalarioMin(salarioMinInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [salarioMinInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterSalarioMax(salarioMaxInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [salarioMaxInput]);

    /**
     * Refresca la vista de contratos llamando al servicio `getContratos`.
     * Aplica filtros de visibilidad, espacios, salarios y paginado activo.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const params = { tipoContrato: filterTipoContrato, activo: filterActivo, page, limit };
            if (filterEspacio) params.espacioTrabajoId = filterEspacio.value;
            if (filterEmpleado) params.empleadoId = filterEmpleado.value;
            if (filterEstado) params.estado = filterEstado;
            if (filterSalarioMin) params.salarioMin = filterSalarioMin;
            if (filterSalarioMax) params.salarioMax = filterSalarioMax;
            const result = await getContratos(params);
            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterTipoContrato, filterActivo, page, limit, filterEspacio, filterEmpleado, filterEstado, filterSalarioMin, filterSalarioMax]);

    useEffect(() => { loadItems(); }, [loadItems]);

    /**
     * Restablece activamente y elimina todos los filtros aplicados a la vista de datos.
     * 
     * @returns {void}
     */
    const clearFilters = () => {
        setFilterActivo('true'); setFilterTipoContrato('');
        if (!currentUser || !currentUser.esEmpleado) {
            setFilterEspacio(null);
        }
        setFilterEmpleado(null);
        setFilterEstado('');
        setFilterSalarioMin('');
        setFilterSalarioMax('');
        setSalarioMinInput('');
        setSalarioMaxInput('');
        setPage(1);
    };

    const isEmpleado = currentUser && currentUser.esEmpleado;
    const hasActiveFilters = filterActivo !== 'true' || filterTipoContrato || (!isEmpleado && filterEspacio) || filterEmpleado || filterEstado || filterSalarioMin || filterSalarioMax;
    const toggleColumn = (col) => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? new Set(items.filter(i => i.estado !== 'finalizado').map(i => i.id)) : new Set());
    };
    const handleSelectOne = (id) => {
        const s = new Set(selectedIds);
        s.has(id) ? s.delete(id) : s.add(id);
        setSelectedIds(s);
    };
    const selectableItems = items.filter(i => i.estado !== 'finalizado');
    const allSelected = selectableItems.length > 0 && selectableItems.every(i => selectedIds.has(i.id));
    const someSelected = items.some(i => selectedIds.has(i.id)) && !allSelected;

    const handleEdit = async (item) => {
        try { const f = await getContratoById(item.id); setEditingItem(f); setModoMultiple(false); setShowWizard(true); setError(''); setSuccess(''); }
        catch (err) { setError(err.message); }
    };
    const handleView = async (item) => {
        try { const f = await getContratoById(item.id); setSelectedItem(f); setShowDetail(true); }
        catch (err) { setError(err.message); }
    };
    const handleCloseWizard = () => { setShowWizard(false); setEditingItem(null); setEmpleadoPreseleccionado(null); };
    const handleWizardSuccess = (count = 1) => {
        handleCloseWizard();
        setSuccess(editingItem ? 'Contrato actualizado correctamente' : (count > 1 ? `${count} contratos creados` : 'Contrato creado correctamente'));
        loadItems();
    };
    const handleDeleteClick = (item) => { setItemToDelete(item); setConfirmOpen(true); };
    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try { await deleteContrato(itemToDelete.id); setSuccess('Contrato desactivado correctamente'); loadItems(); }
        catch (err) { setError(err.message); }
        finally { setConfirmOpen(false); setItemToDelete(null); }
    };
    const handleConfirmBulkDelete = async () => {
        try { await deleteContratosBulk(Array.from(selectedIds)); setSuccess(`${selectedIds.size} contrato(s) desactivado(s)`); setSelectedIds(new Set()); loadItems(); }
        catch (err) { setError(err.message); }
        finally { setConfirmBulkOpen(false); }
    };
    const handleReactivate = async (item) => {
        try { await reactivateContrato(item.id); setSuccess('Contrato reactivado correctamente'); loadItems(); }
        catch (err) { setError(err.message); }
    };
    const showingInactive = filterActivo === 'false';

    const SVG_GEAR = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Contratos</h1>
                    <p className="page-subtitle">Gestiona los contratos laborales de los empleados</p>
                </div>
            </div>
            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}<button onClick={() => setError('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>âœ•</button></div>}
            {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{success}<button onClick={() => setSuccess('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>âœ•</button></div>}
            <div className="card">
                <div className="card-header">
                    <div className="header-left">
                        <h3 className="card-title">Listado de Contratos</h3>
                        <span className="selection-indicator">{selectedIds.size} de {total} seleccionados</span>
                    </div>
                    <div className="header-actions">
                        {selectedIds.size > 0 && !showingInactive && canDelete && (
                            <button className="btn btn-danger" onClick={() => setConfirmBulkOpen(true)}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                Desactivar seleccionados
                            </button>
                        )}
                        {canCreate && (
                            <button className="btn btn-primary" onClick={() => { setEditingItem(null); setEmpleadoPreseleccionado(null); setModoMultiple(true); setShowWizard(true); setError(''); setSuccess(''); }}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                                Nuevo Contrato
                            </button>
                        )}
                    </div>
                </div>
                {/* Filters */}
                <div className="filters-bar">
                    <div className="filters-inputs">
                        <div className="filter-group" style={{ width: '200px' }}>
                            <Select
                                options={espacioOptions}
                                value={filterEspacio}
                                onChange={opt => { setFilterEspacio(opt); setPage(1); }}
                                placeholder="Espacio..."
                                isClearable={!currentUser?.esEmpleado}
                                isDisabled={currentUser && currentUser.esEmpleado}
                                styles={selectStyles}
                                menuPortalTarget={document.body}
                                noOptionsMessage={() => 'Sin resultados'}
                            />
                        </div>
                        <div className="filter-group" style={{ width: '200px' }}>
                            <Select options={empleadoOptions} value={filterEmpleado} onChange={opt => { setFilterEmpleado(opt); setPage(1); }} placeholder="Empleado..." isClearable styles={selectStyles} menuPortalTarget={document.body} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterTipoContrato} onChange={(e) => { setFilterTipoContrato(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="">Tipo de contrato</option>
                                {TIPOS_CONTRATO_FILTER.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterEstado} onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="">Estado</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="en_curso">En Curso</option>
                                <option value="finalizado">Finalizado</option>
                            </select>
                        </div>
                        <div className="filter-group">
                            <input type="number" className="filter-input" placeholder="Salario mÃ­n." value={salarioMinInput} onChange={e => setSalarioMinInput(e.target.value)} style={{ width: '200px' }} min="0" />
                        </div>
                        <div className="filter-group">
                            <input type="number" className="filter-input" placeholder="Salario mÃ¡x." value={salarioMaxInput} onChange={e => setSalarioMaxInput(e.target.value)} style={{ width: '200px' }} min="0" />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterActivo} onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="true">Activos</option>
                                <option value="false">Inactivos</option>
                            </select>
                        </div>
                    </div>
                    <div className="filters-actions">
                        <div className="column-selector-wrapper">
                            <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnSelector(!showColumnSelector)}>{SVG_GEAR} Columnas</button>
                            {showColumnSelector && (
                                <div className="column-selector-dropdown">
                                    {Object.entries({ espacio: 'Espacio', tipoContrato: 'Tipo', estado: 'Estado', salario: 'Salario' }).map(([k, l]) => (
                                        <label key={k} className="column-option">
                                            <input type="checkbox" checked={visibleColumns[k]} onChange={() => toggleColumn(k)} /><span>{l}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        {hasActiveFilters && (
                            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg> Limpiar
                            </button>
                        )}
                    </div>
                </div>
                {loading ? (<div className="loading"><div className="spinner"></div></div>) : items.length === 0 ? (
                    <div className="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>
                        <h3>No hay contratos {showingInactive ? 'inactivos' : ''}</h3>
                        <p>{showingInactive ? 'No hay contratos desactivados' : 'Crea un nuevo contrato para comenzar'}</p>
                    </div>
                ) : (
                    <>
                        <div className="table-container">
                            <table className="table">
                                <thead><tr>
                                    <th style={{ width: '40px' }}><input type="checkbox" checked={allSelected} ref={input => { if (input) input.indeterminate = someSelected; }} onChange={handleSelectAll} /></th>
                                    <th>Empleado</th>
                                    {visibleColumns.espacio && <th>Espacio</th>}
                                    {visibleColumns.tipoContrato && <th>Tipo</th>}
                                    {visibleColumns.estado && <th>Estado</th>}
                                    {visibleColumns.salario && <th>Salario</th>}
                                    <th>Inicio</th>
                                    <th>Acciones</th>
                                </tr></thead>
                                <tbody>
                                    {items.map((item) => {
                                        const hoy = new Date();
                                        const fin = item.fechaFin ? new Date(item.fechaFin) : null;
                                        const dias = fin ? Math.ceil((fin - hoy) / 86400000) : null;
                                        const estado = item.estado == 'finalizado' ? 'Finalizado' : item.estado == 'en_curso' ? 'En Curso' : item.estado == 'pendiente' ? 'Pendiente' : 'Indefinido';
                                        const eColor = { Finalizado: '#ef4444', 'En Curso': '#3b82f6', Pendiente: '#f59e0b' }[estado] || '#64748b';
                                        const ap = item.empleado?.usuario?.apellido || item.empleado?.apellido || '';
                                        const nm = item.empleado?.usuario?.nombre || item.empleado?.nombre || '';
                                        return (
                                            <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                                <td><input type="checkbox" disabled={item.estado === 'finalizado'} checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                <td>
                                                    <strong>{truncateText(ap + ', ' + nm, 15)}</strong>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.empleado?.numeroDocumento}</div>
                                                </td>
                                                {visibleColumns.espacio && <td>{truncateText(item.empleado?.espacioTrabajo?.nombre || '-')}</td>}
                                                {visibleColumns.tipoContrato && <td>{truncateText(TIPOS_CONTRATO_LABELS[item.tipoContrato] || item.tipoContrato, 15)}</td>}
                                                {visibleColumns.estado && <td><span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '9999px', background: `${eColor}20`, color: eColor, fontWeight: 600 }}>{estado}</span></td>}
                                                {visibleColumns.salario && <td><strong>{formatCurrency(item.salario)}</strong></td>}
                                                <td>{formatDate(item.fechaInicio)}</td>
                                                <td>
                                                    <div className="table-actions">
                                                        {showingInactive ? (
                                                            canEdit && (
                                                                <button className="btn btn-success btn-sm" onClick={() => handleReactivate(item)}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                                                                    Reactivar
                                                                </button>
                                                            )
                                                        ) : (
                                                            <>
                                                                <button className="btn btn-info btn-sm" onClick={() => handleView(item)}>
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                                    Ver
                                                                </button>
                                                                {canEdit && item.estado !== 'finalizado' && (
                                                                    <button className="btn btn-warning btn-sm" onClick={() => handleEdit(item)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                                                                        Editar
                                                                    </button>
                                                                )}
                                                                {canDelete && item.estado !== 'finalizado' && (
                                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(item)}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                                                                        Desactivar
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="pagination-bar">
                            <div className="pagination-info">
                                <span>Filas por pÃ¡gina:</span>
                                <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }} className="pagination-select">{ROWS_PER_PAGE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                                <span className="pagination-total">{((page - 1) * limit) + 1}-{Math.min(page * limit, total)} de {total}</span>
                            </div>
                            <div className="pagination-controls">
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(1)}>Â«</button>
                                <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>â€¹</button>
                                <span className="pagination-page">PÃ¡gina {page} de {totalPages || 1}</span>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>â€º</button>
                                <button className="btn btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}>Â»</button>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {showWizard && <ContratoWizard contrato={editingItem} onClose={handleCloseWizard} onSuccess={handleWizardSuccess} empleadoPreseleccionado={empleadoPreseleccionado} />}
            {showDetail && selectedItem && (
                <ContratoDetail contrato={selectedItem} onClose={() => { setShowDetail(false); setSelectedItem(null); }} onEdit={(c) => { setShowDetail(false); setSelectedItem(null); setEditingItem(c); setModoMultiple(false); setShowWizard(true); }} />
            )}
            <ConfirmDialog isOpen={confirmOpen} title="Desactivar contrato" message="Â¿EstÃ¡s seguro de desactivar este contrato? PodrÃ¡s reactivarlo mÃ¡s tarde." onConfirm={handleConfirmDelete} onCancel={() => { setConfirmOpen(false); setItemToDelete(null); }} confirmText="Desactivar" variant="danger" />
            <ConfirmDialog isOpen={confirmBulkOpen} title="Desactivar contratos" message={`Â¿Desactivar ${selectedIds.size} contrato(s)? PodrÃ¡s reactivarlos mÃ¡s tarde.`} onConfirm={handleConfirmBulkDelete} onCancel={() => setConfirmBulkOpen(false)} confirmText="Desactivar todos" variant="danger" />
        </div>
    );
};

export default Contratos;


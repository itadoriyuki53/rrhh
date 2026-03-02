/**
 * @fileoverview Administración de las empresas que componen el grupo o plataforma.
 * @module pages/Empresas
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Select from 'react-select';
import {
    getEmpresas,
    deleteEmpresa,
    deleteEmpresasBulk,
    getEmpresaById,
    reactivateEmpresa,
    getEspaciosTrabajo,
    getCurrentUser,
} from '../services/api';
import EmpresaWizard from '../components/EmpresaWizard';
import EmpresaDetail from '../components/EmpresaDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import { truncateText } from '../helpers/formatters';
import { useIsDark, useModulePermissions } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

/**
 * Componente Empresas
 * 
 * Interfaz interactiva para el sistema multipropiedad de RRHH. Controla listados de Empresas.
 * Conectado con helper useIsDark para la paleta UI react-select unificada.
 * 
 * @returns {JSX.Element}
 */
const Empresas = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { isEmpleadoUser, canRead, canCreate, canEdit, canDelete } = useModulePermissions(user, 'empresas');

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
    const [searchInput, setSearchInput] = useState('');
    const [filterNombre, setFilterNombre] = useState('');
    const [filterActivo, setFilterActivo] = useState('true');
    const [filterEspacio, setFilterEspacio] = useState(null);
    const [filterEmail, setFilterEmail] = useState('');
    const [emailInput, setEmailInput] = useState('');
    const [filterTelefono, setFilterTelefono] = useState('');
    const [telefonoInput, setTelefonoInput] = useState('');
    const [filterIndustria, setFilterIndustria] = useState('');
    const [industriaInput, setIndustriaInput] = useState('');
    const [filterDireccion, setFilterDireccion] = useState('');
    const [direccionInput, setDireccionInput] = useState('');

    const [currentUser, setCurrentUser] = useState(null);

    // Filter lists
    const [espaciosList, setEspaciosList] = useState([]);
    const isDark = useIsDark();

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Column Visibility
    const [visibleColumns, setVisibleColumns] = useState({
        espacio: false,
        email: true,
        telefono: true,
        industria: true,
        direccion: false,
    });
    const [showColumnSelector, setShowColumnSelector] = useState(false);

    // Modal State
    const [showWizard, setShowWizard] = useState(false);
    const [showDetail, setShowDetail] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);

    // Delete Confirmation
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmBulkOpen, setConfirmBulkOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);



    // Redirigir si no tiene permiso de lectura
    useEffect(() => {
        if (user && isEmpleadoUser && !canRead) {
            navigate('/dashboard', { replace: true });
        }
    }, [user, isEmpleadoUser, canRead, navigate]);

    // Load filter data
    // Load Initial Data
    useEffect(() => {
        const load = async () => {
            try {
                const [espaciosRes, userMe] = await Promise.all([
                    getEspaciosTrabajo({ limit: 200, activo: 'true' }),
                    getCurrentUser()
                ]);
                setEspaciosList(espaciosRes.data || []);
                setCurrentUser(userMe);

                // Lógica de preselección de espacio SOLO SI ES EMPLEADO
                if (userMe && userMe.esEmpleado) {
                    const espacios = espaciosRes.data || [];
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

    const espacioOptions = espaciosList.map(e => ({ value: e.id, label: e.nombre }));
    const selectStyles = buildSelectStyles(isDark);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterNombre(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterEmail(emailInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [emailInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterTelefono(telefonoInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [telefonoInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterIndustria(industriaInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [industriaInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterDireccion(direccionInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [direccionInput]);

    /**
     * Reconstruye y refresca los datos de empresas llamando al servicio `getEmpresas`.
     * Filtra por nombre, email, industria y estado activo, gestionando el paginado local.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                search: filterNombre,
                activo: filterActivo,
                page,
                limit,
                espacioTrabajoId: filterEspacio?.value,
                email: filterEmail,
                telefono: filterTelefono,
                industria: filterIndustria,
                direccion: filterDireccion,
            };

            const result = await getEmpresas(params);
            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterNombre, page, limit, filterActivo, filterEspacio, filterEmail, filterTelefono, filterIndustria, filterDireccion]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    // Handlers
    /**
     * Restablece activamente y elimina todos los filtros aplicados a la vista de datos.
     * 
     * @returns {void}
     */
    const clearFilters = () => {
        setSearchInput('');
        setFilterNombre('');
        setFilterActivo('true');
        // Si es empleado, no limpiar el filtro de espacio
        if (!currentUser || !currentUser.esEmpleado) {
            setFilterEspacio(null);
        }
        setFilterEmail('');
        setFilterTelefono('');
        setFilterIndustria('');
        setFilterDireccion('');
        setEmailInput('');
        setTelefonoInput('');
        setIndustriaInput('');
        setDireccionInput('');
        setPage(1);
    };

    const isEmpleado = currentUser && currentUser.esEmpleado;
    const hasActiveFilters = filterNombre || filterActivo !== 'true' || (!isEmpleado && filterEspacio) || filterEmail || filterTelefono || filterIndustria || filterDireccion;

    // Selection Handlers
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(items.map(item => item.id)));
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

    const allSelected = items.length > 0 && items.every(item => selectedIds.has(item.id));
    const someSelected = items.some(item => selectedIds.has(item.id)) && !allSelected;

    // Column Toggle
    const toggleColumn = (col) => {
        setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
    };

    // CRUD Handlers
    const handleCreate = () => {
        setEditingItem(null);
        setShowWizard(true);
        setError('');
        setSuccess('');
    };

    const handleEdit = async (item) => {
        try {
            const fullItem = await getEmpresaById(item.id);
            setEditingItem(fullItem);
            setShowWizard(true);
            setError('');
            setSuccess('');
        } catch (err) {
            setError(err.message);
        }
    };

    const handleView = async (item) => {
        try {
            const fullItem = await getEmpresaById(item.id);
            setSelectedItem(fullItem);
            setShowDetail(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCloseWizard = () => {
        setShowWizard(false);
        setEditingItem(null);
    };

    const handleWizardSuccess = () => {
        handleCloseWizard();
        setSuccess(editingItem ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente');
        loadItems();
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEmpresa(itemToDelete.id);
            setSuccess('Empresa desactivada correctamente');
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
            await deleteEmpresasBulk(Array.from(selectedIds));
            setSuccess(`${selectedIds.size} empresa(s) desactivada(s) correctamente`);
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
            await reactivateEmpresa(item.id);
            setSuccess('Empresa reactivada correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        }
    };

    const showingInactive = filterActivo === 'false';

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Empresas</h1>
                    <p className="page-subtitle">Gestiona las empresas del sistema</p>
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
                        <h3 className="card-title">Listado de Empresas</h3>
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
                                Nueva Empresa
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filters-inputs">
                        <div className="filter-group" style={{ minWidth: '200px' }}>
                            <Select
                                options={espacioOptions}
                                value={filterEspacio}
                                onChange={opt => { setFilterEspacio(opt); setPage(1); }}
                                placeholder="Espacio..."
                                isClearable={!currentUser?.esEmpleado}
                                isDisabled={currentUser && currentUser.esEmpleado}
                                styles={selectStyles}
                                noOptionsMessage={() => 'Sin resultados'}
                            />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Buscar por nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Teléfono" value={telefonoInput} onChange={(e) => setTelefonoInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Industria" value={industriaInput} onChange={(e) => setIndustriaInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Dirección" value={direccionInput} onChange={(e) => setDireccionInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterActivo} onChange={(e) => { setFilterActivo(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="true">Activas</option>
                                <option value="false">Inactivas</option>
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
                                    {Object.entries({ espacio: 'Espacio', email: 'Email', telefono: 'Teléfono', industria: 'Industria', direccion: 'Dirección' }).map(([key, label]) => (
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                        </svg>
                        <h3>No hay empresas {showingInactive ? 'inactivas' : ''}</h3>
                        <p>{showingInactive ? 'No hay empresas desactivadas' : 'Crea una nueva empresa para comenzar'}</p>
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
                                        <th>Nombre</th>
                                        {visibleColumns.espacio && <th>Espacio</th>}
                                        {visibleColumns.email && <th>Email</th>}
                                        {visibleColumns.telefono && <th>Teléfono</th>}
                                        {visibleColumns.industria && <th>Industria</th>}
                                        {visibleColumns.direccion && <th>Dirección</th>}
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                            <td><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                            <td><strong>{truncateText(item.nombre, 15)}</strong></td>
                                            {visibleColumns.espacio && <td>{truncateText(item.espacioTrabajo?.nombre || '-')}</td>}
                                            {visibleColumns.email && <td>{truncateText(item.email || '-', 20)}</td>}
                                            {visibleColumns.telefono && <td>{item.telefono || '-'}</td>}
                                            {visibleColumns.industria && <td>{truncateText(item.industria || '-', 15)}</td>}
                                            {visibleColumns.direccion && <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.direccion || '-'}</td>}
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
                                                            {canEdit && (
                                                                <button className="btn btn-warning btn-sm" onClick={() => handleEdit(item)} title="Editar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                    Editar
                                                                </button>
                                                            )}
                                                            {canDelete && (
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
            {showWizard && (
                <EmpresaWizard empresa={editingItem} onClose={handleCloseWizard} onSuccess={handleWizardSuccess} />
            )}

            {showDetail && selectedItem && (
                <EmpresaDetail
                    empresa={selectedItem}
                    onClose={() => { setShowDetail(false); setSelectedItem(null); }}
                    onEdit={(empresa) => {
                        setShowDetail(false);
                        setSelectedItem(null);
                        setEditingItem(empresa);
                        setShowWizard(true);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Desactivar empresa"
                message={itemToDelete ? `¿Estás seguro de desactivar la empresa "${itemToDelete.nombre}"? Podrás reactivarla más tarde.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Desactivar"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={confirmBulkOpen}
                title="Desactivar empresas"
                message={`¿Estás seguro de desactivar ${selectedIds.size} empresa(s)? Podrás reactivarlas más tarde.`}
                onConfirm={handleConfirmBulkDelete}
                onCancel={() => setConfirmBulkOpen(false)}
                confirmText="Desactivar todas"
                variant="danger"
            />
        </div>
    );
};

export default Empresas;


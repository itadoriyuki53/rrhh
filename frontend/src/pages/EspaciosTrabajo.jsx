/**
 * @fileoverview Configuración de espacios organizacionales y definición de límites.
 * @module pages/EspaciosTrabajo
 */

import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import {
    getEspaciosTrabajo,
    deleteEspacioTrabajo,
    deleteEspaciosTrabajoB,
    getEspacioTrabajoById,
    reactivateEspacioTrabajo,
    getUsuarios,
    getCurrentUser,
} from '../services/api';
import EspacioTrabajoFormulario from '../components/EspacioTrabajoFormulario';
import EspacioTrabajoDetail from '../components/EspacioTrabajoDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import { truncateText } from '../helpers/formatters';
import { useIsDark } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

/**
 * Componente EspaciosTrabajo
 * 
 * Configura particiones organizacionales de trabajo (Espacios). Depende de la API
 * local y estandarización de estados a través de utilidades selectStyles y useIsDark.
 * 
 * @returns {JSX.Element}
 */
const EspaciosTrabajo = () => {
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
    const [descripcionInput, setDescripcionInput] = useState('');
    const [filterDescripcion, setFilterDescripcion] = useState('');
    const [filterPropietario, setFilterPropietario] = useState(null);
    const [filterFechaCreacion, setFilterFechaCreacion] = useState('');

    // Filter lists
    const [usuariosList, setUsuariosList] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const isDark = useIsDark();

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Column Visibility
    const [visibleColumns, setVisibleColumns] = useState({
        descripcion: true,
        propietario: true,
        creacion: true,
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



    // Load filter data — solo usuarios no-empleados (admins/staff que pueden ser propietarios)
    useEffect(() => {
        const load = async () => {
            try {
                const [usersRes, userMe] = await Promise.all([
                    getUsuarios({ activo: 'true' }),
                    getCurrentUser()
                ]);
                setUsuariosList(usersRes.data || []);
                setCurrentUser(userMe);

                if (userMe && !userMe.esAdministrador) {
                    setFilterPropietario({ value: userMe.id, label: `${userMe.apellido}, ${userMe.nombre}` });
                }
            } catch (e) {
                console.error(e);
                // Si falla al obtener usuario, intentar obtener solo usuarios
                try {
                    const res = await getUsuarios({ activo: 'true' });
                    setUsuariosList(res.data || []);
                } catch (ex) { console.error(ex); }
            }
        };
        load();
    }, []);

    const empleadoOptions = usuariosList.map(u => ({
        value: u.id,
        label: `${u.apellido}, ${u.nombre}`,
    }));
    const selectStyles = buildSelectStyles(isDark);

    // Debounce Search (nombre y descripción)
    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterNombre(searchInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setFilterDescripcion(descripcionInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [descripcionInput]);

    /**
     * Reconstruye y refresca los datos de los espacios de trabajo consultando `getEspaciosTrabajo`.
     * Filtra por nombre, descripción, propietario y estatus de activación.
     * 
     * @async
     * @returns {Promise<void>}
     */
    const loadItems = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                nombre: filterNombre,
                activo: filterActivo,
                page,
                limit,
                descripcion: filterDescripcion,
                propietarioId: filterPropietario?.value,
                fechaCreacion: filterFechaCreacion,
            };

            const result = await getEspaciosTrabajo(params);

            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterNombre, filterActivo, page, limit, filterDescripcion, filterPropietario, filterFechaCreacion]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const handleCreate = () => {
        setEditingItem(null);
        setShowForm(true);
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setShowForm(true);
        setShowDetail(false);
    };

    const handleView = async (item) => {
        try {
            const fullItem = await getEspacioTrabajoById(item.id);
            setSelectedItem(fullItem);
            setShowDetail(true);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteClick = (item) => {
        setItemToDelete(item);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await deleteEspacioTrabajo(itemToDelete.id);
            setSuccess('Espacio de trabajo desactivado correctamente');
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
            await deleteEspaciosTrabajoB(Array.from(selectedIds));
            setSuccess(`${selectedIds.size} espacio(s) de trabajo desactivado(s) correctamente`);
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
            await reactivateEspacioTrabajo(item.id);
            setSuccess('Espacio de trabajo reactivado correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingItem(null);
    };

    const handleFormSuccess = () => {
        setShowForm(false);
        setEditingItem(null);
        loadItems();
    };

    const handleSelectAll = () => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.id)));
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
    };

    /**
     * Restablece activamente y elimina todos los filtros aplicados a la vista de datos.
     * 
     * @returns {void}
     */
    const clearFilters = () => {
        setSearchInput('');
        setFilterNombre('');
        setDescripcionInput('');
        setFilterDescripcion('');
        setFilterActivo('true');
        if (!currentUser || currentUser.esAdministrador) {
            setFilterPropietario(null);
        }
        setFilterFechaCreacion('');
        setPage(1);
    };

    const toggleColumn = (key) => {
        setVisibleColumns(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    // Si no es admin, el filtro de propietario es obligatorio y no cuenta como "activo" para mostrar el botón limpiar
    const isNotAdmin = currentUser && !currentUser.esAdministrador;
    const hasActiveFilters = filterNombre || filterActivo !== 'true' || filterDescripcion || (!isNotAdmin && filterPropietario) || filterFechaCreacion;
    const allSelected = items.length > 0 && selectedIds.size === items.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;
    const showingInactive = filterActivo === 'false';

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    return (
        <>
            <div>
                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1 className="page-title">Espacios de Trabajo</h1>
                        <p className="page-subtitle">Gestiona los espacios de trabajo de la organización</p>
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
                            <h3 className="card-title">Listado de Espacios de Trabajo</h3>
                            <span className="selection-indicator">
                                {selectedIds.size} de {total} seleccionados
                            </span>
                        </div>
                        <div className="header-actions">
                            {selectedIds.size > 0 && !showingInactive && (
                                <button className="btn btn-danger" onClick={handleBulkDeleteClick}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                    </svg>
                                    Desactivar seleccionados
                                </button>
                            )}
                            <button className="btn btn-primary" onClick={handleCreate}>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 20, height: 20 }}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Nuevo Espacio
                            </button>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="filters-bar">
                        <div className="filters-inputs">
                            <div className="filter-group">
                                <Select
                                    options={empleadoOptions}
                                    value={filterPropietario}
                                    onChange={opt => { setFilterPropietario(opt); setPage(1); }}
                                    placeholder="Propietario..."
                                    isClearable={currentUser?.esAdministrador}
                                    isDisabled={currentUser && !currentUser.esAdministrador}
                                    styles={selectStyles}
                                    noOptionsMessage={() => 'Sin resultados'}
                                />
                            </div>
                            <div className="filter-group">
                                <input type="text" className="filter-input" placeholder="Buscar por nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ width: '200px' }} />
                            </div>
                            <div className="filter-group">
                                <input type="text" className="filter-input" placeholder="Descripción" value={descripcionInput} onChange={(e) => setDescripcionInput(e.target.value)} style={{ width: '200px' }} />
                            </div>
                            <div className="filter-group">
                                <input type="date" className="filter-input" placeholder="Fecha Creación" value={filterFechaCreacion} onChange={(e) => { setFilterFechaCreacion(e.target.value); setPage(1); }} style={{ width: '200px' }} />
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
                                <button className="btn btn-secondary btn-sm" onClick={() => setShowColumnSelector(!showColumnSelector)}>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Columnas
                                </button>
                                {showColumnSelector && (
                                    <div className="column-selector-dropdown">
                                        {Object.entries({
                                            descripcion: 'Descripción',
                                            propietario: 'Propietario',
                                            creacion: 'Fecha de Creación',
                                        }).map(([key, label]) => (
                                            <label key={key} className="column-option">
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns[key]}
                                                    onChange={() => toggleColumn(key)}
                                                />
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
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0M12 12.75h.008v.008H12v-.008z" />
                            </svg>
                            <h3>No hay espacios de trabajo {showingInactive ? 'inactivos' : ''}</h3>
                            <p>{showingInactive ? 'No hay espacios de trabajo desactivados' : 'Crea un nuevo espacio de trabajo para comenzar'}</p>
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
                                            {visibleColumns.descripcion && <th>Descripción</th>}
                                            {visibleColumns.propietario && <th>Propietario</th>}
                                            {visibleColumns.creacion && <th>Fecha de Creación</th>}
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                                <td><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                                <td><strong>{truncateText(item.nombre, 15)}</strong></td>
                                                {visibleColumns.descripcion && (
                                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{truncateText(item.descripcion || '-', 20)}</td>
                                                )}
                                                {visibleColumns.propietario && (
                                                    <td>{truncateText(item.propietario ? `${item.propietario.nombre} ${item.propietario.apellido}` : '-', 15)}</td>
                                                )}
                                                {visibleColumns.creacion && (
                                                    <td>{formatDate(item.createdAt)}</td>
                                                )}
                                                <td>
                                                    <div className="table-actions">
                                                        {showingInactive ? (
                                                            <button className="btn btn-success btn-sm" onClick={() => handleReactivate(item)} title="Reactivar">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                                                                </svg>
                                                                Reactivar
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button className="btn btn-info btn-sm" onClick={() => handleView(item)} title="Ver">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                    </svg>
                                                                    Ver
                                                                </button>
                                                                <button className="btn btn-warning btn-sm" onClick={() => handleEdit(item)} title="Editar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                                    </svg>
                                                                    Editar
                                                                </button>
                                                                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClick(item)} title="Desactivar">
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" style={{ width: 16, height: 16 }}>
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                    Desactivar
                                                                </button>
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
            </div>

            {/* Modals */}
            {showForm && (
                <EspacioTrabajoFormulario espacio={editingItem} onClose={handleCloseForm} onSuccess={handleFormSuccess} />
            )}

            {showDetail && selectedItem && (
                <EspacioTrabajoDetail espacio={selectedItem} onClose={() => setShowDetail(false)} onEdit={handleEdit} />
            )}

            {confirmOpen && (
                <ConfirmDialog
                    isOpen={true}
                    title="Desactivar espacio de trabajo"
                    message={`¿Está seguro de que desea desactivar el espacio "${itemToDelete?.nombre}"?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                    confirmText="Desactivar"
                />
            )}

            {confirmBulkOpen && (
                <ConfirmDialog
                    isOpen={true}
                    title="Desactivar espacios de trabajo"
                    message={`¿Está seguro de que desea desactivar ${selectedIds.size} espacio(s) de trabajo?`}
                    onConfirm={handleConfirmBulkDelete}
                    onCancel={() => setConfirmBulkOpen(false)}
                    confirmText="Desactivar todos"
                />
            )}
        </>
    );
};

export default EspaciosTrabajo;


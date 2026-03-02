/**
 * @fileoverview Gestión y listado de contactos asociados a empleados.
 * @module pages/Contactos
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import {
    getContactos,
    deleteContacto,
    deleteContactosBulk,
    getContactoById,
    reactivateContacto,
    getEmpleados,
    getEspaciosTrabajo,
} from '../services/api';
import ContactoWizard from '../components/ContactoWizard';
import ContactoDetail from '../components/ContactoDetail';
import ConfirmDialog from '../components/ConfirmDialog';
import { truncateText, formatFullName } from '../helpers/formatters';
import { useIsDark, useModulePermissions } from '../helpers/hooks';
import { buildSelectStyles } from '../helpers/selectStyles';

const PARENTESCOS = [
    'Cónyuge', 'Padre', 'Madre', 'Hijo/a', 'Hermano/a',
    'Abuelo/a', 'Nieto/a', 'Tío/a', 'Sobrino/a', 'Primo/a',
    'Suegro/a', 'Cuñado/a', 'Yerno', 'Nuera', 'Otro'
];

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];

/**
 * Componente Contactos
 * 
 * Interfaz principal para visualizar y administrar la información de los contactos asociados a los empleados.
 * Utiliza hooks centralizados (useIsDark, useModulePermissions) para el control visual y validación de 
 * permisos de usuario sobre el módulo 'contactos'. Integra múltiples handlers de estado (filtros, paginado, etc).
 * 
 * @returns {JSX.Element} Vista del grid y dashboard de Contactos.
 */
const Contactos = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const { isEmpleadoUser, canRead, canCreate, canEdit, canDelete } = useModulePermissions(user, 'contactos');

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
    const [filterEmpleado, setFilterEmpleado] = useState(null);
    const [dniInput, setDniInput] = useState('');
    const [filterDni, setFilterDni] = useState('');
    const [filterParentesco, setFilterParentesco] = useState('');
    const [filterTipo, setFilterTipo] = useState('');

    // Filter lists
    const [empleadosList, setEmpleadosList] = useState([]);
    const [espaciosList, setEspaciosList] = useState([]);
    const isDark = useIsDark();

    // Selection
    const [selectedIds, setSelectedIds] = useState(new Set());

    // Column Visibility
    const [visibleColumns, setVisibleColumns] = useState({
        empleado: true,
        espacio: false,
        dni: true,
        parentesco: true,
        tipo: true,
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

    /**
     * Carga de manera asíncrona la lista de empleados y espacios de trabajo para poblar los filtros
     * iniciales usando Promise.all para optimizar latencia.
     * 
     * @returns {Promise<void>}
     */
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
    const hasFullAccess = user?.esAdministrador || (user?.rol?.permisos?.some(p => p.modulo === 'contactos' && ['crear', 'actualizar', 'eliminar'].includes(p.accion)));
    const isSingleEmployee = (empleadosList.length === 1 && isRestricted) || (isRestricted && !hasFullAccess);
    const isSingleWorkspace = espaciosList.length === 1 && isRestricted;

    // Auto-select espacio y empleado para usuarios restringidos
    useEffect(() => {
        if (isRestricted) {
            if (espaciosList.length === 1 && !filterEspacio) {
                setFilterEspacio({ value: espaciosList[0].id, label: espaciosList[0].nombre });
            }
            if (!filterEmpleado) {
                if (empleadosList.length === 1) {
                    const emp = empleadosList[0];
                    const label = `${emp.usuario?.apellido || emp.apellido}, ${emp.usuario?.nombre || emp.nombre}`;
                    setFilterEmpleado({ value: emp.id, label });
                } else if (!hasFullAccess && user?.empleadoId) {
                    const myEmp = empleadosList.find(e => e.id === user.empleadoId);
                    if (myEmp) {
                        const label = `${myEmp.usuario?.apellido || myEmp.apellido}, ${myEmp.usuario?.nombre || myEmp.nombre}`;
                        setFilterEmpleado({ value: myEmp.id, label });
                    }
                }
            }
        }
    }, [user, espaciosList, empleadosList, filterEspacio, filterEmpleado, isRestricted, hasFullAccess]);

    // Build select options
    const empleadoOptions = Object.values(
        (empleadosList).reduce((acc, emp) => {
            const ws = emp.espacioTrabajo?.nombre || 'Sin Espacio';
            if (!acc[ws]) acc[ws] = { label: ws, options: [] };
            acc[ws].options.push({ value: emp.id, label: `${formatFullName(emp)}` });
            return acc;
        }, {})
    );
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
            setFilterDni(dniInput);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [dniInput]);

    // Load Items
    /**
     * Refresca la vista de contactos realizando una consulta al servicio API `getContactos`.
     * Filtra los resultados considerando la paginación, búsqueda textual y filtros categóricos.
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
                espacioTrabajoId: filterEspacio?.value,
                empleadoId: filterEmpleado?.value,
                dni: filterDni,
                parentesco: filterParentesco,
                tipo: filterTipo,
            };

            const result = await getContactos(params);

            setItems(result.data);
            setTotalPages(result.pagination.totalPages);
            setTotal(result.pagination.total);
            setSelectedIds(new Set());
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [filterNombre, filterActivo, page, limit, filterEspacio, filterEmpleado, filterDni, filterParentesco, filterTipo]);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    /**
     * Restablece activamente y elimina todos los filtros aplicados a la vista de datos.
     * 
     * @returns {void}
     */
    const clearFilters = () => {
        setSearchInput('');
        setFilterNombre('');
        setFilterActivo('true');
        if (!isSingleWorkspace) setFilterEspacio(null);
        if (!isSingleEmployee) setFilterEmpleado(null);
        setFilterDni('');
        setDniInput('');
        setFilterParentesco('');
        setFilterTipo('');
        setPage(1);
    };

    const hasActiveFilters = filterNombre || filterActivo !== 'true' || (!isSingleWorkspace && filterEspacio) || (!isSingleEmployee && filterEmpleado) || filterDni || filterParentesco || filterTipo;

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
            const fullItem = await getContactoById(item.id);
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
            const fullItem = await getContactoById(item.id);
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
        if (editingItem) {
            setSuccess('Contacto actualizado correctamente');
        } else {
            setSuccess('Contacto creado correctamente');
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
            await deleteContacto(itemToDelete.id);
            setSuccess('Contacto desactivado correctamente');
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
            await deleteContactosBulk(Array.from(selectedIds));
            setSuccess(`${selectedIds.size} contacto(s) desactivado(s) correctamente`);
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
            await reactivateContacto(item.id);
            setSuccess('Contacto reactivado correctamente');
            loadItems();
        } catch (err) {
            setError(err.message);
        }
    };

    const showingInactive = filterActivo === 'false';

    // Badge component for type
    const TypeBadge = ({ esFamiliar, esContactoEmergencia }) => (
        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {esFamiliar && (
                <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '9999px',
                    background: 'rgba(21, 128, 61, 0.2)',
                    color: '#15803d',
                    fontWeight: 600
                }}>
                    Familiar
                </span>
            )}
            {esContactoEmergencia && (
                <span style={{
                    fontSize: '0.7rem',
                    padding: '0.15rem 0.4rem',
                    borderRadius: '9999px',
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    fontWeight: 600
                }}>
                    Emergencia
                </span>
            )}
        </div>
    );

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">Contactos</h1>
                    <p className="page-subtitle">Gestiona familiares y contactos de emergencia de los empleados</p>
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
                        <h3 className="card-title">Listado de Contactos</h3>
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
                                Nuevo Contacto
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar">
                    <div className="filters-inputs">
                        <div className="filter-group" style={{ width: '200px' }}>
                            <Select isDisabled={isSingleWorkspace} options={espacioOptions} value={filterEspacio} onChange={opt => { setFilterEspacio(opt); setPage(1); }} placeholder="Espacio..." isClearable={!isSingleWorkspace} styles={selectStyles} menuPortalTarget={document.body} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group" style={{ width: '200px' }}>
                            <Select isDisabled={isSingleEmployee} options={empleadoOptions} value={filterEmpleado} onChange={opt => { setFilterEmpleado(opt); setPage(1); }} placeholder="Empleado..." isClearable={!isSingleEmployee} styles={selectStyles} menuPortalTarget={document.body} noOptionsMessage={() => 'Sin resultados'} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="Buscar por nombre..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <input type="text" className="filter-input" placeholder="DNI" value={dniInput} onChange={(e) => setDniInput(e.target.value)} style={{ width: '200px' }} />
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterParentesco} onChange={(e) => { setFilterParentesco(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="">Parentesco</option>
                                {PARENTESCOS.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-group">
                            <select className="filter-input" value={filterTipo} onChange={(e) => { setFilterTipo(e.target.value); setPage(1); }} style={{ width: '200px' }}>
                                <option value="">Tipo</option>
                                <option value="Familiar">Familiar</option>
                                <option value="Emergencia">Emergencia</option>
                            </select>
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
                                    {Object.entries({ empleado: 'Empleado', espacio: 'Espacio', dni: 'DNI', parentesco: 'Parentesco', tipo: 'Tipo' }).map(([key, label]) => (
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
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                        </svg>
                        <h3>No hay contactos {showingInactive ? 'inactivos' : ''}</h3>
                        <p>{showingInactive ? 'No hay contactos desactivados' : 'Crea un nuevo contacto para comenzar'}</p>
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
                                        {visibleColumns.empleado && <th>Empleado</th>}
                                        {visibleColumns.espacio && <th>Espacio</th>}
                                        {visibleColumns.dni && <th>DNI</th>}
                                        {visibleColumns.parentesco && <th>Parentesco</th>}
                                        {visibleColumns.tipo && <th>Tipo</th>}
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr key={item.id} className={`${selectedIds.has(item.id) ? 'row-selected' : ''} ${!item.activo ? 'row-inactive' : ''}`}>
                                            <td><input type="checkbox" checked={selectedIds.has(item.id)} onChange={() => handleSelectOne(item.id)} /></td>
                                            <td><strong>{truncateText(item.nombreCompleto, 15)}</strong></td>
                                            {visibleColumns.empleado && (
                                                <td>
                                                    {item.empleado ? (
                                                        <>
                                                            <strong>{truncateText(formatFullName(item.empleado), 15)}</strong>
                                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                                {item.empleado?.numeroDocumento}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <span style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Sin empleado</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleColumns.espacio && <td>{truncateText(item.empleado?.espacioTrabajo?.nombre || '-')}</td>}
                                            {visibleColumns.dni && <td>{item.dni}</td>}
                                            {visibleColumns.parentesco && <td>{truncateText(item.parentesco, 15)}</td>}
                                            {visibleColumns.tipo && (
                                                <td>
                                                    <TypeBadge esFamiliar={item.esFamiliar} esContactoEmergencia={item.esContactoEmergencia} />
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
                <ContactoWizard contacto={editingItem} onClose={handleCloseWizard} onSuccess={handleWizardSuccess} />
            )}

            {showDetail && selectedItem && (
                <ContactoDetail
                    contacto={selectedItem}
                    onClose={() => { setShowDetail(false); setSelectedItem(null); }}
                    onEdit={(contacto) => {
                        setShowDetail(false);
                        setSelectedItem(null);
                        setEditingItem(contacto);
                        setShowWizard(true);
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={confirmOpen}
                title="Desactivar contacto"
                message={itemToDelete ? `¿Estás seguro de desactivar al contacto "${itemToDelete.nombreCompleto}"? Podrás reactivarlo más tarde.` : ''}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                confirmText="Desactivar"
                variant="danger"
            />

            <ConfirmDialog
                isOpen={confirmBulkOpen}
                title="Desactivar contactos"
                message={`¿Estás seguro de desactivar ${selectedIds.size} contacto(s)? Podrás reactivarlos más tarde.`}
                onConfirm={handleConfirmBulkDelete}
                onCancel={() => setConfirmBulkOpen(false)}
                confirmText="Desactivar todos"
                variant="danger"
            />
        </div>
    );
};

export default Contactos;


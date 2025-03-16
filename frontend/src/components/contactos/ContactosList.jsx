import React, { useState, useEffect, useRef } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiEye,
  FiChevronUp,
  FiChevronDown,
  FiPlus,
  FiSearch
} from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog } from '../ui';
import { useToast } from '../ui/ToastContext';

export default function ContactosList() {
  const [contactos, setContactos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [municipalidadesFiltered, setMunicipalidadesFiltered] = useState([]);

  // Banderas para mostrar modales
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Modal unificado para crear/editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // false = crear, true = editar

  // Contacto seleccionado (para ver detalles o eliminar)
  const [selectedContacto, setSelectedContacto] = useState(null);

  // Datos del formulario de crear / editar
  const [formData, setFormData] = useState({
    id_contacto: '',
    id_municipalidad: '',
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: ''
  });

  // Búsqueda y filtrado
  const [searchQuery, setSearchQuery] = useState('');
  const [columnFilters, setColumnFilters] = useState({
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: '',
    municipalidad: ''
  });
  const [sortField, setSortField] = useState('nombre_completo');
  const [sortOrder, setSortOrder] = useState('asc');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Manejo de carga y responsive
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Dropdown municipalidad con búsqueda
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  // Notificaciones
  const toast = useToast();

  /* =========================================
   *       Carga inicial y listeners
   * ========================================= */
  useEffect(() => {
    loadContactos();
    loadMunicipalidades();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    const handleClickOutside = (event) => {
      // Cerrar el dropdown de municipalidades si se hace click fuera
      if (
        municipalidadDropdownRef.current &&
        !municipalidadDropdownRef.current.contains(event.target)
      ) {
        setShowMunicipalidadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  /* =========================================
   *          Efecto para filtrar
   *      municipalidades por búsqueda
   * ========================================= */
  useEffect(() => {
    if (!municipalidadSearchQuery.trim()) {
      setMunicipalidadesFiltered(municipalidades);
    } else {
      const q = municipalidadSearchQuery.toLowerCase();
      const filtered = municipalidades.filter((m) => {
        return (
          m.nombre.toLowerCase().includes(q) ||
          (m.ubigeo || '').toLowerCase().includes(q) ||
          (m.departamento || '').toLowerCase().includes(q) ||
          (m.provincia || '').toLowerCase().includes(q) ||
          (m.distrito || '').toLowerCase().includes(q)
        );
      });
      setMunicipalidadesFiltered(filtered);
    }
  }, [municipalidadSearchQuery, municipalidades]);

  /* =========================================
   *   Funciones para cargar datos
   * ========================================= */
  const loadContactos = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('contactos');
      setContactos(data || []);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast.showError('Error', 'No se pudieron cargar los contactos');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const data = await apiService.getAll('municipalidades');
      setMunicipalidades(data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      toast.showError('Error', 'No se pudieron cargar las municipalidades');
    }
  };

  /* =========================================
   *   Funciones de crear / editar
   * ========================================= */
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_contacto: '',
      id_municipalidad: '',
      nombre_completo: '',
      cargo: '',
      telefono: '',
      email: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedContacto(rowData);
    setFormData({
      id_contacto: rowData.id_contacto,
      id_municipalidad: rowData.id_municipalidad || '',
      nombre_completo: rowData.nombre_completo || '',
      cargo: rowData.cargo || '',
      telefono: rowData.telefono || '',
      email: rowData.email || ''
    });
    setUpsertDialogVisible(true);
  };

  // Guardar (tanto crear como editar)
  const handleSave = async () => {
    // Validaciones mínimas
    if (!formData.id_municipalidad) {
      toast.showWarning('Advertencia', 'Debe seleccionar una municipalidad');
      return;
    }
    if (!formData.nombre_completo) {
      toast.showWarning('Advertencia', 'El nombre completo es requerido');
      return;
    }

    try {
      if (isEditMode && formData.id_contacto) {
        // Actualizar
        await apiService.update('contactos', formData.id_contacto, formData);
        toast.showSuccess('Éxito', 'Contacto actualizado correctamente');
      } else {
        // Crear
        await apiService.create('contactos', formData);
        toast.showSuccess('Éxito', 'Contacto creado correctamente');
      }
      setUpsertDialogVisible(false);
      loadContactos();
    } catch (error) {
      console.error('Error al guardar contacto:', error);
      toast.showError('Error', 'Error al guardar el contacto');
    }
  };

  /* =========================================
   *   Funciones de ver detalles y eliminar
   * ========================================= */
  const handleView = (rowData) => {
    setSelectedContacto(rowData);
    setViewDialogVisible(true);
  };

  const confirmDeletePrompt = (rowData) => {
    setSelectedContacto(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedContacto) return;
    try {
      await apiService.delete('contactos', selectedContacto.id_contacto);
      toast.showSuccess('Éxito', 'Contacto eliminado correctamente');
      setDeleteDialogVisible(false);
      loadContactos();
    } catch (error) {
      console.error('Error al eliminar contacto:', error);
      toast.showError('Error', 'Error al eliminar el contacto');
    }
  };

  /* =========================================
   *    Funciones para obtener nombres
   * ========================================= */
  const getMunicipalidadName = (id_municipalidad) => {
    const m = municipalidades.find((x) => x.id_municipalidad === id_municipalidad);
    return m ? m.nombre : '';
  };

  /* =========================================
   *   Filtrado, Búsqueda y Orden
   * ========================================= */
  const applyFilters = () => {
    // Filtro de búsqueda global
    let filtered = contactos.filter((c) => {
      const searchFields = [
        c.nombre_completo,
        c.cargo,
        c.telefono,
        c.email,
        getMunicipalidadName(c.id_municipalidad)
      ].map((fld) => fld?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchNombre =
        !columnFilters.nombre_completo ||
        (c.nombre_completo || '').toLowerCase().includes(columnFilters.nombre_completo.toLowerCase());
      const matchCargo =
        !columnFilters.cargo ||
        (c.cargo || '').toLowerCase().includes(columnFilters.cargo.toLowerCase());
      const matchTelefono =
        !columnFilters.telefono ||
        (c.telefono || '').toLowerCase().includes(columnFilters.telefono.toLowerCase());
      const matchEmail =
        !columnFilters.email ||
        (c.email || '').toLowerCase().includes(columnFilters.email.toLowerCase());
      const municipalidadName = getMunicipalidadName(c.id_municipalidad).toLowerCase();
      const matchMunicipalidad =
        !columnFilters.municipalidad ||
        municipalidadName.includes(columnFilters.municipalidad.toLowerCase());

      return (
        matchesSearch &&
        matchNombre &&
        matchCargo &&
        matchTelefono &&
        matchEmail &&
        matchMunicipalidad
      );
    });

    // Ordenar
    filtered.sort((a, b) => {
      let aValue = '';
      let bValue = '';

      if (sortField === 'id_municipalidad') {
        aValue = getMunicipalidadName(a.id_municipalidad) || '';
        bValue = getMunicipalidadName(b.id_municipalidad) || '';
      } else {
        aValue = a[sortField] || '';
        bValue = b[sortField] || '';
      }

      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      } else {
        return bValue.localeCompare(aValue, undefined, { numeric: true });
      }
    });

    return filtered;
  };

  const getPaginatedData = () => {
    const filtered = applyFilters();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filtered.slice(startIndex, endIndex),
      totalRecords: filtered.length
    };
  };

  // Obtener data final
  const { data: paginatedData, totalRecords } = getPaginatedData();
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  /* =========================================
   *   Definir columnas
   * ========================================= */
  const columns = [
    {
      field: 'nombre_completo',
      header: 'Nombre',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.nombre_completo || 'N/A'
    },
    {
      field: 'cargo',
      header: 'Cargo',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.cargo || 'N/A'
    },
    {
      field: 'telefono',
      header: 'Teléfono',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.telefono || 'N/A'
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.email || 'N/A'
    },
    {
      field: 'id_municipalidad',
      header: 'Municipalidad',
      sortable: true,
      filterable: true,
      body: (rowData) => getMunicipalidadName(rowData.id_municipalidad) || 'N/A'
    }
  ];

  const mobileColumns = ['nombre_completo', 'id_municipalidad'];

  // Render de acciones
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => handleView(rowData)}
        className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
        title="Ver detalles"
      >
        <FiEye className="w-5 h-5" />
      </button>
      <button
        onClick={() => handleEdit(rowData)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="w-5 h-5" />
      </button>
      <button
        onClick={() => confirmDeletePrompt(rowData)}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="w-5 h-5" />
      </button>
    </div>
  );

  // Ordenar
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Búsqueda global
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  // Filtros por columna
  const handleColumnFilterChange = (filters) => {
    setColumnFilters(filters);
    setCurrentPage(1);
  };

  // Paginación
  const handlePageChange = (page) => setCurrentPage(page);
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  /* =========================================
   * Render principal
   * ========================================= */
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Contactos</h2>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center 
                     font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Contacto
        </button>
      </div>

      {/* Búsqueda global */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar contactos..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={paginatedData}
        columns={columns}
        actions={renderActions}
        loading={loading}
        isMobile={isMobile}
        mobileColumns={mobileColumns}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearch={handleSearch}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        emptyMessage="No se encontraron contactos"
        className="mb-4"
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={totalRecords}
      />

      {/* Modal de ver detalle */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles del Contacto"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 
                         rounded-md font-medium"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedContacto && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nombre Completo</p>
              <p className="mt-1 text-sm text-gray-900">{selectedContacto.nombre_completo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Cargo</p>
              <p className="mt-1 text-sm text-gray-900">{selectedContacto.cargo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Teléfono</p>
              <p className="mt-1 text-sm text-gray-900">{selectedContacto.telefono}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1 text-sm text-gray-900">{selectedContacto.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Municipalidad</p>
              <p className="mt-1 text-sm text-gray-900">
                {getMunicipalidadName(selectedContacto.id_municipalidad)}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal unificado CREAR / EDITAR */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Contacto' : 'Nuevo Contacto'}
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 
                         rounded-md font-medium"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white 
                         rounded-md font-medium"
              onClick={handleSave}
            >
              {isEditMode ? 'Guardar' : 'Crear'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* MUNICIPALIDAD (dropdown con búsqueda) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={municipalidadDropdownRef}>
              {/* Caja "select" */}
              <div
                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 
                            focus:outline-none focus:ring-blue-500 focus:border-blue-500 
                            sm:text-sm rounded-md cursor-pointer bg-white`}
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                {formData.id_municipalidad
                  ? municipalidades.find((m) => m.id_municipalidad == formData.id_municipalidad)
                      ?.nombre || 'Seleccione una municipalidad'
                  : 'Seleccione una municipalidad'}
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  {showMunicipalidadDropdown ? (
                    <FiChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </span>
              </div>

              {showMunicipalidadDropdown && (
                <div
                  className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 
                             rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 
                             overflow-auto focus:outline-none sm:text-sm"
                >
                  {/* Input de búsqueda dentro del dropdown */}
                  <div className="sticky top-0 z-10 bg-white p-2">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-1.5 border border-gray-300 
                                   rounded-md focus:outline-none focus:ring-blue-500 
                                   focus:border-blue-500 sm:text-sm"
                        placeholder="Buscar municipalidad..."
                        value={municipalidadSearchQuery}
                        onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Lista de resultados */}
                  {municipalidadesFiltered.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500">
                      No se encontraron resultados
                    </div>
                  ) : (
                    municipalidadesFiltered.map((m) => (
                      <div
                        key={m.id_municipalidad}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_municipalidad: m.id_municipalidad
                          }));
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        <span className="font-medium">{m.nombre}</span>
                        <span className="text-xs text-gray-500">
                          {m.ubigeo && `[${m.ubigeo}] `}
                          {m.departamento}, {m.provincia}, {m.distrito}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* NOMBRE COMPLETO */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.nombre_completo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, nombre_completo: e.target.value }))
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 
                         rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                         focus:border-blue-500"
              required
            />
          </div>

          {/* CARGO */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Cargo</label>
            <input
              type="text"
              value={formData.cargo}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, cargo: e.target.value }))
              }
              className="mt-1 block w-full px-3 py-2 border border-gray-300 
                         rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                         focus:border-blue-500"
            />
          </div>

          {/* Teléfono y Email en una misma fila */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* TELÉFONO */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Teléfono</label>
              <input
                type="text"
                value={formData.telefono}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, telefono: e.target.value }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                           rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                           focus:border-blue-500"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 
                           rounded-md shadow-sm focus:outline-none focus:ring-blue-500 
                           focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar eliminación"
        message={
          selectedContacto
            ? `¿Está seguro que desea eliminar el contacto "${selectedContacto.nombre_completo}"?`
            : '¿Está seguro de eliminar este contacto?'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

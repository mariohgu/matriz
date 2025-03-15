import React, { useState, useEffect, useRef } from 'react';
import { FiEdit, FiTrash2, FiEye, FiChevronUp, FiChevronDown, FiPlus, FiSearch, FiX } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog } from '../ui';
import { useToast } from '../ui/ToastContext';

export default function ContactosList() {
  const [contactos, setContactos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [editData, setEditData] = useState({
    id_contacto: '',
    id_municipalidad: '',
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('nombre_completo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: '',
    municipalidad: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [municipalidadesFiltered, setMunicipalidadesFiltered] = useState([]);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const municipalidadDropdownRef = useRef(null);
  const toast = useToast(); // Hook para mostrar notificaciones

  useEffect(() => {
    loadContactos();
    loadMunicipalidades();
    
    // Añadir listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Añadir listener para cerrar el dropdown de municipalidades cuando se hace clic fuera
    const handleClickOutside = (event) => {
      if (municipalidadDropdownRef.current && !municipalidadDropdownRef.current.contains(event.target)) {
        setShowMunicipalidadDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Efecto para filtrar municipalidades cuando cambia la búsqueda
  useEffect(() => {
    if (municipalidadSearchQuery.trim() === '') {
      setMunicipalidadesFiltered(municipalidades);
    } else {
      const searchTerm = municipalidadSearchQuery.toLowerCase();
      const filtered = municipalidades.filter(municipalidad => 
        municipalidad.nombre.toLowerCase().includes(searchTerm) ||
        (municipalidad.ubigeo && municipalidad.ubigeo.toLowerCase().includes(searchTerm)) ||
        municipalidad.departamento.toLowerCase().includes(searchTerm) ||
        municipalidad.provincia.toLowerCase().includes(searchTerm) ||
        municipalidad.distrito.toLowerCase().includes(searchTerm)
      );
      setMunicipalidadesFiltered(filtered);
    }
  }, [municipalidadSearchQuery, municipalidades]);

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

  const handleSave = async () => {
    // Validación
    if (!editData.id_municipalidad) {
      toast.showWarning('Advertencia', 'Debe seleccionar una municipalidad');
      return;
    }

    if (!editData.nombre_completo) {
      toast.showWarning('Advertencia', 'El nombre completo es requerido');
      return;
    }

    try {
      if (editData.id_contacto) {
        await apiService.update('contactos', editData.id_contacto, editData);
        toast.showSuccess('Éxito', 'Contacto actualizado correctamente');
      } else {
        await apiService.create('contactos', editData);
        toast.showSuccess('Éxito', 'Contacto creado correctamente');
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_contacto: '',
        id_municipalidad: '',
        nombre_completo: '',
        cargo: '',
        telefono: '',
        email: '',
      });
      loadContactos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.showError('Error', 'Error al guardar el contacto');
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await apiService.delete('contactos', rowData.id_contacto);
      toast.showSuccess('Éxito', 'Contacto eliminado correctamente');
      loadContactos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.showError('Error', 'Error al eliminar el contacto');
    }
  };

  // Get municipalidad name by id
  const getMunicipalidadName = (id_municipalidad) => {
    const municipalidad = municipalidades.find(m => m.id_municipalidad === id_municipalidad);
    return municipalidad ? municipalidad.nombre : '';
  };

  // Definición de columnas para el componente Table
  const columns = [
    {
      field: 'nombre_completo',
      header: 'Nombre',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.nombre_completo || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'cargo',
      header: 'Cargo',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.cargo || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'telefono',
      header: 'Teléfono',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.telefono || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.email || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'id_municipalidad',
      header: 'Municipalidad',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {getMunicipalidadName(rowData.id_municipalidad) || 'N/A'}
          </span>
        </div>
      )
    }
  ];

  // Columnas a mostrar en modo móvil
  const mobileColumns = ['nombre_completo', 'id_municipalidad'];

  // Filtering functions
  const filteredContactos = contactos.filter(contacto => {
    // Filtro de búsqueda general
    const searchFields = [
      contacto.nombre_completo,
      contacto.cargo,
      contacto.telefono,
      contacto.email,
      getMunicipalidadName(contacto.id_municipalidad)
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesNombre = columnFilters.nombre_completo === '' || 
      (contacto.nombre_completo && contacto.nombre_completo.toLowerCase().includes(columnFilters.nombre_completo.toLowerCase()));
    
    const matchesCargo = columnFilters.cargo === '' || 
      (contacto.cargo && contacto.cargo.toLowerCase().includes(columnFilters.cargo.toLowerCase()));
    
    const matchesTelefono = columnFilters.telefono === '' || 
      (contacto.telefono && contacto.telefono.toLowerCase().includes(columnFilters.telefono.toLowerCase()));
    
    const matchesEmail = columnFilters.email === '' || 
      (contacto.email && contacto.email.toLowerCase().includes(columnFilters.email.toLowerCase()));
    
    const municipalidadName = getMunicipalidadName(contacto.id_municipalidad);
    const matchesMunicipalidad = columnFilters.municipalidad === '' || 
      (municipalidadName && municipalidadName.toLowerCase().includes(columnFilters.municipalidad.toLowerCase()));
    
    return matchesSearch && matchesNombre && matchesCargo && matchesTelefono && 
           matchesEmail && matchesMunicipalidad;
  });

  // Sorting
  const sortedData = [...filteredContactos].sort((a, b) => {
    let aValue, bValue;
    
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

  // Pagination
  const totalPages = Math.ceil(filteredContactos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Action buttons component
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedContacto(rowData);
          setViewDialogVisible(true);
        }}
        className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
        title="Ver detalles"
      >
        <FiEye className="w-5 h-5" />
      </button>
      <button
        onClick={() => {
          setSelectedContacto(rowData);
          setEditData(rowData);
          setEditDialogVisible(true);
        }}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="w-5 h-5" />
      </button>
      <button
        onClick={() => {
          setSelectedContacto(rowData);
          setDeleteDialogVisible(true);
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="w-5 h-5" />
      </button>
    </div>
  );

  // Event handlers
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleColumnFilterChange = (filters) => {
    setColumnFilters(filters);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-800">Contactos</h2>
          <button
            onClick={() => {
              setEditData({
                id_contacto: '',
                id_municipalidad: '',
                nombre_completo: '',
                cargo: '',
                telefono: '',
                email: '',
              });
              setCreateDialogVisible(true);
            }}
            className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Contacto</span>
          </button>
        </div>
      </div>
      
      {/* Table Component */}
      <Table
        data={paginatedData}
        columns={columns}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        loading={loading}
        emptyMessage="No se encontraron contactos"
        isMobile={isMobile}
        mobileColumns={mobileColumns}
        actions={renderActions}
        className="mb-4"
      />
      
      {/* Pagination Component */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={handleItemsPerPageChange}
        totalItems={filteredContactos.length}
      />
      
      {/* View Modal */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles del Contacto"
        size="lg"
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
              <p className="mt-1 text-sm text-gray-900">{getMunicipalidadName(selectedContacto.id_municipalidad)}</p>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Create/Edit Modal */}
      <Modal
        isOpen={createDialogVisible || editDialogVisible}
        onClose={() => {
          setEditDialogVisible(false);
          setCreateDialogVisible(false);
        }}
        title={editDialogVisible ? 'Editar Contacto' : 'Nuevo Contacto'}
        size="lg"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
              onClick={() => {
                setEditDialogVisible(false);
                setCreateDialogVisible(false);
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
              onClick={handleSave}
            >
              {editDialogVisible ? 'Guardar' : 'Crear'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="municipalidad" className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={municipalidadDropdownRef}>
              <div 
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md cursor-pointer bg-white"
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                {editData.id_municipalidad 
                  ? municipalidades.find(m => m.id_municipalidad == editData.id_municipalidad)?.nombre || 'Seleccione una municipalidad'
                  : 'Seleccione una municipalidad'}
                <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <FiChevronDown className={`h-5 w-5 text-gray-400 ${showMunicipalidadDropdown ? 'hidden' : 'block'}`} />
                  <FiChevronUp className={`h-5 w-5 text-gray-400 ${showMunicipalidadDropdown ? 'block' : 'hidden'}`} />
                </span>
              </div>
              
              {showMunicipalidadDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                  <div className="sticky top-0 z-10 bg-white p-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                        placeholder="Buscar municipalidad..."
                        value={municipalidadSearchQuery}
                        onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <FiSearch className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  </div>

                  {municipalidadesFiltered.length === 0 ? (
                    <div className="px-3 py-2 text-gray-500">No se encontraron resultados</div>
                  ) : (
                    municipalidadesFiltered.map((municipalidad) => (
                      <div
                        key={municipalidad.id_municipalidad}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer flex flex-col"
                        onClick={() => {
                          setEditData({...editData, id_municipalidad: municipalidad.id_municipalidad});
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        <span className="font-medium">{municipalidad.nombre}</span>
                        <span className="text-xs text-gray-500">
                          {municipalidad.ubigeo && `[${municipalidad.ubigeo}] `}
                          {municipalidad.departamento}, {municipalidad.provincia}, {municipalidad.distrito}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
          <div>
            <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nombre_completo"
              value={editData.nombre_completo}
              onChange={(e) => setEditData({ ...editData, nombre_completo: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="cargo" className="block text-sm font-medium text-gray-700">
              Cargo
            </label>
            <input
              type="text"
              id="cargo"
              value={editData.cargo}
              onChange={(e) => setEditData({ ...editData, cargo: e.target.value })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Teléfono
              </label>
              <input
                type="text"
                id="telefono"
                value={editData.telefono}
                onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </Modal>
      
      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={() => {
          confirmDelete(selectedContacto);
          setDeleteDialogVisible(false);
        }}
        title="Confirmar eliminación"
        message={`¿Está seguro que desea eliminar el contacto ${selectedContacto?.nombre_completo}? Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}
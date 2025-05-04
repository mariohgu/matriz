import React, { useState, useEffect } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiSearch
} from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function DireccionLineaList() {
  // ========= Estados principales =========
  const [direccionesLinea, setDireccionesLinea] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda global, filtros por columna, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('descripcion');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal unificado (crear/editar)
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    id_direccion_linea: '',
    descripcion: ''
  });

  // Para ver detalles y eliminar
  const [selectedDireccion, setSelectedDireccion] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();

  // ========= useEffect de carga inicial =========
  useEffect(() => {
    loadDireccionesLinea();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ========= Cargar data de backend =========
  const loadDireccionesLinea = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('direccion-linea');
      setDireccionesLinea(data || []);
    } catch (error) {
      console.error('Error al cargar direcciones de línea:', error);
      toast.showError('Error', 'No se pudieron cargar las direcciones de línea');
    } finally {
      setLoading(false);
    }
  };

  // =====================
  //  Crear / Editar
  // =====================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_direccion_linea: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedDireccion(rowData);

    setFormData({
      id_direccion_linea: rowData.id_direccion_linea,
      descripcion: rowData.descripcion || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!formData.descripcion) {
      toast.showWarning('Advertencia', 'Por favor ingresa una descripción');
      return;
    }

    try {
      if (isEditMode && formData.id_direccion_linea) {
        // Actualizar
        await apiService.update('direccion-linea', formData.id_direccion_linea, formData);
        toast.showSuccess('Éxito', 'Dirección de línea actualizada');
      } else {
        // Crear nuevo
        await apiService.create('direccion-linea', formData);
        toast.showSuccess('Éxito', 'Dirección de línea creada');
      }
      setUpsertDialogVisible(false);
      loadDireccionesLinea();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.showError('Error', 'No se pudo guardar la dirección de línea');
    }
  };

  // =====================
  //  Eliminar
  // =====================
  const confirmDelete = (rowData) => {
    setSelectedDireccion(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedDireccion) return;
    try {
      await apiService.delete('direccion-linea', selectedDireccion.id_direccion_linea);
      toast.showSuccess('Éxito', 'Dirección de línea eliminada');
      setDeleteDialogVisible(false);
      loadDireccionesLinea();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.showError('Error', 'No se pudo eliminar la dirección de línea');
    }
  };

  // =====================
  //  Ver detalle
  // =====================
  const handleView = (rowData) => {
    setSelectedDireccion(rowData);
    setViewDialogVisible(true);
  };

  // =====================
  //  Búsqueda y Filtros
  // =====================
  const applyFilters = () => {
    if (!direccionesLinea || direccionesLinea.length === 0) return [];
    let filtered = [...direccionesLinea];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          (item.descripcion || '').toLowerCase().includes(q) ||
          (item.id_direccion_linea || '').toString().includes(q)
        );
      });
    }

    // Filtros por columna
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value) {
        const lowerVal = value.toLowerCase();
        filtered = filtered.filter((item) => {
          return (item[field] || '').toString().toLowerCase().includes(lowerVal);
        });
      }
    });

    // Ordenar
    if (sortField) {
      filtered.sort((a, b) => {
        const valA = (a[sortField] || '').toString().toLowerCase();
        const valB = (b[sortField] || '').toString().toLowerCase();
        
        const result = valA.localeCompare(valB);
        return sortOrder === 'asc' ? result : -result;
      });
    }

    return filtered;
  };

  const getPaginatedData = () => {
    const filteredData = applyFilters();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredData.slice(startIndex, endIndex),
      totalRecords: filteredData.length
    };
  };

  const { data: paginatedData, totalRecords } = getPaginatedData();
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // =====================
  //  Definir columnas
  // =====================
  const columns = [
    {
      field: 'id_direccion_linea',
      header: 'ID',
      sortable: true,
      filterable: true,
      hidden: isMobile
    },
    {
      field: 'descripcion',
      header: 'DESCRIPCIÓN',
      sortable: true,
      filterable: true
    }
  ];

  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => handleView(rowData)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        title="Ver detalle"
      >
        <FiEye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEdit(rowData)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="h-4 w-4" />
      </button>
      <button
        onClick={() => confirmDelete(rowData)}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const tableColumns = [...columns, { field: 'acciones', header: 'ACCIONES', body: renderActions }];

  // Columnas en móvil
  const mobileColumns = ['descripcion', 'acciones'];

  // =====================
  // Render principal
  // =====================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Direcciones de Línea</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nueva Dirección
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
            placeholder="Buscar direcciones de línea..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden">
        <Table
          data={paginatedData}
          columns={tableColumns}
          loading={loading}
          hideGlobalSearch={true}
          showFiltersButton={true}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          emptyMessage="No hay direcciones de línea disponibles"
          searchQuery={searchQuery}
          onSearch={(value) => {
            setSearchQuery(value);
            setCurrentPage(1);
          }}
          columnFilters={columnFilters}
          onColumnFilterChange={(columnName, value) => {
            setColumnFilters(prev => ({
              ...prev,
              [columnName]: value
            }));
            setCurrentPage(1);
          }}
          isMobile={isMobile}
          mobileColumns={mobileColumns}
        />
      </div>

      {/* Paginación */}
      {totalRecords > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* MODAL CREAR/EDITAR UNIFICADO */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Dirección de Línea' : 'Nueva Dirección de Línea'}
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
              placeholder="Ingrese la descripción de la dirección"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Dirección de Línea"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedDireccion && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ID</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedDireccion.id_direccion_linea}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedDireccion.descripcion}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedDireccion.created_at ? new Date(selectedDireccion.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedDireccion.updated_at ? new Date(selectedDireccion.updated_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar esta dirección de línea?"
        title="Confirmación"
        icon={<FiTrash2 />}
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="bg-red-600 text-white"
        onConfirm={handleDelete}
        onReject={() => setDeleteDialogVisible(false)}
      />
    </div>
  );
} 
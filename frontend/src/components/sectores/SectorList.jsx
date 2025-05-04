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

export default function SectorList() {
  // ========= Estados principales =========
  const [sectores, setSectores] = useState([]);
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
    id_sector: '',
    descripcion: ''
  });

  // Para ver detalles y eliminar
  const [selectedSector, setSelectedSector] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();

  // ========= useEffect de carga inicial =========
  useEffect(() => {
    loadSectores();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ========= Cargar data de backend =========
  const loadSectores = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('sectores');
      setSectores(data || []);
    } catch (error) {
      console.error('Error al cargar sectores:', error);
      toast.showError('Error', 'No se pudieron cargar los sectores');
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
      id_sector: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedSector(rowData);

    setFormData({
      id_sector: rowData.id_sector,
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
      if (isEditMode && formData.id_sector) {
        // Actualizar
        await apiService.update('sectores', formData.id_sector, formData);
        toast.showSuccess('Éxito', 'Sector actualizado');
      } else {
        // Crear nuevo
        await apiService.create('sectores', formData);
        toast.showSuccess('Éxito', 'Sector creado');
      }
      setUpsertDialogVisible(false);
      loadSectores();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.showError('Error', 'No se pudo guardar el sector');
    }
  };

  // =====================
  //  Eliminar
  // =====================
  const confirmDelete = (rowData) => {
    setSelectedSector(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedSector) return;
    try {
      await apiService.delete('sectores', selectedSector.id_sector);
      toast.showSuccess('Éxito', 'Sector eliminado');
      setDeleteDialogVisible(false);
      loadSectores();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.showError('Error', 'No se pudo eliminar el sector');
    }
  };

  // =====================
  //  Ver detalle
  // =====================
  const handleView = (rowData) => {
    setSelectedSector(rowData);
    setViewDialogVisible(true);
  };

  // =====================
  //  Búsqueda y Filtros
  // =====================
  const applyFilters = () => {
    if (!sectores || sectores.length === 0) return [];
    let filtered = [...sectores];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          (item.descripcion || '').toLowerCase().includes(q) ||
          (item.id_sector || '').toString().includes(q)
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
      field: 'id_sector',
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
        <h1 className="text-2xl font-bold text-gray-800">Sectores</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nuevo Sector
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
            placeholder="Buscar sectores..."
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
          emptyMessage="No hay sectores disponibles"
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
        title={isEditMode ? 'Editar Sector' : 'Nuevo Sector'}
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
              placeholder="Ingrese la descripción del sector"
            />
          </div>
        </div>
      </Modal>

      {/* MODAL VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Sector"
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
        {selectedSector && (
          <div className="grid grid-cols-1 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">ID</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedSector.id_sector}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Descripción</h3>
              <p className="mt-1 text-sm text-gray-900">{selectedSector.descripcion}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedSector.created_at ? new Date(selectedSector.created_at).toLocaleString() : 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Última Actualización</h3>
              <p className="mt-1 text-sm text-gray-900">
                {selectedSector.updated_at ? new Date(selectedSector.updated_at).toLocaleString() : 'N/A'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* DIÁLOGO CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar este sector?"
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
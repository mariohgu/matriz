import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function EstadoList() {
  const [estados, setEstados] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState(null);
  const [editData, setEditData] = useState({
    id_estado: '',
    descripcion: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('descripcion');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    descripcion: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const toast = useToast();

  useEffect(() => {
    loadEstados();
    
    // Añadir listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadEstados = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('estados');
      setEstados(data || []);
    } catch (error) {
      console.error('Error al cargar estados:', error);
      toast.showError('Error', 'No se pudieron cargar los estados');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...editData };
      
      // Validar que el campo descripción no esté vacío
      if (!dataToSend.descripcion.trim()) {
        toast.showWarning('Advertencia', 'La descripción no puede estar vacía');
        return;
      }
      
      if (dataToSend.id_estado) {
        await apiService.update('estados', dataToSend.id_estado, dataToSend);
        toast.showSuccess('Éxito', 'Estado actualizado correctamente');
      } else {
        await apiService.create('estados', dataToSend);
        toast.showSuccess('Éxito', 'Estado creado correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      resetEditData();
      loadEstados();
    } catch (error) {
      console.error('Error al guardar estado:', error);
      toast.showError('Error', 'No se pudo guardar el estado');
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.delete('estados', selectedEstado.id_estado);
      toast.showSuccess('Éxito', 'Estado eliminado correctamente');
      setDeleteDialogVisible(false);
      loadEstados();
    } catch (error) {
      console.error('Error al eliminar estado:', error);
      toast.showError('Error', 'No se pudo eliminar el estado');
    }
  };

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtering functions
  const filteredEstados = estados.filter(estado => {
    // Filtro de búsqueda general
    const searchFields = [
      estado.descripcion
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesDescripcion = columnFilters.descripcion === '' || 
      (estado.descripcion && estado.descripcion.toLowerCase().includes(columnFilters.descripcion.toLowerCase()));
    
    return matchesSearch && matchesDescripcion;
  });

  // Sorting
  const sortedData = [...filteredEstados].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredEstados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const resetEditData = () => {
    setEditData({
      id_estado: '',
      descripcion: '',
    });
  };

  // Definición de columnas para la tabla
  const columns = [
    {
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true
    }
  ];

  // Columnas para la vista móvil
  const mobileColumns = ['descripcion'];

  // Componente de acciones para cada fila
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedEstado(rowData);
          setEditData({
            id_estado: rowData.id_estado,
            descripcion: rowData.descripcion,
          });
          setEditDialogVisible(true);
        }}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedEstado(rowData);
          setDeleteDialogVisible(true);
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Estados</h1>
        <button
          onClick={() => {
            resetEditData();
            setCreateDialogVisible(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Estado
        </button>
      </div>

      {/* Búsqueda global - Siempre visible */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar estados..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de Estados */}
      <Table
        data={paginatedData}
        columns={columns}
        mobileColumns={mobileColumns}
        isMobile={isMobile}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        columnFilters={columnFilters}
        onColumnFilterChange={setColumnFilters}
        loading={loading}
        emptyMessage="No hay estados disponibles"
        actions={renderActions}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredEstados.length}
        className="mt-4"
      />

      {/* Modal de Edición */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Estado"
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setEditDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              id="descripcion"
              type="text"
              value={editData.descripcion}
              onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la descripción"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Creación */}
      <Modal
        isOpen={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        title="Nuevo Estado"
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setCreateDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="descripcionNew" className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <input
              id="descripcionNew"
              type="text"
              value={editData.descripcion}
              onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la descripción"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar el estado "${selectedEstado?.descripcion}"?`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}

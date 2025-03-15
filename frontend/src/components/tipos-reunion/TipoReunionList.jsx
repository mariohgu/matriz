import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function TipoReunionList() {
  const [tiposReunion, setTiposReunion] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTipoReunion, setSelectedTipoReunion] = useState(null);
  const [editData, setEditData] = useState({
    id_tipo_reunion: '',
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
    loadTiposReunion();
    
    // Listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadTiposReunion = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('tipos-reunion');
      setTiposReunion(data || []);
    } catch (error) {
      console.error('Error al cargar tipos de reunión:', error);
      toast.showError('Error', 'No se pudieron cargar los tipos de reunión');
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
      
      if (dataToSend.id_tipo_reunion) {
        await apiService.update('tipos-reunion', dataToSend.id_tipo_reunion, dataToSend);
        toast.showSuccess('Éxito', 'Tipo de reunión actualizado correctamente');
      } else {
        await apiService.create('tipos-reunion', dataToSend);
        toast.showSuccess('Éxito', 'Tipo de reunión creado correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_tipo_reunion: '',
        descripcion: '',
      });
      
      loadTiposReunion();
    } catch (error) {
      console.error('Error al guardar tipo de reunión:', error);
      toast.showError('Error', 'No se pudo guardar el tipo de reunión');
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.delete('tipos-reunion', selectedTipoReunion.id_tipo_reunion);
      toast.showSuccess('Éxito', 'Tipo de reunión eliminado correctamente');
      setDeleteDialogVisible(false);
      loadTiposReunion();
    } catch (error) {
      console.error('Error al eliminar tipo de reunión:', error);
      toast.showError('Error', 'No se pudo eliminar el tipo de reunión');
    }
  };

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtering functions
  const filteredTiposReunion = tiposReunion.filter(tipo => {
    // Filtro de búsqueda general
    const searchFields = [
      tipo.descripcion
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesDescripcion = columnFilters.descripcion === '' || 
      (tipo.descripcion && tipo.descripcion.toLowerCase().includes(columnFilters.descripcion.toLowerCase()));
    
    return matchesSearch && matchesDescripcion;
  });

  // Sorting
  const sortedData = [...filteredTiposReunion].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredTiposReunion.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  // Definición de columnas para la tabla
  const columns = [
    {
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true,
      style: 'min-w-[250px] whitespace-normal break-words',
      renderCell: (rowData) => (
        <div className="whitespace-pre-wrap break-words">
          {rowData.descripcion}
        </div>
      )
    }
  ];

  // Columnas para la vista móvil
  const mobileColumns = ['descripcion'];

  // Componente de acciones para cada fila
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedTipoReunion(rowData);
          setEditData({
            id_tipo_reunion: rowData.id_tipo_reunion,
            descripcion: rowData.descripcion,
          });
          setEditDialogVisible(true);
        }}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors duration-200"
        title="Editar"
      >
        <FiEdit className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedTipoReunion(rowData);
          setDeleteDialogVisible(true);
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full transition-colors duration-200"
        title="Eliminar"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Tipos de Reunión</h1>
        <button
          onClick={() => {
            setEditData({
              id_tipo_reunion: '',
              descripcion: '',
            });
            setCreateDialogVisible(true);
          }}
          className="px-3 py-2 md:px-4 md:py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
        >
          <FiPlus className="mr-2" />
          Nuevo Tipo
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
            placeholder="Buscar tipos de reunión..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de Tipos de Reunión */}
      <div className="overflow-x-auto">
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
          emptyMessage="No hay tipos de reunión disponibles"
          actions={renderActions}
          className="w-full"
          rowClassName="hover:bg-gray-50 transition-colors duration-150"
        />
      </div>

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredTiposReunion.length}
        className="mt-4"
      />

      {/* Modal de Edición */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Tipo de Reunión"
        contentClassName="max-w-md mx-auto"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              onClick={() => setEditDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
            <textarea
              id="descripcion"
              value={editData.descripcion}
              onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder="Ingrese la descripción"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Creación */}
      <Modal
        isOpen={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        title="Nuevo Tipo de Reunión"
        contentClassName="max-w-md mx-auto"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200"
              onClick={() => setCreateDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
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
            <textarea
              id="descripcionNew"
              value={editData.descripcion}
              onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 resize-vertical"
              placeholder="Ingrese la descripción"
              rows={3}
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
        message={`¿Está seguro que desea eliminar el tipo de reunión "${selectedTipoReunion?.descripcion}"?`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
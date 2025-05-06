import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiList } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function CategoriasList() {
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('descripcion');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    descripcion: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogo para "ver detalles"
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState(null);

  // Diálogo unificado para crear / editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  // false = crear, true = editar

  // Diálogo para ver clasificadores
  const [clasificadoresDialogVisible, setClasificadoresDialogVisible] = useState(false);
  const [relatedClasificadores, setRelatedClasificadores] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_categoria: '',
    descripcion: ''
  });

  // Diálogo para eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadCategorias();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEditMode && selectedCategoria) {
      // Asegurarse de que los valores del formulario estén actualizados con los datos seleccionados
      setFormData({
        id_categoria: selectedCategoria.id_categoria,
        descripcion: selectedCategoria.descripcion || ''
      });
    }
  }, [isEditMode, selectedCategoria]);

  const loadCategorias = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll('presupuesto/categorias');
      // Asegurarse de que response sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Categorías recibidas:', response);
      setCategorias(data);
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      toast.showError('Error', 'No se pudieron cargar las categorías');
      setCategorias([]); // En caso de error, establecer un array vacío
    } finally {
      setLoading(false);
    }
  };

  /* ==================================
   *  Crear / Editar (Modal unificado)
   * ================================== */
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_categoria: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedCategoria(rowData);
    setFormData({
      id_categoria: rowData.id_categoria,
      descripcion: rowData.descripcion || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones mínimas
      if (!formData.descripcion.trim()) {
        toast.showWarning('Advertencia', 'La descripción no puede estar vacía');
        return;
      }

      // Preparar los datos
      const dataToSend = { ...formData };
      
      // Depuración - mostrar en consola lo que se enviará
      console.log('Datos a enviar:', dataToSend);
      
      if (isEditMode && dataToSend.id_categoria) {
        // Actualizar
        await apiService.update('presupuesto/categorias', dataToSend.id_categoria, dataToSend);
        toast.showSuccess('Éxito', 'Categoría actualizada correctamente');
      } else {
        // Crear
        await apiService.create('presupuesto/categorias', dataToSend);
        toast.showSuccess('Éxito', 'Categoría creada correctamente');
      }

      setUpsertDialogVisible(false);
      loadCategorias();
    } catch (error) {
      console.error('Error al guardar categoría:', error);
      
      // Mostrar detalles del error para depuración
      if (error.response && error.response.data) {
        console.error('Detalles del error:', error.response.data);
        
        // Mostrar mensajes de error específicos si están disponibles
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
          toast.showError('Error de validación', errorMessages);
          return;
        } else if (error.response.data.message) {
          toast.showError('Error', error.response.data.message);
          return;
        }
      }
      
      toast.showError('Error', 'No se pudo guardar la categoría');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedCategoria(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedCategoria) return;
    try {
      await apiService.delete('presupuesto/categorias', selectedCategoria.id_categoria);
      toast.showSuccess('Éxito', 'Categoría eliminada correctamente');
      setDeleteDialogVisible(false);
      loadCategorias();
    } catch (error) {
      console.error('Error al eliminar categoría:', error);
      toast.showError('Error', 'No se pudo eliminar la categoría');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    setSelectedCategoria(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Ver Clasificadores
   * ================================== */
  const handleViewClasificadores = async (rowData) => {
    setSelectedCategoria(rowData);
    setLoadingRelated(true);
    try {
      const response = await apiService.get(`presupuesto/categorias/${rowData.id_categoria}/clasificadores`);
      // Asegurar que sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Clasificadores recibidos:', response);
      setRelatedClasificadores(data);
      setClasificadoresDialogVisible(true);
    } catch (error) {
      console.error('Error al cargar clasificadores:', error);
      toast.showError('Error', 'No se pudieron cargar los clasificadores');
      setRelatedClasificadores([]); // En caso de error, establecer un array vacío
    } finally {
      setLoadingRelated(false);
    }
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  // Filtrado principal
  const getFilteredData = () => {
    // Verificar que categorias sea un array
    if (!Array.isArray(categorias)) {
      console.error('categorias no es un array:', categorias);
      return [];
    }
    
    // Filtro de búsqueda global
    const filtered = categorias.filter((categoria) => {
      const searchFields = [
        categoria?.descripcion
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchDescripcion =
        !columnFilters.descripcion ||
        (categoria?.descripcion?.toLowerCase() || '').includes(columnFilters.descripcion.toLowerCase());

      return (
        matchesSearch &&
        matchDescripcion
      );
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      const aValue = a?.[sortField] || '';
      const bValue = b?.[sortField] || '';
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      } else {
        return bValue.localeCompare(aValue, undefined, { numeric: true });
      }
    });

    return sortedData;
  };

  // Paginación
  const applyPagination = (data) => {
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: data.slice(startIndex, endIndex),
      totalRecords,
      totalPages
    };
  };

  // Obtener data final
  const filteredData = getFilteredData();
  const { data: paginatedData, totalRecords, totalPages } = applyPagination(filteredData);

  /* ==================================
   *   Columnas de la tabla
   * ================================== */
  const columns = [
    {
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true
    }
  ];

  // Columnas en móvil
  const mobileColumns = ['descripcion'];

  // Función para cambiar el orden
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Acciones de la tabla
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
        onClick={() => handleViewClasificadores(rowData)}
        className="p-2 text-green-600 hover:bg-green-100 rounded-full"
        title="Ver clasificadores"
      >
        <FiList className="h-4 w-4" />
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

  // Componente para inputs
  const renderFormField = (id, label, value, onChange, type = 'text') => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value || ''}
        onChange={onChange}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        placeholder={`Ingrese ${label.toLowerCase()}`}
      />
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nueva Categoría
        </button>
      </div>

      {/* Búsqueda global */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar categorías..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FiEye className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <Table
        data={paginatedData}
        columns={columns}
        mobileColumns={mobileColumns}
        isMobile={isMobile}
        hideGlobalSearch={true}
        showFiltersButton={true}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
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
        loading={loading}
        emptyMessage="No hay categorías disponibles"
        actions={renderActions}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={totalRecords}
        className="mt-4"
      />

      {/* Modal para Ver Detalles */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles de Categoría"
        size="lg"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedCategoria && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="text-base">{selectedCategoria.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
              <p className="text-base">{new Date(selectedCategoria.created_at).toLocaleString() || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última actualización</p>
              <p className="text-base">{new Date(selectedCategoria.updated_at).toLocaleString() || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para Ver Clasificadores */}
      <Modal
        isOpen={clasificadoresDialogVisible}
        onClose={() => setClasificadoresDialogVisible(false)}
        title={`Clasificadores de Categoría: ${selectedCategoria?.descripcion || ''}`}
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setClasificadoresDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {loadingRelated ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : relatedClasificadores.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatedClasificadores.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codigo || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.descripcion || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No hay clasificadores disponibles para esta categoría</div>
        )}
      </Modal>

      {/*
        Modal unificado para CREAR / EDITAR Categoría
        (usamos isEditMode para saber si es edición)
      */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Categoría' : 'Nueva Categoría'}
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          {renderFormField('descripcion', 'Descripción', formData.descripcion, (e) =>
            setFormData((prev) => ({ ...prev, descripcion: e.target.value }))
          )}
        </div>
      </Modal>

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedCategoria
            ? `¿Está seguro de que desea eliminar la categoría "${selectedCategoria.descripcion}"?`
            : '¿Está seguro de que desea eliminar esta categoría?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
} 
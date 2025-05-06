import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function ClasificadoresList() {
  const [clasificadores, setClasificadores] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategorias, setLoadingCategorias] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('codigo_clasificador');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    codigo_clasificador: '',
    descripcion: '',
    'categoria.descripcion': ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogo para "ver detalles"
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedClasificador, setSelectedClasificador] = useState(null);

  // Diálogo unificado para crear / editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  // false = crear, true = editar

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_clasificador: '',
    id_categoria: '',
    codigo_clasificador: '',
    descripcion: ''
  });

  // Diálogo para eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadClasificadores();
    loadCategorias();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEditMode && selectedClasificador) {
      // Asegurarse de que los valores del formulario estén actualizados con los datos seleccionados
      setFormData({
        id_clasificador: selectedClasificador.id_clasificador,
        id_categoria: selectedClasificador.id_categoria || '',
        codigo_clasificador: selectedClasificador.codigo_clasificador || '',
        descripcion: selectedClasificador.descripcion || ''
      });
    }
  }, [isEditMode, selectedClasificador]);

  const loadClasificadores = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll('presupuesto/clasificadores');
      // Asegurarse de que response sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Clasificadores recibidos:', response);
      setClasificadores(data);
    } catch (error) {
      console.error('Error al cargar clasificadores:', error);
      toast.showError('Error', 'No se pudieron cargar los clasificadores');
      setClasificadores([]); // En caso de error, establecer un array vacío
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async () => {
    setLoadingCategorias(true);
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
      setLoadingCategorias(false);
    }
  };

  /* ==================================
   *  Crear / Editar (Modal unificado)
   * ================================== */
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_clasificador: '',
      id_categoria: '',
      codigo_clasificador: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedClasificador(rowData);
    setFormData({
      id_clasificador: rowData.id_clasificador,
      id_categoria: rowData.id_categoria || '',
      codigo_clasificador: rowData.codigo_clasificador || '',
      descripcion: rowData.descripcion || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones mínimas
      if (!formData.id_categoria) {
        toast.showWarning('Advertencia', 'Debe seleccionar una categoría');
        return;
      }
      
      if (!formData.codigo_clasificador.trim()) {
        toast.showWarning('Advertencia', 'El código no puede estar vacío');
        return;
      }

      if (!formData.descripcion.trim()) {
        toast.showWarning('Advertencia', 'La descripción no puede estar vacía');
        return;
      }

      // Preparar los datos
      const dataToSend = { ...formData };
      
      // Depuración - mostrar en consola lo que se enviará
      console.log('Datos a enviar:', dataToSend);
      
      if (isEditMode && dataToSend.id_clasificador) {
        // Actualizar
        await apiService.update('presupuesto/clasificadores', dataToSend.id_clasificador, dataToSend);
        toast.showSuccess('Éxito', 'Clasificador actualizado correctamente');
      } else {
        // Crear
        await apiService.create('presupuesto/clasificadores', dataToSend);
        toast.showSuccess('Éxito', 'Clasificador creado correctamente');
      }

      setUpsertDialogVisible(false);
      loadClasificadores();
    } catch (error) {
      console.error('Error al guardar clasificador:', error);
      
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
      
      toast.showError('Error', 'No se pudo guardar el clasificador');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedClasificador(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedClasificador) return;
    try {
      await apiService.delete('presupuesto/clasificadores', selectedClasificador.id_clasificador);
      toast.showSuccess('Éxito', 'Clasificador eliminado correctamente');
      setDeleteDialogVisible(false);
      loadClasificadores();
    } catch (error) {
      console.error('Error al eliminar clasificador:', error);
      toast.showError('Error', 'No se pudo eliminar el clasificador');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    setSelectedClasificador(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  // Filtrado principal
  const getFilteredData = () => {
    // Verificar que clasificadores sea un array
    if (!Array.isArray(clasificadores)) {
      console.error('clasificadores no es un array:', clasificadores);
      return [];
    }
    
    // Filtro de búsqueda global
    const filtered = clasificadores.filter((clasificador) => {
      const searchFields = [
        clasificador?.codigo_clasificador,
        clasificador?.descripcion,
        clasificador?.categoria?.descripcion
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchCodigo =
        !columnFilters.codigo_clasificador ||
        (clasificador?.codigo_clasificador?.toLowerCase() || '').includes(columnFilters.codigo_clasificador.toLowerCase());
      
      const matchDescripcion =
        !columnFilters.descripcion ||
        (clasificador?.descripcion?.toLowerCase() || '').includes(columnFilters.descripcion.toLowerCase());
      
      const matchCategoria =
        !columnFilters['categoria.descripcion'] ||
        (clasificador?.categoria?.descripcion?.toLowerCase() || '').includes(columnFilters['categoria.descripcion'].toLowerCase());

      return (
        matchesSearch &&
        matchCodigo &&
        matchDescripcion &&
        matchCategoria
      );
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      // Ordenamiento especial para el campo de categoría
      if (sortField === 'categoria.descripcion') {
        const aValue = a?.categoria?.descripcion || '';
        const bValue = b?.categoria?.descripcion || '';
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
          return bValue.localeCompare(aValue, undefined, { numeric: true });
        }
      } else {
        const aValue = a?.[sortField] || '';
        const bValue = b?.[sortField] || '';
        if (sortOrder === 'asc') {
          return aValue.localeCompare(bValue, undefined, { numeric: true });
        } else {
          return bValue.localeCompare(aValue, undefined, { numeric: true });
        }
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
      field: 'codigo_clasificador',
      header: 'Código',
      sortable: true,
      filterable: true
    },
    {
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true
    },
    {
      field: 'categoria.descripcion',
      header: 'Categoría',
      sortable: true,
      filterable: true,
      render: (rowData) => rowData.categoria?.descripcion || '-'
    }
  ];

  // Columnas en móvil
  const mobileColumns = ['codigo_clasificador', 'descripcion'];

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

  // Componente para inputs y selects
  const renderFormField = (id, label, value, onChange, type = 'text', options = null) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {options ? (
        <select
          id={id}
          value={value || ''}
          onChange={(e) => {
            console.log(`Seleccionado ${id}:`, e.target.value);
            onChange(e);
          }}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccione {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Ingrese ${label.toLowerCase()}`}
        />
      )}
    </div>
  );

  // Preparar categorías para select
  const categoriasOptions = categorias.map(cat => ({
    value: cat.id_categoria,
    label: cat.descripcion
  }));

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Clasificadores</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Clasificador
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
            placeholder="Buscar clasificadores..."
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
        emptyMessage="No hay clasificadores disponibles"
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
        title="Detalles de Clasificador"
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
        {selectedClasificador && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Código</p>
              <p className="text-base">{selectedClasificador.codigo_clasificador || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="text-base">{selectedClasificador.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Categoría</p>
              <p className="text-base">{selectedClasificador.categoria?.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
              <p className="text-base">{new Date(selectedClasificador.created_at).toLocaleString() || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última actualización</p>
              <p className="text-base">{new Date(selectedClasificador.updated_at).toLocaleString() || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/*
        Modal unificado para CREAR / EDITAR Clasificador
        (usamos isEditMode para saber si es edición)
      */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Clasificador' : 'Nuevo Clasificador'}
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
          {renderFormField(
            'id_categoria',
            'Categoría',
            formData.id_categoria,
            (e) => setFormData((prev) => ({ ...prev, id_categoria: e.target.value })),
            'select',
            categoriasOptions
          )}
          {renderFormField('codigo_clasificador', 'Código', formData.codigo_clasificador, (e) =>
            setFormData((prev) => ({ ...prev, codigo_clasificador: e.target.value }))
          )}
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
          selectedClasificador
            ? `¿Está seguro de que desea eliminar el clasificador "${selectedClasificador.codigo_clasificador} - ${selectedClasificador.descripcion}"?`
            : '¿Está seguro de que desea eliminar este clasificador?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
} 
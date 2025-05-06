import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiDollarSign, FiActivity } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function AreasEjecutorasList() {
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('codigo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    codigo: '',
    descripcion: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogo para "ver detalles"
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedAreaEjecutora, setSelectedAreaEjecutora] = useState(null);

  // Diálogo unificado para crear / editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  // false = crear, true = editar

  // Diálogos para ver presupuestos y ejecuciones
  const [presupuestosDialogVisible, setPresupuestosDialogVisible] = useState(false);
  const [ejecucionesDialogVisible, setEjecucionesDialogVisible] = useState(false);
  const [relatedPresupuestos, setRelatedPresupuestos] = useState([]);
  const [relatedEjecuciones, setRelatedEjecuciones] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_ae: '',
    codigo: '',
    descripcion: ''
  });

  // Diálogo para eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadAreasEjecutoras();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEditMode && selectedAreaEjecutora) {
      // Asegurarse de que los valores del formulario estén actualizados con los datos seleccionados
      setFormData({
        id_ae: selectedAreaEjecutora.id_ae,
        codigo: selectedAreaEjecutora.codigo || '',
        descripcion: selectedAreaEjecutora.descripcion || ''
      });
    }
  }, [isEditMode, selectedAreaEjecutora]);

  const loadAreasEjecutoras = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll('presupuesto/areas-ejecutoras');
      // Asegurarse de que response sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Datos recibidos:', response);
      setAreasEjecutoras(data);
    } catch (error) {
      console.error('Error al cargar áreas ejecutoras:', error);
      toast.showError('Error', 'No se pudieron cargar las áreas ejecutoras');
      setAreasEjecutoras([]); // En caso de error, establecer un array vacío
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
      id_ae: '',
      codigo: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedAreaEjecutora(rowData);
    setFormData({
      id_ae: rowData.id_ae,
      codigo: rowData.codigo || '',
      descripcion: rowData.descripcion || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones mínimas
      if (!formData.codigo) {
        toast.showWarning('Advertencia', 'El código no puede estar vacío');
        return;
      }

      if (!formData.descripcion.trim()) {
        toast.showWarning('Advertencia', 'La descripción no puede estar vacía');
        return;
      }

      // Procesar código como número
      const dataToSend = { 
        ...formData,
        codigo: parseInt(formData.codigo)
      };
      
      // Depuración - mostrar en consola lo que se enviará
      console.log('Datos a enviar:', dataToSend);
      
      if (isEditMode && dataToSend.id_ae) {
        // Actualizar
        await apiService.update('presupuesto/areas-ejecutoras', dataToSend.id_ae, dataToSend);
        toast.showSuccess('Éxito', 'Área ejecutora actualizada correctamente');
      } else {
        // Crear
        await apiService.create('presupuesto/areas-ejecutoras', dataToSend);
        toast.showSuccess('Éxito', 'Área ejecutora creada correctamente');
      }

      setUpsertDialogVisible(false);
      loadAreasEjecutoras();
    } catch (error) {
      console.error('Error al guardar área ejecutora:', error);
      
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
      
      toast.showError('Error', 'No se pudo guardar el área ejecutora');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedAreaEjecutora(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedAreaEjecutora) return;
    try {
      await apiService.delete('presupuesto/areas-ejecutoras', selectedAreaEjecutora.id_ae);
      toast.showSuccess('Éxito', 'Área ejecutora eliminada correctamente');
      setDeleteDialogVisible(false);
      loadAreasEjecutoras();
    } catch (error) {
      console.error('Error al eliminar área ejecutora:', error);
      toast.showError('Error', 'No se pudo eliminar el área ejecutora');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    setSelectedAreaEjecutora(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Ver Presupuestos y Ejecuciones
   * ================================== */
  const handleViewPresupuestos = async (rowData) => {
    setSelectedAreaEjecutora(rowData);
    setLoadingRelated(true);
    try {
      const response = await apiService.get(`presupuesto/areas-ejecutoras/${rowData.id_ae}/presupuestos`);
      // Asegurar que sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Presupuestos recibidos:', response);
      setRelatedPresupuestos(data);
      setPresupuestosDialogVisible(true);
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      toast.showError('Error', 'No se pudieron cargar los presupuestos');
      setRelatedPresupuestos([]); // En caso de error, establecer un array vacío
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleViewEjecuciones = async (rowData) => {
    setSelectedAreaEjecutora(rowData);
    setLoadingRelated(true);
    try {
      const response = await apiService.get(`presupuesto/areas-ejecutoras/${rowData.id_ae}/ejecuciones`);
      // Asegurar que sea un array
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Ejecuciones recibidas:', response);
      setRelatedEjecuciones(data);
      setEjecucionesDialogVisible(true);
    } catch (error) {
      console.error('Error al cargar ejecuciones:', error);
      toast.showError('Error', 'No se pudieron cargar las ejecuciones');
      setRelatedEjecuciones([]); // En caso de error, establecer un array vacío
    } finally {
      setLoadingRelated(false);
    }
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  // Filtrado principal
  const getFilteredData = () => {
    // Verificar que areasEjecutoras sea un array
    if (!Array.isArray(areasEjecutoras)) {
      console.error('areasEjecutoras no es un array:', areasEjecutoras);
      return [];
    }
    
    // Filtro de búsqueda global
    const filtered = areasEjecutoras.filter((ae) => {
      const searchFields = [
        ae?.codigo?.toString(),
        ae?.descripcion
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchCodigo =
        !columnFilters.codigo ||
        (ae?.codigo?.toString() || '').includes(columnFilters.codigo);
      const matchDescripcion =
        !columnFilters.descripcion ||
        (ae?.descripcion?.toLowerCase() || '').includes(columnFilters.descripcion.toLowerCase());

      return (
        matchesSearch &&
        matchCodigo &&
        matchDescripcion
      );
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      if (sortField === 'codigo') {
        return sortOrder === 'asc' 
          ? (a?.codigo || 0) - (b?.codigo || 0)
          : (b?.codigo || 0) - (a?.codigo || 0);
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
      field: 'codigo',
      header: 'Código',
      sortable: true,
      filterable: true
    },
    {
      field: 'descripcion',
      header: 'Descripción',
      sortable: true,
      filterable: true
    }
  ];

  // Columnas en móvil
  const mobileColumns = ['codigo', 'descripcion'];

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
        onClick={() => handleViewPresupuestos(rowData)}
        className="p-2 text-green-600 hover:bg-green-100 rounded-full"
        title="Ver presupuestos"
      >
        <FiDollarSign className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleViewEjecuciones(rowData)}
        className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
        title="Ver ejecuciones"
      >
        <FiActivity className="h-4 w-4" />
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

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Áreas Ejecutoras</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nueva Área Ejecutora
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
            placeholder="Buscar áreas ejecutoras..."
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
        emptyMessage="No hay áreas ejecutoras disponibles"
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
        title="Detalles de Área Ejecutora"
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
        {selectedAreaEjecutora && (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Código</p>
              <p className="text-base">{selectedAreaEjecutora.codigo || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="text-base">{selectedAreaEjecutora.descripcion || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
              <p className="text-base">{new Date(selectedAreaEjecutora.created_at).toLocaleString() || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última actualización</p>
              <p className="text-base">{new Date(selectedAreaEjecutora.updated_at).toLocaleString() || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal para Ver Presupuestos */}
      <Modal
        isOpen={presupuestosDialogVisible}
        onClose={() => setPresupuestosDialogVisible(false)}
        title={`Presupuestos de Área Ejecutora: ${selectedAreaEjecutora?.descripcion || ''}`}
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setPresupuestosDialogVisible(false)}
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
        ) : relatedPresupuestos.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clasificador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PIM
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatedPresupuestos.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.anio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.clasificador?.descripcion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pia?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.pim?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No hay presupuestos disponibles para esta área ejecutora</div>
        )}
      </Modal>

      {/* Modal para Ver Ejecuciones */}
      <Modal
        isOpen={ejecucionesDialogVisible}
        onClose={() => setEjecucionesDialogVisible(false)}
        title={`Ejecuciones de Área Ejecutora: ${selectedAreaEjecutora?.descripcion || ''}`}
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setEjecucionesDialogVisible(false)}
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
        ) : relatedEjecuciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Año
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mes
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clasificador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Certificado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Comprometido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Devengado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {relatedEjecuciones.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.anio}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.mes}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.clasificador?.descripcion || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.certificado?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.comprometido?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) || '0'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.devengado?.toLocaleString('es-PE', { style: 'currency', currency: 'PEN' }) || '0'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-4 text-gray-500">No hay ejecuciones disponibles para esta área ejecutora</div>
        )}
      </Modal>

      {/*
        Modal unificado para CREAR / EDITAR Área Ejecutora
        (usamos isEditMode para saber si es edición)
      */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Área Ejecutora' : 'Nueva Área Ejecutora'}
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
          {renderFormField('codigo', 'Código', formData.codigo, (e) =>
            setFormData((prev) => ({ ...prev, codigo: e.target.value })),
            'number'
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
          selectedAreaEjecutora
            ? `¿Está seguro de que desea eliminar el área ejecutora "${selectedAreaEjecutora.descripcion}"?`
            : '¿Está seguro de que desea eliminar esta área ejecutora?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
} 
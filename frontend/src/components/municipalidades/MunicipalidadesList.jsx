import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

// Opciones de nivel para reutilizar en el formulario (crear/editar)
const nivelOptions = [
  { value: '', label: 'Seleccionar nivel' },
  { value: 'Gobierno Local', label: 'Gobierno Local' },
  { value: 'Gobierno Regional', label: 'Gobierno Regional' },
  { value: 'Gobierno Provincial', label: 'Gobierno Provincial' },
  { value: 'Asociación', label: 'Asociación' },
  { value: 'Otro', label: 'Otro' }
];

const nivelRegional = [
  { value: '', label: 'Seleccionar nivel' },
  { value: 'Regional', label: 'Regional' },
  { value: 'Provincial', label: 'Provincial' },
  { value: 'Distrital', label: 'Distrital' },
  { value: 'Local', label: 'Local' },
  { value: 'Mancomunidad', label: 'Mancomunidad' },
  { value: 'Otros', label: 'Otros' }
];

export default function MunicipalidadesList() {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    nombre: '',
    region: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    nivel: '',
    RUC: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogo para “ver detalles”
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);

  // Diálogo unificado para crear / editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  // false = crear, true = editar

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_municipalidad: '',
    nombre: '',
    departamento: '',
    region: '',
    region_natural: 'No especificada', // Valor predeterminado
    provincia: '',
    distrito: '',
    ubigeo: '',
    nivel: '',
    X: '',
    Y: '',
    RUC: ''
  });

  // Diálogo para eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadMunicipalidades();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadMunicipalidades = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('municipalidades');
      setMunicipalidades(data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      toast.showError('Error', 'No se pudieron cargar las municipalidades');
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
      id_municipalidad: '',
      nombre: '',
      departamento: '',
      region: '',
      region_natural: 'No especificada',
      provincia: '',
      distrito: '',
      ubigeo: '',
      nivel: '',
      X: '',
      Y: '',
      RUC: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedMunicipalidad(rowData);
    setFormData({
      id_municipalidad: rowData.id_municipalidad,
      nombre: rowData.nombre || '',
      departamento: rowData.departamento || '',
      region: rowData.region || '',
      region_natural: rowData.region_natural || 'No especificada',
      provincia: rowData.provincia || '',
      distrito: rowData.distrito || '',
      ubigeo: rowData.ubigeo || '',
      nivel: rowData.nivel || '',
      X: rowData.X || '',
      Y: rowData.Y || '',
      RUC: rowData.RUC || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones mínimas
      if (!formData.nombre.trim()) {
        toast.showWarning('Advertencia', 'El nombre no puede estar vacío');
        return;
      }

      // Procesar coordenadas
      const dataToSend = { ...formData };
      if (dataToSend.X) {
        dataToSend.X = parseFloat(dataToSend.X);
        if (isNaN(dataToSend.X)) {
          toast.showWarning('Advertencia', 'La coordenada X debe ser un número');
          return;
        }
      }
      if (dataToSend.Y) {
        dataToSend.Y = parseFloat(dataToSend.Y);
        if (isNaN(dataToSend.Y)) {
          toast.showWarning('Advertencia', 'La coordenada Y debe ser un número');
          return;
        }
      }

      if (isEditMode && dataToSend.id_municipalidad) {
        // Actualizar
        await apiService.update('municipalidades', dataToSend.id_municipalidad, dataToSend);
        toast.showSuccess('Éxito', 'Entidad actualizada correctamente');
      } else {
        // Crear
        await apiService.create('municipalidades', dataToSend);
        toast.showSuccess('Éxito', 'Entidad creada correctamente');
      }

      setUpsertDialogVisible(false);
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al guardar entidad:', error);
      toast.showError('Error', 'No se pudo guardar la entidad');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedMunicipalidad(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedMunicipalidad) return;
    try {
      await apiService.delete('municipalidades', selectedMunicipalidad.id_municipalidad);
      toast.showSuccess('Éxito', 'Entidad eliminada correctamente');
      setDeleteDialogVisible(false);
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al eliminar entidad:', error);
      toast.showError('Error', 'No se pudo eliminar la entidad');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    setSelectedMunicipalidad(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  // Filtrado principal
  const getFilteredData = () => {
    // Filtro de búsqueda global
    const filtered = municipalidades.filter((m) => {
      const searchFields = [
        m.nombre,
        m.departamento,
        m.region,
        m.provincia,
        m.distrito,
        m.ubigeo,
        m.nivel,
        m.RUC
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchNombre =
        !columnFilters.nombre ||
        (m.nombre?.toLowerCase() || '').includes(columnFilters.nombre.toLowerCase());
      const matchRegion =
        !columnFilters.region ||
        (m.region?.toLowerCase() || '').includes(columnFilters.region.toLowerCase());
      const matchDepartamento =
        !columnFilters.departamento ||
        (m.departamento?.toLowerCase() || '').includes(columnFilters.departamento.toLowerCase());
      const matchProvincia =
        !columnFilters.provincia ||
        (m.provincia?.toLowerCase() || '').includes(columnFilters.provincia.toLowerCase());
      const matchDistrito =
        !columnFilters.distrito ||
        (m.distrito?.toLowerCase() || '').includes(columnFilters.distrito.toLowerCase());
      const matchUbigeo =
        !columnFilters.ubigeo ||
        (m.ubigeo?.toLowerCase() || '').includes(columnFilters.ubigeo.toLowerCase());
      const matchNivel =
        !columnFilters.nivel ||
        (m.nivel?.toLowerCase() || '').includes(columnFilters.nivel.toLowerCase());
      const matchRUC =
        !columnFilters.RUC ||
        (m.RUC?.toLowerCase() || '').includes(columnFilters.RUC.toLowerCase());

      return (
        matchesSearch &&
        matchNombre &&
        matchRegion &&
        matchDepartamento &&
        matchProvincia &&
        matchDistrito &&
        matchUbigeo &&
        matchNivel &&
        matchRUC
      );
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      const aValue = a[sortField] || '';
      const bValue = b[sortField] || '';
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
      field: 'nombre',
      header: 'Nombre',
      sortable: true,
      filterable: true
    },
    {
      field: 'departamento',
      header: 'Departamento',
      sortable: true,
      filterable: true
    },
    {
      field: 'provincia',
      header: 'Provincia',
      sortable: true,
      filterable: true
    },
    {
      field: 'distrito',
      header: 'Distrito',
      sortable: true,
      filterable: true
    },
    {
      field: 'nivel',
      header: 'Nivel',
      sortable: true,
      filterable: true
    }
  ];

  // Columnas en móvil (puedes customizar cuáles mostrar)
  const mobileColumns = ['nombre', 'departamento'];

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
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
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
          value={value}
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
        <h1 className="text-2xl font-bold text-gray-800">Entidades</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nueva Entidad
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
            placeholder="Buscar entidades..."
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
        emptyMessage="No hay entidades disponibles"
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
        title="Detalles de Entidad"
        size="xl"
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
        {selectedMunicipalidad && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p className="text-base">{selectedMunicipalidad.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Región</p>
                <p className="text-base">{selectedMunicipalidad.region || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Subnivel</p>
                <p className="text-base">{selectedMunicipalidad.region_natural || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Departamento</p>
                <p className="text-base">{selectedMunicipalidad.departamento || '-'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Provincia</p>
                <p className="text-base">{selectedMunicipalidad.provincia || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Distrito</p>
                <p className="text-base">{selectedMunicipalidad.distrito || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Ubigeo</p>
                <p className="text-base">{selectedMunicipalidad.ubigeo || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Nivel</p>
                <p className="text-base">{selectedMunicipalidad.nivel || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">RUC</p>
                <p className="text-base">{selectedMunicipalidad.RUC || '-'}</p>
              </div>
              </div>
              <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Subnivel</p>
                <p className="text-base">{selectedMunicipalidad.region_natural || '-'}</p>
              </div>
              {(selectedMunicipalidad.X || selectedMunicipalidad.Y) && (
              <div className="col-span-1 md:col-span-2">
                <p className="text-sm font-medium text-gray-500">Coordenadas</p>
                <p className="text-base">
                  X: {selectedMunicipalidad.X || '-'}, Y: {selectedMunicipalidad.Y || '-'}
                </p>
              </div>
            )}
            </div>
            
          </div>
        )}
      </Modal>

      {/*
        Modal unificado para CREAR / EDITAR Municipalidad
        (usamos isEditMode para saber si es edición)
      */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Entidad' : 'Nueva Entidad'}
        size="xl"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField('nombre', 'Nombre', formData.nombre, (e) =>
            setFormData((prev) => ({ ...prev, nombre: e.target.value }))
          )}
          {renderFormField('region', 'Región', formData.region, (e) =>
            setFormData((prev) => ({ ...prev, region: e.target.value }))
          )}         

          {renderFormField('departamento', 'Departamento', formData.departamento, (e) =>
            setFormData((prev) => ({ ...prev, departamento: e.target.value }))
          )}
          {renderFormField('provincia', 'Provincia', formData.provincia, (e) =>
            setFormData((prev) => ({ ...prev, provincia: e.target.value }))
          )}
          {renderFormField('distrito', 'Distrito', formData.distrito, (e) =>
            setFormData((prev) => ({ ...prev, distrito: e.target.value }))
          )}
          {renderFormField('ubigeo', 'Ubigeo', formData.ubigeo, (e) =>
            setFormData((prev) => ({ ...prev, ubigeo: e.target.value }))
          )}
          {renderFormField(
            'nivel',
            'Nivel',
            formData.nivel,
            (e) => setFormData((prev) => ({ ...prev, nivel: e.target.value })),
            'text',
            nivelOptions
          )}
          {renderFormField(
            'region_natural',
            'Subnivel',
            formData.region_natural,
            (e) => setFormData((prev) => ({ ...prev, region_natural: e.target.value })),
            'text',
            nivelRegional
          )}

          {renderFormField('RUC', 'RUC', formData.RUC, (e) =>
            setFormData((prev) => ({ ...prev, RUC: e.target.value })),
            'text'
          )}

          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField('X', 'Coordenada X', formData.X, (e) =>
              setFormData((prev) => ({ ...prev, X: e.target.value })),
              'number'
            )}
            {renderFormField('Y', 'Coordenada Y', formData.Y, (e) =>
              setFormData((prev) => ({ ...prev, Y: e.target.value })),
              'number'
            )}
          </div>
        </div>
      </Modal>

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedMunicipalidad
            ? `¿Está seguro de que desea eliminar la entidad "${selectedMunicipalidad.nombre}"?`
            : '¿Está seguro de que desea eliminar esta entidad?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}

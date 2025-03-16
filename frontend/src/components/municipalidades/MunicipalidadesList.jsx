import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, authService, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function MunicipalidadesList() {
  // Opciones de nivel para reutilizar en los modales
  const nivelOptions = [
    { value: "", label: "Seleccionar nivel" },
    { value: "Gobierno Local", label: "Gobierno Local" },
    { value: "Gobierno Regional", label: "Gobierno Regional" },
    { value: "Gobierno Provincial", label: "Gobierno Provincial" },
    { value: "Asociación", label: "Asociación" }
  ];

  const [municipalidades, setMunicipalidades] = useState([]);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [editData, setEditData] = useState({
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
    Y: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    nombre: '',
    region: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    nivel: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const toast = useToast();

  useEffect(() => {
    loadMunicipalidades();
    
    // Listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
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

  const handleSave = async () => {
    try {
      const dataToSend = { ...editData };
      
      // Validaciones
      if (!dataToSend.nombre.trim()) {
        toast.showWarning('Advertencia', 'El nombre no puede estar vacío');
        return;
      }
      
      // Procesar coordenadas
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
      
      if (dataToSend.id_municipalidad) {
        // Actualizar existente
        await apiService.update('municipalidades', dataToSend.id_municipalidad, dataToSend);
        toast.showSuccess('Éxito', 'Municipalidad actualizada correctamente');
      } else {
        // Crear nuevo
        await apiService.create('municipalidades', dataToSend);
        toast.showSuccess('Éxito', 'Municipalidad creada correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      resetEditData();
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al guardar municipalidad:', error);
      toast.showError('Error', 'No se pudo guardar la municipalidad');
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.delete('municipalidades', selectedMunicipalidad.id_municipalidad);
      toast.showSuccess('Éxito', 'Municipalidad eliminada correctamente');
      setDeleteDialogVisible(false);
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al eliminar municipalidad:', error);
      toast.showError('Error', 'No se pudo eliminar la municipalidad');
    }
  };

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtering functions
  const filteredMunicipalidades = municipalidades.filter(municipalidad => {
    // Filtro de búsqueda general
    const searchFields = [
      municipalidad.nombre,
      municipalidad.departamento,
      municipalidad.region,
      municipalidad.provincia,
      municipalidad.distrito,
      municipalidad.ubigeo,
      municipalidad.nivel
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesNombre = columnFilters.nombre === '' || 
      (municipalidad.nombre && municipalidad.nombre.toLowerCase().includes(columnFilters.nombre.toLowerCase()));
    
    const matchesRegion = columnFilters.region === '' || 
      (municipalidad.region && municipalidad.region.toLowerCase().includes(columnFilters.region.toLowerCase()));
    
    const matchesDepartamento = columnFilters.departamento === '' || 
      (municipalidad.departamento && municipalidad.departamento.toLowerCase().includes(columnFilters.departamento.toLowerCase()));
    
    const matchesProvincia = columnFilters.provincia === '' || 
      (municipalidad.provincia && municipalidad.provincia.toLowerCase().includes(columnFilters.provincia.toLowerCase()));
    
    const matchesDistrito = columnFilters.distrito === '' || 
      (municipalidad.distrito && municipalidad.distrito.toLowerCase().includes(columnFilters.distrito.toLowerCase()));
    
    const matchesUbigeo = columnFilters.ubigeo === '' || 
      (municipalidad.ubigeo && municipalidad.ubigeo.toLowerCase().includes(columnFilters.ubigeo.toLowerCase()));
    
    const matchesNivel = columnFilters.nivel === '' || 
      (municipalidad.nivel && municipalidad.nivel.toLowerCase().includes(columnFilters.nivel.toLowerCase()));
    
    return matchesSearch && matchesNombre && matchesRegion && matchesDepartamento && 
           matchesProvincia && matchesDistrito && matchesUbigeo && matchesNivel;
  });

  // Sorting
  const sortedData = [...filteredMunicipalidades].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredMunicipalidades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const resetEditData = () => {
    setEditData({
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
      Y: ''
    });
  };

  // Definición de columnas para la tabla
  const columns = [
    {
      field: 'nombre',
      header: 'Nombre',
      sortable: true,
      filterable: true
    },
    {
      field: 'region',
      header: 'Región',
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

  // Columnas para la vista móvil
  const mobileColumns = ['nombre', 'departamento'];

  // Componente de acciones para cada fila
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedMunicipalidad(rowData);
          setViewDialogVisible(true);
        }}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        title="Ver detalle"
      >
        <FiEye className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedMunicipalidad(rowData);
          setEditData({
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
            Y: rowData.Y || ''
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
          setSelectedMunicipalidad(rowData);
          setDeleteDialogVisible(true);
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Renderizar campos para el formulario
  const renderFormField = (id, label, value, onChange, type = "text", options = null) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {options ? (
        <select
          id={id}
          value={value}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {options.map(option => (
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Ingrese ${label.toLowerCase()}`}
        />
      )}
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Municipalidades</h1>
        <button
          onClick={() => {
            resetEditData();
            setCreateDialogVisible(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nueva Municipalidad
        </button>
      </div>

      {/* Tabla de Municipalidades */}
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
        emptyMessage="No hay municipalidades disponibles"
        actions={renderActions}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredMunicipalidades.length}
        className="mt-4"
      />

      {/* Modal de Vista */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de la Municipalidad"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
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
                <p className="text-sm font-medium text-gray-500">Región Natural</p>
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
        )}
      </Modal>

      {/* Modal de Edición */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Municipalidad"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField("nombre", "Nombre", editData.nombre, (e) => setEditData({ ...editData, nombre: e.target.value }))}
          {renderFormField("region", "Región", editData.region, (e) => setEditData({ ...editData, region: e.target.value }))}
          
          {renderFormField("region_natural", "Región Natural", editData.region_natural, 
            (e) => setEditData({ ...editData, region_natural: e.target.value }), 
            "text", [
              { value: "No especificada", label: "No especificada" },
              { value: "Costa", label: "Costa" },
              { value: "Sierra", label: "Sierra" },
              { value: "Selva baja", label: "Selva baja" },
              { value: "Selva alta", label: "Selva alta" }
            ]
          )}
          
          {renderFormField("departamento", "Departamento", editData.departamento, (e) => setEditData({ ...editData, departamento: e.target.value }))}
          {renderFormField("provincia", "Provincia", editData.provincia, (e) => setEditData({ ...editData, provincia: e.target.value }))}
          {renderFormField("distrito", "Distrito", editData.distrito, (e) => setEditData({ ...editData, distrito: e.target.value }))}
          {renderFormField("ubigeo", "Ubigeo", editData.ubigeo, (e) => setEditData({ ...editData, ubigeo: e.target.value }))}
          {renderFormField("nivel", "Nivel", editData.nivel, (e) => setEditData({ ...editData, nivel: e.target.value }), "text", nivelOptions)}
          
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField("X", "Coordenada X", editData.X, (e) => setEditData({ ...editData, X: e.target.value }), "number")}
            {renderFormField("Y", "Coordenada Y", editData.Y, (e) => setEditData({ ...editData, Y: e.target.value }), "number")}
          </div>
        </div>
      </Modal>

      {/* Modal de Creación */}
      <Modal
        isOpen={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        title="Nueva Municipalidad"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField("nombre", "Nombre", editData.nombre, (e) => setEditData({ ...editData, nombre: e.target.value }))}
          {renderFormField("region", "Región", editData.region, (e) => setEditData({ ...editData, region: e.target.value }))}
          
          {renderFormField("region_natural", "Región Natural", editData.region_natural, 
            (e) => setEditData({ ...editData, region_natural: e.target.value }), 
            "text", [
              { value: "No especificada", label: "No especificada" },
              { value: "Costa", label: "Costa" },
              { value: "Sierra", label: "Sierra" },
              { value: "Selva baja", label: "Selva baja" },
              { value: "Selva alta", label: "Selva alta" }
            ]
          )}
          
          {renderFormField("departamento", "Departamento", editData.departamento, (e) => setEditData({ ...editData, departamento: e.target.value }))}
          {renderFormField("provincia", "Provincia", editData.provincia, (e) => setEditData({ ...editData, provincia: e.target.value }))}
          {renderFormField("distrito", "Distrito", editData.distrito, (e) => setEditData({ ...editData, distrito: e.target.value }))}
          {renderFormField("ubigeo", "Ubigeo", editData.ubigeo, (e) => setEditData({ ...editData, ubigeo: e.target.value }))}
          {renderFormField("nivel", "Nivel", editData.nivel, (e) => setEditData({ ...editData, nivel: e.target.value }), "text", nivelOptions)}
          
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderFormField("X", "Coordenada X", editData.X, (e) => setEditData({ ...editData, X: e.target.value }), "number")}
            {renderFormField("Y", "Coordenada Y", editData.Y, (e) => setEditData({ ...editData, Y: e.target.value }), "number")}
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar la municipalidad "${selectedMunicipalidad?.nombre}"?`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
}
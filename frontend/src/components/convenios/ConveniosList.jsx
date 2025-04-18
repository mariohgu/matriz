import React, { useState, useEffect, useRef } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiChevronUp, FiChevronDown, FiSearch } from 'react-icons/fi';
import { apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';

// Opciones de tipo de convenio
const tipoConvenioOptions = [
  { value: '', label: 'Seleccione un tipo' },
  { value: 'Colaboración', label: 'Colaboración' },
  { value: 'Delegación', label: 'Delegación' },
  { value: 'Asistencia Técnica', label: 'Asistencia Técnica' },
  { value: 'Otros', label: 'Otros' }
];

// Opciones de estado
const estadoOptions = [
  { value: '', label: 'Seleccione un estado' },
  { value: 'Pendiente', label: 'Pendiente' },
  { value: 'En proceso', label: 'En proceso' },
  { value: 'Firmado', label: 'Firmado' },
  { value: 'Cancelado', label: 'Cancelado' },
  { value: 'Finalizado', label: 'Finalizado' }
];

export default function ConveniosList() {
  const [convenios, setConvenios] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);

  const [loading, setLoading] = useState(false);

  // Búsqueda global, filtros, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha_firma');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    tipo_convenio: '',
    municipalidad: '',
    monto: '',
    fecha_firma: '',
    estado: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Modal de ver detalle
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState(null);

  // Modal unificado para crear/editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_convenio: '',
    id_municipalidad: '',
    tipo_convenio: '',
    monto: '',
    fecha_firma: '',
    estado: '',
    descripcion: ''
  });

  // Modal de eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Notificaciones
  const toast = useToast();

  // ============== Estados y refs para replicar el SELECTBOX con búsqueda (Municipalidad) ===========
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  useEffect(() => {
    loadConvenios();
    loadMunicipalidades();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Cerrar el dropdown al hacer clic fuera
    const handleClickOutside = (e) => {
      if (
        municipalidadDropdownRef.current &&
        !municipalidadDropdownRef.current.contains(e.target)
      ) {
        setShowMunicipalidadDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadConvenios = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('convenios');
      setConvenios(data || []);
    } catch (error) {
      console.error('Error al cargar convenios:', error);
      toast.showError('Error', 'No se pudieron cargar los convenios');
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

  // ================== CREAR / EDITAR ==================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_convenio: '',
      id_municipalidad: '',
      tipo_convenio: '',
      monto: '',
      fecha_firma: '',
      estado: '',
      descripcion: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedConvenio(rowData);

    // Ajustar fecha a YYYY-MM-DD
    const fechaString = rowData.fecha_firma
      ? new Date(rowData.fecha_firma).toISOString().split('T')[0]
      : '';
    setFormData({
      id_convenio: rowData.id_convenio,
      id_municipalidad: rowData.id_municipalidad || '',
      tipo_convenio: rowData.tipo_convenio || '',
      monto: rowData.monto?.toString() || '',
      fecha_firma: fechaString,
      estado: rowData.estado || '',
      descripcion: rowData.descripcion || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formData.id_municipalidad || !formData.tipo_convenio) {
      toast.showWarning('Advertencia', 'Complete los campos obligatorios');
      return;
    }

    try {
      const payload = { ...formData };

      // isEditMode?
      if (isEditMode && payload.id_convenio) {
        await apiService.update('convenios', payload.id_convenio, payload);
        toast.showSuccess('Éxito', 'Convenio actualizado correctamente');
      } else {
        await apiService.create('convenios', payload);
        toast.showSuccess('Éxito', 'Convenio creado correctamente');
      }

      setUpsertDialogVisible(false);
      loadConvenios();
    } catch (error) {
      console.error('Error al guardar convenio:', error);
      toast.showError('Error', 'No se pudo guardar el convenio');
    }
  };

  // ================== ELIMINAR ==================
  const confirmDelete = (rowData) => {
    setSelectedConvenio(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedConvenio) return;
    try {
      await apiService.delete('convenios', selectedConvenio.id_convenio);
      toast.showSuccess('Éxito', 'Convenio eliminado correctamente');
      setDeleteDialogVisible(false);
      loadConvenios();
    } catch (error) {
      console.error('Error al eliminar convenio:', error);
      toast.showError('Error', 'No se pudo eliminar el convenio');
    }
  };

  // ================== VER DETALLE ==================
  const handleView = (rowData) => {
    setSelectedConvenio(rowData);
    setViewDialogVisible(true);
  };

  // ================== UTILS ==================
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    if (!val) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(val);
  };

  const getMunicipalidadName = (id) => {
    const muni = municipalidades.find((m) => m.id_municipalidad === id);
    return muni?.nombre || 'N/A';
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':      return 'Pendiente';
      case 'En proceso':     return 'En proceso';
      case 'Firmado':        return 'Firmado';
      case 'Cancelado':      return 'Cancelado';
      case 'Finalizado':     return 'Finalizado';
      default:               return 'N/A';
    }
  };

  // ================== FILTRO, ORDEN, PAGINACIÓN ==================
  const getFilteredData = () => {
    let filtered = convenios.filter((c) => {
      // Búsqueda global
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const muniName = getMunicipalidadName(c.id_municipalidad).toLowerCase();
        const fields = [
          c.tipo_convenio,
          muniName,
          c.monto?.toString() || '',
          c.estado,
          c.descripcion || ''
        ].map((x) => x?.toLowerCase() || '');
        if (!fields.some((f) => f.includes(q))) {
          return false;
        }
      }

      // Filtros por columna
      if (columnFilters.tipo_convenio) {
        if (!c.tipo_convenio.toLowerCase().includes(columnFilters.tipo_convenio.toLowerCase()))
          return false;
      }
      if (columnFilters.municipalidad) {
        const muni = getMunicipalidadName(c.id_municipalidad).toLowerCase();
        if (!muni.includes(columnFilters.municipalidad.toLowerCase())) return false;
      }
      if (columnFilters.monto) {
        if (!c.monto?.toString().includes(columnFilters.monto)) return false;
      }
      if (columnFilters.fecha_firma) {
        const fdate = formatDate(c.fecha_firma);
        if (!fdate.includes(columnFilters.fecha_firma)) return false;
      }
      if (columnFilters.estado) {
        if (!c.estado.toLowerCase().includes(columnFilters.estado.toLowerCase())) return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Manejo especial
      if (sortField === 'fecha_firma') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      if (sortField === 'monto') {
        valA = valA ? parseFloat(valA) : 0;
        valB = valB ? parseFloat(valB) : 0;
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

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

  const filteredData = getFilteredData();
  const { data: paginatedData, totalRecords, totalPages } = applyPagination(filteredData);

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // ================== COLUMNAS DE TABLA ==================
  const columns = [
    {
      field: 'tipo_convenio',
      header: 'Tipo Convenio',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.tipo_convenio || 'N/A'
    },
    {
      field: 'municipalidad',
      header: 'Municipalidad',
      // Realmente es "id_municipalidad" en la data
      sortable: true,
      filterable: true,
      body: (rowData) => getMunicipalidadName(rowData.id_municipalidad) || 'N/A'
    },
    {
      field: 'monto',
      header: 'Monto',
      sortable: true,
      filterable: true,
      body: (rowData) => formatCurrency(rowData.monto)
    },
    {
      field: 'fecha_firma',
      header: 'Fecha Firma',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha_firma)
    },
    {
      field: 'estado',
      header: 'Estado',
      sortable: true,
      filterable: true,
      body: (rowData) => getEstadoClass(rowData.estado)
    }
  ];

  const mobileColumns = ['tipo_convenio', 'municipalidad'];

  // ================== RENDER ACCIONES ==================
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

  // ================== RENDER PRINCIPAL ==================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Convenios</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Convenio
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
            placeholder="Buscar convenios..."
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
        onSearch={setSearchQuery}
        columnFilters={columnFilters}
        onColumnFilterChange={setColumnFilters}
        loading={loading}
        emptyMessage="No hay convenios disponibles"
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

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles de Convenio"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-gray-500"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedConvenio && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Tipo de Convenio</p>
                <p className="text-base">{selectedConvenio.tipo_convenio || '-'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Municipalidad</p>
                <p className="text-base">{getMunicipalidadName(selectedConvenio.id_municipalidad)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Monto</p>
                <p className="text-base">{formatCurrency(selectedConvenio.monto)}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha de Firma</p>
                <p className="text-base">{formatDate(selectedConvenio.fecha_firma)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Estado</p>
                <p className="text-base">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                ${getEstadoClass(selectedConvenio.estado)}`}
                  >
                    {selectedConvenio.estado}
                  </span>
                </p>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="text-base whitespace-pre-wrap">
                {selectedConvenio.descripcion || 'Sin descripción'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal CREAR / EDITAR UNIFICADO */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Convenio' : 'Nuevo Convenio'}
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 
                         rounded-md font-medium focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-blue-500"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/** ======== MUNICIPALIDAD con SELECTBOX de búsqueda como en EventosList ======== */}
          <div className="relative" ref={municipalidadDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
            >
              <span>
                {formData.id_municipalidad
                  ? municipalidades.find(
                      (m) => m.id_municipalidad === Number(formData.id_municipalidad)
                    )?.nombre || 'Seleccione una municipalidad'
                  : 'Seleccione una municipalidad'}
              </span>
              {showMunicipalidadDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showMunicipalidadDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
                              rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar municipalidad..."
                      value={municipalidadSearchQuery}
                      onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {municipalidades
                    .filter((m) => {
                      const q = municipalidadSearchQuery.toLowerCase();
                      return (
                        m.nombre.toLowerCase().includes(q) ||
                        (m.ubigeo || '').toLowerCase().includes(q) ||
                        (m.departamento || '').toLowerCase().includes(q)
                      );
                    })
                    .map((m) => (
                      <div
                        key={m.id_municipalidad}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_municipalidad: m.id_municipalidad
                          }));
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        <div className="font-medium">{m.nombre}</div>
                        <div className="text-xs text-gray-500">
                          [{m.ubigeo}, {m.departamento}]
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* TIPO DE CONVENIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Convenio <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.tipo_convenio || ''}
              onChange={(e) => setFormData({ ...formData, tipo_convenio: e.target.value })}
            >
              {tipoConvenioOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* MONTO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">S/</span>
              </div>
              <input
                type="number"
                className="block w-full pl-7 pr-12 border border-gray-300 
                           rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.monto || ''}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">PEN</span>
              </div>
            </div>
          </div>

          {/* FECHA_FIRMA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Firma <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.fecha_firma || ''}
              onChange={(e) => setFormData({ ...formData, fecha_firma: e.target.value })}
            />
          </div>

          {/* ESTADO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.estado || ''}
              onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
            >
              {estadoOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedConvenio
            ? `¿Está seguro de eliminar el convenio "${selectedConvenio.tipo_convenio}"?`
            : '¿Está seguro de eliminar este convenio?'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

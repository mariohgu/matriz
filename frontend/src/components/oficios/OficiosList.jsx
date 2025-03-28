import React, { useState, useEffect, useRef } from 'react';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiEdit,
  FiEye,
  FiChevronDown,
  FiChevronUp
} from 'react-icons/fi';
import { apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';

export default function OficiosList() {
  // === Arreglo de estados para selectbox (puedes cambiar según necesites) ===
  const estadoOficioOptions = [
    { value: 'Borrador', label: 'Borrador' },
    { value: 'Enviado', label: 'Enviado' },
    { value: 'Pendiente de firma', label: 'Pendiente de firma' },
    { value: 'Firmado', label: 'Firmado' },
    { value: 'Archivado', label: 'Archivado' }
  ];

  // === Estados principales ===
  const [oficios, setOficios] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda global y filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha_envio');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modales para crear/editar, ver detalle y eliminar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOficio, setSelectedOficio] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Datos para el formulario (crear/editar)
  const [formData, setFormData] = useState({
    id_oficio: '',
    id_municipalidad: '',
    numero_oficio: '',
    fecha_envio: new Date(),
    asunto: '',
    contenido: '',
    estado: ''
  });

  // Dropdown con búsqueda para municipalidad
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  // Dropdown con búsqueda para estado
  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const estadoDropdownRef = useRef(null);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();

  // =======================
  // useEffect de carga inicial
  // =======================
  useEffect(() => {
    loadOficios();
    loadMunicipalidades();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Cerrar dropdowns al hacer clic fuera
    function handleClickOutside(e) {
      if (
        municipalidadDropdownRef.current &&
        !municipalidadDropdownRef.current.contains(e.target)
      ) {
        setShowMunicipalidadDropdown(false);
      }
      if (
        estadoDropdownRef.current &&
        !estadoDropdownRef.current.contains(e.target)
      ) {
        setShowEstadoDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // =======================
  // Carga de datos
  // =======================
  const loadOficios = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('oficios'); // Ajusta el endpoint si varía
      setOficios(data || []);
    } catch (error) {
      console.error('Error al cargar oficios:', error);
      toast.showError('Error', 'No se pudieron cargar los oficios');
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

  // =======================
  // Crear / Editar
  // =======================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_oficio: '',
      id_municipalidad: '',
      numero_oficio: '',
      fecha_envio: new Date(),
      asunto: '',
      contenido: '',
      estado: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (row) => {
    setIsEditMode(true);
    setSelectedOficio(row);

    setFormData({
      id_oficio: row.id_oficio,
      id_municipalidad: row.id_municipalidad || '',
      numero_oficio: row.numero_oficio || '',
      fecha_envio: row.fecha_envio ? new Date(row.fecha_envio) : new Date(),
      asunto: row.asunto || '',
      contenido: row.contenido || '',
      estado: row.estado || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!formData.id_municipalidad || !formData.numero_oficio || !formData.asunto) {
      toast.showWarning('Advertencia', 'Completa los campos obligatorios');
      return;
    }

    const payload = {
      ...formData,
      fecha_envio: formData.fecha_envio
        ? formData.fecha_envio.toISOString().split('T')[0]
        : null
    };

    try {
      if (isEditMode && formData.id_oficio) {
        await apiService.update('oficios', formData.id_oficio, payload);
        toast.showSuccess('Éxito', 'Oficio actualizado correctamente');
      } else {
        await apiService.create('oficios', payload);
        toast.showSuccess('Éxito', 'Oficio creado correctamente');
      }
      setUpsertDialogVisible(false);
      loadOficios();
    } catch (error) {
      console.error('Error al guardar oficio:', error);
      toast.showError('Error', 'No se pudo guardar el oficio');
    }
  };

  // =======================
  // Eliminar
  // =======================
  const confirmDelete = (row) => {
    setSelectedOficio(row);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedOficio) return;
    try {
      await apiService.delete('oficios', selectedOficio.id_oficio);
      toast.showSuccess('Éxito', 'Oficio eliminado correctamente');
      setDeleteDialogVisible(false);
      loadOficios();
    } catch (error) {
      console.error('Error al eliminar oficio:', error);
      toast.showError('Error', 'No se pudo eliminar el oficio');
    }
  };

  // =======================
  // Ver detalle
  // =======================
  const handleView = (row) => {
    setSelectedOficio(row);
    setViewDialogVisible(true);
  };

  // =======================
  // Formatear fecha
  // =======================
  const formatDate = (date) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // =======================
  // Filtros / Orden
  // =======================
  const applyFilters = () => {
    if (!oficios || oficios.length === 0) return [];
    let filtered = [...oficios];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((o) => {
        const muniName =
          municipalidades.find((m) => m.id_municipalidad === o.id_municipalidad)
            ?.nombre?.toLowerCase() || '';
        return (
          (o.numero_oficio || '').toLowerCase().includes(q) ||
          (o.asunto || '').toLowerCase().includes(q) ||
          muniName.includes(q)
        );
      });
    }

    // Filtros por columna
    Object.entries(columnFilters).forEach(([key, value]) => {
      if (value) {
        const lowVal = value.toLowerCase();
        filtered = filtered.filter((o) => {
          if (key === 'municipalidad.nombre') {
            const muniName =
              municipalidades.find((m) => m.id_municipalidad === o.id_municipalidad)
                ?.nombre?.toLowerCase() || '';
            return muniName.includes(lowVal);
          } else if (key === 'fecha_envio') {
            const fdate = formatDate(o.fecha_envio);
            return fdate.includes(value);
          } else {
            const fieldVal = (o[key] || '').toString().toLowerCase();
            return fieldVal.includes(lowVal);
          }
        });
      }
    });

    // Ordenar
    if (sortField) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortField === 'municipalidad.nombre') {
          valA =
            municipalidades.find((m) => m.id_municipalidad === a.id_municipalidad)
              ?.nombre?.toLowerCase() || '';
          valB =
            municipalidades.find((m) => m.id_municipalidad === b.id_municipalidad)
              ?.nombre?.toLowerCase() || '';
        } else if (sortField === 'fecha_envio') {
          valA = a.fecha_envio ? new Date(a.fecha_envio) : new Date(0);
          valB = b.fecha_envio ? new Date(b.fecha_envio) : new Date(0);
        } else {
          valA = (a[sortField] || '').toString().toLowerCase();
          valB = (b[sortField] || '').toString().toLowerCase();
        }

        if (valA instanceof Date && valB instanceof Date) {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        } else {
          const result = valA.localeCompare(valB);
          return sortOrder === 'asc' ? result : -result;
        }
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

  // =======================
  // Columnas de la tabla
  // =======================
  const columns = [
    {
      field: 'numero_oficio',
      header: 'N° Oficio',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.numero_oficio || 'N/A'
    },
    {
      field: 'municipalidad.nombre',
      header: 'Municipalidad',
      sortable: true,
      filterable: true,
      body: (rowData) =>
        municipalidades.find((m) => m.id_municipalidad === rowData.id_municipalidad)
          ?.nombre || 'No asignada'
    },
    {
      field: 'fecha_envio',
      header: 'Fecha de Envío',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha_envio) || 'N/A'
    },
    {
      field: 'asunto',
      header: 'Asunto',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.asunto || 'N/A'
    },
    {
      field: 'estado',
      header: 'Estado',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.estado || 'N/A'
    }
  ];

  const mobileColumns = ['numero_oficio', 'fecha_envio', 'acciones'];

  // Botones de acción
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

  // =======================
  // Render principal
  // =======================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Oficios</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nuevo Oficio
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
            placeholder="Buscar oficios..."
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
          emptyMessage="No hay oficios disponibles"
          searchQuery={searchQuery}
          columnFilters={columnFilters}
          onFilterChange={(field, value) => {
            setColumnFilters({
              ...columnFilters,
              [field]: value
            });
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

      {/* Modal CREAR / EDITAR */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Oficio' : 'Nuevo Oficio'}
        size="xl"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* MUNICIPALIDAD */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={municipalidadDropdownRef}>
              <div
                className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                <span>
                  {formData.id_municipalidad
                    ? municipalidades.find(
                        (m) =>
                          m.id_municipalidad.toString() ===
                          formData.id_municipalidad.toString()
                      )?.nombre || 'Seleccione una municipalidad'
                    : 'Seleccione una municipalidad'}
                </span>
                {showMunicipalidadDropdown ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {showMunicipalidadDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
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
          </div>

          {/* NUMERO DE OFICIO */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              N° Oficio <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.numero_oficio}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, numero_oficio: e.target.value }))
              }
            />
          </div>

          {/* FECHA DE ENVIO */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha de Envío
            </label>
            <TailwindCalendar
              selectedDate={formData.fecha_envio}
              onChange={(newDate) =>
                setFormData((prev) => ({ ...prev, fecha_envio: newDate }))
              }
              id="fecha_envio"
              className="w-full"
            />
          </div>

          {/* SELECTBOX DE ESTADO (CON BÚSQUEDA) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado
            </label>
            <div className="relative" ref={estadoDropdownRef}>
              <div
                className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
                onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
              >
                <span>
                  {formData.estado
                    ? estadoOficioOptions.find(
                        (opt) => opt.value === formData.estado
                      )?.label || 'Seleccione un estado'
                    : 'Seleccione un estado'}
                </span>
                {showEstadoDropdown ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {showEstadoDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                        placeholder="Buscar estado..."
                        value={estadoSearchQuery}
                        onChange={(e) => setEstadoSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {estadoOficioOptions
                      .filter((opt) =>
                        opt.label.toLowerCase().includes(estadoSearchQuery.toLowerCase())
                      )
                      .map((opt) => (
                        <div
                          key={opt.value}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, estado: opt.value }));
                            setShowEstadoDropdown(false);
                          }}
                        >
                          <div className="font-medium">{opt.label}</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ASUNTO */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Asunto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.asunto}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, asunto: e.target.value }))
              }
            />
          </div>

          {/* CONTENIDO */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contenido
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.contenido}
              onChange={(e) => setFormData((prev) => ({ ...prev, contenido: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Oficio"
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
        {selectedOficio && (
          <div className="space-y-2">
            <p>
              <strong>Municipalidad:</strong>{' '}
              {
                municipalidades.find(
                  (m) => m.id_municipalidad === selectedOficio.id_municipalidad
                )?.nombre || 'N/A'
              }
            </p>
            <p>
              <strong>N° Oficio:</strong> {selectedOficio.numero_oficio || 'N/A'}
            </p>
            <p>
              <strong>Fecha de Envío:</strong> {formatDate(selectedOficio.fecha_envio) || 'N/A'}
            </p>
            <p>
              <strong>Estado:</strong> {selectedOficio.estado || 'N/A'}
            </p>
            <p>
              <strong>Asunto:</strong> {selectedOficio.asunto || 'N/A'}
            </p>
            <p>
              <strong>Contenido:</strong> {selectedOficio.contenido || 'N/A'}
            </p>
          </div>
        )}
      </Modal>

      {/* Modal CONFIRMAR ELIMINACION */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedOficio
            ? `¿Está seguro de eliminar el oficio "${selectedOficio.numero_oficio}"?`
            : '¿Está seguro de eliminar este oficio?'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

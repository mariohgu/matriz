import React, { useState, useRef, useEffect } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiSearch
} from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';


export default function EventosList() {
  // Opciones de modalidad a usar en el <select>
  const modalidadOptions = [
    { value: 'Presencial', label: 'Presencial' },
    { value: 'Virtual', label: 'Virtual' },
    { value: 'Híbrido', label: 'Híbrido' }
  ];

  // ======== Estados principales ========
  const [eventos, setEventos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda, filtros, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // ======== Modal unificado para crear/editar ========
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario de crear / editar
  const [formData, setFormData] = useState({
    id_evento: '',
    id_municipalidad: '',
    id_contacto: '',
    tipo_acercamiento: '',
    lugar: '',
    fecha: null,
    modalidad: '',
    descripcion: ''
  });

  // ======== Ver detalle y eliminar ========
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // ======== Dropdowns con búsqueda (para municipalidad y contacto) ========
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  const [showContactoDropdown, setShowContactoDropdown] = useState(false);
  const [contactoSearchQuery, setContactoSearchQuery] = useState('');
  const contactoDropdownRef = useRef(null);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();

  // ======== Efectos iniciales ========
  useEffect(() => {
    loadEventos();
    loadMunicipalidades();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    // Cerrar dropdowns al hacer clic fuera
    function handleClickOutside(e) {
      if (municipalidadDropdownRef.current && !municipalidadDropdownRef.current.contains(e.target)) {
        setShowMunicipalidadDropdown(false);
      }
      if (contactoDropdownRef.current && !contactoDropdownRef.current.contains(e.target)) {
        setShowContactoDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('eventos');

      // Cargar municipalidad/contacto anidados si no vienen ya en la respuesta
      const eventosProcessed = await Promise.all(
        data.map(async (evento) => {
          // Cargar municipalidad
          if (!evento.municipalidad && evento.id_municipalidad) {
            try {
              const muni = await apiService.getById('municipalidades', evento.id_municipalidad);
              evento.municipalidad = muni;
            } catch (err) {
              console.error(`Error cargando municipalidad ${evento.id_municipalidad}:`, err);
            }
          }
          // Cargar contacto
          if (!evento.contacto && evento.id_contacto) {
            try {
              const cont = await apiService.getById('contactos', evento.id_contacto);
              evento.contacto = cont;
            } catch (err) {
              console.error(`Error cargando contacto ${evento.id_contacto}:`, err);
            }
          }
          return evento;
        })
      );

      setEventos(eventosProcessed);
    } catch (error) {
      console.error('Error al cargar primer acercamiento:', error);
      toast.showError('Error', 'No se pudieron cargar los acercamientos');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const data = await apiService.getAll('municipalidades');
      setMunicipalidades(data);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      toast.showError('Error', 'No se pudieron cargar las municipalidades');
    }
  };

  // Cargar contactos para la municipalidad seleccionada
  const loadContactosPorMunicipalidad = async (id_municipalidad) => {
    if (!id_municipalidad) {
      setContactos([]);
      return;
    }
    try {
      const response = await api.get(`contactos`);
      const contactosFiltrados = response.data.filter(
        (c) => c.id_municipalidad === parseInt(id_municipalidad)
      );
      setContactos(contactosFiltrados);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast.showError('Error', 'No se pudieron cargar los contactos');
    }
  };

  // ======== Crear / Editar (un solo modal) ========
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_evento: '',
      id_municipalidad: '',
      id_contacto: '',
      tipo_acercamiento: '',
      lugar: '',
      fecha: new Date(), // fecha por defecto
      modalidad: '',
      descripcion: ''
    });
    setContactos([]); // reiniciar contactos
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedEvento(rowData);

    setFormData({
      id_evento: rowData.id_evento,
      id_municipalidad: rowData.id_municipalidad,
      id_contacto: rowData.id_contacto,
      tipo_acercamiento: rowData.tipo_acercamiento || '',
      lugar: rowData.lugar || '',
      fecha: rowData.fecha ? new Date(rowData.fecha) : new Date(),
      modalidad: rowData.modalidad || '',
      descripcion: rowData.descripcion || ''
    });

    // Cargar contactos para la municipalidad que tenga
    loadContactosPorMunicipalidad(rowData.id_municipalidad);

    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    if (
      !formData.id_municipalidad ||
      !formData.id_contacto ||
      !formData.tipo_acercamiento ||
      !formData.lugar ||
      !formData.fecha ||
      !formData.modalidad
    ) {
      toast.showWarning('Advertencia', 'Por favor complete todos los campos obligatorios');
      return;
    }

    const eventoPayload = {
      ...formData,
      fecha: formData.fecha?.toISOString().split('T')[0]
    };

    try {
      if (isEditMode && formData.id_evento) {
        // Editar
        await apiService.update('eventos', formData.id_evento, eventoPayload);
        toast.showSuccess('Éxito', 'Evento actualizado correctamente');
      } else {
        // Crear
        await apiService.create('eventos', eventoPayload);
        toast.showSuccess('Éxito', 'Evento creado correctamente');
      }
      setUpsertDialogVisible(false);
      loadEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      toast.showError('Error', 'No se pudo guardar el evento');
    }
  };

  // ======== Eliminar ========
  const confirmDelete = (rowData) => {
    setSelectedEvento(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedEvento) return;
    try {
      await apiService.delete('eventos', selectedEvento.id_evento);
      toast.showSuccess('Éxito', 'Primer acercamiento eliminado correctamente');
      setDeleteDialogVisible(false);
      loadEventos();
    } catch (error) {
      console.error('Error al eliminar primer acercamiento:', error);
      toast.showError('Error', 'No se pudo eliminar el primer acercamiento');
    }
  };

  // ======== Ver Detalle ========
  const handleView = (rowData) => {
    setSelectedEvento(rowData);
    setViewDialogVisible(true);
  };

  // ======== Búsqueda y filtrado ========
  const formatDate = (date) => {
    if (!date) return '';
    let dateObj = typeof date === 'string' ? new Date(date) : date;
    if (!(dateObj instanceof Date && !isNaN(dateObj))) return '';
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const applyFilters = () => {
    if (!eventos || eventos.length === 0) return [];

    let filteredData = [...eventos];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filteredData = filteredData.filter((ev) => {
        return (
          (ev.municipalidad?.nombre?.toLowerCase() || '').includes(q) ||
          (ev.municipalidad?.departamento?.toLowerCase() || '').includes(q) ||
          (ev.contacto?.nombre_completo?.toLowerCase() || '').includes(q) ||
          (ev.tipo_acercamiento || '').toLowerCase().includes(q) ||
          (ev.lugar || '').toLowerCase().includes(q) ||
          (ev.modalidad || '').toLowerCase().includes(q) ||
          (ev.descripcion || '').toLowerCase().includes(q)
        );
      });
    }

    // Filtros por columna
    if (columnFilters) {
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          const lowVal = value.toLowerCase();
          filteredData = filteredData.filter((ev) => {
            if (key === 'municipalidad.nombre') {
              return ev.municipalidad?.nombre?.toLowerCase().includes(lowVal);
            } else if (key === 'municipalidad.departamento') {
              return ev.municipalidad?.departamento?.toLowerCase().includes(lowVal);
            } else if (key === 'contacto.nombre_completo') {
              return ev.contacto?.nombre_completo?.toLowerCase().includes(lowVal);
            } else if (key === 'fecha') {
              return formatDate(ev.fecha).includes(lowVal);
            } else {
              // Para campos directos en ev (tipo_acercamiento, lugar, modalidad, descripcion)
              return (ev[key] || '').toString().toLowerCase().includes(lowVal);
            }
          });
        }
      });
    }

    // Ordenar
    if (sortField) {
      filteredData.sort((a, b) => {
        let valA, valB;
        if (sortField === 'municipalidad.nombre') {
          valA = a.municipalidad?.nombre?.toLowerCase() || '';
          valB = b.municipalidad?.nombre?.toLowerCase() || '';
        } else if (sortField === 'contacto.nombre_completo') {
          valA = a.contacto?.nombre_completo?.toLowerCase() || '';
          valB = b.contacto?.nombre_completo?.toLowerCase() || '';
        } else if (sortField === 'fecha') {
          valA = a.fecha ? new Date(a.fecha) : new Date(0);
          valB = b.fecha ? new Date(b.fecha) : new Date(0);
        } else {
          valA = (a[sortField] || '').toString().toLowerCase();
          valB = (b[sortField] || '').toString().toLowerCase();
        }

        if (valA instanceof Date && valB instanceof Date) {
          const diff = valA - valB;
          return sortOrder === 'asc' ? diff : -diff;
        } else {
          const result = valA.localeCompare(valB);
          return sortOrder === 'asc' ? result : -result;
        }
      });
    }

    return filteredData;
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

  // ======== Definir columnas ========
  const columns = [
    {
      field: 'municipalidad.nombre',
      header: 'MUNICIPALIDAD',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.municipalidad?.nombre || 'N/A'
    },
    {
      field: 'municipalidad.departamento',
      header: 'DEPARTAMENTO',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.municipalidad?.departamento || 'N/A'
    },
    {
      field: 'contacto.nombre_completo',
      header: 'CONTACTO',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.contacto?.nombre_completo || 'N/A'
    },
    {
      field: 'tipo_acercamiento',
      header: 'TIPO DE ACERCAMIENTO',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.tipo_acercamiento || 'N/A'
    },
    {
      field: 'lugar',
      header: 'LUGAR',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.lugar || 'N/A'
    },
    {
      field: 'fecha',
      header: 'FECHA',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha) || 'N/A'
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
  const mobileColumns = ['municipalidad.nombre', 'fecha', 'acciones'];

  // ======== Render principal ========
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Primeros Acercamientos</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nuevo Primer Acercamiento
        </button>
      </div>

      {/* Búsqueda global */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar primeros acercamientos..."
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
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          emptyMessage="No hay primeros acercamientos disponibles"
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

      {/** ======================================
       *  MODAL CREAR / EDITAR UNIFICADO
       * ======================================= */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Primer Acercamiento' : 'Nuevo Primer Acercamiento'}
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
                        (m) => m.id_municipalidad.toString() === formData.id_municipalidad.toString()
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
                          (m.ubigeo || '').toLowerCase().includes(q)
                        );
                      })
                      .map((m) => (
                        <div
                          key={m.id_municipalidad}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              id_municipalidad: m.id_municipalidad,
                              id_contacto: '' // reset
                            }));
                            loadContactosPorMunicipalidad(m.id_municipalidad);
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

          {/* CONTACTO */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div className="relative" ref={contactoDropdownRef}>
              <div
                className={`w-full border border-gray-300 rounded-md p-2 flex justify-between items-center ${
                  formData.id_municipalidad ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100'
                }`}
                onClick={() => {
                  if (formData.id_municipalidad) {
                    setShowContactoDropdown(!showContactoDropdown);
                  }
                }}
              >
                <span>
                  {formData.id_contacto
                    ? contactos.find(
                        (c) => c.id_contacto.toString() === formData.id_contacto.toString()
                      )?.nombre_completo || 'Seleccione un contacto'
                    : 'Seleccione un contacto'}
                </span>
                {showContactoDropdown ? <FiChevronUp /> : <FiChevronDown />}
              </div>
              {showContactoDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                        placeholder="Buscar contacto..."
                        value={contactoSearchQuery}
                        onChange={(e) => setContactoSearchQuery(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {contactos
                      .filter((c) =>
                        c.nombre_completo?.toLowerCase().includes(contactoSearchQuery.toLowerCase())
                      )
                      .map((c) => (
                        <div
                          key={c.id_contacto}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              id_contacto: c.id_contacto
                            }));
                            setShowContactoDropdown(false);
                          }}
                        >
                          <div className="font-medium">{c.nombre_completo}</div>
                          <div className="text-xs text-gray-500">[{c.cargo}]</div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* TIPO DE ACERCAMIENTO */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo de Acercamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.tipo_acercamiento || ''}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, tipo_acercamiento: e.target.value }))
              }
            />
          </div>

          {/* LUGAR */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Lugar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.lugar || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, lugar: e.target.value }))}
            />
          </div>

          {/* FECHA */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <TailwindCalendar
              selectedDate={formData.fecha}
              onChange={(newDate) => setFormData((prev) => ({ ...prev, fecha: newDate }))}
              id="fecha"
              className="w-full"
            />
          </div>

          {/* MODALIDAD (SELECT) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.modalidad || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, modalidad: e.target.value }))}
            >
              <option value="">Seleccione una modalidad</option>
              {modalidadOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Diálogo VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Primer Acercamiento"
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
        {selectedEvento && (
          <div className="space-y-2">
            <p>
              <strong>Municipalidad:</strong>{' '}
              {selectedEvento.municipalidad?.nombre || 'N/A'}
            </p><p>
              <strong>Departamento:</strong>{' '}
              {selectedEvento.municipalidad?.departamento || 'N/A'}
            </p>
            <p>
              <strong>Contacto:</strong>{' '}
              {selectedEvento.contacto?.nombre_completo || 'N/A'}
            </p>
            <p>
              <strong>Tipo de Acercamiento:</strong>{' '}
              {selectedEvento.tipo_acercamiento || 'N/A'}
            </p>
            <p>
              <strong>Lugar:</strong>{' '}
              {selectedEvento.lugar || 'N/A'}
            </p>
            <p>
              <strong>Fecha:</strong>{' '}
              {formatDate(selectedEvento.fecha) || 'N/A'}
            </p>
            <p>
              <strong>Modalidad:</strong>{' '}
              {selectedEvento.modalidad || 'N/A'}
            </p>
            <p>
              <strong>Descripción:</strong>{' '}
              {selectedEvento.descripcion || 'N/A'}
            </p>
          </div>
        )}
      </Modal>

      {/* Diálogo CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar este primer acercamiento?"
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

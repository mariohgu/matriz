import React, { useState, useEffect, useRef } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiCalendar
} from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';

export default function EstadoSeguimientoList() {
  // ========= Estados principales =========
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [tiposReunion, setTiposReunion] = useState([]);
  const [estados, setEstados] = useState([]); // Para id_estado_ref (p.ej. Pendiente, En Proceso, etc.)
  const [loading, setLoading] = useState(true);

  // Búsqueda global, filtros por columna, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal unificado (crear/editar)
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    id_estado: '',
    id_evento: '',
    id_contacto: '',
    id_tipo_reunion: '',
    fecha: null,
    id_estado_ref: '',
    descripcion: '',
    compromiso: '',
    fecha_compromiso: null
  });

  // Para ver detalles y eliminar
  const [selectedSeguimiento, setSelectedSeguimiento] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Dropdowns con búsqueda
  const [showEventoDropdown, setShowEventoDropdown] = useState(false);
  const [eventoSearchQuery, setEventoSearchQuery] = useState('');
  const eventoDropdownRef = useRef(null);

  const [showContactoDropdown, setShowContactoDropdown] = useState(false);
  const [contactoSearchQuery, setContactoSearchQuery] = useState('');
  const contactoDropdownRef = useRef(null);

  const [showTipoReunionDropdown, setShowTipoReunionDropdown] = useState(false);
  const [tipoReunionSearchQuery, setTipoReunionSearchQuery] = useState('');
  const tipoReunionDropdownRef = useRef(null);

  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const estadoDropdownRef = useRef(null);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();

  // ========= useEffect de carga inicial =========
  useEffect(() => {
    loadEstadosSeguimiento();
    loadRelatedData();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Cerrar dropdowns al hacer clic afuera
    function handleClickOutside(e) {
      if (eventoDropdownRef.current && !eventoDropdownRef.current.contains(e.target)) {
        setShowEventoDropdown(false);
      }
      if (contactoDropdownRef.current && !contactoDropdownRef.current.contains(e.target)) {
        setShowContactoDropdown(false);
      }
      if (tipoReunionDropdownRef.current && !tipoReunionDropdownRef.current.contains(e.target)) {
        setShowTipoReunionDropdown(false);
      }
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(e.target)) {
        setShowEstadoDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ========= Cargar data de backend =========
  const loadEstadosSeguimiento = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('estados-seguimiento');
      setEstadosSeguimiento(data || []);
    } catch (error) {
      console.error('Error al cargar estados de seguimiento:', error);
      toast.showError('Error', 'No se pudieron cargar los estados de seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [evt, mun, ctos, tr, est] = await Promise.all([
        apiService.getAll('eventos'),
        apiService.getAll('municipalidades'),
        apiService.getAll('contactos'),
        apiService.getAll('tipos-reunion'),
        apiService.getAll('estados') // la tabla "estados" para id_estado_ref
      ]);
      setEventos(evt || []);
      setContactos(ctos || []);
      setTiposReunion(tr || []);
      setEstados(est || []);
      // Podrías guardar municipalidades si las necesitaras
      // en este caso, tal vez no las necesites directamente
      // si no hay ID de municipalidad en este modelo.
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      toast.showError('Error', 'No se pudieron cargar los datos relacionados');
    }
  };

  // =====================
  //  Crear / Editar
  // =====================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_estado: '',
      id_evento: '',
      id_contacto: '',
      id_tipo_reunion: '',
      fecha: new Date(),
      id_estado_ref: '',
      descripcion: '',
      compromiso: '',
      fecha_compromiso: null
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedSeguimiento(rowData);

    setFormData({
      id_estado: rowData.id_estado,
      id_evento: rowData.id_evento,
      id_contacto: rowData.id_contacto,
      id_tipo_reunion: rowData.id_tipo_reunion,
      fecha: rowData.fecha ? new Date(rowData.fecha) : new Date(),
      id_estado_ref: rowData.id_estado_ref || '',
      descripcion: rowData.descripcion || '',
      compromiso: rowData.compromiso || '',
      fecha_compromiso: rowData.fecha_compromiso
        ? new Date(rowData.fecha_compromiso)
        : null
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!formData.id_evento || !formData.id_contacto || !formData.id_tipo_reunion || !formData.fecha) {
      toast.showWarning('Advertencia', 'Por favor llena los campos obligatorios');
      return;
    }

    const payload = {
      ...formData,
      fecha: formData.fecha ? formData.fecha.toISOString().split('T')[0] : null,
      fecha_compromiso: formData.fecha_compromiso
        ? formData.fecha_compromiso.toISOString().split('T')[0]
        : null
    };

    try {
      if (isEditMode && formData.id_estado) {
        // Actualizar
        await apiService.update('estados-seguimiento', formData.id_estado, payload);
        toast.showSuccess('Éxito', 'Estado de seguimiento actualizado');
      } else {
        // Crear nuevo
        await apiService.create('estados-seguimiento', payload);
        toast.showSuccess('Éxito', 'Estado de seguimiento creado');
      }
      setUpsertDialogVisible(false);
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.showError('Error', 'No se pudo guardar el estado de seguimiento');
    }
  };

  // =====================
  //  Eliminar
  // =====================
  const confirmDelete = (rowData) => {
    setSelectedSeguimiento(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedSeguimiento) return;
    try {
      await apiService.remove('estados-seguimiento', selectedSeguimiento.id_estado);
      toast.showSuccess('Éxito', 'Estado de seguimiento eliminado');
      setDeleteDialogVisible(false);
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.showError('Error', 'No se pudo eliminar el estado de seguimiento');
    }
  };

  // =====================
  //  Ver detalle
  // =====================
  const handleView = (rowData) => {
    setSelectedSeguimiento(rowData);
    setViewDialogVisible(true);
  };

  // =====================
  //  Formatear fecha
  // =====================
  const formatDate = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d)) return '';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // =====================
  //  Búsqueda y Filtros
  // =====================
  const applyFilters = () => {
    if (!estadosSeguimiento || estadosSeguimiento.length === 0) return [];
    let filtered = [...estadosSeguimiento];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        // Campos para text-search
        const eventoName = eventos.find((e) => e.id_evento === item.id_evento)?.municipalidad?.nombre?.toLowerCase() || '';
        const contactoName = contactos.find((c) => c.id_contacto === item.id_contacto)?.nombre_completo?.toLowerCase() || '';
        const tipoRDesc = tiposReunion.find((t) => t.id_tipo_reunion === item.id_tipo_reunion)?.descripcion?.toLowerCase() || '';
        const estadoDesc = estados.find((es) => es.id_estado == item.id_estado_ref)?.descripcion?.toLowerCase() || '';

        return (
          eventoName.includes(q) ||
          contactoName.includes(q) ||
          tipoRDesc.includes(q) ||
          (item.descripcion || '').toLowerCase().includes(q) ||
          (item.compromiso || '').toLowerCase().includes(q) ||
          estadoDesc.includes(q) ||
          formatDate(item.fecha).includes(q) ||
          formatDate(item.fecha_compromiso).includes(q)
        );
      });
    }

    // Filtros por columna
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value) {
        const lowerVal = value.toLowerCase();
        filtered = filtered.filter((item) => {
          if (field === 'evento.municipalidad.nombre') {
            const eventoName = eventos.find((e) => e.id_evento === item.id_evento)?.municipalidad?.nombre?.toLowerCase() || '';
            return eventoName.includes(lowerVal);
          } else if (field === 'contacto.nombre') {
            const cName = contactos.find((c) => c.id_contacto === item.id_contacto)?.nombre_completo?.toLowerCase() || '';
            return cName.includes(lowerVal);
          } else if (field === 'tipoReunion.descripcion') {
            const trDesc = tiposReunion.find((tr) => tr.id_tipo_reunion === item.id_tipo_reunion)?.descripcion?.toLowerCase() || '';
            return trDesc.includes(lowerVal);
          } else if (field === 'estado') {
            const esDesc = estados.find((es) => es.id_estado == item.id_estado_ref)?.descripcion?.toLowerCase() || '';
            return esDesc.includes(lowerVal);
          } else if (field === 'fecha') {
            return formatDate(item.fecha).includes(value);
          } else if (field === 'fecha_compromiso') {
            return formatDate(item.fecha_compromiso).includes(value);
          } else {
            // Por si tuviéramos otros campos directos
            return (item[field] || '').toString().toLowerCase().includes(lowerVal);
          }
        });
      }
    });

    // Ordenar
    if (sortField) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortField === 'evento.municipalidad.nombre') {
          valA = eventos.find((e) => e.id_evento === a.id_evento)?.municipalidad?.nombre?.toLowerCase() || '';
          valB = eventos.find((e) => e.id_evento === b.id_evento)?.municipalidad?.nombre?.toLowerCase() || '';
        } else if (sortField === 'contacto.nombre') {
          valA = contactos.find((c) => c.id_contacto === a.id_contacto)?.nombre_completo?.toLowerCase() || '';
          valB = contactos.find((c) => c.id_contacto === b.id_contacto)?.nombre_completo?.toLowerCase() || '';
        } else if (sortField === 'tipoReunion.descripcion') {
          valA = tiposReunion.find((tr) => tr.id_tipo_reunion === a.id_tipo_reunion)?.descripcion?.toLowerCase() || '';
          valB = tiposReunion.find((tr) => tr.id_tipo_reunion === b.id_tipo_reunion)?.descripcion?.toLowerCase() || '';
        } else if (sortField === 'fecha') {
          valA = a.fecha ? new Date(a.fecha) : new Date(0);
          valB = b.fecha ? new Date(b.fecha) : new Date(0);
        } else if (sortField === 'fecha_compromiso') {
          valA = a.fecha_compromiso ? new Date(a.fecha_compromiso) : new Date(0);
          valB = b.fecha_compromiso ? new Date(b.fecha_compromiso) : new Date(0);
        } else if (sortField === 'estado') {
          valA = estados.find((es) => es.id_estado == a.id_estado_ref)?.descripcion?.toLowerCase() || '';
          valB = estados.find((es) => es.id_estado == b.id_estado_ref)?.descripcion?.toLowerCase() || '';
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

  // =====================
  //  Definir columnas
  // =====================
  const columns = [
    {
      field: 'evento.municipalidad.nombre',
      header: 'EVENTO DE MUNICIPALIDAD',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const evt = eventos.find((e) => e.id_evento === rowData.id_evento);
        const nombre_fecha = evt?.municipalidad?.nombre + ' - ' + formatDate(evt?.fecha) || 'N/A';
        return nombre_fecha;
      }
    },
    {
      field: 'contacto.nombre',
      header: 'CONTACTO',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const cto = contactos.find((c) => c.id_contacto === rowData.id_contacto);
        return cto?.nombre_completo || 'N/A';
      }
    },
    {
      field: 'fecha',
      header: 'FECHA',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha) || 'N/A'
    },
    {
      field: 'estado',
      header: 'ESTADO',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const estRef = estados.find((es) => es.id_estado == rowData.id_estado_ref);
        return estRef?.descripcion || 'N/A';
      }
    },
    {
      field: 'fecha_compromiso',
      header: 'FECHA COMPROMISO',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha_compromiso) || 'N/A'
    }
  ];

  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedSeguimiento(rowData);
          setViewDialogVisible(true);
        }}
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
  const mobileColumns = ['evento.municipalidad.nombre', 'fecha', 'acciones'];

  // =====================
  // Render principal
  // =====================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Estados de Seguimiento</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nuevo Estado
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
            placeholder="Buscar estados de seguimiento..."
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
          emptyMessage="No hay estados de seguimiento disponibles"
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

      {/* MODAL CREAR/EDITAR UNIFICADO */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Estado de Seguimiento' : 'Nuevo Estado de Seguimiento'}
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
          {/* Evento con búsqueda */}
          <div className="relative" ref={eventoDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Evento <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowEventoDropdown(!showEventoDropdown)}
            >
              <span>
                {formData.id_evento
                  ? eventos.find((ev) => ev.id_evento.toString() === formData.id_evento.toString())
                      ?.municipalidad?.nombre || 'Seleccione un evento'
                  : 'Seleccione un evento'}
              </span>
              {showEventoDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showEventoDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar evento..."
                      value={eventoSearchQuery}
                      onChange={(e) => setEventoSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {eventos
                    .filter((ev) => {
                      const q = eventoSearchQuery.toLowerCase();
                      const muniName = ev.municipalidad?.nombre?.toLowerCase() || '';
                      const ubigeo = ev.municipalidad?.ubigeo?.toLowerCase() || '';
                      const dep = ev.municipalidad?.departamento?.toLowerCase() || '';
                      const fechaEvt = ev.fecha ? formatDate(ev.fecha).toLowerCase() : '';
                      return (
                        muniName.includes(q) ||
                        ubigeo.includes(q) ||
                        dep.includes(q) ||
                        fechaEvt.includes(q)
                      );
                    })
                    .map((ev) => (
                      <div
                        key={ev.id_evento}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_evento: ev.id_evento,
                            id_contacto: '' // reset
                          }));
                          setShowEventoDropdown(false);
                        }}
                      >
                        <div className="font-medium">
                          {ev.municipalidad?.nombre || '(Sin municipalidad)'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Fecha: {formatDate(ev.fecha)}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Contacto con búsqueda */}
          <div className="relative" ref={contactoDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div
              className={`w-full border border-gray-300 rounded-md p-2 flex justify-between items-center ${
                formData.id_evento ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100'
              }`}
              onClick={() => {
                if (formData.id_evento) setShowContactoDropdown(!showContactoDropdown);
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
                      c.nombre_completo
                        ?.toLowerCase()
                        .includes(contactoSearchQuery.toLowerCase())
                    )
                    .map((c) => (
                      <div
                        key={c.id_contacto}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, id_contacto: c.id_contacto }));
                          setShowContactoDropdown(false);
                        }}
                      >
                        <div className="font-medium">{c.nombre_completo}</div>
                        <div className="text-xs text-gray-500">
                          {c.cargo || 'Sin cargo'}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Tipo de Reunión con búsqueda */}
          <div className="relative" ref={tipoReunionDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo de Reunión <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowTipoReunionDropdown(!showTipoReunionDropdown)}
            >
              <span>
                {formData.id_tipo_reunion
                  ? tiposReunion.find(
                      (tr) => tr.id_tipo_reunion.toString() === formData.id_tipo_reunion.toString()
                    )?.descripcion || 'Seleccione un tipo'
                  : 'Seleccione un tipo de reunión'}
              </span>
              {showTipoReunionDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showTipoReunionDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar tipo..."
                      value={tipoReunionSearchQuery}
                      onChange={(e) => setTipoReunionSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {tiposReunion
                    .filter((tr) =>
                      tr.descripcion
                        ?.toLowerCase()
                        .includes(tipoReunionSearchQuery.toLowerCase())
                    )
                    .map((tr) => (
                      <div
                        key={tr.id_tipo_reunion}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, id_tipo_reunion: tr.id_tipo_reunion }));
                          setShowTipoReunionDropdown(false);
                        }}
                      >
                        <div className="font-medium">{tr.descripcion}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Fecha */}
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

          {/* Estado (id_estado_ref) con dropdown (si deseas que se seleccione) */}
          <div className="relative" ref={estadoDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado (Referencia)
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
            >
              <span>
                {formData.id_estado_ref
                  ? estados.find((es) => es.id_estado.toString() === formData.id_estado_ref.toString())
                      ?.descripcion || 'Seleccione un estado'
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
                  {estados
                    .filter((es) =>
                      es.descripcion?.toLowerCase().includes(estadoSearchQuery.toLowerCase())
                    )
                    .map((es) => (
                      <div
                        key={es.id_estado}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, id_estado_ref: es.id_estado }));
                          setShowEstadoDropdown(false);
                        }}
                      >
                        <div className="font-medium">{es.descripcion}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Compromiso */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Compromiso
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.compromiso || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, compromiso: e.target.value }))}
            />
          </div>

          {/* Fecha Compromiso */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha de Compromiso
            </label>
            <TailwindCalendar
              selectedDate={formData.fecha_compromiso}
              onChange={(newDate) => setFormData((prev) => ({ ...prev, fecha_compromiso: newDate }))}
              id="fecha_compromiso"
              className="w-full"
            />
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.descripcion || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle del Estado de Seguimiento"
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
        {selectedSeguimiento && (
          <div className="space-y-2">
            <p>
              <strong>Evento:</strong>{' '}
              {
                eventos.find((ev) => ev.id_evento === selectedSeguimiento.id_evento)
                  ?.municipalidad?.nombre || 'N/A'
              }
            </p>
            <p>
              <strong>Contacto:</strong>{' '}
              {
                contactos.find((c) => c.id_contacto === selectedSeguimiento.id_contacto)
                  ?.nombre_completo || 'N/A'
              }
            </p>
            <p>
              <strong>Tipo de Reunión:</strong>{' '}
              {
                tiposReunion.find((tr) => tr.id_tipo_reunion === selectedSeguimiento.id_tipo_reunion)
                  ?.descripcion || 'N/A'
              }
            </p>
            <p>
              <strong>Fecha:</strong>{' '}
              {formatDate(selectedSeguimiento.fecha) || 'N/A'}
            </p>
            <p>
              <strong>Estado:</strong>{' '}
              {
                estados.find((es) => es.id_estado == selectedSeguimiento.id_estado_ref)
                  ?.descripcion || 'N/A'
              }
            </p>
            <p>
              <strong>Fecha de Compromiso:</strong>{' '}
              {formatDate(selectedSeguimiento.fecha_compromiso) || 'N/A'}
            </p>
            <p>
              <strong>Compromiso:</strong>{' '}
              {selectedSeguimiento.compromiso || 'N/A'}
            </p>
            <p>
              <strong>Descripción:</strong>{' '}
              {selectedSeguimiento.descripcion || 'N/A'}
            </p>
          </div>
        )}
      </Modal>

      {/* Diálogo CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        visible={deleteDialogVisible}
        onHide={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar este Estado de Seguimiento?"
        header="Confirmación"
        icon={<FiTrash2 />}
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="bg-red-600 text-white"
        onAccept={handleDelete}
        onReject={() => setDeleteDialogVisible(false)}
      />
    </div>
  );
}

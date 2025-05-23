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
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar, InteraccionDetails } from '../ui';

export default function EstadoSeguimientoList() {
  // ========= Estados principales =========
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [tiposReunion, setTiposReunion] = useState([]);
  const [estados, setEstados] = useState([]); // Para id_estado_ref (p.ej. Pendiente, En Proceso, etc.)
  const [convenios, setConvenios] = useState([]);
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
    fecha_compromiso: null,
    compromiso_concluido: null
  });

  // Para ver detalles y eliminar
  const [selectedSeguimiento, setSelectedSeguimiento] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Modal para crear nuevo contacto
  const [newContactDialogVisible, setNewContactDialogVisible] = useState(false);
  const [newContactData, setNewContactData] = useState({
    nombre_completo: '',
    cargo: '',
    telefono: '',
    correo: '',
    id_municipalidad: ''
  });

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
      const [evt, ctos, tr, est, convs] = await Promise.all([
        apiService.getAll('eventos'),
        apiService.getAll('contactos'),
        apiService.getAll('tipos-reunion'),
        apiService.getAll('estados'), // la tabla "estados" para id_estado_ref
        apiService.getAll('convenios') // Cargar convenios
      ]);
      setEventos(evt || []);
      setContactos(ctos || []);
      setTiposReunion(tr || []);
      setEstados(est || []);
      setConvenios(convs || []); // Guardar convenios
      // Podrías guardar municipalidades si las necesitaras
      // en este caso, tal vez no las necesites directamente
      // si no hay ID de municipalidad en este modelo.
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      toast.showError('Error', 'No se pudieron cargar los datos relacionados');
    }
  };

  // Crear nuevo contacto desde el formulario de estado de seguimiento
  const handleCreateNewContact = () => {
    if (!formData.id_evento) {
      toast.showWarning('Advertencia', 'Primero seleccione un evento para crear un contacto asociado');
      return;
    }

    // Obtener la municipalidad del evento seleccionado
    const selectedEvento = eventos.find(ev => ev.id_evento.toString() === formData.id_evento.toString());
    if (!selectedEvento || !selectedEvento.id_municipalidad) {
      toast.showWarning('Advertencia', 'No se pudo determinar la municipalidad para este evento');
      return;
    }

    // Inicializar datos del nuevo contacto
    setNewContactData({
      nombre_completo: '',
      cargo: '',
      telefono: '',
      correo: '',
      id_municipalidad: selectedEvento.id_municipalidad
    });

    setNewContactDialogVisible(true);
  };

  // Guardar el nuevo contacto
  const handleSaveNewContact = async () => {
    // Validar datos mínimos
    if (!newContactData.nombre_completo || !newContactData.id_municipalidad) {
      toast.showWarning('Advertencia', 'Por favor ingrese al menos el nombre del contacto');
      return;
    }

    try {
      const response = await apiService.create('contactos', newContactData);
      toast.showSuccess('Éxito', 'Contacto creado correctamente');
      
      // Actualizar lista de contactos
      const updatedContactos = await apiService.getAll('contactos');
      setContactos(updatedContactos || []);
      
      // Seleccionar el nuevo contacto en el formulario
      if (response && response.id_contacto) {
        setFormData(prev => ({ ...prev, id_contacto: response.id_contacto }));
      }
      
      setNewContactDialogVisible(false);
    } catch (error) {
      console.error('Error al crear contacto:', error);
      toast.showError('Error', 'No se pudo crear el contacto');
    }
  };

  // =====================
  //  Crear / Editar
  // =====================
  const handleCreate = () => {
    setIsEditMode(false);
    // Crear fecha actual usando UTC para evitar problemas de zona horaria
    const today = new Date();
    const fechaUtc = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
    
    setFormData({
      id_estado: '',
      id_evento: '',
      id_contacto: '',
      id_tipo_reunion: '',
      fecha: fechaUtc,
      id_estado_ref: '',
      descripcion: '',
      compromiso: '',
      fecha_compromiso: null,
      compromiso_concluido: null
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedSeguimiento(rowData);

    // Ajustar las fechas para corregir el problema de zona horaria
    let fechaObj = null;
    if (rowData.fecha) {
      const fechaStr = typeof rowData.fecha === 'string' ? rowData.fecha : rowData.fecha.toISOString().split('T')[0];
      const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
      fechaObj = new Date(Date.UTC(year, month - 1, day));
    } else {
      fechaObj = new Date();
    }
    
    let fechaCompromisoObj = null;
    if (rowData.fecha_compromiso) {
      const fechaStr = typeof rowData.fecha_compromiso === 'string' ? rowData.fecha_compromiso : rowData.fecha_compromiso.toISOString().split('T')[0];
      const [year, month, day] = fechaStr.split('-').map(num => parseInt(num, 10));
      fechaCompromisoObj = new Date(Date.UTC(year, month - 1, day));
    }

    setFormData({
      id_estado: rowData.id_estado,
      id_evento: rowData.id_evento,
      id_contacto: rowData.id_contacto,
      id_tipo_reunion: rowData.id_tipo_reunion,
      fecha: fechaObj,
      id_estado_ref: rowData.id_estado_ref || '',
      descripcion: rowData.descripcion || '',
      compromiso: rowData.compromiso || '',
      fecha_compromiso: fechaCompromisoObj,
      compromiso_concluido: rowData.compromiso_concluido
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
      fecha: formData.fecha ? new Date(formData.fecha.getFullYear(), formData.fecha.getMonth(), formData.fecha.getDate()).toISOString().split('T')[0] : null,
      fecha_compromiso: formData.fecha_compromiso
        ? new Date(formData.fecha_compromiso.getFullYear(), formData.fecha_compromiso.getMonth(), formData.fecha_compromiso.getDate()).toISOString().split('T')[0]
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
      await apiService.delete('estados-seguimiento', selectedSeguimiento.id_estado);
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
    // Primero convertir a objeto Date si es string
    const d = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(d)) return '';
    
    // Crear una nueva fecha usando UTC para evitar problemas de zona horaria
    const utcDate = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dd = String(utcDate.getUTCDate()).padStart(2, '0');
    const mm = String(utcDate.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = utcDate.getUTCFullYear();
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
      header: 'ENTIDAD - FECHA 1 ACERC.',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const evt = eventos.find((e) => e.id_evento === rowData.id_evento);
        const nombre_fecha = evt?.municipalidad?.nombre + ' - ' + formatDate(evt?.fecha) || 'N/A';
        return nombre_fecha;
      }
    },
    {
      field: 'evento.municipalidad.departamento',
      header: 'DEPARTAMENTO',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const evt = eventos.find((e) => e.id_evento === rowData.id_evento);
        return evt?.municipalidad?.departamento || 'N/A';
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
          hideGlobalSearch={true}
          showFiltersButton={true}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          emptyMessage="No hay estados de seguimiento disponibles"
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
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-500">
                Contacto <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                className={`text-xs px-2 py-1 rounded ${formData.id_evento ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                onClick={() => formData.id_evento && handleCreateNewContact()}
                disabled={!formData.id_evento}
              >
                <FiPlus className="inline mr-1" /> Nuevo Contacto
              </button>
            </div>
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
                    .filter((c) => {
                      // Filtrar contactos por municipalidad en lugar de evento
                      if (!formData.id_evento) return false;
                      
                      // Obtener la municipalidad del evento seleccionado
                      const selectedEvento = eventos.find(ev => ev.id_evento.toString() === formData.id_evento.toString());
                      const eventoMunicipId = selectedEvento?.id_municipalidad;
                      
                      // Mostrar contactos relacionados con la municipalidad del evento
                      return eventoMunicipId && c.id_municipalidad && 
                             c.id_municipalidad.toString() === eventoMunicipId.toString();
                    })
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
          
          {/* Compromiso Concluido (checkbox) */}
          <div className="flex items-center">
            <div className="flex items-center h-full">
              <label className="flex items-center cursor-pointer">
                <div className="mr-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={formData.compromiso_concluido === true}
                    onChange={(e) => setFormData((prev) => ({ ...prev, compromiso_concluido: e.target.checked }))}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">Compromiso Concluido</span>
              </label>
            </div>
          </div>
          {/* Compromiso */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Compromiso
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.compromiso || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, compromiso: e.target.value }))}
            />
          </div>

          
        </div>
      </Modal>

      {/* Modal VER DETALLE con InteraccionDetails */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Interacción"
        size="xl"
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
          <InteraccionDetails 
            id_evento={selectedSeguimiento.id_evento}
          />
        )}
      </Modal>

      {/* Diálogo CONFIRMAR ELIMINACIÓN */}
          <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar este evento?"
        title="Confirmación"
        icon={<FiTrash2 />}
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="bg-red-600 text-white"
        onConfirm={handleDelete}
        onReject={() => setDeleteDialogVisible(false)}
      />

      {/* Modal para crear nuevo contacto */}
      <Modal
        isOpen={newContactDialogVisible}
        onClose={() => setNewContactDialogVisible(false)}
        title="Nuevo Contacto"
        size="md"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setNewContactDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              onClick={handleSaveNewContact}
            >
              Guardar Contacto
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Nombre Completo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newContactData.nombre_completo}
              onChange={(e) => setNewContactData(prev => ({ ...prev, nombre_completo: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Cargo
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newContactData.cargo}
              onChange={(e) => setNewContactData(prev => ({ ...prev, cargo: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Teléfono
            </label>
            <input
              type="text"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newContactData.telefono}
              onChange={(e) => setNewContactData(prev => ({ ...prev, telefono: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md"
              value={newContactData.correo}
              onChange={(e) => setNewContactData(prev => ({ ...prev, correo: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { FiEdit, FiTrash2, FiEye, FiChevronUp, FiChevronDown, FiPlus, FiCalendar } from 'react-icons/fi';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';

export default function EstadoSeguimientosList() {
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [tiposReunion, setTiposReunion] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedEstadoSeguimiento, setSelectedEstadoSeguimiento] = useState(null);
  const [editData, setEditData] = useState({
    id_estado: '',
    id_evento: '',
    id_contacto: '',
    id_tipo_reunion: '',
    fecha: null,
    estado: '',
    descripcion: '',
    compromiso: '',
    fecha_compromiso: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toastMessage, setToastMessage] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    'evento.municipalidad.nombre': '',
    'contacto.nombre': '',
    'tipoReunion.descripcion': '',
    fecha: '',
    estado: '',
    fecha_compromiso: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En Proceso', value: 'En Proceso' },
    { label: 'Completado', value: 'Completado' },
    { label: 'Cancelado', value: 'Cancelado' }
  ];

  const loadEstadosSeguimiento = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADDRESS}api/estados-seguimiento`);
      setEstadosSeguimiento(response.data || []);
    } catch (error) {
      console.error('Error al cargar estados de seguimiento:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los estados de seguimiento'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      const [eventosResponse, municipalidadesResponse, contactosResponse, tiposReunionResponse] = 
        await Promise.all([
          axios.get(`${ADDRESS}api/eventos`),
          axios.get(`${ADDRESS}api/municipalidades`),
          axios.get(`${ADDRESS}api/contactos`),
          axios.get(`${ADDRESS}api/tipos-reunion`)
        ]);
      
      setEventos(eventosResponse.data || []);
      setContactos(contactosResponse.data || []);
      setTiposReunion(tiposReunionResponse.data || []);
      
      window.municipalidadesData = municipalidadesResponse.data || [];
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar algunos datos relacionados'
      });
    }
  };

  useEffect(() => {
    loadEstadosSeguimiento();
    loadRelatedData();
    
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadEventos = async () => {
    try {
      const response = await axios.get(`${ADDRESS}api/eventos`);
      setEventos(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los eventos'
      });
    }
  };

  const loadTiposReunion = async () => {
    try {
      const response = await axios.get(`${ADDRESS}api/tipos-reunion`);
      setTiposReunion(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de reunión:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los tipos de reunión'
      });
    }
  };

  const loadContactosPorEvento = async (eventoId) => {
    try {
      const eventoResponse = await axios.get(`${ADDRESS}api/eventos/${eventoId}`);
      const evento = eventoResponse.data;
      
      if (evento && evento.id_municipalidad) {
        const response = await axios.get(`${ADDRESS}api/municipalidades/${evento.id_municipalidad}/contactos`);
        const contactosFiltrados = response.data.filter(
          contacto => contacto.id_municipalidad === parseInt(evento.id_municipalidad)
        );
        setContactos(contactosFiltrados);
      } else {
        setContactos([]);
      }
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los contactos'
      });
    }
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...editData };
      
      if (dataToSend.fecha && dataToSend.fecha instanceof Date) {
        dataToSend.fecha = dataToSend.fecha.toISOString().split('T')[0];
      }
      
      if (dataToSend.fecha_compromiso && dataToSend.fecha_compromiso instanceof Date) {
        dataToSend.fecha_compromiso = dataToSend.fecha_compromiso.toISOString().split('T')[0];
      }
      
      if (dataToSend.id_estado) {
        await axios.put(`${ADDRESS}api/estados-seguimiento/${dataToSend.id_estado}`, dataToSend);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado de seguimiento actualizado correctamente'
        });
      } else {
        await axios.post(`${ADDRESS}api/estados-seguimiento`, dataToSend);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado de seguimiento creado correctamente'
        });
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_estado: '',
        id_evento: '',
        id_contacto: '',
        id_tipo_reunion: '',
        fecha: null,
        estado: '',
        descripcion: '',
        compromiso: '',
        fecha_compromiso: null
      });
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al guardar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el estado de seguimiento'
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/estados-seguimiento/${rowData.id_estado}`);
      setToastMessage({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Estado de seguimiento eliminado correctamente'
      });
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el estado de seguimiento'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const filteredEstadosSeguimiento = estadosSeguimiento.filter(estado => {
    const searchFields = [
      estado.evento?.municipalidad?.nombre,
      estado.contacto?.nombre,
      estado.tipoReunion?.descripcion,
      estado.estado,
      estado.descripcion,
      estado.compromiso,
      formatDate(estado.fecha),
      formatDate(estado.fecha_compromiso)
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesMunicipalidad = columnFilters['evento.municipalidad.nombre'] === '' || 
      (estado.evento?.municipalidad?.nombre && 
       estado.evento.municipalidad.nombre.toLowerCase().includes(columnFilters['evento.municipalidad.nombre'].toLowerCase()));
    
    const matchesContacto = columnFilters['contacto.nombre'] === '' || 
      (estado.contacto?.nombre && 
       estado.contacto.nombre.toLowerCase().includes(columnFilters['contacto.nombre'].toLowerCase()));
    
    const matchesTipoReunion = columnFilters['tipoReunion.descripcion'] === '' || 
      (estado.tipoReunion?.descripcion && 
       estado.tipoReunion.descripcion.toLowerCase().includes(columnFilters['tipoReunion.descripcion'].toLowerCase()));
    
    const matchesFecha = columnFilters.fecha === '' || 
      (estado.fecha && 
       formatDate(estado.fecha).toLowerCase().includes(columnFilters.fecha.toLowerCase()));
    
    const matchesEstado = columnFilters.estado === '' || 
      (estado.estado && 
       estado.estado.toLowerCase().includes(columnFilters.estado.toLowerCase()));
    
    const matchesFechaCompromiso = columnFilters.fecha_compromiso === '' || 
      (estado.fecha_compromiso && 
       formatDate(estado.fecha_compromiso).toLowerCase().includes(columnFilters.fecha_compromiso.toLowerCase()));
    
    return matchesSearch && matchesMunicipalidad && matchesContacto && matchesTipoReunion && 
           matchesFecha && matchesEstado && matchesFechaCompromiso;
  });

  const totalPages = Math.ceil(filteredEstadosSeguimiento.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const sortedData = [...filteredEstadosSeguimiento].sort((a, b) => {
    let aValue, bValue;
    
    if (sortField.includes('.')) {
      const parts = sortField.split('.');
      aValue = parts.reduce((obj, key) => obj && obj[key], a) || '';
      bValue = parts.reduce((obj, key) => obj && obj[key], b) || '';
    } else {
      aValue = a[sortField] || '';
      bValue = b[sortField] || '';
    }
    
    if (sortField === 'fecha' || sortField === 'fecha_compromiso') {
      return sortOrder === 'asc' 
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc'
        ? aValue.localeCompare(bValue, undefined, { numeric: true })
        : bValue.localeCompare(aValue, undefined, { numeric: true });
    }
    
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const paginatedData = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const TailwindCalendar = ({ selectedDate, onChange, id, className }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef(null);
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);
    
    const handleDateSelect = (date) => {
      onChange(date);
      setIsOpen(false);
    };
    
    const navigateMonth = (step) => {
      const newDate = new Date(currentDate);
      newDate.setMonth(newDate.getMonth() + step);
      setCurrentDate(newDate);
    };
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    const renderCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
      const firstDayOfMonth = new Date(year, month, 1).getDay();
      
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const days = [];
      
      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(
          <div key={`empty-${i}`} className="h-8 w-8"></div>
        );
      }
      
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const isToday = new Date().toDateString() === date.toDateString();
        const isSelected = selectedDate && selectedDate.toDateString() === date.toDateString();
        
        days.push(
          <button
            key={`day-${day}`}
            type="button"
            onClick={() => handleDateSelect(date)}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
              isSelected
                ? 'bg-blue-500 text-white'
                : isToday
                  ? 'bg-blue-100 text-blue-800'
                  : 'hover:bg-gray-100'
            }`}
          >
            {day}
          </button>
        );
      }
      
      return days;
    };
    
    return (
      <div className="relative" ref={calendarRef}>
        <div className={`relative ${className}`}>
          <input
            id={id}
            type="text"
            readOnly
            value={selectedDate ? formatDate(selectedDate) : ''}
            placeholder="Seleccionar fecha"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <FiCalendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        {isOpen && (
          <div className="absolute z-10 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
            <div className="flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={() => navigateMonth(-1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => navigateMonth(1)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
            
            <div className="mt-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  handleDateSelect(new Date());
                }}
                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const eventoBodyTemplate = (estado) => {
    if (estado.evento && estado.evento.municipalidad) {
      return estado.evento.municipalidad.nombre || 'Sin municipalidad';
    }
    
    const evento = eventos.find(e => e.id_evento === estado.id_evento);
    if (evento && evento.municipalidad) {
      return evento.municipalidad.nombre || 'Sin municipalidad';
    }
    
    return 'N/A';
  };

  const contactoBodyTemplate = (estado) => {
    if (estado.contacto) {
      return estado.contacto.nombre_completo || 'Sin nombre';
    }
    
    const contacto = contactos.find(c => c.id_contacto === estado.id_contacto);
    if (contacto) {
      return contacto.nombre_completo || 'Sin nombre';
    }
    
    return 'N/A';
  };

  const tipoReunionBodyTemplate = (estado) => {
    if (estado.tipoReunion) {
      return estado.tipoReunion.descripcion || 'Sin descripción';
    }
    
    const tipoReunion = tiposReunion.find(tr => tr.id_tipo_reunion === estado.id_tipo_reunion);
    if (tipoReunion) {
      return tipoReunion.descripcion || 'Sin descripción';
    }
    
    return 'N/A';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border border-gray-200 ${
          toastMessage.severity === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' :
          toastMessage.severity === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' :
          toastMessage.severity === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700' :
          'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        }`}>
          <div className="flex items-center">
            <div className="font-bold">{toastMessage.summary}</div>
            <div className="ml-2">{toastMessage.detail}</div>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-800">Estados de Seguimiento</h2>
          <button
            onClick={() => {
              setEditData({
                id_estado: '',
                id_evento: '',
                id_contacto: '',
                id_tipo_reunion: '',
                fecha: null,
                estado: '',
                descripcion: '',
                compromiso: '',
                fecha_compromiso: null
              });
              setCreateDialogVisible(true);
            }}
            className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Estado</span>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar estado..."
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto w-full">
        <table className="min-w-full w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('evento.municipalidad.nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Municipalidad</span>
                  {sortField === 'evento.municipalidad.nombre' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters['evento.municipalidad.nombre']}
                      onChange={(e) => setColumnFilters({...columnFilters, 'evento.municipalidad.nombre': e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : ''}`}
                onClick={() => handleSort('contacto.nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Contacto</span>
                  {sortField === 'contacto.nombre' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters['contacto.nombre']}
                      onChange={(e) => setColumnFilters({...columnFilters, 'contacto.nombre': e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : ''}`}
                onClick={() => handleSort('tipoReunion.descripcion')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipo Reunión</span>
                  {sortField === 'tipoReunion.descripcion' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters['tipoReunion.descripcion']}
                      onChange={(e) => setColumnFilters({...columnFilters, 'tipoReunion.descripcion': e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('fecha')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha</span>
                  {sortField === 'fecha' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.fecha}
                      onChange={(e) => setColumnFilters({...columnFilters, fecha: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('estado')}
              >
                <div className="flex items-center space-x-1">
                  <span>Estado</span>
                  {sortField === 'estado' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.estado}
                      onChange={(e) => setColumnFilters({...columnFilters, estado: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : ''}`}
                onClick={() => handleSort('fecha_compromiso')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha Compromiso</span>
                  {sortField === 'fecha_compromiso' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.fecha_compromiso}
                      onChange={(e) => setColumnFilters({...columnFilters, fecha_compromiso: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
          {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron estados de seguimiento
                </td>
              </tr>
            ) : (
              paginatedData.map(estado => (
                <tr key={estado.id_estado} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal">
                    <div className="text-sm font-medium text-gray-900">
                      {eventoBodyTemplate(estado)}
                    </div>
                  </td>
                  
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900">
                        {contactoBodyTemplate(estado)}
                      </div>
                    </td>
                  )}
                  
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900">
                        {tipoReunionBodyTemplate(estado)}
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(estado.fecha)}
                    </div>
                  </td>
                  
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      estado.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      estado.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                      estado.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                      estado.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {estado.estado || 'N/A'}
                    </span>
                  </td>
                  
                  {!isMobile && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(estado.fecha_compromiso)}
                      </div>
                    </td>
                  )}
                  
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedEstadoSeguimiento(estado);
                          setViewDialogVisible(true);
                        }}
                        className="text-purple-600 hover:text-purple-900 focus:outline-none"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          const editableData = {
                            id_estado: estado.id_estado,
                            id_evento: estado.id_evento,
                            id_contacto: estado.id_contacto,
                            id_tipo_reunion: estado.id_tipo_reunion,
                            fecha: estado.fecha ? new Date(estado.fecha) : null,
                            estado: estado.estado,
                            descripcion: estado.descripcion || '',
                            compromiso: estado.compromiso || '',
                            fecha_compromiso: estado.fecha_compromiso ? new Date(estado.fecha_compromiso) : null
                          };
                          
                          setEditData(editableData);
                          setEditDialogVisible(true);
                          
                          if (estado.id_evento) {
                            loadContactosPorEvento(estado.id_evento);
                          }
                        }}
                        className="text-blue-600 hover:text-blue-900 focus:outline-none"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEstadoSeguimiento(estado);
                          setDeleteDialogVisible(true);
                        }}
                        className="text-red-600 hover:text-red-900 focus:outline-none"
                      >
                        <FiTrash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4">
        <div className="flex justify-between sm:hidden w-full">
          <button 
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === 1 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Anterior
          </button>
          <button 
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
              currentPage === totalPages || totalPages === 0 ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{paginatedData.length > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, filteredEstadosSeguimiento.length)}</span> de <span className="font-medium">{filteredEstadosSeguimiento.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => goToPage(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Primera página</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => goToPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 ${
                  currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = index + 1;
                } else if (currentPage <= 3) {
                  pageNumber = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + index;
                } else {
                  pageNumber = currentPage - 2 + index;
                }
                
                if (pageNumber <= 0 || pageNumber > totalPages) return null;
                
                return (
                  <button
                    key={pageNumber}
                    onClick={() => goToPage(pageNumber)}
                    className={`relative inline-flex items-center px-4 py-2 border ${
                      currentPage === pageNumber
                        ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    } text-sm font-medium`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
              
              <button
                onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 ${
                  currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Siguiente</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 ${
                  currentPage === totalPages || totalPages === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Última página</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
      
      {viewDialogVisible && selectedEstadoSeguimiento && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">Detalles del Estado de Seguimiento</h3>
              <button
                onClick={() => setViewDialogVisible(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Municipalidad</label>
                  <p className="text-gray-800">{eventoBodyTemplate(selectedEstadoSeguimiento)}</p>
                </div>
                
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Tipo de Reunión</label>
                  <p className="text-gray-800">{tipoReunionBodyTemplate(selectedEstadoSeguimiento)}</p>
                </div>
                
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Contacto</label>
                  <p className="text-gray-800">{contactoBodyTemplate(selectedEstadoSeguimiento)}</p>
                </div>
                
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Fecha</label>
                  <p className="text-gray-800">{formatDate(selectedEstadoSeguimiento.fecha)}</p>
                </div>

                <div className="field col-span-1 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Descripción</label>
                  <p className="text-gray-800 whitespace-pre-line">{selectedEstadoSeguimiento.descripcion || 'N/A'}</p>
                </div>
                
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Estado</label>
                  <p className="text-gray-800">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedEstadoSeguimiento.estado === 'Pendiente' ? 'bg-yellow-100 text-yellow-800' :
                      selectedEstadoSeguimiento.estado === 'En Proceso' ? 'bg-blue-100 text-blue-800' :
                      selectedEstadoSeguimiento.estado === 'Completado' ? 'bg-green-100 text-green-800' :
                      selectedEstadoSeguimiento.estado === 'Cancelado' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedEstadoSeguimiento.estado || 'N/A'}
                    </span>
                  </p>
                </div>
                
                <div className="field">
                  <label className="block text-gray-700 font-medium mb-1">Fecha de Compromiso</label>
                  <p className="text-gray-800">{formatDate(selectedEstadoSeguimiento.fecha_compromiso)}</p>
                </div>
                
                <div className="field col-span-1 md:col-span-2">
                  <label className="block text-gray-700 font-medium mb-1">Compromiso</label>
                  <p className="text-gray-800 whitespace-pre-line">{selectedEstadoSeguimiento.compromiso || 'N/A'}</p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => setViewDialogVisible(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
      
      {(editDialogVisible || createDialogVisible) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h3 className="text-lg font-medium text-gray-900">
                {editDialogVisible ? 'Editar Estado de Seguimiento' : 'Nuevo Estado de Seguimiento'}
              </h3>
              <button
                onClick={() => {
                  setEditDialogVisible(false);
                  setCreateDialogVisible(false);
                }}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="field">
                  <label htmlFor="evento" className="block text-gray-700 font-medium mb-2">
                    Evento (Municipalidad)
                  </label>
                  <select
                    id="evento"
                    value={editData.id_evento || ''}
                    onChange={(e) => {
                      setEditData({ ...editData, id_evento: e.target.value, id_contacto: '' });
                      if (e.target.value) {
                        loadContactosPorEvento(e.target.value);
                      } else {
                        setContactos([]);
                      }
                    }}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un evento</option>
                    {eventos.map(evento => (
                      <option key={evento.id_evento} value={evento.id_evento}>
                        {evento.municipalidad?.nombre || 'Sin municipalidad'} - {formatDate(evento.fecha)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label htmlFor="contacto" className="block text-gray-700 font-medium mb-2">
                    Contacto
                  </label>
                  <select
                    id="contacto"
                    value={editData.id_contacto || ''}
                    onChange={(e) => setEditData({ ...editData, id_contacto: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={!editData.id_evento}
                  >
                    <option value="">Seleccione un contacto</option>
                    {contactos.map(contacto => (
                      <option key={contacto.id_contacto} value={contacto.id_contacto}>
                        {contacto.nombre_completo || 'Sin nombre'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label htmlFor="tipoReunion" className="block text-gray-700 font-medium mb-2">
                    Tipo de Reunión
                  </label>
                  <select
                    id="tipoReunion"
                    value={editData.id_tipo_reunion || ''}
                    onChange={(e) => setEditData({ ...editData, id_tipo_reunion: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un tipo de reunión</option>
                    {tiposReunion.map(tipo => (
                      <option key={tipo.id_tipo_reunion} value={tipo.id_tipo_reunion}>
                        {tipo.descripcion || 'Sin descripción'}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label htmlFor="fecha" className="block text-gray-700 font-medium mb-2">
                    Fecha
                  </label>
                  <TailwindCalendar
                    id="fecha"
                    selectedDate={editData.fecha}
                    onChange={(date) => setEditData({ ...editData, fecha: date })}
                    className="w-full"
                  />
                </div>

                <div className="field md:col-span-2">
                  <label htmlFor="descripcion" className="block text-gray-700 font-medium mb-2">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    value={editData.descripcion}
                    onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div className="field">
                  <label htmlFor="estado" className="block text-gray-700 font-medium mb-2">
                    Estado
                  </label>
                  <select
                    id="estado"
                    value={editData.estado}
                    onChange={(e) => setEditData({ ...editData, estado: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un estado</option>
                    {estadoOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="field">
                  <label htmlFor="fechaCompromiso" className="block text-gray-700 font-medium mb-2">
                    Fecha de Compromiso
                  </label>
                  <TailwindCalendar
                    id="fechaCompromiso"
                    selectedDate={editData.fecha_compromiso}
                    onChange={(date) => setEditData({ ...editData, fecha_compromiso: date })}
                    className="w-full"
                  />
                </div>
                
                <div className="field md:col-span-2">
                  <label htmlFor="compromiso" className="block text-gray-700 font-medium mb-2">
                    Compromiso
                  </label>
                  <textarea
                    id="compromiso"
                    value={editData.compromiso}
                    onChange={(e) => setEditData({ ...editData, compromiso: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end p-4 border-t gap-2 sticky bottom-0 bg-white">
              <button
                onClick={() => {
                  setEditDialogVisible(false);
                  setCreateDialogVisible(false);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none"
              >
                {editDialogVisible ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {deleteDialogVisible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-100 p-2 rounded-full mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
              </div>
              <p className="text-gray-700 mb-4">
                ¿Está seguro de que desea eliminar este estado de seguimiento? Esta acción no se puede deshacer.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setDeleteDialogVisible(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    confirmDelete(selectedEstadoSeguimiento);
                    setDeleteDialogVisible(false);
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:outline-none"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
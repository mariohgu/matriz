import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiEdit, FiEye, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiX, FiCalendar } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, apiService } from '../../services/authService';

export default function OficiosList() {
  const [oficios, setOficios] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedOficio, setSelectedOficio] = useState(null);
  const [editData, setEditData] = useState({
    id_oficio: '',
    id_municipalidad: '',
    numero_oficio: '',
    fecha_envio: null,
    asunto: '',
    contenido: '',
    estado: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('numero_oficio');
  const [sortOrder, setSortOrder] = useState('asc');
  const [toastMessage, setToastMessage] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    numero_oficio: '',
    municipalidad: '',
    fecha_envio: '',
    asunto: '',
    estado: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Variables para los dropdowns con búsqueda
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const estadoDropdownRef = useRef(null);

  // Efecto para cerrar el dropdown cuando se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event) {
      if (municipalidadDropdownRef.current && !municipalidadDropdownRef.current.contains(event.target)) {
        setShowMunicipalidadDropdown(false);
      }
      
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(event.target)) {
        setShowEstadoDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [municipalidadDropdownRef, estadoDropdownRef]);

  const estadoOptions = [
    { label: 'Borrador', value: 'Borrador' },
    { label: 'Enviado', value: 'Enviado' },
    { label: 'Pendiente de firma', value: 'Pendiente de firma' },
    { label: 'Firmado', value: 'Firmado' },
    { label: 'Archivado', value: 'Archivado' }
  ];

  useEffect(() => {
    loadOficios();
    loadMunicipalidades();
    
    // Añadir listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Toast message auto-hide
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadOficios = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('oficios');
      setOficios(data || []);
    } catch (error) {
      console.error('Error al cargar oficios:', error);
      showToast('error', 'Error', 'No se pudieron cargar los oficios');
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
      showToast('error', 'Error', 'No se pudieron cargar las municipalidades');
    }
  };

  const showToast = (severity, summary, detail) => {
    setToastMessage({ severity, summary, detail });
  };

  const handleSave = async () => {
    try {
      // Validación básica
      if (!editData.id_municipalidad || !editData.asunto || !editData.numero_oficio) {
        showToast('warn', 'Advertencia', 'Por favor complete los campos requeridos');
        return;
      }
      
      if (editData.id_oficio) {
        // Actualizar
        await apiService.update('oficios', editData.id_oficio, editData);
        showToast('success', 'Éxito', 'Oficio actualizado correctamente');
      } else {
        // Crear
        await apiService.create('oficios', editData);
        showToast('success', 'Éxito', 'Oficio creado correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      resetEditData();
      loadOficios();
    } catch (error) {
      console.error('Error al guardar oficio:', error);
      showToast('error', 'Error', 'No se pudo guardar el oficio');
    }
  };

  const handleDelete = async () => {
    try {
      await apiService.delete('oficios', selectedOficio.id_oficio);
      showToast('success', 'Éxito', 'Oficio eliminado correctamente');
      setDeleteDialogVisible(false);
      loadOficios();
    } catch (error) {
      console.error('Error al eliminar oficio:', error);
      showToast('error', 'Error', 'No se pudo eliminar el oficio');
    }
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Borrador':
        return 'bg-gray-100 text-gray-800';
      case 'Enviado':
        return 'bg-green-100 text-green-800';
      case 'Pendiente de firma':
        return 'bg-yellow-100 text-yellow-800';
      case 'Firmado':
        return 'bg-blue-100 text-blue-800';
      case 'Archivado':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sorting functions
  const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      let valueA = a[field];
      let valueB = b[field];
      
      // Handle sorting dates
      if (field === 'fecha_envio') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      if (valueA < valueB) {
        return order === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return order === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const handleSort = (field) => {
    const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortOrder(newOrder);
  };

  // Filtering functions
  const filteredOficios = oficios.filter(oficio => {
    const matchesSearch = searchQuery.trim() === '' || 
      (oficio.numero_oficio && oficio.numero_oficio.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (oficio.asunto && oficio.asunto.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (oficio.municipalidad && oficio.municipalidad.nombre && oficio.municipalidad.nombre.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesColumnFilters = 
      (columnFilters.numero_oficio === '' || (oficio.numero_oficio && oficio.numero_oficio.toLowerCase().includes(columnFilters.numero_oficio.toLowerCase()))) &&
      (columnFilters.municipalidad === '' || (oficio.municipalidad && oficio.municipalidad.nombre && oficio.municipalidad.nombre.toLowerCase().includes(columnFilters.municipalidad.toLowerCase()))) &&
      (columnFilters.fecha_envio === '' || (oficio.fecha_envio && formatDate(oficio.fecha_envio).includes(columnFilters.fecha_envio))) &&
      (columnFilters.asunto === '' || (oficio.asunto && oficio.asunto.toLowerCase().includes(columnFilters.asunto.toLowerCase()))) &&
      (columnFilters.estado === '' || (oficio.estado && oficio.estado.toLowerCase().includes(columnFilters.estado.toLowerCase())));
    
    return matchesSearch && matchesColumnFilters;
  });
  
  const municipalidadesFiltered = municipalidades.filter(municipalidad => {
    return municipalidadSearchQuery.trim() === '' || 
      (municipalidad.nombre && municipalidad.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase())) ||
      (municipalidad.ubigeo && municipalidad.ubigeo.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()));
  });

  // Pagination
  const sortedData = sortData(filteredOficios, sortField, sortOrder);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Componente TailwindCalendar para selección de fechas
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
          <div className="absolute z-50 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-64">
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

  const resetEditData = () => {
    setEditData({
      id_oficio: '',
      id_municipalidad: '',
      numero_oficio: '',
      fecha_envio: null,
      asunto: '',
      contenido: '',
      estado: ''
    });
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Toast Message */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toastMessage.severity === 'success' ? 'bg-green-100 border-l-4 border-green-500 text-green-700' : 
          toastMessage.severity === 'error' ? 'bg-red-100 border-l-4 border-red-500 text-red-700' : 
          'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        }`}>
          <div className="flex items-center">
            <div className="font-bold mr-2">{toastMessage.summary}:</div>
            <div>{toastMessage.detail}</div>
            <button 
              onClick={() => setToastMessage(null)}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-gray-800">Oficios</h2>
          <button
            onClick={() => {
              resetEditData();
              setCreateDialogVisible(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Oficio</span>
          </button>
        </div>
        <div className="w-full sm:w-auto relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar oficio..."
              className="w-full sm:w-[300px] rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto w-full">
        <table className="min-w-full w-full divide-y divide-gray-200 table-fixed">
          <thead className="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6"
                onClick={() => handleSort('numero_oficio')}
              >
                <div className="flex items-center space-x-1">
                  <span>Número de Oficio</span>
                  {sortField === 'numero_oficio' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.numero_oficio}
                      onChange={(e) => setColumnFilters({...columnFilters, numero_oficio: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-1/6"
                onClick={() => handleSort('id_municipalidad')}
              >
                <div className="flex items-center space-x-1">
                  <span>Municipalidad</span>
                  {sortField === 'id_municipalidad' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.municipalidad}
                      onChange={(e) => setColumnFilters({...columnFilters, municipalidad: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : 'w-1/6'}`}
                onClick={() => handleSort('fecha_envio')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha de Envío</span>
                  {sortField === 'fecha_envio' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.fecha_envio}
                      onChange={(e) => setColumnFilters({...columnFilters, fecha_envio: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : 'w-1/6'}`}
                onClick={() => handleSort('asunto')}
              >
                <div className="flex items-center space-x-1">
                  <span>Asunto</span>
                  {sortField === 'asunto' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.asunto}
                      onChange={(e) => setColumnFilters({...columnFilters, asunto: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th 
                scope="col" 
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : 'w-1/6'}`}
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
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${isMobile ? 'w-1/4' : 'w-1/6'}`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <svg className="animate-spin h-5 w-5 text-blue-500 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron oficios
                </td>
              </tr>
            ) : (
              paginatedData.map((oficio) => (
                <tr key={oficio.id_oficio} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 break-words">{oficio.numero_oficio}</td>
                  <td className="px-6 py-4 break-words">
                    {municipalidades.find(m => m.id_municipalidad === oficio.id_municipalidad)?.nombre || 'No asignada'}
                  </td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{formatDate(oficio.fecha_envio)}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>
                    <div className="line-clamp-3">{oficio.asunto}</div>
                  </td>
                  <td className={`px-6 py-4 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(oficio.estado)}`}>
                      {oficio.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedOficio(oficio);
                          setViewDialogVisible(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
                        title="Ver detalles"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOficio(oficio);
                          setEditData({
                            ...oficio,
                            fecha_envio: oficio.fecha_envio ? new Date(oficio.fecha_envio) : null
                          });
                          setEditDialogVisible(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Editar"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOficio(oficio);
                          setDeleteDialogVisible(true);
                        }}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
                        title="Eliminar"
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
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6 mt-4">
        <div className="flex justify-between sm:hidden w-full">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
              currentPage === 1
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages || totalPages === 0}
            className={`relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium rounded-md ${
              currentPage === totalPages || totalPages === 0
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Siguiente
          </button>
        </div>
        <div className="hidden sm:flex sm:items-center sm:justify-between w-full">
          <div>
            <p className="text-sm text-gray-700">
              Mostrando <span className="font-medium">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>{' '}
              a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredOficios.length)}</span> de{' '}
              <span className="font-medium">{filteredOficios.length}</span> resultados
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-md text-sm py-1 pl-2 pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value={5}>5 por página</option>
              <option value={10}>10 por página</option>
              <option value={25}>25 por página</option>
              <option value={50}>50 por página</option>
            </select>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Primera página</span>
                <FiChevronLeft className="h-5 w-5" />
                <FiChevronLeft className="h-5 w-5 -ml-2" />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Anterior</span>
                <FiChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Siguiente</span>
                <FiChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages || totalPages === 0
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Última página</span>
                <FiChevronRight className="h-5 w-5" />
                <FiChevronRight className="h-5 w-5 -ml-2" />
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      {(createDialogVisible || editDialogVisible) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-4xl lg:max-w-5xl ml-auto mr-auto relative" style={{ marginLeft: 'auto', marginRight: 'auto', left: '0', right: '0' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editDialogVisible ? "Editar Oficio" : "Nuevo Oficio"}
                  </h3>
                  <button 
                    onClick={() => {
                      setCreateDialogVisible(false);
                      setEditDialogVisible(false);
                    }} 
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label htmlFor="municipalidad" className="block text-sm font-medium text-gray-700 mb-1">
                      Municipalidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative" ref={municipalidadDropdownRef}>
                      <div 
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center cursor-pointer"
                        onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
                      >
                        <span className="truncate">
                          {editData.id_municipalidad 
                            ? municipalidades.find(m => m.id_municipalidad == editData.id_municipalidad)?.nombre || 'Sin nombre'
                            : 'Seleccione una municipalidad'}
                        </span>
                        <span>
                          {showMunicipalidadDropdown ? (
                            <FiChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </span>
                      </div>
                      
                      {showMunicipalidadDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          <div className="sticky top-0 z-10 bg-white p-2">
                            <div className="relative">
                              <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Buscar municipalidad..."
                                value={municipalidadSearchQuery}
                                onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          
                          {municipalidadesFiltered.length === 0 ? (
                            <div className="py-2 px-3 text-gray-700">No se encontraron resultados</div>
                          ) : (
                            municipalidadesFiltered.map((municipalidad) => (
                              <div
                                key={municipalidad.id_municipalidad}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                  editData.id_municipalidad == municipalidad.id_municipalidad ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                                }`}
                                onClick={() => {
                                  setEditData({...editData, id_municipalidad: municipalidad.id_municipalidad});
                                  setShowMunicipalidadDropdown(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium truncate">{municipalidad.nombre || 'Sin nombre'}</span>
                                  <span className="text-xs text-gray-500 truncate">
                                    {municipalidad.ubigeo && <span className="font-semibold mr-1">[{municipalidad.ubigeo}]</span>}
                                    {municipalidad.provincia || ''} {municipalidad.departamento ? `- ${municipalidad.departamento}` : ''}
                                  </span>
                                </div>
                                
                                {editData.id_municipalidad == municipalidad.id_municipalidad && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4">
                    <label htmlFor="numero_oficio" className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Oficio
                    </label>
                    <input
                      type="text"
                      id="numero_oficio"
                      value={editData.numero_oficio}
                      onChange={(e) => setEditData({ ...editData, numero_oficio: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="fecha_envio" className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Envío
                    </label>
                    <TailwindCalendar
                      id="fecha_envio"
                      selectedDate={editData.fecha_envio instanceof Date 
                        ? editData.fecha_envio 
                        : editData.fecha_envio ? new Date(editData.fecha_envio) : null}
                      onChange={(date) => setEditData({ ...editData, fecha_envio: date })}
                      className="w-full"
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="relative" ref={estadoDropdownRef}>
                      <div 
                        className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center cursor-pointer"
                        onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
                      >
                        <span className="truncate">
                          {editData.estado 
                            ? estadoOptions.find(option => option.value === editData.estado)?.label || 'Sin nombre'
                            : 'Seleccione un estado'}
                        </span>
                        <span>
                          {showEstadoDropdown ? (
                            <FiChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          )}
                        </span>
                      </div>
                      
                      {showEstadoDropdown && (
                        <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                          <div className="sticky top-0 z-10 bg-white p-2">
                            <div className="relative">
                              <input
                                type="text"
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Buscar estado..."
                                value={estadoSearchQuery}
                                onChange={(e) => setEstadoSearchQuery(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          
                          {estadoOptions.filter(option => option.label.toLowerCase().includes(estadoSearchQuery.toLowerCase())).length === 0 ? (
                            <div className="py-2 px-3 text-gray-700">No se encontraron resultados</div>
                          ) : (
                            estadoOptions.filter(option => option.label.toLowerCase().includes(estadoSearchQuery.toLowerCase())).map((option) => (
                              <div
                                key={option.value}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                  editData.estado == option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                                }`}
                                onClick={() => {
                                  setEditData({...editData, estado: option.value});
                                  setShowEstadoDropdown(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium truncate">{option.label}</span>
                                </div>
                                
                                {editData.estado == option.value && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mb-4 col-span-1 md:col-span-2">
                    <label htmlFor="asunto" className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto
                    </label>
                    <input
                      type="text"
                      id="asunto"
                      value={editData.asunto}
                      onChange={(e) => setEditData({ ...editData, asunto: e.target.value })}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>

                  <div className="mb-4 col-span-1 md:col-span-2">
                    <label htmlFor="contenido" className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido
                    </label>
                    <textarea
                      id="contenido"
                      value={editData.contenido}
                      onChange={(e) => setEditData({ ...editData, contenido: e.target.value })}
                      rows={5}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Guardar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreateDialogVisible(false);
                    setEditDialogVisible(false);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {viewDialogVisible && selectedOficio && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-4xl lg:max-w-5xl ml-auto mr-auto relative" style={{ marginLeft: 'auto', marginRight: 'auto', left: '0', right: '0' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Detalles del Oficio
                  </h3>
                  <button 
                    onClick={() => setViewDialogVisible(false)} 
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <FiX className="h-6 w-6" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Municipalidad
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800">
                      {municipalidades.find(m => m.id_municipalidad === selectedOficio.id_municipalidad)?.nombre || 'No especificada'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de Oficio
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800">
                      {selectedOficio.numero_oficio || 'No especificado'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Envío
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800">
                      {formatDate(selectedOficio.fecha_envio) || 'No especificada'}
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estado
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(selectedOficio.estado)}`}>
                        {selectedOficio.estado}
                      </span>
                    </div>
                  </div>
                  <div className="mb-4 col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Asunto
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800">
                      {selectedOficio.asunto || 'No especificado'}
                    </div>
                  </div>
                  <div className="mb-4 col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contenido
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded-md border border-gray-200 text-gray-800 whitespace-pre-wrap h-40 overflow-y-auto">
                      {selectedOficio.contenido || 'No hay contenido'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setViewDialogVisible(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:w-auto sm:text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialogVisible && selectedOficio && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ inset: '0px', margin: 'auto' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar Oficio
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar el oficio <span className="font-semibold">{selectedOficio.numero_oficio}</span>? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Eliminar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteDialogVisible(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { api, apiService } from '../../services/authService';
import { FaEdit, FaTrashAlt, FaPlus, FaSearch, FaSort, FaSortUp, FaSortDown, FaCalendarAlt } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';

export default function EventosList() {
  const [eventos, setEventos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState(-1); // -1 descendente, 1 ascendente
  const [filters, setFilters] = useState({
    'municipalidad.nombre': { value: null, matchMode: 'contains' },
    'contacto.nombre_completo': { value: null, matchMode: 'contains' },
    'tipo_acercamiento': { value: null, matchMode: 'contains' },
    'lugar': { value: null, matchMode: 'contains' },
    'fecha': { value: null, matchMode: 'contains' },
    'modalidad': { value: null, matchMode: 'contains' },
    'descripcion': { value: null, matchMode: 'contains' }
  });
  const [editData, setEditData] = useState({
    id_evento: '',
    id_municipalidad: '',
    id_contacto: '',
    tipo_acercamiento: '',
    lugar: '',
    fecha: null,
    modalidad: '',
    descripcion: ''
  });
  
  // Variables para los dropdowns con búsqueda
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);
  
  const [showContactoDropdown, setShowContactoDropdown] = useState(false);
  const [contactoSearchQuery, setContactoSearchQuery] = useState('');
  const contactoDropdownRef = useRef(null);
  
  // Referencia al toast
  const toast = useRef(null);
  const dt = useRef(null);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    loadEventos();
    loadMunicipalidades();
  }, []);

  // Efecto para cerrar los dropdowns cuando se hace clic fuera de ellos
  useEffect(() => {
    function handleClickOutside(event) {
      if (municipalidadDropdownRef.current && !municipalidadDropdownRef.current.contains(event.target)) {
        setShowMunicipalidadDropdown(false);
      }
      
      if (contactoDropdownRef.current && !contactoDropdownRef.current.contains(event.target)) {
        setShowContactoDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [municipalidadDropdownRef, contactoDropdownRef]);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('eventos');
      setEventos(data);
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      setLoading(false);
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p><strong>Error:</strong> No se pudieron cargar los eventos</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const data = await apiService.getAll('municipalidades');
      setMunicipalidades(data);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p><strong>Error:</strong> No se pudieron cargar las municipalidades</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
    }
  };

  const loadContactosPorMunicipalidad = async (id_municipalidad) => {
    if (!id_municipalidad) {
      setContactos([]);
      return;
    }
    
    try {
      // Usar el endpoint estándar de contactos y filtrar por id_municipalidad
      const response = await api.get(`api/contactos`);
      // Filtrar los contactos que pertenecen a la municipalidad seleccionada
      const contactosFiltrados = response.data.filter(
        contacto => contacto.id_municipalidad === parseInt(id_municipalidad)
      );
      setContactos(contactosFiltrados);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p><strong>Error:</strong> No se pudieron cargar los contactos</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
    }
  };

  const handleMunicipalidadChange = (id_municipalidad) => {
    setEditData(prev => ({ ...prev, id_municipalidad, id_contacto: '' }));
    loadContactosPorMunicipalidad(id_municipalidad);
    setContactoSearchQuery(''); // Limpiar búsqueda de contactos al cambiar municipalidad
  };

  const handleSave = async () => {
    if (!editData.id_municipalidad || !editData.id_contacto || !editData.tipo_acercamiento || !editData.lugar || !editData.fecha || !editData.modalidad) {
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p><strong>Advertencia:</strong> Por favor complete todos los campos obligatorios</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
      return;
    }

    const eventoData = {
      ...editData,
      fecha: editData.fecha ? editData.fecha.toISOString().split('T')[0] : null
    };

    try {
      if (eventoData.id_evento) {
        await apiService.update('eventos', eventoData.id_evento, eventoData);
        
        const toastDiv = toast.current;
        if (toastDiv) {
          toastDiv.innerHTML = `
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md">
              <div class="flex items-center">
                <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p><strong>Éxito:</strong> Evento actualizado correctamente</p>
              </div>
            </div>
          `;
          toastDiv.classList.remove('hidden');
          setTimeout(() => {
            toastDiv.classList.add('hidden');
          }, 3000);
        }
      } else {
        await apiService.create('eventos', eventoData);
        
        const toastDiv = toast.current;
        if (toastDiv) {
          toastDiv.innerHTML = `
            <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md">
              <div class="flex items-center">
                <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <p><strong>Éxito:</strong> Evento creado correctamente</p>
              </div>
            </div>
          `;
          toastDiv.classList.remove('hidden');
          setTimeout(() => {
            toastDiv.classList.add('hidden');
          }, 3000);
        }
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      loadEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p><strong>Error:</strong> No se pudo guardar el evento</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
    }
  };

  const confirmDelete = async (evento) => {
    try {
      await apiService.delete('eventos', evento.id_evento);
      
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <p><strong>Éxito:</strong> Evento eliminado correctamente</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
      loadEventos();
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      
      const toastDiv = toast.current;
      if (toastDiv) {
        toastDiv.innerHTML = `
          <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md">
            <div class="flex items-center">
              <svg class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <p><strong>Error:</strong> No se pudo eliminar el evento</p>
            </div>
          </div>
        `;
        toastDiv.classList.remove('hidden');
        setTimeout(() => {
          toastDiv.classList.add('hidden');
        }, 3000);
      }
    }
  };

  const onGlobalFilterChange = (e) => {
    setGlobalFilterValue(e.target.value);
    applyGlobalFilter(e.target.value);
  };

  const applyGlobalFilter = (value) => {
    const filterValue = value.trim().toLowerCase();
    const updatedFilters = { ...filters };
    
    Object.keys(updatedFilters).forEach(field => {
      updatedFilters[field] = { value: filterValue || null, matchMode: 'contains' };
    });
    
    setFilters(updatedFilters);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder * -1);
    } else {
      setSortField(field);
      setSortOrder(1);
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <FaSort className="ml-1 text-gray-400" />;
    }
    
    return sortOrder === 1 
      ? <FaSortUp className="ml-1 text-blue-500" />
      : <FaSortDown className="ml-1 text-blue-500" />;
  };

  const sortData = (data, field, order) => {
    return [...data].sort((a, b) => {
      let valueA, valueB;
      
      if (field.includes('.')) {
        const parts = field.split('.');
        valueA = parts.reduce((obj, key) => obj && obj[key], a);
        valueB = parts.reduce((obj, key) => obj && obj[key], b);
      } else {
        valueA = a[field];
        valueB = b[field];
      }
      
      if (valueA === null || valueA === undefined) return 1 * order;
      if (valueB === null || valueB === undefined) return -1 * order;
      
      if (field === 'fecha') {
        return (new Date(valueA) - new Date(valueB)) * order;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return valueA.localeCompare(valueB) * order;
      }
      
      return (valueA - valueB) * order;
    });
  };

  const sortedData = sortData(eventos, sortField, sortOrder);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredData = sortedData.filter(evento => {
    return Object.keys(filters).every(key => {
      const filter = filters[key];
      if (!filter.value) return true;
      
      let itemValue;
      if (key.includes('.')) {
        const parts = key.split('.');
        itemValue = parts.reduce((obj, part) => obj && obj[part], evento);
      } else {
        itemValue = evento[key];
      }
      
      if (itemValue === null || itemValue === undefined) return false;
      
      if (key === 'fecha') {
        const date = new Date(itemValue);
        const formattedDate = formatDate(date);
        return formattedDate.toLowerCase().includes(filter.value.toLowerCase());
      }
      
      return String(itemValue).toLowerCase().includes(filter.value.toLowerCase());
    });
  });

  const TailwindCalendar = ({ selectedDate, onChange, id, className }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef(null);

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

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

    const handlePrevMonth = () => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() - 1);
        return newDate;
      });
    };

    const handleNextMonth = () => {
      setCurrentDate(prev => {
        const newDate = new Date(prev);
        newDate.setMonth(newDate.getMonth() + 1);
        return newDate;
      });
    };

    const handleDayClick = (day) => {
      const newDate = new Date(currentDate);
      newDate.setDate(day);
      onChange({ value: newDate });
      setIsOpen(false);
    };

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
          <div 
            key={day}
            onClick={() => handleDayClick(day)}
            className={`h-8 w-8 flex items-center justify-center text-sm rounded-full cursor-pointer
              ${isToday ? 'bg-blue-100 text-blue-800' : ''}
              ${isSelected ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            `}
          >
            {day}
          </div>
        );
      }
      
      return days;
    };

    return (
      <div className={`relative ${className}`} ref={calendarRef}>
        <div 
          className="flex items-center border border-gray-300 rounded-md p-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <input
            id={id}
            type="text"
            className="flex-grow outline-none cursor-pointer"
            value={formatDate(selectedDate)}
            readOnly
            placeholder="Seleccione una fecha"
          />
          <FaCalendarAlt className="text-gray-400" />
        </div>

        {isOpen && (
          <div className="absolute mt-1 z-50 bg-white rounded-md shadow-lg p-4 border border-gray-200 w-64">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
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
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  onChange({ value: today });
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
              >
                Hoy
              </button>
              <button 
                onClick={() => {
                  onChange({ value: null });
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  return (
    <div className="w-full p-4">
      <div ref={toast} className="hidden fixed top-4 right-4 z-50"></div>
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <h2 className="text-2xl font-bold text-gray-800">Eventos</h2>
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto flex items-center justify-center gap-2"
              onClick={() => {
                setEditData({
                  id_evento: '',
                  id_municipalidad: '',
                  id_contacto: '',
                  tipo_acercamiento: '',
                  lugar: '',
                  fecha: null,
                  modalidad: '',
                  descripcion: ''
                });
                setCreateDialogVisible(true);
              }}
            >
              <FaPlus />
              <span>Nuevo Evento</span>
            </button>
          </div>
          <div className="w-full sm:w-auto">
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Buscar evento..."
                className="w-full sm:w-[300px] pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('municipalidad.nombre')}
                >
                  <div className="flex items-center">
                    <span>Municipalidad</span>
                    {getSortIcon('municipalidad.nombre')}
                  </div>
                  {!isMobile && (
                    <div className="mt-2">
                      <div className="relative">
                        <div className="relative mt-1 flex h-10 w-full items-center overflow-hidden rounded-md bg-white border border-gray-300">
                          <div className="grid h-full w-full">
                            <input
                              className="peer h-full w-full outline-none border-none bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:ring-0"
                              type="text"
                              placeholder="Buscar municipalidad"
                              value={filters['municipalidad.nombre'].value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFilters(prev => ({
                                  ...prev,
                                  'municipalidad.nombre': { value: value || null, matchMode: 'contains' }
                                }));
                              }}
                            />
                          </div>
                          <div className="grid h-full w-12 place-items-center text-gray-400">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </th>
                
                {!isMobile && (
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('contacto.nombre_completo')}
                  >
                    <div className="flex items-center">
                      <span>Contacto</span>
                      {getSortIcon('contacto.nombre_completo')}
                    </div>
                    <div className="mt-2">
                      <div className="relative">
                        <div className="relative mt-1 flex h-10 w-full items-center overflow-hidden rounded-md bg-white border border-gray-300">
                          <div className="grid h-full w-full">
                            <input
                              className="peer h-full w-full outline-none border-none bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:ring-0"
                              type="text"
                              placeholder="Buscar contacto"
                              value={filters['contacto.nombre_completo'].value || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setFilters(prev => ({
                                  ...prev,
                                  'contacto.nombre_completo': { value: value || null, matchMode: 'contains' }
                                }));
                              }}
                            />
                          </div>
                          <div className="grid h-full w-12 place-items-center text-gray-400">
                            <FiSearch className="h-5 w-5 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </th>
                )}
                
                {!isMobile && (
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('tipo_acercamiento')}
                  >
                    <div className="flex items-center">
                      <span>Tipo de Acercamiento</span>
                      {getSortIcon('tipo_acercamiento')}
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full p-1 text-sm border border-gray-300 rounded"
                        placeholder="Filtrar..."
                        value={filters['tipo_acercamiento'].value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            'tipo_acercamiento': { value: value || null, matchMode: 'contains' }
                          }));
                        }}
                      />
                    </div>
                  </th>
                )}
                
                {!isMobile && (
                  <th 
                    scope="col" 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('lugar')}
                  >
                    <div className="flex items-center">
                      <span>Lugar</span>
                      {getSortIcon('lugar')}
                    </div>
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full p-1 text-sm border border-gray-300 rounded"
                        placeholder="Filtrar..."
                        value={filters['lugar'].value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            'lugar': { value: value || null, matchMode: 'contains' }
                          }));
                        }}
                      />
                    </div>
                  </th>
                )}
                
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('fecha')}
                >
                  <div className="flex items-center">
                    <span>Fecha</span>
                    {getSortIcon('fecha')}
                  </div>
                  {!isMobile && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full p-1 text-sm border border-gray-300 rounded"
                        placeholder="Filtrar..."
                        value={filters['fecha'].value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            'fecha': { value: value || null, matchMode: 'contains' }
                          }));
                        }}
                      />
                    </div>
                  )}
                </th>
                
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('modalidad')}
                >
                  <div className="flex items-center">
                    <span>Modalidad</span>
                    {getSortIcon('modalidad')}
                  </div>
                  {!isMobile && (
                    <div className="mt-2">
                      <input
                        type="text"
                        className="w-full p-1 text-sm border border-gray-300 rounded"
                        placeholder="Filtrar..."
                        value={filters['modalidad'].value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setFilters(prev => ({
                            ...prev,
                            'modalidad': { value: value || null, matchMode: 'contains' }
                          }));
                        }}
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
                  <td colSpan={isMobile ? 3 : 6} className="px-6 py-4 text-center text-gray-500">
                    <div className="flex justify-center items-center">
                      <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cargando...
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={isMobile ? 3 : 6} className="px-6 py-4 text-center text-gray-500">
                    No se encontraron eventos
                  </td>
                </tr>
              ) : (
                filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(evento => (
                  <tr key={evento.id_evento} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm font-medium text-gray-900">
                        {evento.municipalidad?.nombre || 'N/A'}
                      </div>
                    </td>
                    
                    {!isMobile && (
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-900">
                          {evento.contacto?.nombre_completo || 'N/A'}
                        </div>
                      </td>
                    )}
                    
                    {!isMobile && (
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-900">
                          {evento.tipo_acercamiento || 'N/A'}
                        </div>
                      </td>
                    )}
                    
                    {!isMobile && (
                      <td className="px-6 py-4 whitespace-normal">
                        <div className="text-sm text-gray-900">
                          {evento.lugar || 'N/A'}
                        </div>
                      </td>
                    )}
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(evento.fecha)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-normal">
                      <div className="text-sm text-gray-900">
                        {evento.modalidad || 'N/A'}
                      </div>
                    </td>
                    
                                        
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center space-x-2">
                        <button
                          className="text-blue-500 hover:text-blue-700"
                          onClick={() => {
                            setEditData({
                              ...evento,
                              fecha: evento.fecha ? new Date(evento.fecha) : null
                            });
                            loadContactosPorMunicipalidad(evento.id_municipalidad);
                            setEditDialogVisible(true);
                          }}
                        >
                          <FaEdit />
                        </button>
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            setSelectedEvento(evento);
                            setDeleteDialogVisible(true);
                          }}
                        >
                          <FaTrashAlt />
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
                Mostrando <span className="font-medium">{filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>{' '}
                a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> de{' '}
                <span className="font-medium">{filteredData.length}</span> resultados
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
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Primera página</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="sr-only">Anterior</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
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
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
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
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {(editDialogVisible || createDialogVisible) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editData.id_evento ? 'Editar Evento' : 'Nuevo Evento'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-4">
                  <label htmlFor="municipalidad" className="block text-sm font-medium text-gray-700 mb-1">
                    Municipalidad
                  </label>
                  <div className="relative" ref={municipalidadDropdownRef}>
                    <div 
                      className="w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center cursor-pointer"
                      onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
                    >
                      <span className="truncate">
                        {editData.id_municipalidad 
                          ? municipalidades.find(m => m.id_municipalidad === parseInt(editData.id_municipalidad))?.nombre || 'Sin nombre'
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
                            <div className="relative mt-1 flex h-10 w-full items-center overflow-hidden rounded-md bg-white border border-gray-300">
                              <div className="grid h-full w-full">
                                <input
                                  className="peer h-full w-full outline-none border-none bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:ring-0"
                                  type="text"
                                  placeholder="Buscar municipalidad"
                                  value={municipalidadSearchQuery}
                                  onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="grid h-full w-12 place-items-center text-gray-400">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          {municipalidades.filter(muni => 
                            municipalidadSearchQuery.trim() === '' || 
                            (muni.nombre && muni.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase())) ||
                            (muni.ubigeo && muni.ubigeo.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()))
                          ).length === 0 ? (
                            <div className="py-2 px-3 text-gray-700">No se encontraron resultados</div>
                          ) : (
                            municipalidades.filter(muni => 
                              municipalidadSearchQuery.trim() === '' || 
                              (muni.nombre && muni.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase())) ||
                              (muni.ubigeo && muni.ubigeo.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()))
                            ).map((muni) => (
                              <div
                                key={muni.id_municipalidad}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                  parseInt(editData.id_municipalidad) === muni.id_municipalidad ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                                }`}
                                onClick={() => {
                                  handleMunicipalidadChange(muni.id_municipalidad.toString());
                                  setShowMunicipalidadDropdown(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium truncate">{muni.nombre}</span>
                                  {muni.ubigeo && (
                                    <span className="text-xs text-gray-500">Ubigeo: {muni.ubigeo}</span>
                                  )}
                                </div>
                                
                                {parseInt(editData.id_municipalidad) === muni.id_municipalidad && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
                    Contacto
                  </label>
                  <div className="relative" ref={contactoDropdownRef}>
                    <div 
                      className={`w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex justify-between items-center ${editData.id_municipalidad ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100'}`}
                      onClick={() => {
                        if (editData.id_municipalidad) {
                          setShowContactoDropdown(!showContactoDropdown);
                        }
                      }}
                    >
                      <span className="truncate">
                        {editData.id_contacto 
                          ? contactos.find(c => c.id_contacto === parseInt(editData.id_contacto))?.nombre_completo || 'Sin nombre'
                          : editData.id_municipalidad 
                            ? 'Seleccione un contacto' 
                            : 'Primero seleccione una municipalidad'}
                      </span>
                      <span>
                        {editData.id_municipalidad && (
                          showContactoDropdown ? (
                            <FiChevronUp className="h-5 w-5 text-gray-400" />
                          ) : (
                            <FiChevronDown className="h-5 w-5 text-gray-400" />
                          )
                        )}
                      </span>
                    </div>
                    
                    {showContactoDropdown && editData.id_municipalidad && (
                      <div className="absolute z-20 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                        <div className="sticky top-0 z-10 bg-white p-2">
                          <div className="relative">
                            <div className="relative mt-1 flex h-10 w-full items-center overflow-hidden rounded-md bg-white border border-gray-300">
                              <div className="grid h-full w-full">
                                <input
                                  className="peer h-full w-full outline-none border-none bg-transparent px-3 py-2.5 text-sm text-gray-700 focus:ring-0"
                                  type="text"
                                  placeholder="Buscar contacto"
                                  value={contactoSearchQuery}
                                  onChange={(e) => setContactoSearchQuery(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                              <div className="grid h-full w-12 place-items-center text-gray-400">
                                <FiSearch className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                          {contactos.filter(contacto => 
                            contactoSearchQuery.trim() === '' || 
                            (contacto.nombre_completo && contacto.nombre_completo.toLowerCase().includes(contactoSearchQuery.toLowerCase())) ||
                            (contacto.cargo && contacto.cargo.toLowerCase().includes(contactoSearchQuery.toLowerCase()))
                          ).length === 0 ? (
                            <div className="py-2 px-3 text-gray-700">No se encontraron resultados</div>
                          ) : (
                            contactos.filter(contacto => 
                              contactoSearchQuery.trim() === '' || 
                              (contacto.nombre_completo && contacto.nombre_completo.toLowerCase().includes(contactoSearchQuery.toLowerCase())) ||
                              (contacto.cargo && contacto.cargo.toLowerCase().includes(contactoSearchQuery.toLowerCase()))
                            ).map((contacto) => (
                              <div
                                key={contacto.id_contacto}
                                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-100 ${
                                  parseInt(editData.id_contacto) === contacto.id_contacto ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                                }`}
                                onClick={() => {
                                  setEditData(prev => ({ ...prev, id_contacto: contacto.id_contacto.toString() }));
                                  setShowContactoDropdown(false);
                                }}
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium truncate">{contacto.nombre_completo}</span>
                                  {contacto.cargo && (
                                    <span className="text-xs text-gray-500">Cargo: {contacto.cargo}</span>
                                  )}
                                </div>
                                
                                {parseInt(editData.id_contacto) === contacto.id_contacto && (
                                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </span>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="lugar" className="block text-sm font-medium text-gray-700 mb-1">
                    Lugar
                  </label>
                  <input
                    id="lugar"
                    type="text"
                    value={editData.lugar}
                    onChange={(e) => setEditData(prev => ({ ...prev, lugar: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <TailwindCalendar
                    id="fecha"
                    selectedDate={editData.fecha ? new Date(editData.fecha) : null}
                    onChange={(e) => setEditData(prev => ({ ...prev, fecha: e.value }))}
                    className="w-full"
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="modalidad" className="block text-sm font-medium text-gray-700 mb-1">
                    Modalidad
                  </label>
                  <select
                    id="modalidad"
                    value={editData.modalidad}
                    onChange={(e) => setEditData(prev => ({ ...prev, modalidad: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccione una modalidad</option>
                    <option value="DOCUMENTOS OFICIALES">DOCUMENTOS OFICIALES</option>
                    <option value="EVENTOS OFICIALES">EVENTOS OFICIALES</option>
                    <option value="PLATAFORMA DE COMUNICACIÓN">PLATAFORMA DE COMUNICACIÓN</option>
                    <option value="REUNIONES">REUNIONES</option>
                  </select>
                </div>

                <div className="mb-4 col-span-full">
                  <label htmlFor="tipo_acercamiento" className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Acercamiento
                  </label>
                  <textarea
                    id="tipo_acercamiento"
                    value={editData.tipo_acercamiento}
                    onChange={(e) => setEditData(prev => ({ ...prev, tipo_acercamiento: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="mb-4 col-span-full">
                  <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    id="descripcion"
                    value={editData.descripcion}
                    onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                  />
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  onClick={() => {
                    setEditDialogVisible(false);
                    setCreateDialogVisible(false);
                  }}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
                  onClick={handleSave}
                >
                  Guardar
                </button>
              </div>
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
                    <path fillRule="evenodd" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Confirmar eliminación</h3>
              </div>
              
              <p className="text-gray-700 mb-6">
                ¿Está seguro que desea eliminar este evento? Esta acción no se puede deshacer.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded"
                  onClick={() => setDeleteDialogVisible(false)}
                >
                  Cancelar
                </button>
                <button
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                  onClick={() => {
                    confirmDelete(selectedEvento);
                    setDeleteDialogVisible(false);
                  }}
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
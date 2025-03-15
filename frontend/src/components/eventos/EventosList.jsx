import React, { useState, useRef, useEffect } from 'react';
import { api, apiService } from '../../services/authService';
import { FaEdit, FaTrashAlt, FaPlus, FaCalendarAlt } from 'react-icons/fa';
import { FiChevronDown, FiChevronUp, FiSearch } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function EventosList() {
  const [eventos, setEventos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({});
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
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const toast = useToast();

  useEffect(() => {
    loadEventos();
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
  }, []);

  const loadEventos = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('eventos');
      
      // Cargar municipalidades y contactos para cada evento si no vienen en la respuesta
      const eventosProcessed = await Promise.all(data.map(async (evento) => {
        // Si el evento ya tiene el objeto municipalidad completo, usarlo
        if (evento.municipalidad && typeof evento.municipalidad === 'object') {
          return evento;
        }
        
        // Si solo tiene id_municipalidad, buscar la información completa
        if (evento.id_municipalidad) {
          try {
            const municipalidadData = await apiService.getById('municipalidades', evento.id_municipalidad);
            evento.municipalidad = municipalidadData;
          } catch (err) {
            console.error(`Error al cargar municipalidad ${evento.id_municipalidad}:`, err);
          }
        }
        
        // Si el evento ya tiene el objeto contacto completo, usarlo
        if (evento.contacto && typeof evento.contacto === 'object') {
          return evento;
        }
        
        // Si solo tiene id_contacto, buscar la información completa
        if (evento.id_contacto) {
          try {
            const contactoData = await apiService.getById('contactos', evento.id_contacto);
            evento.contacto = contactoData;
          } catch (err) {
            console.error(`Error al cargar contacto ${evento.id_contacto}:`, err);
          }
        }
        
        return evento;
      }));
      
      setEventos(eventosProcessed);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      toast.showError('Error', 'No se pudieron cargar los eventos');
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

  const loadContactosPorMunicipalidad = async (id_municipalidad) => {
    if (!id_municipalidad) {
      setContactos([]);
      return;
    }
    
    try {
      // Usar el endpoint estándar de contactos y filtrar por id_municipalidad
      const response = await api.get(`contactos`);
      // Filtrar los contactos que pertenecen a la municipalidad seleccionada
      const contactosFiltrados = response.data.filter(
        contacto => contacto.id_municipalidad === parseInt(id_municipalidad)
      );
      setContactos(contactosFiltrados);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast.showError('Error', 'No se pudieron cargar los contactos');
    }
  };

  const handleMunicipalidadChange = (id_municipalidad) => {
    setEditData(prev => ({ ...prev, id_municipalidad, id_contacto: '' }));
    loadContactosPorMunicipalidad(id_municipalidad);
    setContactoSearchQuery(''); // Limpiar búsqueda de contactos al cambiar municipalidad
  };
  
  // Funciones de manejo de eventos
  const handleEdit = (rowData) => {
    setSelectedEvento(rowData);
    setEditData({
      ...rowData,
      id_evento: rowData.id_evento,
      id_municipalidad: rowData.id_municipalidad,
      id_contacto: rowData.id_contacto,
      fecha: rowData.fecha ? new Date(rowData.fecha) : null
    });
    loadContactosPorMunicipalidad(rowData.id_municipalidad);
    setEditDialogVisible(true);
  };
  
  const confirmDelete = (rowData) => {
    setSelectedEvento(rowData);
    setDeleteDialogVisible(true);
  };
  
  const handleDelete = async () => {
    if (!selectedEvento) return;
    
    try {
      await apiService.remove('eventos', selectedEvento.id_evento);
      toast.showSuccess('Éxito', 'Evento eliminado correctamente');
      setDeleteDialogVisible(false);
      loadEventos();
    } catch (error) {
      console.error('Error al eliminar evento:', error);
      toast.showError('Error', 'No se pudo eliminar el evento');
    }
  };
  
  const handleCreate = () => {
    setEditData({
      id_evento: '',
      id_municipalidad: '',
      id_contacto: '',
      tipo_acercamiento: '',
      lugar: '',
      fecha: new Date(),
      modalidad: '',
      descripcion: ''
    });
    setCreateDialogVisible(true);
  };
  
  const handleSave = async () => {
    if (!editData.id_municipalidad || !editData.id_contacto || !editData.tipo_acercamiento || !editData.lugar || !editData.fecha || !editData.modalidad) {
      toast.showWarning('Advertencia', 'Por favor complete todos los campos obligatorios');
      return;
    }

    const eventoData = {
      ...editData,
      fecha: editData.fecha ? editData.fecha.toISOString().split('T')[0] : null
    };

    try {
      if (eventoData.id_evento) {
        await apiService.update('eventos', eventoData.id_evento, eventoData);
        toast.showSuccess('Éxito', 'Evento actualizado correctamente');
      } else {
        await apiService.create('eventos', eventoData);
        toast.showSuccess('Éxito', 'Evento creado correctamente');
      }
      
      setCreateDialogVisible(false);
      setEditDialogVisible(false);
      loadEventos();
    } catch (error) {
      console.error('Error al guardar evento:', error);
      toast.showError('Error', 'No se pudo guardar el evento');
    }
  };
  
  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1); // Volver a la primera página al realizar una búsqueda
  };
  
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };
  
  const handleColumnFilterChange = (field, value) => {
    setColumnFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setCurrentPage(1); // Volver a la primera página al filtrar
  };

  const formatDate = (date) => {
    if (!date) return '';
    
    // Si date es un string, intentar convertirlo a Date
    let dateObj = date;
    if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    
    // Verificar si la fecha es válida
    if (!(dateObj instanceof Date && !isNaN(dateObj))) {
      return '';
    }
    
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Componente de calendario personalizado
  const TailwindCalendar = ({ selectedDate, onChange, id, className }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate ? new Date(selectedDate) : new Date());
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef(null);

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
      if (selectedDate) {
        setCurrentDate(new Date(selectedDate));
      }
    }, [selectedDate]);

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
        
        // Verificar si hay una fecha seleccionada y compararla correctamente
        let isSelected = false;
        if (selectedDate) {
          const selDate = new Date(selectedDate);
          isSelected = selDate.getDate() === day && 
                      selDate.getMonth() === month && 
                      selDate.getFullYear() === year;
        }
        
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
            className="flex-grow outline-none cursor-pointer bg-transparent"
            value={selectedDate ? formatDate(selectedDate) : ''}
            readOnly
            placeholder="Seleccione una fecha"
          />
          <FaCalendarAlt className="text-gray-400" />
        </div>

        {isOpen && (
          <div className="absolute mt-1 z-50 bg-white rounded-md shadow-lg p-4 border border-gray-200 w-64">
            <div className="flex justify-between items-center mb-4">
              <button 
                type="button"
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
                type="button"
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
                type="button"
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
                type="button"
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

  // Filtrado de datos
  const applyFilters = () => {
    if (!eventos || eventos.length === 0) return [];
    
    let filteredData = [...eventos];
    
    // Aplicar búsqueda global
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filteredData = filteredData.filter(evento => {
        return (
          (evento.municipalidad && evento.municipalidad.nombre ? evento.municipalidad.nombre.toLowerCase().includes(lowercaseQuery) : false) ||
          (evento.contacto && evento.contacto.nombre_completo ? evento.contacto.nombre_completo.toLowerCase().includes(lowercaseQuery) : false) ||
          (evento.tipo_acercamiento ? evento.tipo_acercamiento.toLowerCase().includes(lowercaseQuery) : false) ||
          (evento.lugar ? evento.lugar.toLowerCase().includes(lowercaseQuery) : false) ||
          (evento.modalidad ? evento.modalidad.toLowerCase().includes(lowercaseQuery) : false) ||
          (evento.descripcion ? evento.descripcion.toLowerCase().includes(lowercaseQuery) : false)
        );
      });
    }
    
    // Aplicar filtros por columna
    if (columnFilters) {
      Object.entries(columnFilters).forEach(([key, value]) => {
        if (value) {
          const lowercaseValue = value.toLowerCase();
          if (key === 'municipalidad.nombre') {
            filteredData = filteredData.filter(evento => 
              evento.municipalidad && evento.municipalidad.nombre ? 
              evento.municipalidad.nombre.toLowerCase().includes(lowercaseValue) : false
            );
          } else if (key === 'contacto.nombre_completo') {
            filteredData = filteredData.filter(evento => 
              evento.contacto && evento.contacto.nombre_completo ? 
              evento.contacto.nombre_completo.toLowerCase().includes(lowercaseValue) : false
            );
          } else if (key === 'fecha') {
            filteredData = filteredData.filter(evento => 
              evento.fecha && formatDate(evento.fecha).includes(lowercaseValue)
            );
          } else {
            filteredData = filteredData.filter(evento => 
              evento[key] ? String(evento[key]).toLowerCase().includes(lowercaseValue) : false
            );
          }
        }
      });
    }
    
    // Ordenar los resultados
    if (sortField) {
      filteredData.sort((a, b) => {
        let valueA, valueB;
        
        if (sortField === 'municipalidad.nombre') {
          valueA = a.municipalidad && a.municipalidad.nombre ? a.municipalidad.nombre : '';
          valueB = b.municipalidad && b.municipalidad.nombre ? b.municipalidad.nombre : '';
        } else if (sortField === 'contacto.nombre_completo') {
          valueA = a.contacto && a.contacto.nombre_completo ? a.contacto.nombre_completo : '';
          valueB = b.contacto && b.contacto.nombre_completo ? b.contacto.nombre_completo : '';
        } else {
          valueA = a[sortField] || '';
          valueB = b[sortField] || '';
        }
        
        // Si es una fecha, convertir a objeto Date
        if (sortField === 'fecha') {
          valueA = valueA ? new Date(valueA) : new Date(0);
          valueB = valueB ? new Date(valueB) : new Date(0);
        }
        
        // Comparar string o date
        const result = typeof valueA === 'string' 
          ? valueA.localeCompare(valueB)
          : valueA - valueB;
          
        return sortOrder === 'asc' ? result : -result;
      });
    }
    
    return filteredData;
  };
  
  // Aplicar paginación a los datos filtrados
  const getPaginatedData = () => {
    const filteredData = applyFilters();
    
    // Calcular límites de página
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      data: filteredData.slice(startIndex, endIndex),
      totalRecords: filteredData.length
    };
  };
  
  // Obtener número total de páginas
  const totalPages = Math.ceil(applyFilters().length / itemsPerPage);
  
  // Definir columnas para la tabla
  const columns = [
    {
      field: 'municipalidad.nombre',
      header: 'MUNICIPALIDAD',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.municipalidad && rowData.municipalidad.nombre ? rowData.municipalidad.nombre : 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'contacto.nombre_completo',
      header: 'CONTACTO',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.contacto && rowData.contacto.nombre_completo ? rowData.contacto.nombre_completo : 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'tipo_acercamiento',
      header: 'TIPO DE ACERCAMIENTO',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.tipo_acercamiento || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'lugar',
      header: 'LUGAR',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.lugar || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'fecha',
      header: 'FECHA',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha) || 'N/A'
    },
    {
      field: 'modalidad',
      header: 'MODALIDAD',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.modalidad || 'N/A'}
          </span>
        </div>
      )
    },
    {
      field: 'descripcion',
      header: 'DESCRIPCIÓN',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <div className="max-w-xs overflow-hidden">
          <span className="whitespace-pre-wrap break-words">
            {rowData.descripcion || 'N/A'}
          </span>
        </div>
      )
    }
  ];
  
  // Acciones para cada fila
  const actionColumn = {
    field: 'acciones',
    header: 'ACCIONES',
    body: (rowData) => (
      <div className="flex space-x-2 justify-center">
        <button
          onClick={() => handleEdit(rowData)}
          className="text-blue-600 hover:text-blue-800 p-1"
          title="Editar"
        >
          <FaEdit />
        </button>
        <button
          onClick={() => confirmDelete(rowData)}
          className="text-red-600 hover:text-red-800 p-1"
          title="Eliminar"
        >
          <FaTrashAlt />
        </button>
      </div>
    )
  };
  
  // Añadir columna de acciones al final
  const tableColumns = [...columns, actionColumn];
  
  // Columnas a mostrar en versión móvil (solo municipalidad y fecha)
  const mobileColumns = ['municipalidad.nombre', 'fecha', 'acciones'];
  
  // Obtener datos paginados
  const { data: paginatedData, totalRecords } = getPaginatedData();

  // Renderizar componente de acciones
  const renderActions = (rowData) => (
    <div className="flex space-x-2 justify-center">
      <button
        onClick={() => handleEdit(rowData)}
        className="text-blue-600 hover:text-blue-800 p-1"
        title="Editar"
      >
        <FaEdit />
      </button>
      <button
        onClick={() => confirmDelete(rowData)}
        className="text-red-600 hover:text-red-800 p-1"
        title="Eliminar"
      >
        <FaTrashAlt />
      </button>
    </div>
  );

  // Render principal del componente
  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
        
        <div className="w-full md:w-auto flex items-center">
          <div className="relative flex-grow mr-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          
          <button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            onClick={handleCreate}
          >
            <FaPlus className="h-4 w-4" />
            <span>Nuevo Evento</span>
          </button>
        </div>
      </div>

      {/* Tabla con nuestro componente Table personalizado */}
      <Table
        data={paginatedData}
        columns={tableColumns}
        loading={loading}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onSearch={handleSearch}
        searchQuery={searchQuery}
        columnFilters={columnFilters}
        onColumnFilterChange={handleColumnFilterChange}
        emptyMessage="No hay eventos disponibles"
        isMobile={isMobile}
        mobileColumns={mobileColumns}
        actions={renderActions}
        className="mb-4"
      />

      {/* Paginación */}
      {!loading && totalRecords > 0 && (
        <div className="mt-4 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            itemsPerPage={itemsPerPage}
            itemsPerPageOptions={[5, 10, 25, 50]}
            totalItems={totalRecords}
          />
        </div>
      )}

      {/* Modal para crear/editar evento */}
      <Modal
        isOpen={createDialogVisible || editDialogVisible}
        onClose={() => {
          setCreateDialogVisible(false);
          setEditDialogVisible(false);
        }}
        title={editDialogVisible ? 'Editar Evento' : 'Crear Evento'}
        contentClassName="max-w-2xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
          {/* Selector de Municipalidad */}
          <div className="relative" ref={municipalidadDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div
              className="relative"
              onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
            >
              <div className="flex justify-between items-center w-full border border-gray-300 rounded-md p-2 cursor-pointer">
                <span>
                  {editData.id_municipalidad
                    ? municipalidades.find(m => m.id_municipalidad === parseInt(editData.id_municipalidad))?.nombre || ''
                    : 'Seleccione una municipalidad'}
                </span>
                {showMunicipalidadDropdown ? (
                  <FiChevronUp className="text-gray-400" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </div>
            </div>
            
            {showMunicipalidadDropdown && (
              <div className="absolute mt-1 w-full z-50 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                <div className="p-2">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    placeholder="Buscar municipalidad..."
                    value={municipalidadSearchQuery}
                    onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <ul className="py-1">
                  {municipalidades
                    .filter(m => m.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()))
                    .map(municipalidad => (
                      <li
                        key={municipalidad.id_municipalidad}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          handleMunicipalidadChange(municipalidad.id_municipalidad);
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        {municipalidad.nombre}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Selector de Contacto */}
          <div className="relative" ref={contactoDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div
              className="relative"
              onClick={() => {
                if (editData.id_municipalidad) {
                  setShowContactoDropdown(!showContactoDropdown);
                } else {
                  toast.showWarning('Advertencia', 'Primero debe seleccionar una municipalidad');
                }
              }}
            >
              <div className={`flex justify-between items-center w-full border border-gray-300 rounded-md p-2 ${editData.id_municipalidad ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-50'}`}>
                <span>
                  {editData.id_contacto
                    ? contactos.find(c => c.id_contacto === parseInt(editData.id_contacto))?.nombre_completo || ''
                    : 'Seleccione un contacto'}
                </span>
                {showContactoDropdown ? (
                  <FiChevronUp className="text-gray-400" />
                ) : (
                  <FiChevronDown className="text-gray-400" />
                )}
              </div>
            </div>
            
            {showContactoDropdown && (
              <div className="absolute mt-1 w-full z-50 bg-white rounded-md shadow-lg max-h-60 overflow-y-auto border border-gray-200">
                <div className="p-2">
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded-md mb-2"
                    placeholder="Buscar contacto..."
                    value={contactoSearchQuery}
                    onChange={(e) => setContactoSearchQuery(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                
                <ul className="py-1">
                  {contactos
                    .filter(c => c.nombre_completo.toLowerCase().includes(contactoSearchQuery.toLowerCase()))
                    .map(contacto => (
                      <li
                        key={contacto.id_contacto}
                        className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                        onClick={() => {
                          setEditData(prev => ({ ...prev, id_contacto: contacto.id_contacto }));
                          setShowContactoDropdown(false);
                        }}
                      >
                        {contacto.nombre_completo}
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </div>
          
          {/* Tipo de Acercamiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Acercamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.tipo_acercamiento || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, tipo_acercamiento: e.target.value }))}
            />
          </div>
          
          {/* Lugar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lugar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.lugar || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, lugar: e.target.value }))}
            />
          </div>
          
          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <TailwindCalendar
              id="fecha"
              selectedDate={editData.fecha}
              onChange={(e) => setEditData(prev => ({ ...prev, fecha: e.value }))}
            />
          </div>
          
          {/* Modalidad */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modalidad <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.modalidad || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, modalidad: e.target.value }))}
            >
              <option value="">Seleccione una modalidad</option>
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Híbrido">Híbrido</option>
            </select>
          </div>
          
          {/* Descripción - ocupa 2 columnas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-32"
              value={editData.descripcion || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            onClick={() => {
              setCreateDialogVisible(false);
              setEditDialogVisible(false);
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            onClick={handleSave}
          >
            Guardar
          </button>
        </div>
      </Modal>
      
      {/* Modal de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar el evento con fecha ${selectedEvento ? formatDate(selectedEvento.fecha) : ''} en ${selectedEvento?.municipalidad?.nombre || ''}?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { api, apiService } from '../../services/authService';
import { FiEdit, FiTrash2, FiPlus, FiEye } from 'react-icons/fi';
import { FaEdit, FaTrashAlt, FaPlus, FaCalendarAlt  } from 'react-icons/fa';
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
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
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

  // Acciones para cada fila
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedEvento(rowData);
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
  
  // Añadir columna de acciones al final
  const tableColumns = [...columns, { field: 'acciones', header: 'ACCIONES', body: renderActions }];

  // Columnas a mostrar en versión móvil (solo municipalidad y fecha)
  const mobileColumns = ['municipalidad.nombre', 'fecha', 'acciones'];
  
  // Obtener datos paginados
  const { data: paginatedData, totalRecords } = getPaginatedData();

  // Render principal del componente
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Eventos</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={() => {
            setEditData({
              id_evento: '',
              id_municipalidad: '',
              id_contacto: '',
              tipo_acercamiento: '',
              lugar: '',
              fecha: new Date().toISOString().split('T')[0],
              modalidad: '',
              descripcion: ''
            });
            setCreateDialogVisible(true);
          }}
        >
          <FiPlus className="mr-2" />
          Nuevo Evento
        </button>
      </div>

      {/* Búsqueda global - Siempre visible */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar eventos..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Tabla de eventos */}
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
          emptyMessage="No hay eventos disponibles"
          searchQuery={searchQuery}
          
          columnFilters={columnFilters}
          onFilterChange={(field, value) => {
            setColumnFilters({
              ...columnFilters,
              [field]: value
            });
          }}
          isMobile={window.innerWidth < 768}
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
      
      {/* Modal de creación */}
      <Modal
        isOpen={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        title="Crear Evento"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              onClick={() => setCreateDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Municipalidad mejorado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                <span>
                  {editData.id_municipalidad
                    ? municipalidades.find(m => m.id_municipalidad.toString() === editData.id_municipalidad.toString())?.nombre || 'Seleccione una municipalidad'
                    : 'Seleccione una municipalidad'}
                </span>
                <FiChevronDown className={`transition-transform ${showMunicipalidadDropdown ? 'rotate-180' : ''}`} />
              </div>
              
              {showMunicipalidadDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                        placeholder="Buscar evento por municipalidad..."
                        value={municipalidadSearchQuery}
                        onChange={e => setMunicipalidadSearchQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {municipalidades
                      .filter(m => m.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()))
                      .map(m => (
                        <div 
                          key={m.id_municipalidad} 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setEditData(prev => ({ ...prev, id_municipalidad: m.id_municipalidad, id_contacto: '' }));
                            loadContactosPorMunicipalidad(m.id_municipalidad);
                            setShowMunicipalidadDropdown(false);
                          }}
                        >
                          <div className="font-medium">{m.nombre}</div>
                          <div className="text-xs text-gray-500">
                            [{m.id_municipalidad}]
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Selector de Contacto mejorado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className={`w-full border border-gray-300 rounded-md p-2 flex justify-between items-center ${editData.id_municipalidad ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100'}`}
                onClick={() => {
                  if (editData.id_municipalidad) {
                    setShowContactoDropdown(!showContactoDropdown);
                  }
                }}
              >
                <span>
                  {editData.id_contacto
                    ? contactos.find(c => c.id_contacto.toString() === editData.id_contacto.toString())?.nombre_completo || 'Seleccione un contacto'
                    : 'Seleccione un contacto'}
                </span>
                <FiChevronDown className={`transition-transform ${showContactoDropdown ? 'rotate-180' : ''}`} />
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
                        onChange={e => setContactoSearchQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {contactos
                      .filter(c => c.nombre_completo.toLowerCase().includes(contactoSearchQuery.toLowerCase()))
                      .map(c => (
                        <div 
                          key={c.id_contacto} 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setEditData(prev => ({ ...prev, id_contacto: c.id_contacto }));
                            setShowContactoDropdown(false);
                          }}
                        >
                          <div className="font-medium">{c.nombre_completo}</div>
                          <div className="text-xs text-gray-500">
                            [{c.id_contacto}]
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo de Acercamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.tipo_acercamiento || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, tipo_acercamiento: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Lugar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.lugar || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, lugar: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.fecha || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
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
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-32"
              value={editData.descripcion || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
      
      {/* Modal de edición */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Evento"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              onClick={() => setEditDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Selector de Municipalidad mejorado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
                onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
              >
                <span>
                  {editData.id_municipalidad
                    ? municipalidades.find(m => m.id_municipalidad.toString() === editData.id_municipalidad.toString())?.nombre || 'Seleccione una municipalidad'
                    : 'Seleccione una municipalidad'}
                </span>
                <FiChevronDown className={`transition-transform ${showMunicipalidadDropdown ? 'rotate-180' : ''}`} />
              </div>
              
              {showMunicipalidadDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                    <div className="relative">
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border rounded-md"
                        placeholder="Buscar evento por municipalidad..."
                        value={municipalidadSearchQuery}
                        onChange={e => setMunicipalidadSearchQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {municipalidades
                      .filter(m => m.nombre.toLowerCase().includes(municipalidadSearchQuery.toLowerCase()))
                      .map(m => (
                        <div 
                          key={m.id_municipalidad} 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setEditData(prev => ({ ...prev, id_municipalidad: m.id_municipalidad, id_contacto: '' }));
                            loadContactosPorMunicipalidad(m.id_municipalidad);
                            setShowMunicipalidadDropdown(false);
                          }}
                        >
                          <div className="font-medium">{m.nombre}</div>
                          <div className="text-xs text-gray-500">
                            [{m.id_municipalidad}]
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Selector de Contacto mejorado */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div 
                className={`w-full border border-gray-300 rounded-md p-2 flex justify-between items-center ${editData.id_municipalidad ? 'cursor-pointer' : 'cursor-not-allowed bg-gray-100'}`}
                onClick={() => {
                  if (editData.id_municipalidad) {
                    setShowContactoDropdown(!showContactoDropdown);
                  }
                }}
              >
                <span>
                  {editData.id_contacto
                    ? contactos.find(c => c.id_contacto.toString() === editData.id_contacto.toString())?.nombre_completo || 'Seleccione un contacto'
                    : 'Seleccione un contacto'}
                </span>
                <FiChevronDown className={`transition-transform ${showContactoDropdown ? 'rotate-180' : ''}`} />
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
                        onChange={e => setContactoSearchQuery(e.target.value)}
                        onClick={e => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="py-1">
                    {contactos
                      .filter(c => c.nombre_completo.toLowerCase().includes(contactoSearchQuery.toLowerCase()))
                      .map(c => (
                        <div 
                          key={c.id_contacto} 
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setEditData(prev => ({ ...prev, id_contacto: c.id_contacto }));
                            setShowContactoDropdown(false);
                          }}
                        >
                          <div className="font-medium">{c.nombre_completo}</div>
                          <div className="text-xs text-gray-500">
                            [{c.id_contacto}]
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo de Acercamiento <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.tipo_acercamiento || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, tipo_acercamiento: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Lugar <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.lugar || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, lugar: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={editData.fecha || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, fecha: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
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
          
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2 h-32"
              value={editData.descripcion || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
            />
          </div>
        </div>
      </Modal>
      
      {/* Modal de visualización */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles del Evento"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedEvento && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">MUNICIPALIDAD</h3>
                <p className="mt-1">{selectedEvento.municipalidad && selectedEvento.municipalidad.nombre ? selectedEvento.municipalidad.nombre : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">CONTACTO</h3>
                <p className="mt-1">{selectedEvento.contacto && selectedEvento.contacto.nombre_completo ? selectedEvento.contacto.nombre_completo : 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">TIPO DE ACERCAMIENTO</h3>
                <p className="mt-1">{selectedEvento.tipo_acercamiento || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">LUGAR</h3>
                <p className="mt-1">{selectedEvento.lugar || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">FECHA</h3>
                <p className="mt-1">{formatDate(selectedEvento.fecha) || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">MODALIDAD</h3>
                <p className="mt-1">{selectedEvento.modalidad || 'N/A'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">DESCRIPCIÓN</h3>
              <p className="mt-1 whitespace-pre-wrap">{selectedEvento.descripcion || 'N/A'}</p>
            </div>
          </div>
        )}
      </Modal>
      
      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={() => {
          if (selectedEvento) {
            confirmDelete(selectedEvento);
            setDeleteDialogVisible(false);
          }
        }}
        title="Eliminar Evento"
        message="¿Está seguro que desea eliminar este evento? Esta acción no se puede deshacer."
      />
    </div>
  );
}

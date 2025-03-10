import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiPlus, FiTrash2, FiEdit, FiEye, FiChevronDown, FiChevronUp, FiChevronLeft, FiChevronRight, FiX } from 'react-icons/fi';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';

export default function ConveniosList() {
  const [convenios, setConvenios] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState(null);
  const [editData, setEditData] = useState({
    id_convenio: '',
    id_municipalidad: '',
    tipo_convenio: '',
    monto: '',
    fecha_firma: null,
    estado: '',
    descripcion: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('fecha_firma');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toastMessage, setToastMessage] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    tipo_convenio: '',
    municipalidad: '',
    monto: '',
    fecha_firma: '',
    estado: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En proceso', value: 'En proceso' },
    { label: 'Firmado', value: 'Firmado' },
    { label: 'Cancelado', value: 'Cancelado' },
    { label: 'Finalizado', value: 'Finalizado' }
  ];

  const tipoConvenioOptions = [
    { label: 'Cooperación', value: 'Cooperación' },
    { label: 'Infraestructura', value: 'Infraestructura' },
    { label: 'Servicios', value: 'Servicios' },
    { label: 'Desarrollo social', value: 'Desarrollo social' },
    { label: 'Otros', value: 'Otros' }
  ];

  useEffect(() => {
    loadConvenios();
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

  const loadConvenios = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADDRESS}api/convenios`);
      setConvenios(response.data || []);
    } catch (error) {
      console.error('Error al cargar convenios:', error);
      showToast('error', 'Error', 'No se pudieron cargar los convenios');
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const response = await axios.get(`${ADDRESS}api/municipalidades`);
      setMunicipalidades(response.data || []);
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
      // Crear una copia del objeto para no modificar el estado directamente
      const dataToSend = { ...editData };
      
      // Asegurarse de que las fechas estén en el formato correcto para la API
      if (dataToSend.fecha_firma && dataToSend.fecha_firma instanceof Date) {
        dataToSend.fecha_firma = dataToSend.fecha_firma.toISOString().split('T')[0];
      }

      // Asegurarse de que el monto sea un número
      if (dataToSend.monto) {
        dataToSend.monto = parseFloat(dataToSend.monto);
      }

      console.log('Datos a enviar:', dataToSend);
      
      if (dataToSend.id_convenio) {
        await axios.put(`${ADDRESS}api/convenios/${dataToSend.id_convenio}`, dataToSend);
        showToast('success', 'Éxito', 'Convenio actualizado correctamente');
      } else {
        await axios.post(`${ADDRESS}api/convenios`, dataToSend);
        showToast('success', 'Éxito', 'Convenio creado correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_convenio: '',
        id_municipalidad: '',
        tipo_convenio: '',
        monto: '',
        fecha_firma: null,
        estado: '',
        descripcion: ''
      });
      loadConvenios();
    } catch (error) {
      console.error('Error al guardar:', error);
      showToast('error', 'Error', 'Error al guardar el convenio');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${ADDRESS}api/convenios/${selectedConvenio.id_convenio}`);
      showToast('success', 'Éxito', 'Convenio eliminado correctamente');
      setDeleteDialogVisible(false);
      loadConvenios();
    } catch (error) {
      console.error('Error al eliminar:', error);
      showToast('error', 'Error', 'Error al eliminar el convenio');
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(value);
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Firmado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      case 'Finalizado':
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
      if (field === 'fecha_firma') {
        valueA = valueA ? new Date(valueA).getTime() : 0;
        valueB = valueB ? new Date(valueB).getTime() : 0;
      }
      
      // Handle sorting numbers
      if (field === 'monto') {
        valueA = valueA ? parseFloat(valueA) : 0;
        valueB = valueB ? parseFloat(valueB) : 0;
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
  const filteredConvenios = convenios.filter(convenio => {
    // Filtro de búsqueda general
    const searchFields = [
      convenio.tipo_convenio,
      municipalidades.find(m => m.id_municipalidad === convenio.id_municipalidad)?.nombre || '',
      convenio.monto?.toString() || '',
      convenio.estado,
      convenio.descripcion || ''
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesTipoConvenio = columnFilters.tipo_convenio === '' || 
      convenio.tipo_convenio.toLowerCase().includes(columnFilters.tipo_convenio.toLowerCase());
    
    const municipalidadNombre = municipalidades.find(m => m.id_municipalidad === convenio.id_municipalidad)?.nombre || '';
    const matchesMunicipalidad = columnFilters.municipalidad === '' || 
      municipalidadNombre.toLowerCase().includes(columnFilters.municipalidad.toLowerCase());
    
    const matchesMonto = columnFilters.monto === '' || 
      (convenio.monto?.toString() || '').includes(columnFilters.monto);
    
    const matchesFechaFirma = columnFilters.fecha_firma === '' || 
      (convenio.fecha_firma && formatDate(convenio.fecha_firma).includes(columnFilters.fecha_firma));
    
    const matchesEstado = columnFilters.estado === '' || 
      convenio.estado.toLowerCase().includes(columnFilters.estado.toLowerCase());
    
    return matchesSearch && matchesTipoConvenio && matchesMunicipalidad && 
           matchesMonto && matchesFechaFirma && matchesEstado;
  });

  // Pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const totalPages = Math.ceil(filteredConvenios.length / itemsPerPage);
  const sortedData = sortData(filteredConvenios, sortField, sortOrder);
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
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
          <h2 className="text-2xl font-bold text-gray-800">Convenios</h2>
          <button
            onClick={() => {
              setEditData({
                id_convenio: '',
                id_municipalidad: '',
                tipo_convenio: '',
                monto: '',
                fecha_firma: null,
                estado: 'Pendiente',
                descripcion: ''
              });
              setCreateDialogVisible(true);
            }}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2 w-full sm:w-auto"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Convenio</span>
          </button>
        </div>
        <div className="w-full sm:w-auto relative">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar convenio..."
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('tipo_convenio')}
              >
                <div className="flex items-center space-x-1">
                  <span>Tipo de Convenio</span>
                  {sortField === 'tipo_convenio' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.tipo_convenio}
                      onChange={(e) => setColumnFilters({...columnFilters, tipo_convenio: e.target.value})}
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
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer ${isMobile ? 'hidden md:table-cell' : ''}`}
                onClick={() => handleSort('monto')}
              >
                <div className="flex items-center space-x-1">
                  <span>Monto</span>
                  {sortField === 'monto' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.monto}
                      onChange={(e) => setColumnFilters({...columnFilters, monto: e.target.value})}
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
                onClick={() => handleSort('fecha_firma')}
              >
                <div className="flex items-center space-x-1">
                  <span>Fecha de Firma</span>
                  {sortField === 'fecha_firma' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.fecha_firma}
                      onChange={(e) => setColumnFilters({...columnFilters, fecha_firma: e.target.value})}
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
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    <span className="ml-2">Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron convenios
                </td>
              </tr>
            ) : (
              paginatedData.map((convenio) => (
                <tr key={convenio.id_convenio} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                    {convenio.tipo_convenio}
                  </td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-900">
                    {municipalidades.find(m => m.id_municipalidad === convenio.id_municipalidad)?.nombre || 'N/A'}
                  </td>
                  <td className={`px-6 py-4 whitespace-normal text-sm text-gray-900 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                    {formatCurrency(convenio.monto)}
                  </td>
                  <td className={`px-6 py-4 whitespace-normal text-sm text-gray-900 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                    {formatDate(convenio.fecha_firma)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(convenio.estado)}`}>
                      {convenio.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => {
                          setSelectedConvenio(convenio);
                          setViewDialogVisible(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConvenio(convenio);
                          // Formatear la fecha para el formulario
                          const formattedDate = convenio.fecha_firma ? new Date(convenio.fecha_firma) : null;
                          
                          setEditData({
                            ...convenio,
                            fecha_firma: formattedDate
                          });
                          setEditDialogVisible(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedConvenio(convenio);
                          setDeleteDialogVisible(true);
                        }}
                        className="text-red-600 hover:text-red-900"
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
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
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
            onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
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
              Mostrando <span className="font-medium">{filteredConvenios.length > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, filteredConvenios.length)}</span> de <span className="font-medium">{filteredConvenios.length}</span> resultados
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
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Anterior</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
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
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="sr-only">Siguiente</span>
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                onClick={() => goToPage(totalPages)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
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

      {/* View Dialog */}
      {viewDialogVisible && selectedConvenio && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      Detalles del Convenio
                    </h3>
                    <div className="border-t border-gray-200 py-4 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Tipo de Convenio</p>
                          <p className="font-medium">{selectedConvenio.tipo_convenio}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Municipalidad</p>
                          <p className="font-medium">{municipalidades.find(m => m.id_municipalidad === selectedConvenio.id_municipalidad)?.nombre || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Monto</p>
                          <p className="font-medium">{formatCurrency(selectedConvenio.monto)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Fecha de Firma</p>
                          <p className="font-medium">{formatDate(selectedConvenio.fecha_firma)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Estado</p>
                          <p className="font-medium">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoClass(selectedConvenio.estado)}`}>
                              {selectedConvenio.estado}
                            </span>
                          </p>
                        </div>
                        <div className="sm:col-span-2">
                          <p className="text-gray-500">Descripción</p>
                          <p className="font-medium whitespace-pre-wrap">{selectedConvenio.descripcion || 'Sin descripción'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setViewDialogVisible(false)}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      {(createDialogVisible || editDialogVisible) && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                      {editDialogVisible ? 'Editar Convenio' : 'Crear Nuevo Convenio'}
                    </h3>
                    <div className="mt-2 space-y-4">
                      <div>
                        <label htmlFor="id_municipalidad" className="block text-sm font-medium text-gray-700">
                          Municipalidad
                        </label>
                        <select
                          id="id_municipalidad"
                          value={editData.id_municipalidad}
                          onChange={(e) => setEditData({...editData, id_municipalidad: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          required
                        >
                          <option value="">Seleccione una municipalidad</option>
                          {municipalidades.map((municipalidad) => (
                            <option key={municipalidad.id_municipalidad} value={municipalidad.id_municipalidad}>
                              {municipalidad.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="tipo_convenio" className="block text-sm font-medium text-gray-700">
                          Tipo de Convenio
                        </label>
                        <select
                          id="tipo_convenio"
                          value={editData.tipo_convenio}
                          onChange={(e) => setEditData({...editData, tipo_convenio: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          required
                        >
                          <option value="">Seleccione un tipo</option>
                          {tipoConvenioOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="monto" className="block text-sm font-medium text-gray-700">
                          Monto
                        </label>
                        <input
                          type="number"
                          id="monto"
                          value={editData.monto}
                          onChange={(e) => setEditData({...editData, monto: e.target.value})}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                          step="0.01"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="fecha_firma" className="block text-sm font-medium text-gray-700">
                          Fecha de Firma
                        </label>
                        <input
                          type="date"
                          id="fecha_firma"
                          value={editData.fecha_firma ? editData.fecha_firma instanceof Date 
                            ? editData.fecha_firma.toISOString().split('T')[0]
                            : editData.fecha_firma
                            : ''}
                          onChange={(e) => setEditData({...editData, fecha_firma: e.target.value ? new Date(e.target.value) : null})}
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="estado" className="block text-sm font-medium text-gray-700">
                          Estado
                        </label>
                        <select
                          id="estado"
                          value={editData.estado}
                          onChange={(e) => setEditData({...editData, estado: e.target.value})}
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                          required
                        >
                          <option value="">Seleccione un estado</option>
                          {estadoOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                          Descripción
                        </label>
                        <textarea
                          id="descripcion"
                          value={editData.descripcion || ''}
                          onChange={(e) => setEditData({...editData, descripcion: e.target.value})}
                          rows="4"
                          className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                        ></textarea>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSave}
                >
                  Guardar
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    setEditDialogVisible(false);
                    setCreateDialogVisible(false);
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialogVisible && selectedConvenio && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <FiTrash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar Convenio
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar este convenio? Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button 
                  type="button" 
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDelete}
                >
                  Eliminar
                </button>
                <button 
                  type="button" 
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setDeleteDialogVisible(false)}
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
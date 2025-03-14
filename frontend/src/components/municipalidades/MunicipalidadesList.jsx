import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiChevronUp, FiChevronDown, FiPlus, FiSearch, FiEye } from 'react-icons/fi';
import { ADDRESS } from '../../utils.jsx';
import { api, authService, apiService } from '../../services/authService';

export default function MunicipalidadesList() {
  // Opciones de nivel para reutilizar en los modales
  const nivelOptions = [
    { value: "", label: "Seleccionar nivel" },
    { value: "Gobierno Local", label: "Gobierno Local" },
    { value: "Gobierno Regional", label: "Gobierno Regional" },
    { value: "Gobierno Provincial", label: "Gobierno Provincial" },
    { value: "Asociación", label: "Asociación" }
  ];

  const [municipalidades, setMunicipalidades] = useState([]);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [editData, setEditData] = useState({
    id_municipalidad: '',
    nombre: '',
    departamento: '',
    region: '',
    region_natural: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    nivel: '',
    X: '',
    Y: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [toastMessage, setToastMessage] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    nombre: '',
    region: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
    nivel: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
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

  const loadMunicipalidades = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('municipalidades');
      setMunicipalidades(data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las municipalidades'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editData.id_municipalidad) {
        await api.put(`api/municipalidades/${editData.id_municipalidad}`, editData);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Municipalidad actualizada correctamente'
        });
      } else {
        await api.post(`api/municipalidades`, editData);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Municipalidad creada correctamente'
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_municipalidad: '',
        nombre: '',
        departamento: '',
        region: '',
        region_natural: '',
        provincia: '',
        distrito: '',
        ubigeo: '',
        nivel: '',
        X: '',
        Y: ''
      });
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al guardar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la municipalidad'
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await api.delete(`api/municipalidades/${rowData.id_municipalidad}`);
      setToastMessage({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Municipalidad eliminada correctamente'
      });
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al eliminar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la municipalidad'
      });
    }
  };

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtering functions
  const filteredMunicipalidades = municipalidades.filter(municipalidad => {
    // Filtro de búsqueda general
    const searchFields = [
      municipalidad.nombre,
      municipalidad.region,
      municipalidad.departamento,
      municipalidad.provincia,
      municipalidad.distrito,
      municipalidad.ubigeo,
      municipalidad.nivel
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesNombre = columnFilters.nombre === '' || 
      (municipalidad.nombre && municipalidad.nombre.toLowerCase().includes(columnFilters.nombre.toLowerCase()));
    
    const matchesRegion = columnFilters.region === '' || 
      (municipalidad.region && municipalidad.region.toLowerCase().includes(columnFilters.region.toLowerCase()));
    
    const matchesDepartamento = columnFilters.departamento === '' || 
      (municipalidad.departamento && municipalidad.departamento.toLowerCase().includes(columnFilters.departamento.toLowerCase()));
    
    const matchesProvincia = columnFilters.provincia === '' || 
      (municipalidad.provincia && municipalidad.provincia.toLowerCase().includes(columnFilters.provincia.toLowerCase()));
    
    const matchesDistrito = columnFilters.distrito === '' || 
      (municipalidad.distrito && municipalidad.distrito.toLowerCase().includes(columnFilters.distrito.toLowerCase()));
    
    const matchesUbigeo = columnFilters.ubigeo === '' || 
      (municipalidad.ubigeo && municipalidad.ubigeo.toLowerCase().includes(columnFilters.ubigeo.toLowerCase()));
    
    const matchesNivel = columnFilters.nivel === '' || 
      (municipalidad.nivel && municipalidad.nivel.toLowerCase().includes(columnFilters.nivel.toLowerCase()));
    
    return matchesSearch && matchesNombre && matchesRegion && matchesDepartamento && 
           matchesProvincia && matchesDistrito && matchesUbigeo && matchesNivel;
  });

  // Pagination
  const totalPages = Math.ceil(filteredMunicipalidades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Sorting
  const sortedData = [...filteredMunicipalidades].sort((a, b) => {
    const aValue = a[sortField] || '';
    const bValue = b[sortField] || '';
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

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
          toastMessage.severity === 'warning' ? 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700' :
          'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        }`}>
          <div className="flex items-center">
            <div className="font-bold">{toastMessage.summary}</div>
            <div className="ml-2">{toastMessage.detail}</div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <h2 className="text-2xl font-bold text-gray-800">Municipalidades</h2>
          <button
            onClick={() => {
              setEditData({
                id_municipalidad: '',
                nombre: '',
                departamento: '',
                region: '',
                region_natural: '',
                provincia: '',
                distrito: '',
                ubigeo: '',
              });
              setCreateDialogVisible(true);
            }}
            className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nueva Municipalidad</span>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar municipalidad..."
            className="w-full px-4 py-2 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
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
                onClick={() => handleSort('nombre')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nombre</span>
                  {sortField === 'nombre' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.nombre}
                      onChange={(e) => setColumnFilters({...columnFilters, nombre: e.target.value})}
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
                onClick={() => handleSort('nivel')}
              >
                <div className="flex items-center space-x-1">
                  <span>Nivel</span>
                  {sortField === 'nivel' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.nivel}
                      onChange={(e) => setColumnFilters({...columnFilters, nivel: e.target.value})}
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
                onClick={() => handleSort('region')}
              >
                <div className="flex items-center space-x-1">
                  <span>Región</span>
                  {sortField === 'region' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.region}
                      onChange={(e) => setColumnFilters({...columnFilters, region: e.target.value})}
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
                onClick={() => handleSort('departamento')}
              >
                <div className="flex items-center space-x-1">
                  <span>Departamento</span>
                  {sortField === 'departamento' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.departamento}
                      onChange={(e) => setColumnFilters({...columnFilters, departamento: e.target.value})}
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
                onClick={() => handleSort('provincia')}
              >
                <div className="flex items-center space-x-1">
                  <span>Provincia</span>
                  {sortField === 'provincia' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.provincia}
                      onChange={(e) => setColumnFilters({...columnFilters, provincia: e.target.value})}
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
                onClick={() => handleSort('distrito')}
              >
                <div className="flex items-center space-x-1">
                  <span>Distrito</span>
                  {sortField === 'distrito' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.distrito}
                      onChange={(e) => setColumnFilters({...columnFilters, distrito: e.target.value})}
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
                onClick={() => handleSort('ubigeo')}
              >
                <div className="flex items-center space-x-1">
                  <span>Ubigeo</span>
                  {sortField === 'ubigeo' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.ubigeo}
                      onChange={(e) => setColumnFilters({...columnFilters, ubigeo: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th scope="col" className={`px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider ${isMobile ? 'w-1/4' : 'w-1/6'}`}>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center">
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
                <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                  No se encontraron municipalidades
                </td>
              </tr>
            ) : (
              paginatedData.map((municipalidad) => (
                <tr key={municipalidad.id_municipalidad} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 break-words">{municipalidad.nombre}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{municipalidad.nivel}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{municipalidad.region}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{municipalidad.departamento}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{municipalidad.provincia}</td>
                  <td className={`px-6 py-4 break-words ${isMobile ? 'hidden md:table-cell' : ''}`}>{municipalidad.distrito}</td>
                  <td className="px-6 py-4 break-words">{municipalidad.ubigeo}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedMunicipalidad(municipalidad);
                          setViewDialogVisible(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-100 rounded-full"
                        title="Ver detalles"
                      >
                        <FiEye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMunicipalidad(municipalidad);
                          setEditData(municipalidad);
                          setEditDialogVisible(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
                        title="Editar"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedMunicipalidad(municipalidad);
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
              Mostrando <span className="font-medium">{filteredMunicipalidades.length > 0 ? startIndex + 1 : 0}</span> a <span className="font-medium">{Math.min(endIndex, filteredMunicipalidades.length)}</span> de <span className="font-medium">{filteredMunicipalidades.length}</span> resultados
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
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
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
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
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
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
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
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <svg className="h-5 w-5 -ml-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* View Dialog */}
      {viewDialogVisible && selectedMunicipalidad && (
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
                    Detalles de la Municipalidad
                  </h3>
                  <button
                    onClick={() => setViewDialogVisible(false)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nombre</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.nombre}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Nivel</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.nivel}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Región</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.region}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Región Natural</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.region_natural || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Departamento</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.departamento}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Provincia</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.provincia}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Distrito</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.distrito}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Ubigeo</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.ubigeo}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Coordenada X (Longitud)</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.X || 'No disponible'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Coordenada Y (Latitud)</p>
                    <p className="mt-1 text-sm text-gray-900">{selectedMunicipalidad.Y || 'No disponible'}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
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
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full md:max-w-4xl lg:max-w-5xl ml-auto mr-auto relative" style={{ marginLeft: 'auto', marginRight: 'auto', left: '0', right: '0' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editDialogVisible ? 'Editar Municipalidad' : 'Nueva Municipalidad'}
                  </h3>
                  <button
                    onClick={() => {
                      setEditDialogVisible(false);
                      setCreateDialogVisible(false);
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">
                      Nombre
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={editData.nombre}
                      onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="nivel" className="block text-sm font-medium text-gray-700">
                      Nivel
                    </label>
                    <select
                      id="nivel"
                      value={editData.nivel}
                      onChange={(e) => setEditData({ ...editData, nivel: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      {nivelOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="region" className="block text-sm font-medium text-gray-700">
                        Región
                      </label>
                      <input
                        type="text"
                        id="region"
                        value={editData.region}
                        onChange={(e) => setEditData({ ...editData, region: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="region_natural" className="block text-sm font-medium text-gray-700">
                        Región Natural
                      </label>
                      <input
                        type="text"
                        id="region_natural"
                        value={editData.region_natural}
                        onChange={(e) => setEditData({ ...editData, region_natural: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="departamento" className="block text-sm font-medium text-gray-700">
                        Departamento
                      </label>
                      <input
                        type="text"
                        id="departamento"
                        value={editData.departamento}
                        onChange={(e) => setEditData({ ...editData, departamento: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                        Provincia
                      </label>
                      <input
                        type="text"
                        id="provincia"
                        value={editData.provincia}
                        onChange={(e) => setEditData({ ...editData, provincia: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="distrito" className="block text-sm font-medium text-gray-700">
                        Distrito
                      </label>
                      <input
                        type="text"
                        id="distrito"
                        value={editData.distrito}
                        onChange={(e) => setEditData({ ...editData, distrito: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="ubigeo" className="block text-sm font-medium text-gray-700">
                        Ubigeo
                      </label>
                      <input
                        type="text"
                        id="ubigeo"
                        value={editData.ubigeo}
                        onChange={(e) => setEditData({ ...editData, ubigeo: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  {/* Nuevos campos X y Y */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="X" className="block text-sm font-medium text-gray-700">
                        Coordenada X (Longitud)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="X"
                        value={editData.X}
                        onChange={(e) => setEditData({ ...editData, X: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="-77.123456"
                      />
                    </div>
                    <div>
                      <label htmlFor="Y" className="block text-sm font-medium text-gray-700">
                        Coordenada Y (Latitud)
                      </label>
                      <input
                        type="number"
                        step="0.000001"
                        id="Y"
                        value={editData.Y}
                        onChange={(e) => setEditData({ ...editData, Y: e.target.value })}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="-12.654321"
                      />
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
                  {editDialogVisible ? 'Guardar' : 'Crear'}
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
      {deleteDialogVisible && selectedMunicipalidad && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ marginLeft: 'auto', marginRight: 'auto', left: '0', right: '0' }}>
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmar eliminación
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar la municipalidad <span className="font-bold">{selectedMunicipalidad.nombre}</span>?
                        Esta acción no se puede deshacer.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    confirmDelete(selectedMunicipalidad);
                    setDeleteDialogVisible(false);
                  }}
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
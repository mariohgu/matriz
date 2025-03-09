import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiChevronUp, FiChevronDown, FiPlus } from 'react-icons/fi';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';

export default function TipoReunionList() {
  const [tiposReunion, setTiposReunion] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTipoReunion, setSelectedTipoReunion] = useState(null);
  const [editData, setEditData] = useState({
    id_tipo_reunion: '',
    descripcion: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('descripcion');
  const [sortOrder, setSortOrder] = useState('asc');
  const [toastMessage, setToastMessage] = useState(null);
  const [columnFilters, setColumnFilters] = useState({
    descripcion: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    loadTiposReunion();
    
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

  const loadTiposReunion = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editData.id_tipo_reunion) {
        await axios.put(`${ADDRESS}api/tipos-reunion/${editData.id_tipo_reunion}`, editData);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de reunión actualizado correctamente'
        });
      } else {
        await axios.post(`${ADDRESS}api/tipos-reunion`, editData);
        setToastMessage({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de reunión creado correctamente'
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_tipo_reunion: '',
        descripcion: '',
      });
      loadTiposReunion();
    } catch (error) {
      console.error('Error al guardar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el tipo de reunión'
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/tipos-reunion/${rowData.id_tipo_reunion}`);
      setToastMessage({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de reunión eliminado correctamente'
      });
      loadTiposReunion();
    } catch (error) {
      console.error('Error al eliminar:', error);
      setToastMessage({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el tipo de reunión'
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
  const filteredTiposReunion = tiposReunion.filter(tipo => {
    // Filtro de búsqueda general
    const searchFields = [
      tipo.descripcion
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesDescripcion = columnFilters.descripcion === '' || 
      (tipo.descripcion && tipo.descripcion.toLowerCase().includes(columnFilters.descripcion.toLowerCase()));
    
    return matchesSearch && matchesDescripcion;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTiposReunion.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Sorting
  const sortedData = [...filteredTiposReunion].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
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
          <h2 className="text-2xl font-bold text-gray-800">Tipos de Reunión</h2>
          <button
            onClick={() => {
              setEditData({
                id_tipo_reunion: '',
                descripcion: '',
              });
              setCreateDialogVisible(true);
            }}
            className="ml-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FiPlus className="w-5 h-5" />
            <span>Nuevo Tipo</span>
          </button>
        </div>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar tipo de reunión..."
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
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer w-4/5"
                onClick={() => handleSort('descripcion')}
              >
                <div className="flex items-center space-x-1">
                  <span>Descripción</span>
                  {sortField === 'descripcion' && (
                    sortOrder === 'asc' ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />
                  )}
                </div>
                {!isMobile && (
                  <div className="mt-2">
                    <input
                      type="text"
                      value={columnFilters.descripcion}
                      onChange={(e) => setColumnFilters({...columnFilters, descripcion: e.target.value})}
                      placeholder="Filtrar..."
                      className="w-full px-2 py-1 text-xs border rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </th>
              <th 
                scope="col" 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5"
              >
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-center">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-800"></div>
                    <span className="ml-2">Cargando...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-center text-gray-500">
                  No se encontraron tipos de reunión
                </td>
              </tr>
            ) : (
              paginatedData.map((tipo) => (
                <tr key={tipo.id_tipo_reunion} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-normal break-words">
                    <div className="text-sm text-gray-900">{tipo.descripcion}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditData(tipo);
                          setEditDialogVisible(true);
                        }}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <FiEdit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTipoReunion(tipo);
                          setDeleteDialogVisible(true);
                        }}
                        className="text-red-600 hover:text-red-800"
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
      {!loading && filteredTiposReunion.length > 0 && (
        <div className="flex justify-between items-center mt-4 px-4">
          <div className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">
              {Math.min(endIndex, filteredTiposReunion.length)}
            </span> de <span className="font-medium">{filteredTiposReunion.length}</span> resultados
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              &laquo;
            </button>
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              &lsaquo;
            </button>
            {[...Array(Math.min(5, totalPages))].map((_, i) => {
              const pageNum = currentPage <= 3
                ? i + 1
                : currentPage >= totalPages - 2
                  ? totalPages - 4 + i
                  : currentPage - 2 + i;
              
              if (pageNum <= 0 || pageNum > totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  onClick={() => goToPage(pageNum)}
                  className={`px-3 py-1 rounded ${
                    currentPage === pageNum
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              &rsaquo;
            </button>
            <button
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              &raquo;
            </button>
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
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center pb-3 border-b mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {editDialogVisible ? 'Editar Tipo de Reunión' : 'Nuevo Tipo de Reunión'}
                  </h3>
                  <button
                    onClick={() => {
                      setEditDialogVisible(false);
                      setCreateDialogVisible(false);
                    }}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    <span className="sr-only">Cerrar</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700">
                      Descripción
                    </label>
                    <input
                      type="text"
                      id="descripcion"
                      value={editData.descripcion}
                      onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
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
      {deleteDialogVisible && selectedTipoReunion && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Confirmar eliminación
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Está seguro que desea eliminar el tipo de reunión <span className="font-bold">{selectedTipoReunion.descripcion}</span>?
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
                    confirmDelete(selectedTipoReunion);
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
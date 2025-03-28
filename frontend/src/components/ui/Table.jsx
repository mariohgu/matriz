import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp, FiSearch, FiX, FiFilter } from 'react-icons/fi';

const getNestedValue = (obj, field) => {
  const fields = field.split('.');
  let value = obj;
  for (let i = 0; i < fields.length; i++) {
    if (!value) return null;
    value = value[fields[i]];
  }
  return value;
};

const Table = ({
  data = [],
  columns = [],
  sortField,
  sortOrder,
  onSort,
  onSearch,
  searchQuery = '',
  columnFilters = {},
  onColumnFilterChange,
  loading = false,
  emptyMessage = 'No hay datos disponibles',
  isMobile = false,
  mobileColumns = [], // Columnas a mostrar en vista móvil
  actions = null, // Componente de acciones (botones editar, eliminar, etc.)
  className = ''
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [localColumnFilters, setLocalColumnFilters] = useState(columnFilters);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Sincronizar filtros locales con los externos - solo cuando cambian los props
  useEffect(() => {
    setLocalColumnFilters(columnFilters);
  }, [JSON.stringify(columnFilters)]);

  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  // Aplicar filtros cuando se presiona Enter o después de un delay
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    
    // Solo llamar a onSearch si está definido
    if (onSearch) {
      // Debounce para no aplicar el filtro en cada keystroke
      const timeoutId = setTimeout(() => {
        onSearch(value);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(localSearchQuery);
    }
  };

  const handleFilterChange = (columnName, value) => {
    const newFilters = {
      ...localColumnFilters,
      [columnName]: value
    };
    setLocalColumnFilters(newFilters);
    
    // Solo llamar a onColumnFilterChange si está definido
    if (onColumnFilterChange) {
      // Debounce para no aplicar el filtro en cada keystroke
      const timeoutId = setTimeout(() => {
        onColumnFilterChange(columnName, value);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  };

  const clearFilter = (columnName) => {
    const newFilters = {
      ...localColumnFilters,
      [columnName]: ''
    };
    setLocalColumnFilters(newFilters);
    if (onColumnFilterChange) {
      onColumnFilterChange(columnName, '');
    }
  };

  const clearSearch = () => {
    setLocalSearchQuery('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Determinar qué columnas mostrar según el modo
  const visibleColumns = isMobile 
    ? columns.filter(col => mobileColumns.includes(col.field))
    : columns;

  return (
    <div className={`w-full ${className}`}>
      {/* Barra de búsqueda global siempre visible */}
      <div className="mb-4 flex">
        <div className="relative flex-1">
          <input
            type="text"
            value={localSearchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleSearchKeyDown}
            className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar..."
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="text-gray-400" />
          </div>
          {localSearchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={clearSearch}
            >
              <FiX className="text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
        
        {/* Botón para mostrar/ocultar filtros en versión desktop */}
        {!isMobile && (
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-2 px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg flex items-center"
          >
            <FiFilter className="mr-1" />
            Filtros
          </button>
        )}
      </div>
      
      {/* Tabla versión desktop */}
      {!isMobile ? (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {visibleColumns.map((column) => (
                  <th
                    key={column.field}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {/* Encabezado con ordenamiento */}
                    <div className="flex items-center cursor-pointer" onClick={() => column.sortable !== false && onSort && onSort(column.field, sortField === column.field ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'asc')}>
                      <span>{column.header}</span>
                      {column.sortable !== false && sortField === column.field ? (
                        sortOrder === 'asc' ? (
                          <FiChevronUp className="ml-1" />
                        ) : (
                          <FiChevronDown className="ml-1" />
                        )
                      ) : null}
                    </div>
                    
                    {/* Filtros por columna */}
                    {showFilters && column.filterable !== false && (
                      <div className="mt-2 relative">
                        <input
                          type="text"
                          value={localColumnFilters[column.field] || ''}
                          onChange={(e) => handleFilterChange(column.field, e.target.value)}
                          className="block w-full text-sm border border-gray-300 rounded-md p-1"
                          placeholder={`Filtrar ${column.header}`}
                        />
                        {localColumnFilters[column.field] && (
                          <button
                            className="absolute right-1 top-1/2 transform -translate-y-1/2"
                            onClick={() => clearFilter(column.field)}
                          >
                            <FiX className="text-gray-400 hover:text-gray-600" />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}
                {actions && (
                  <th 
                    key="actions" 
                    scope="col" 
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Acciones
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length + (actions ? 1 : 0)} className="px-6 py-4 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {visibleColumns.map((column, colIndex) => (
                      <td key={`${rowIndex}-${colIndex}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {column.body ? column.body(row) : getNestedValue(row, column.field) || 'N/A'}
                      </td>
                    ))}
                    {actions && (
                      <td key={`${rowIndex}-actions`} className="px-6 py-4 text-right">
                        {typeof actions === 'function' ? actions(row) : actions}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tabla versión móvil */
        <div className="rounded-lg shadow">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {emptyMessage}
            </div>
          ) : (
            data.map((row, rowIndex) => (
              <div key={rowIndex} className={`p-4 border-b ${rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                {visibleColumns.map((column, colIndex) => (
                  <div key={`${rowIndex}-${colIndex}`} className="mb-3">
                    <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                      {column.header}
                    </div>
                    <div className="text-sm text-gray-900">
                      {column.body ? column.body(row) : getNestedValue(row, column.field) || 'N/A'}
                    </div>
                  </div>
                ))}
                {actions && (
                  <div className="mt-3 flex justify-end">
                    {typeof actions === 'function' ? actions(row) : actions}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Table;

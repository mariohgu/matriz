import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  onItemsPerPageChange,
  totalRecords,
  totalItems,
  className = '',
  showItemsPerPage = true,
}) => {
  // Compatibilidad para usar cualquiera de los dos nombres de props
  const total = totalRecords || totalItems || 0;
  
  // No renderizar si no hay páginas o solo hay una
  if (totalPages <= 1) return null;

  // Determinar las páginas que se mostrarán
  const getPageNumbers = () => {
    const maxPagesToShow = 5;
    const pageNumbers = [];
    
    if (totalPages <= maxPagesToShow) {
      // Mostrar todas las páginas si hay menos que el máximo
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Lógica para mostrar un subconjunto de páginas
      // Siempre mostrar la primera y última página
      // Y algunas páginas alrededor de la página actual
      let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = startPage + maxPagesToShow - 1;
      
      if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      // Primera página
      pageNumbers.push(1);
      
      // Ellipsis después de la primera página si es necesario
      if (startPage > 2) {
        pageNumbers.push('...');
      }
      
      // Páginas intermedias
      for (let i = Math.max(2, startPage); i <= Math.min(totalPages - 1, endPage); i++) {
        pageNumbers.push(i);
      }
      
      // Ellipsis antes de la última página si es necesario
      if (endPage < totalPages - 1) {
        pageNumbers.push('...');
      }
      
      // Última página si no es la primera
      if (totalPages > 1) {
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Opciones para elementos por página
  const itemsPerPageOptions = [5, 10, 20, 50];

  return (
    <div className={`flex flex-col md:flex-row justify-between items-center mt-4 ${className}`}>
      {/* Información de elementos */}
      <div className="text-sm text-gray-600 mb-2 md:mb-0">
        Mostrando {Math.min((currentPage - 1) * itemsPerPage + 1, total)} a {Math.min(currentPage * itemsPerPage, total)} de {total} elementos
      </div>
      
      <div className="flex items-center">
        {/* Selector de elementos por página */}
        {showItemsPerPage && (
          <div className="mr-4 flex items-center">
            <label htmlFor="itemsPerPage" className="text-sm text-gray-600 mr-2">
              Por página:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded p-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {itemsPerPageOptions.map(option => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Botones de paginación */}
        <div className="flex">
          {/* Primera página */}
          <button
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center h-8 w-8 mx-1 rounded 
                      ${currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'}`}
            title="Primera página"
          >
            <FiChevronsLeft className="h-4 w-4" />
          </button>
          
          {/* Página anterior */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex items-center justify-center h-8 w-8 mx-1 rounded 
                      ${currentPage === 1 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'}`}
            title="Página anterior"
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          
          {/* Números de página */}
          {getPageNumbers().map((pageNumber, index) => (
            <button
              key={index}
              onClick={() => typeof pageNumber === 'number' && onPageChange(pageNumber)}
              className={`flex items-center justify-center h-8 w-8 mx-1 rounded 
                        ${pageNumber === currentPage 
                          ? 'bg-blue-600 text-white' 
                          : pageNumber === '...' 
                            ? 'text-gray-500 cursor-default' 
                            : 'text-gray-700 hover:bg-gray-200'}`}
              disabled={pageNumber === '...'}
            >
              {pageNumber}
            </button>
          ))}
          
          {/* Página siguiente */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center h-8 w-8 mx-1 rounded 
                      ${currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'}`}
            title="Página siguiente"
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
          
          {/* Última página */}
          <button
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={`flex items-center justify-center h-8 w-8 mx-1 rounded 
                      ${currentPage === totalPages 
                        ? 'text-gray-400 cursor-not-allowed' 
                        : 'text-gray-700 hover:bg-gray-200'}`}
            title="Última página"
          >
            <FiChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pagination;

import React, { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
import { createPortal } from 'react-dom';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnClickOutside = true,
  closeOnEsc = true,
}) => {
  const modalRef = useRef(null);

  // Determinar ancho del modal según el tamaño
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  // Efecto para manejar la tecla Escape
  useEffect(() => {
    const handleEscKey = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      // Evitar scroll en el body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      // Restaurar scroll cuando el modal se cierra
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Manejar clic fuera del modal
  const handleOutsideClick = (event) => {
    if (closeOnClickOutside && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Usar createPortal para renderizar el modal fuera de la jerarquía del DOM
  return createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0"
      style={{ marginLeft: 0 }} // Asegurar que no se tape con la barra lateral
      onClick={handleOutsideClick}
    >
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`${sizeClasses[size]} w-full bg-white rounded-lg shadow-xl transform transition-all 
                    overflow-hidden z-10 max-h-[90vh] flex flex-col`}
        aria-modal="true"
        role="dialog"
        aria-labelledby="modal-title"
      >
        {/* Encabezado */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-medium text-gray-900">
            {title}
          </h3>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
        
        {/* Contenido */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {children}
        </div>
        
        {/* Pie */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

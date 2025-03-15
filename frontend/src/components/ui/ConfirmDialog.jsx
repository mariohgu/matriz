import React from 'react';
import Modal from './Modal';
import { FiAlertTriangle } from 'react-icons/fi';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = '¿Confirmar acción?',
  message = '¿Está seguro que desea realizar esta acción?',
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'danger', // 'danger', 'warning', 'info'
  isLoading = false
}) => {
  // Definir clases según la variante
  const getVariantClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: 'text-red-500',
          button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
        };
      case 'warning':
        return {
          icon: 'text-yellow-500',
          button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
        };
      case 'info':
      default:
        return {
          icon: 'text-blue-500',
          button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
        };
    }
  };

  const variantClasses = getVariantClasses();

  const footer = (
    <div className="flex justify-end space-x-3">
      <button
        type="button"
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
        onClick={onClose}
        disabled={isLoading}
      >
        {cancelLabel}
      </button>
      <button
        type="button"
        className={`px-4 py-2 ${variantClasses.button} text-white rounded-md font-medium 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 flex items-center`}
        onClick={onConfirm}
        disabled={isLoading}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {confirmLabel}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      footer={footer}
      size="sm"
    >
      <div className="flex items-start">
        <div className={`mr-4 flex-shrink-0 ${variantClasses.icon}`}>
          <FiAlertTriangle className="h-6 w-6" />
        </div>
        <p className="text-gray-700">{message}</p>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;

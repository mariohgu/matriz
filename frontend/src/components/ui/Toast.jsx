import React, { useEffect, useState } from 'react';
import { FiX, FiAlertCircle, FiCheck, FiInfo, FiAlertTriangle } from 'react-icons/fi';

const Toast = ({ message, onClose, autoHideDuration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (message && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Esperar a que termine la animación
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [message, autoHideDuration, onClose]);

  if (!message) return null;

  const { severity = 'info', summary = '', detail = '' } = message;

  // Determinar el icono y los colores según la severidad
  const getSeverityStyles = () => {
    switch (severity) {
      case 'success':
        return {
          icon: <FiCheck className="h-5 w-5" />,
          containerClass: 'bg-green-100 border-l-4 border-green-500 text-green-700'
        };
      case 'error':
        return {
          icon: <FiAlertCircle className="h-5 w-5" />,
          containerClass: 'bg-red-100 border-l-4 border-red-500 text-red-700'
        };
      case 'warning':
        return {
          icon: <FiAlertTriangle className="h-5 w-5" />,
          containerClass: 'bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700'
        };
      case 'info':
      default:
        return {
          icon: <FiInfo className="h-5 w-5" />,
          containerClass: 'bg-blue-100 border-l-4 border-blue-500 text-blue-700'
        };
    }
  };

  const { icon, containerClass } = getSeverityStyles();

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      } ${containerClass}`}
      role="alert"
    >
      <div className="flex items-center">
        <div className="flex-shrink-0 mr-3">
          {icon}
        </div>
        <div className="flex-1">
          {summary && <div className="font-bold">{summary}</div>}
          {detail && <div className={summary ? 'mt-1' : ''}>{detail}</div>}
        </div>
        <div className="ml-4">
          <button
            type="button"
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 300);
            }}
            aria-label="Cerrar"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para gestionar múltiples toasts
export const ToastContainer = ({ toasts = [], removeToast }) => {
  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-4 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast}
            onClose={() => removeToast(toast.id)}
            autoHideDuration={toast.duration || 3000}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;

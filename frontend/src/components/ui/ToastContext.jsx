import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from './Toast';
import { v4 as uuidv4 } from 'uuid';

// Crear contexto para el sistema de notificaciones
const ToastContext = createContext(null);

// Hook personalizado para usar el contexto de toast
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast debe ser usado dentro de un ToastProvider');
  }
  return context;
};

// Proveedor del contexto toast
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Función para añadir un nuevo toast
  const addToast = useCallback((toast) => {
    const id = uuidv4();
    const newToast = {
      id,
      ...toast,
    };
    
    setToasts((prevToasts) => [...prevToasts, newToast]);
    
    return id;
  }, []);

  // Función para eliminar un toast por su ID
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Funciones helper para diferentes tipos de notificaciones
  const showSuccess = useCallback((summary, detail, duration = 3000) => {
    return addToast({
      severity: 'success',
      summary,
      detail,
      duration,
    });
  }, [addToast]);

  const showError = useCallback((summary, detail, duration = 4000) => {
    return addToast({
      severity: 'error',
      summary,
      detail,
      duration,
    });
  }, [addToast]);

  const showWarning = useCallback((summary, detail, duration = 4000) => {
    return addToast({
      severity: 'warning',
      summary,
      detail,
      duration,
    });
  }, [addToast]);

  const showInfo = useCallback((summary, detail, duration = 3000) => {
    return addToast({
      severity: 'info',
      summary,
      detail,
      duration,
    });
  }, [addToast]);

  // Valor del contexto con las funciones de toast
  const contextValue = {
    addToast,
    removeToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
};

export default ToastContext;

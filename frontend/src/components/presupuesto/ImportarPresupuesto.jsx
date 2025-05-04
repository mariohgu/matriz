import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { useToast } from '../ui/ToastContext';
import { apiService } from '../../services/authService';

/**
 * Componente para importar archivos de presupuesto completo
 */
const ImportarPresupuesto = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

  // Manejar selección de archivo por click
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    validateAndSetFile(selectedFile);
  };

  // Manejar drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  // Validar archivo y establecerlo
  const validateAndSetFile = (selectedFile) => {
    if (!selectedFile) return;

    // Validar tipo de archivo (solo Excel)
    const validTypes = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.showWarning('Formato incorrecto', 'Por favor, seleccione un archivo Excel (.xls o .xlsx)');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (selectedFile.size > maxSize) {
      toast.showWarning('Archivo demasiado grande', 'El tamaño máximo permitido es 10MB');
      return;
    }

    setFile(selectedFile);
  };

  // Abrir selector de archivo al hacer clic en el área de drop
  const onButtonClick = () => {
    fileInputRef.current.click();
  };

  // Eliminar archivo seleccionado
  const handleRemoveFile = () => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Enviar archivo al servidor
  const handleUpload = async () => {
    if (!file) {
      toast.showWarning('Archivo requerido', 'Por favor, seleccione un archivo Excel para importar');
      return;
    }

    const formData = new FormData();
    formData.append('archivo', file);

    setLoading(true);
    try {
      // Configuración específica para esta solicitud
      const requestOptions = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      };

      // La ruta correcta según el archivo routes/api.php
      const response = await apiService.uploadFile('presupuesto/importar', formData, requestOptions);
      toast.showSuccess('Éxito', 'Archivo importado correctamente');
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error('Error al importar archivo:', error);
      if (error.response && error.response.data && error.response.data.message) {
        toast.showError('Error', error.response.data.message);
      } else if (error.message && error.message.includes('Network Error')) {
        toast.showError('Error de conexión', 'No se pudo conectar con el servidor. Verifique su conexión o contacte al administrador.');
      } else {
        toast.showError('Error', 'No se pudo importar el archivo. Intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Importar Presupuesto Completo</h2>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-2">
          Cargue un archivo Excel con la información completa del presupuesto. 
          El sistema procesará la información y actualizará tanto el presupuesto como la ejecución mensual.
        </p>
        <p className="text-sm text-gray-500">
          Formatos permitidos: .xlsx, .xls | Tamaño máximo: 10MB
        </p>
      </div>
      
      {!file ? (
        // Área para arrastrar y soltar (drag and drop)
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={onButtonClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-600">
            Arrastre y suelte un archivo Excel aquí, o
            <span className="text-blue-600 font-medium"> haga clic para seleccionar un archivo</span>
          </p>
        </div>
      ) : (
        // Mostrar archivo seleccionado
        <div className="border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FiFile className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="text-gray-500 hover:text-red-500"
              disabled={loading}
            >
              <FiXCircle className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}
      
      {/* Botones de acción */}
      <div className="flex justify-end mt-6 space-x-3">
        <button
          type="button"
          onClick={() => setFile(null)}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          disabled={loading || !file}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={loading || !file}
          className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                    ${loading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
        >
          {loading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Importando...
            </span>
          ) : 'Importar archivo'}
        </button>
      </div>
    </div>
  );
};

export default ImportarPresupuesto; 
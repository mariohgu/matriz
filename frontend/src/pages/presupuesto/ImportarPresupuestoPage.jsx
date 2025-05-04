import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';
import ImportarPresupuesto from '../../components/presupuesto/ImportarPresupuesto';

const ImportarPresupuestoPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Importación de Presupuesto</h1>
          <p className="text-gray-600">
            Importe datos de presupuesto y ejecución desde archivos Excel
          </p>
        </div>
        <div className="flex items-center text-blue-600">
          <FiUploadCloud className="mr-2 h-5 w-5" />
          <span>Carga de Datos</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ImportarPresupuesto />
        
        {/* Instrucciones */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Instrucciones para la importación</h3>
          <ul className="list-disc pl-5 space-y-2 text-blue-700">
            <li>El archivo Excel debe tener el formato correcto con las columnas requeridas.</li>
            <li>La primera fila debe contener los encabezados de las columnas.</li>
            <li>Los datos existentes con el mismo ID serán actualizados automáticamente.</li>
            <li>El sistema procesará tanto los datos de presupuesto como la ejecución mensual.</li>
            <li>Se recomienda hacer una copia de seguridad antes de realizar la importación.</li>
            <li>El proceso puede tardar varios minutos dependiendo del tamaño del archivo.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportarPresupuestoPage; 
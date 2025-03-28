import React from 'react';

/**
 * Componente que muestra el detalle de una interacción, incluyendo la información
 * de la municipalidad, evento e interacciones relacionadas.
 */
const InteraccionDetails = ({ evento, municipalidad, contacto, estadosSeguimiento, estados }) => {
  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Obtener las interacciones relacionadas con este evento, ordenadas por fecha
  const interacciones = evento 
    ? estadosSeguimiento
        .filter(es => es.id_evento === evento.id_evento)
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0))
    : [];

  return (
    <div className="space-y-6">
      {/* Encabezado con datos de la Municipalidad */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Información de la Municipalidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Nombre</p>
            <p className="text-base font-semibold">{municipalidad ? municipalidad.nombre : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ubigeo</p>
            <p className="text-base">{municipalidad ? municipalidad.ubigeo : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Departamento</p>
            <p className="text-base">{municipalidad ? municipalidad.departamento : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Provincia</p>
            <p className="text-base">{municipalidad ? municipalidad.provincia : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Sección de datos del Evento */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Detalles del Evento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Tipo de Evento</p>
            <p className="text-base font-semibold">{evento ? (evento.tipo_evento || 'N/A') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Contacto</p>
            <p className="text-base">{contacto ? contacto.nombre_completo : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha</p>
            <p className="text-base">{evento ? formatDate(evento.fecha) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Modalidad</p>
            <p className="text-base">{evento ? (evento.modalidad || 'N/A') : 'N/A'}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Descripción</p>
            <p className="text-base whitespace-pre-wrap">{evento ? (evento.descripcion || 'Sin descripción') : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Tabla de interacciones */}
      <div>
        <h3 className="text-xl font-bold text-gray-800 mb-3">Historial de Interacciones</h3>
        
        {interacciones.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    N
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Compromiso
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compromiso
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interacciones.map((interaccion, index) => {
                  // Buscar el estado correspondiente
                  const estadoObj = estados.find(e => e.id_estado === interaccion.id_estado_ref);
                  const estadoNombre = estadoObj ? estadoObj.descripcion : (interaccion.estado_seguimiento || 'No especificado');
                  
                  return (
                    <tr key={interaccion.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(interaccion.fecha)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs break-words">
                        {interaccion.descripcion || 'Sin descripción'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(interaccion.fecha_compromiso)}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500 max-w-xs break-words">
                        {interaccion.compromiso || 'Sin compromiso'}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${estadoNombre === 'ESTADO 01' ? 'bg-green-100 text-green-800' :
                            estadoNombre === 'ESTADO 02' ? 'bg-yellow-100 text-yellow-800' :
                            estadoNombre === 'ESTADO 03' ? 'bg-blue-100 text-blue-800' :
                            estadoNombre === 'ESTADO 04' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {estadoNombre}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 p-4 text-center rounded">
            <p className="text-gray-500">No hay interacciones registradas para este evento</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InteraccionDetails;

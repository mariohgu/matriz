import React, { useState, useEffect } from 'react';
import { apiService } from '../../services/authService';

/**
 * Componente que muestra el detalle de una interacción, incluyendo la información
 * de la municipalidad, evento e interacciones relacionadas.
 * 
 * @param {object} props.evento - Datos del evento principal (opcional, si no se proporciona se cargará mediante id_evento)
 * @param {string} props.id_evento - ID del evento a mostrar (opcional si ya se proporciona evento)
 * @param {object} props.municipalidad - Datos de la municipalidad (opcional, se cargará automáticamente si no se proporciona)
 * @param {object} props.contacto - Datos del contacto (opcional, se cargará automáticamente si no se proporciona)
 * @param {array} props.estadosSeguimiento - Lista de interacciones (opcional, se cargarán automáticamente si no se proporciona)
 * @param {array} props.estados - Lista de estados (opcional, se cargarán automáticamente si no se proporciona)
 * @param {array} props.convenios - Lista de convenios (opcional, se cargarán automáticamente si no se proporciona)
 */
const InteraccionDetails = ({ 
  evento, 
  id_evento,
  municipalidad, 
  contacto, 
  estadosSeguimiento, 
  estados, 
  convenios 
}) => {
  // Estados para almacenar datos que podrían cargarse automáticamente
  const [eventoData, setEventoData] = useState(evento || null);
  const [municipalidadData, setMunicipalidadData] = useState(municipalidad || null);
  const [contactoData, setContactoData] = useState(contacto || null);
  const [estadosSeguimientoData, setEstadosSeguimientoData] = useState(estadosSeguimiento || []);
  const [estadosData, setEstadosData] = useState(estados || []);
  const [conveniosData, setConveniosData] = useState(convenios || []);
  const [loading, setLoading] = useState(!evento || !municipalidad);

  // Cargar datos de forma centralizada
  useEffect(() => {
    async function loadData() {
      // Solo cargamos los datos si no fueron proporcionados
      if (!evento && id_evento) {
        try {
          setLoading(true);
          
          // Cargar el evento si no fue proporcionado pero tenemos su ID
          try {
            const eventoResult = await apiService.getById('eventos', id_evento);
            if (eventoResult) {
              setEventoData(eventoResult);
              
              // Si no tenemos municipalidad pero el evento tiene id_municipalidad
              if (!municipalidad && eventoResult?.id_municipalidad) {
                try {
                  const municipalidadResult = await apiService.getById('municipalidades', eventoResult.id_municipalidad);
                  if (municipalidadResult) {
                    setMunicipalidadData(municipalidadResult);
                  }
                } catch (err) {
                  console.warn('No se pudo cargar la municipalidad:', eventoResult.id_municipalidad);
                }
              }
              
              // Si no tenemos contacto pero el evento tiene id_contacto
              if (!contacto && eventoResult?.id_contacto) {
                try {
                  const contactoResult = await apiService.getById('contactos', eventoResult.id_contacto);
                  if (contactoResult) {
                    setContactoData(contactoResult);
                  }
                } catch (err) {
                  console.warn('No se pudo cargar el contacto:', eventoResult.id_contacto);
                }
              }
            }
          } catch (err) {
            console.warn('No se pudo cargar el evento:', id_evento);
          }
          
          // Si no tenemos interacciones, las cargamos por id_evento
          if (!estadosSeguimiento) {
            try {
              const allInteracciones = await apiService.getAll('estados-seguimiento');
              if (Array.isArray(allInteracciones)) {
                const filteredInteracciones = allInteracciones.filter(es => es.id_evento === id_evento);
                setEstadosSeguimientoData(filteredInteracciones);
              }
            } catch (err) {
              console.warn('No se pudieron cargar los estados de seguimiento');
              setEstadosSeguimientoData([]);
            }
          }
          
          // Si no tenemos estados, los cargamos
          if (!estados) {
            try {
              const estadosResult = await apiService.getAll('estados');
              if (Array.isArray(estadosResult)) {
                setEstadosData(estadosResult);
              }
            } catch (err) {
              console.warn('No se pudieron cargar los estados');
              setEstadosData([]);
            }
          }
          
          // Si no tenemos convenios, los cargamos
          if (!convenios) {
            try {
              const conveniosResult = await apiService.getAll('convenios');
              if (Array.isArray(conveniosResult)) {
                setConveniosData(conveniosResult);
              }
            } catch (err) {
              console.warn('No se pudieron cargar los convenios');
              setConveniosData([]);
            }
          }
        } catch (error) {
          console.error('Error general al cargar datos para InteraccionDetails:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }
    
    // Solo ejecutamos la carga si falta algún dato esencial
    if (!evento || !municipalidad || !estadosSeguimiento || !estados || !convenios) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [evento, id_evento, municipalidad, contacto, estadosSeguimiento, estados, convenios]);

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
  
  // Formatear moneda para los convenios
  const formatCurrency = (val) => {
    if (!val) return 'N/A';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(val);
  };

  // Usar los datos cargados o proporcionados
  const eventoActual = eventoData || evento;
  const municipalidadActual = municipalidadData || municipalidad;
  const contactoActual = contactoData || contacto;
  const estadosSeguimientoActuales = estadosSeguimientoData.length > 0 ? estadosSeguimientoData : (estadosSeguimiento || []);
  const estadosActuales = estadosData.length > 0 ? estadosData : (estados || []);
  const conveniosActuales = conveniosData.length > 0 ? conveniosData : (convenios || []);

  // Obtener las interacciones relacionadas con este evento, ordenadas por fecha
  const interacciones = eventoActual 
    ? estadosSeguimientoActuales
        .filter(es => es.id_evento === eventoActual.id_evento)
        .sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0))
    : [];
  
  // Obtener los convenios firmados para esta municipalidad
  const conveniosFirmados = municipalidadActual && municipalidadActual.id_municipalidad
    ? conveniosActuales.filter(c => 
        c.id_municipalidad === municipalidadActual.id_municipalidad && 
        c.estado === 'Firmado')
    : [];

  // Función para calcular interacciones previas a la firma del convenio
  const getInteraccionesPrevias = (fechaFirma) => {
    if (!fechaFirma || !interacciones.length) return 0;
    
    const fechaConvenio = new Date(fechaFirma);
    return interacciones.filter(i => 
      i.fecha && new Date(i.fecha) < fechaConvenio
    ).length;
  };

  // Si estamos cargando datos, mostrar indicador
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">Cargando datos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado con datos de la Municipalidad */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Información de la Entidad</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Nombre</p>
            <p className="text-base font-semibold">{municipalidadActual ? municipalidadActual.nombre : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ubigeo</p>
            <p className="text-base">{municipalidadActual ? municipalidadActual.ubigeo : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Departamento</p>
            <p className="text-base">{municipalidadActual ? municipalidadActual.departamento : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Provincia</p>
            <p className="text-base">{municipalidadActual ? municipalidadActual.provincia : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Sección de datos del Evento */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-xl font-bold text-gray-800 mb-2">Detalles del Primer Acercamiento</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Tipo de Acercamiento</p>
            <p className="text-base font-semibold">{eventoActual ? (eventoActual.tipo_acercamiento || 'N/A') : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Contacto</p>
            <p className="text-base">{contactoActual ? contactoActual.nombre_completo : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Fecha</p>
            <p className="text-base">{eventoActual ? formatDate(eventoActual.fecha) : 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Modalidad</p>
            <p className="text-base">{eventoActual ? (eventoActual.modalidad || 'N/A') : 'N/A'}</p>
          </div>
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-gray-500">Descripción</p>
            <p className="text-base whitespace-pre-wrap">{eventoActual ? (eventoActual.descripcion || 'Sin descripción') : 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Sección de Convenios Firmados */}
      {conveniosFirmados.length > 0 && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-2">Convenios Firmados</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo de Convenio
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Firma
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conveniosFirmados.map((convenio, index) => {
                  const interaccionesPrevias = getInteraccionesPrevias(convenio.fecha_firma);
                  
                  return (
                    <React.Fragment key={convenio.id_convenio || index}>
                      {/* Fila con subtítulo que indica cuántas interacciones hubo antes de la firma */}
                      <tr className="bg-gray-50">
                        <td colSpan="4" className="px-3 py-2 text-sm text-gray-700 italic">
                          Convenio firmado el {formatDate(convenio.fecha_firma)} después de 
                          {interaccionesPrevias === 0 
                            ? ' la primera interacción' 
                            : ` ${interaccionesPrevias} interacción${interaccionesPrevias !== 1 ? 'es' : ''}`}
                        </td>
                      </tr>
                      {/* Fila con datos del convenio */}
                      <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-4 text-sm text-gray-900">
                          {convenio.tipo_convenio || 'N/A'}
                        </td>
                        <td className="hidden md:table-cell px-3 py-4 text-sm text-gray-500">
                          {formatCurrency(convenio.monto)}
                        </td>
                        <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(convenio.fecha_firma)}
                        </td>
                        <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {convenio.estado || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      {/* Fila para descripción del convenio */}
                      <tr className="bg-white">
                        <td colSpan="4" className="px-3 py-3 text-sm">
                          <p className="text-xs font-medium text-gray-500 mb-1">Descripción:</p>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {convenio.descripcion || 'Sin descripción'}
                          </p>
                        </td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Compromiso
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Compromiso
                  </th>
                  <th scope="col" className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Compromiso
                  </th>
                  <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {interacciones.map((interaccion, index) => {
                  // Buscar el estado correspondiente
                  const estadoObj = estadosActuales.find(e => e.id_estado === interaccion.id_estado_ref);
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
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(interaccion.fecha_compromiso)}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 text-sm text-gray-500 max-w-xs break-words">
                        {interaccion.compromiso || 'Sin compromiso'}
                      </td>
                      <td className="hidden md:table-cell px-3 py-4 whitespace-nowrap text-sm text-center">
                        {interaccion.compromiso_concluido === true ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Concluido
                          </span>
                        ) : interaccion.compromiso_concluido === false ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Pendiente
                          </span>
                        ) : interaccion.compromiso ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            No especificado
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
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
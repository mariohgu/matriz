import React, { useState, useEffect } from 'react';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { apiService, api } from '../services/authService';
import { FiCheck, FiX, FiCalendar, FiEye } from 'react-icons/fi';
import { Modal } from '../components/ui';
import InteraccionDetails from '../components/ui/InteraccionDetails';
import SweetAlert from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(SweetAlert);

const CalendarioCompromisos = () => {
  // Estados
  const [date, setDate] = useState(new Date());
  const [compromisos, setCompromisos] = useState([]);
  const [comprimisosDelDia, setCompromisosDelDia] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCompromisos, setShowCompromisos] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estados, setEstados] = useState([]);

  // Obtener compromisos al cargar el componente
  useEffect(() => {
    fetchCompromisos();
  }, []);

  // Función para obtener compromisos
  const fetchCompromisos = async () => {
    setIsLoading(true);
    try {
      // Obtener todos los datos necesarios en paralelo
      const [
        estadosSeguimientoData, 
        eventosData, 
        contactosData,
        estadosData
      ] = await Promise.all([
        apiService.getAll('estados-seguimiento'),
        apiService.getAll('eventos'),
        apiService.getAll('contactos'),
        apiService.getAll('estados')
      ]);
      
      // Guardar los datos completos para usar con InteraccionDetails
      setEventos(eventosData || []);
      setContactos(contactosData || []);
      setEstados(estadosData || []);
      
      // Filtrar solo los que tienen fecha_compromiso y compromiso
      const compromisosConFecha = (estadosSeguimientoData || []).filter(
        (item) => item.fecha_compromiso && item.compromiso
      );
      
      // Enriquecer los compromisos con datos del evento y municipalidad
      const compromisosEnriquecidos = compromisosConFecha.map(compromiso => {
        const eventoRelacionado = eventosData?.find(evento => 
          evento.id_evento === compromiso.id_evento
        );
        // Añadir también el estado
        const estadoRelacionado = estadosData?.find(estado => 
          estado.id_estado === compromiso.id_estado_ref
        );
        return {
          ...compromiso,
          evento: eventoRelacionado || {},
          estado_desc: estadoRelacionado?.descripcion || 'N/A'
        };
      });
      
      setCompromisos(compromisosEnriquecidos);
    } catch (error) {
      console.error('Error al obtener compromisos:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los compromisos',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para visualizar los detalles de la interacción
  const handleViewState = async (compromiso) => {
    if (!compromiso || !compromiso.id_evento) return;
    
    try {
      setIsLoading(true);
      
      // Obtener los detalles del evento si es necesario
      let evento = compromiso.evento;
      if (!evento || !evento.id_evento) {
        const response = await api.get(`eventos/${compromiso.id_evento}`);
        evento = response.data;
      }
      
      if (!evento) {
        console.error('No se encontró el evento');
        return;
      }
      
      // Buscar la municipalidad asociada al evento
      const municipalidad = evento.municipalidad || null;
      
      // Buscar el contacto asociado
      const contacto = contactos.find(c => c.id_contacto === compromiso.id_contacto) || null;
      
      // Guardar los datos seleccionados
      setSelectedInteraction({
        ...compromiso,
        evento,
        municipalidad,
        contacto
      });
      
      // Mostrar el modal
      setViewDialogVisible(true);
    } catch (error) {
      console.error('Error al obtener detalles de la interacción:', error);
      MySwal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los detalles de la interacción',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Verificar si una fecha tiene compromisos
  const fechaTieneCompromisos = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return compromisos.some(
      (compromiso) =>
        new Date(compromiso.fecha_compromiso).toISOString().split('T')[0] === formattedDate
    );
  };

  // Formatear fecha para mostrar
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  // Obtener los compromisos para un día específico
  const obtenerCompromisosDelDia = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    return compromisos.filter(
      (compromiso) =>
        new Date(compromiso.fecha_compromiso).toISOString().split('T')[0] === formattedDate
    );
  };

  // Manejar clic en una fecha del calendario
  const handleDateClick = (value) => {
    setDate(value);
    const compromisosDelDia = obtenerCompromisosDelDia(value);
    setCompromisosDelDia(compromisosDelDia);
    setShowCompromisos(true);
  };

  // Marcar un compromiso como concluido
  const marcarComoConcluido = async (id, esConcluido) => {
    // Mostrar SweetAlert de confirmación
    const result = await MySwal.fire({
      title: esConcluido ? '¿Marcar como concluido?' : '¿Cambiar estado del compromiso?',
      text: esConcluido 
        ? '¿Estás seguro de que deseas marcar este compromiso como concluido?' 
        : '¿Estás seguro de que deseas cambiar el estado de este compromiso?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, confirmar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      setIsLoading(true);
      try {
        // Buscar el compromiso completo
        const compromiso = compromisos.find(c => c.id_estado === id);
        
        if (!compromiso) {
          throw new Error('Compromiso no encontrado');
        }

        // Preparar datos para actualizar
        const datosActualizados = {
          ...compromiso,
          compromiso_concluido: esConcluido
        };

        // Actualizar en la API
        await apiService.update('estados-seguimiento', id, datosActualizados);
        
        // Actualizar estado local
        const compromisosActualizados = compromisos.map(c => {
          if (c.id_estado === id) {
            return { ...c, compromiso_concluido: esConcluido };
          }
          return c;
        });
        
        setCompromisos(compromisosActualizados);
        
        // Actualizar los compromisos del día
        const nuevosCompromisosDelDia = comprimisosDelDia.map(c => {
          if (c.id_estado === id) {
            return { ...c, compromiso_concluido: esConcluido };
          }
          return c;
        });
        
        setCompromisosDelDia(nuevosCompromisosDelDia);
        
        MySwal.fire({
          title: '¡Actualizado!',
          text: 'El estado del compromiso ha sido actualizado.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        console.error('Error al actualizar compromiso:', error);
        MySwal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudo actualizar el estado del compromiso',
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Renderizado condicional de eventos en el calendario
  const tileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    
    const formattedDate = date.toISOString().split('T')[0];
    const compromisosDelDia = compromisos.filter(
      (compromiso) =>
        new Date(compromiso.fecha_compromiso).toISOString().split('T')[0] === formattedDate
    );
    
    if (compromisosDelDia.length === 0) return null;
    
    return (
      <div className="flex flex-col items-center mt-1">
        <div className="h-1.5 w-1.5 bg-blue-500 rounded-full"></div>
        <span className="text-xs font-medium text-blue-700 mt-0.5">
          {compromisosDelDia.length}
        </span>
      </div>
    );
  };

  // Función para personalizar la clase de los días
  const tileClassName = ({ date, view }) => {
    if (view !== 'month') return '';
    
    const hasCompromisos = fechaTieneCompromisos(date);
    return hasCompromisos ? 'has-compromisos' : '';
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center">
          <FiCalendar className="mr-2" /> Calendario de Compromisos
        </h1>
        <p className="text-gray-600 mt-1">
          Visualiza y gestiona tus compromisos con municipalidades
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Columna del calendario - ocupa 4 de 12 columnas en pantallas grandes */}
        <div className="lg:col-span-4">
          <div className="calendario-wrapper">
            <Calendar
              onChange={handleDateClick}
              value={date}
              locale="es-ES"
              tileContent={tileContent}
              tileClassName={tileClassName}
              prevLabel="← Anterior"
              nextLabel="Siguiente →"
              prev2Label={null}
              next2Label={null}
              navigationLabel={({ date }) => {
                return `${date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}`;
              }}
              className="rounded-lg border border-gray-300 shadow-sm w-full"
            />
          </div>
        </div>

        {/* Columna de compromisos del día - ocupa 8 de 12 columnas en pantallas grandes */}
        <div className="lg:col-span-8">
          <div className="bg-gray-50 p-4 rounded-lg h-full">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {showCompromisos ? (
                <>Compromisos del {formatDate(date)}</>
              ) : (
                <>Selecciona una fecha</>
              )}
            </h2>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                {showCompromisos && (
                  <>
                    {comprimisosDelDia.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        <p>No hay compromisos para esta fecha</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Municipalidad
                              </th>
                              <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Compromiso
                              </th>
                              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Estado
                              </th>
                              <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {comprimisosDelDia.map((compromiso) => (
                              <tr key={compromiso.id_estado} className="hover:bg-gray-50">
                                <td className="px-3 py-3 text-sm text-gray-800">
                                  {compromiso.evento?.municipalidad?.nombre || 'Sin municipalidad'}
                                </td>
                                <td className="px-3 py-3 text-sm text-gray-800 max-w-xs break-words">
                                  {compromiso.compromiso || 'Sin detalle'}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <div className="flex flex-col items-center justify-center">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={compromiso.compromiso_concluido === true}
                                        onChange={() => marcarComoConcluido(
                                          compromiso.id_estado,
                                          !compromiso.compromiso_concluido
                                        )}
                                        className="sr-only peer"
                                      />
                                      <div 
                                        className={`w-11 h-6 rounded-full peer 
                                          ${compromiso.compromiso_concluido ? 'bg-green-500' : 'bg-gray-300'} 
                                          after:content-[''] after:absolute after:top-[2px] 
                                          after:left-[2px] after:bg-white after:border-gray-300 
                                          after:border after:rounded-full after:h-5 after:w-5 
                                          after:transition-all 
                                          ${compromiso.compromiso_concluido ? 'after:translate-x-5' : 'after:translate-x-0'}
                                        `}
                                      ></div>
                                    </label>
                                    <span className="text-xs mt-1">
                                      {compromiso.compromiso_concluido ? (
                                        <span className="text-green-600 font-semibold">Concluido</span>
                                      ) : (
                                        <span className="text-yellow-600 font-semibold">Pendiente</span>
                                      )}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <button
                                    onClick={() => handleViewState(compromiso)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center mx-auto"
                                    title="Ver historial completo"
                                  >
                                    <FiEye className="mr-1" /> Ver
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estilos personalizados para el calendario */}
      <style jsx>{`
        /* Estilos para el componente de calendario */
        :global(.react-calendar) {
          width: 100%;
          border: none;
          font-family: inherit;
        }
        
        :global(.react-calendar__navigation) {
          margin-bottom: 10px;
        }
        
        :global(.react-calendar__navigation button) {
          min-width: 44px;
          background: none;
          font-size: 1rem;
          color: #374151;
        }
        
        :global(.react-calendar__month-view__weekdays) {
          text-transform: uppercase;
          font-weight: bold;
          font-size: 0.8rem;
        }
        
        :global(.react-calendar__tile) {
          padding: 0.75em 0.5em;
          border-radius: 0.25rem;
        }
        
        :global(.react-calendar__tile--now) {
          background: #ebf8ff;
        }
        
        :global(.react-calendar__tile--active) {
          background: #3182ce;
          color: white;
        }
        
        :global(.react-calendar__tile--hasActive) {
          background: #3182ce;
          color: white;
        }
        
        :global(.has-compromisos) {
          font-weight: bold;
          color: #2563eb;
          background-color: #dbeafe;
        }
        
        :global(.react-calendar__tile:hover) {
          background-color: #e5e7eb;
        }
        
        .calendario-wrapper {
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
          border-radius: 0.5rem;
          overflow: hidden;
        }
      `}</style>
      
      {/* Modal para ver detalles de la interacción */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Interacción"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedInteraction && (
          <InteraccionDetails 
            evento={selectedInteraction.evento || {}}
            municipalidad={selectedInteraction.evento?.municipalidad || {}}
            contacto={selectedInteraction.contacto || {}}
            estadosSeguimiento={compromisos.filter(es => 
              es.id_evento === selectedInteraction.id_evento
            )}
            estados={estados}
          />
        )}
      </Modal>
    </div>
  );
};

export default CalendarioCompromisos;

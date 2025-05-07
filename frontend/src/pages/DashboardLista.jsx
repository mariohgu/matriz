import React, { useEffect, useState, useMemo } from 'react';
import { apiService } from '../services/authService';
import { FiChevronDown, FiChevronUp, FiSearch, FiRefreshCw, FiFilter, FiEye, FiChevronLeft, FiChevronRight, FiPrinter } from 'react-icons/fi';
import { PiFilePdfLight } from "react-icons/pi";
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Modal } from '../components/ui';
import InteraccionDetails from '../components/ui/InteraccionDetails';
import ExcelExport from '../components/ui/ExcelExport';
import { generateInteraccionesPDF } from '../utils/printUtils';

const DashboardLista = () => {
  // Estados para datos
  const [departamentos, setDepartamentos] = useState([]);
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [selectedProvincia, setSelectedProvincia] = useState('');
  const [municipalidades, setMunicipalidades] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [estados, setEstados] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // Estados para UI
  const [expandedRows, setExpandedRows] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [viewEventoDialogVisible, setViewEventoDialogVisible] = useState(false);
  const [selectedInteraccionId, setSelectedInteraccionId] = useState(null);
  const [selectedEventoId, setSelectedEventoId] = useState(null);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Cargar datos al inicio
  useEffect(() => {
    loadData();
    
    // Detectar cambios de tamaño de pantalla
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Función para cargar datos
  const loadData = async () => {
    try {
      setLoading(true);
      const [munis, eventosData, estadosData, tiposReunion, conveniosData] = await Promise.all([
        apiService.getAll('municipalidades'),
        apiService.getAll('eventos'),
        apiService.getAll('estados-seguimiento'),
        apiService.getAll('tipos-reunion'),
        apiService.getAll('convenios'),
      ]);
      
      // Procesar tipos de reunión para usarlos en el mapeo
      const tiposMap = {};
      (tiposReunion || []).forEach(tipo => {
        tiposMap[tipo.id_tipo_reunion] = tipo.descripcion;
      });
      
      // Asignar tipos de reunión a los estados de seguimiento
      const estadosConTipos = (estadosData || []).map(estado => ({
        ...estado,
        id_tipo_reunion_nombre: tiposMap[estado.id_tipo_reunion] || 'Sin tipo asignado'
      }));
      
      setMunicipalidades(munis || []);
      setEventos(eventosData || []);
      setEstadosSeguimiento(estadosConTipos || []);
      setEstados(tiposReunion || []);
      setConvenios(conveniosData || []);
      
      // Extraer lista de departamentos únicos
      setDepartamentos(Array.from(new Set((munis || []).map(m => m.departamento).filter(Boolean))).sort());
      
      const now = new Date();
      setLastUpdateDate(now);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Convertir estados_seguimiento para que tengan id_municipalidad
  const estadosSeguimientoConMuni = useMemo(() => {
    return estadosSeguimiento.map(es => {
      const evento = eventos.find(ev => ev.id_evento === es.id_evento);
      return evento
        ? { ...es, id_municipalidad: evento.id_municipalidad }
        : null;
    }).filter(Boolean);
  }, [estadosSeguimiento, eventos]);

  // Agrupar interacciones por municipalidad
  const entidadesConInteracciones = useMemo(() => {
    if (loading) return [];
    
    // Filtrar municipalidades por departamento seleccionado
    let filteredMunis = selectedDepartamento
      ? municipalidades.filter(m => m.departamento === selectedDepartamento)
      : municipalidades;
    
    // Filtrar por provincia si está seleccionada
    if (selectedProvincia) {
      filteredMunis = filteredMunis.filter(m => m.provincia === selectedProvincia);
    }
    
    // Aplicar filtro de búsqueda general
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredMunis = filteredMunis.filter(m => 
        m.nombre?.toLowerCase().includes(query) ||
        m.provincia?.toLowerCase().includes(query) ||
        m.distrito?.toLowerCase().includes(query) ||
        m.departamento?.toLowerCase().includes(query)
      );
    }
    
    return filteredMunis.map(muni => {
      // Buscar todas las interacciones de la municipalidad
      const eventosMuni = eventos.filter(e => e.id_municipalidad === muni.id_municipalidad);
      const estadosMuni = estadosSeguimientoConMuni.filter(es => es.id_municipalidad === muni.id_municipalidad);
      const conveniosMuni = convenios.filter(c => c.id_municipalidad === muni.id_municipalidad);
      
      // Filtrar interacciones por rango de fechas
      const eventosFiltrados = eventosMuni.filter(e => {
        if (!fechaInicio && !fechaFin) return true;
        const fechaEvento = new Date(e.fecha);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date(0);
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaEvento >= inicio && fechaEvento <= fin;
      });

      const estadosFiltrados = estadosMuni.filter(e => {
        if (!fechaInicio && !fechaFin) return true;
        const fechaEstado = new Date(e.fecha);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date(0);
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaEstado >= inicio && fechaEstado <= fin;
      });

      const conveniosFiltrados = conveniosMuni.filter(c => {
        if (!fechaInicio && !fechaFin) return true;
        const fechaConvenio = new Date(c.fecha_firma);
        const inicio = fechaInicio ? new Date(fechaInicio) : new Date(0);
        const fin = fechaFin ? new Date(fechaFin) : new Date();
        return fechaConvenio >= inicio && fechaConvenio <= fin;
      });
      
      const total = eventosFiltrados.length + estadosFiltrados.length + conveniosFiltrados.length;
      
      // Solo incluir si tiene al menos una interacción
      if (total === 0) return null;
      
      // Unificar todas las interacciones y agregar tipo
      const interacciones = [
        ...eventosFiltrados.map(ev => ({
          ...ev,
          tipo: 'Evento',
          fecha: ev.fecha,
          tipoDetalle: ev.tipo_acercamiento || 'Evento',
          isEvento: true
        })),
        ...estadosFiltrados.map(es => ({
          ...es,
          tipo: 'Seguimiento',
          fecha: es.fecha,
          tipoDetalle: es.id_tipo_reunion_nombre || 'Sin tipo asignado',
          isEstado: true
        })),
        ...conveniosFiltrados.map(cv => ({
          ...cv,
          tipo: 'Convenio',
          fecha: cv.fecha_firma,
          tipoDetalle: 'Convenio',
          isConvenio: true
        })),
      ].sort((a, b) => new Date(a.fecha || 0) - new Date(b.fecha || 0));
      
      return {
        id: muni.id_municipalidad,
        nombre: muni.nombre,
        provincia: muni.provincia,
        distrito: muni.distrito,
        departamento: muni.departamento,
        total,
        interacciones,
        // Extraer la última interacción para mostrarla en la fila principal
        ultimaInteraccion: interacciones.length > 0 ? interacciones[0] : null
      };
    }).filter(Boolean).sort((a, b) => b.total - a.total);
  }, [municipalidades, eventos, estadosSeguimientoConMuni, convenios, selectedDepartamento, selectedProvincia, searchQuery, loading, fechaInicio, fechaFin]);

  // Calcular entidades paginadas
  const paginatedEntidades = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return entidadesConInteracciones.slice(startIndex, endIndex);
  }, [entidadesConInteracciones, currentPage, itemsPerPage]);

  // Calcular número total de páginas
  const totalPages = useMemo(() => {
    return Math.ceil(entidadesConInteracciones.length / itemsPerPage);
  }, [entidadesConInteracciones.length, itemsPerPage]);

  // Cambiar de página
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Cerrar todas las filas expandidas al cambiar de página
      setExpandedRows({});
    }
  };

  // Manejar clic en botón de expandir/colapsar
  const toggleExpand = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Manejar clic para ver detalles de un evento o interacción
  const handleVerEvento = (interaccion) => {
    if (interaccion && interaccion.id_evento) {
      // Si la interacción es un evento, usar su ID directamente
      setSelectedEventoId(interaccion.id_evento);
      setViewEventoDialogVisible(true);
    } else if (interaccion && interaccion.isEstado && interaccion.id_evento) {
      // Si es un estado de seguimiento, usar el ID del evento asociado
      setSelectedEventoId(interaccion.id_evento);
      setViewEventoDialogVisible(true);
    }
  };

  // Formatear fecha en formato dd/mm/aaaa
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    
    // Formatear como dd/mm/aaaa
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  // Componente de paginación
  const Pagination = () => {
    if (totalPages <= 1) return null;

    // Determinar qué páginas mostrar (mostrar máximo 5 números de página)
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }
    
    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
        <div className="flex items-center">
          <p className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{paginatedEntidades.length}</span> de{' '}
            <span className="font-medium">{entidadesConInteracciones.length}</span> entidades
          </p>
        </div>
        
        <div className="flex justify-end">
          <nav className="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
            >
              <span className="sr-only">Anterior</span>
              <FiChevronLeft className="h-5 w-5" />
            </button>
            
            {pageNumbers.map(page => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                  currentPage === page 
                    ? 'bg-blue-50 border-blue-500 text-blue-600 z-10' 
                    : 'bg-white text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-50 cursor-pointer'}`}
            >
              <span className="sr-only">Siguiente</span>
              <FiChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    );
  };

  // Encontrar el número máximo de interacciones
  const maxInteracciones = useMemo(() => {
    return Math.max(...entidadesConInteracciones.map(entidad => entidad.interacciones.length));
  }, [entidadesConInteracciones]);

  // Definir columnas para exportación a Excel
  const excelColumns = useMemo(() => {
    // Columnas base
    const baseColumns = [
      { header: 'Entidad', field: 'nombre' },
      { header: 'Departamento', field: 'departamento' },
      { header: 'Provincia', field: 'provincia' },
      { header: 'Total Interacciones', field: 'total' }
    ];

    // Generar columnas dinámicamente para cada interacción
    const interactionColumns = Array.from({ length: maxInteracciones }, (_, index) => [
      { 
        header: `${index + 1} Interaccion Fecha`, 
        body: (row) => row.interacciones[index] ? formatDate(row.interacciones[index].fecha) : '' 
      },
      { 
        header: `${index + 1} Interaccion Tipo`, 
        body: (row) => row.interacciones[index] ? row.interacciones[index].tipoDetalle : '' 
      }
    ]).flat();

    return [...baseColumns, ...interactionColumns];
  }, [maxInteracciones, entidadesConInteracciones]);

  // Obtener provincias del departamento seleccionado
  const provinciasDelDepartamento = useMemo(() => {
    if (!selectedDepartamento) return [];
    return Array.from(new Set(
      municipalidades
        .filter(m => m.departamento === selectedDepartamento && m.provincia)
        .map(m => m.provincia)
    )).sort();
  }, [selectedDepartamento, municipalidades]);

  // Función para manejar la impresión del PDF
  const handlePrintInteracciones = async () => {
    generateInteraccionesPDF({
      municipalidades,
      eventos,
      estadosSeguimiento,
      contactos: [], // Asumiendo que no necesitamos contactos para este reporte
      estados,
      selectedDepartamento,
      onComplete: () => {
        console.log('PDF generado correctamente');
      }
    });
  };

  // Calcular estadísticas filtradas
  const estadisticas = useMemo(() => {
    let totalEventos = 0;
    let totalEstados = 0;
    let totalConvenios = 0;
    let municipiosConSeguimiento = 0;

    entidadesConInteracciones.forEach(entidad => {
      let tieneSeguimiento = false;
      entidad.interacciones.forEach(interaccion => {
        if (interaccion.isEvento) totalEventos++;
        if (interaccion.isEstado) {
          totalEstados++;
          tieneSeguimiento = true;
        }
        if (interaccion.isConvenio) totalConvenios++;
      });
      if (tieneSeguimiento) municipiosConSeguimiento++;
    });

    return {
      totalEntidades: entidadesConInteracciones.length,
      totalEventos,
      totalEstados: municipiosConSeguimiento,
      totalConvenios,
      totalSeguimientos: totalEstados
    };
  }, [entidadesConInteracciones]);

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
      {/* Cabecera y controles */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h1 className="text-xl md:text-2xl font-bold">Dashboard Lista de Entidades</h1>
          
          <div className="flex items-center gap-2">
            <span className="text-sm bg-blue-100 text-blue-800 py-1 px-3 rounded-full">
              {entidadesConInteracciones.length} entidades
            </span>

            <button
              onClick={loadData}
              className="flex items-center gap-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-3 rounded transition-colors"
              title="Actualizar datos"
            >
              <FiRefreshCw className="h-4 w-4" />
              <span className="hidden md:inline">Actualizar</span>
            </button>

            <button
              onClick={handlePrintInteracciones}
              className="flex items-center gap-1 text-sm bg-red-600 hover:bg-red-700 text-white py-1 px-3 rounded transition-colors"
            >
              <PiFilePdfLight className="h-4 w-4" />
              <span className="hidden md:inline">Imprimir PDF</span>
            </button>

            <ExcelExport 
              data={entidadesConInteracciones}
              columns={excelColumns}
              filename="entidades_e_interacciones.xlsx"
              buttonText="Exportar Excel"
              buttonClass="flex items-center gap-1 text-sm bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded transition-colors"
            />
          </div>
        </div>

        {/* Cards de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Entidades</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalEntidades}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <FiEye className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Primer Acercamiento</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalEventos}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <FiEye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Seguimientos</p>
                <p className="text-2xl font-bold text-gray-900">
                  {estadisticas.totalEstados}/{estadisticas.totalSeguimientos}
                </p>
                <p className="text-xs text-gray-500 mt-1">Municipalidades con al menos un seguimiento / Total de seguimientos</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-full">
                <FiEye className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Convenios</p>
                <p className="text-2xl font-bold text-gray-900">{estadisticas.totalConvenios}</p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <FiEye className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
         
        <div className="flex flex-col md:flex-row gap-3 md:items-center mb-4">
          {/* Filtro por departamento */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={selectedDepartamento}
              onChange={e => {
                setSelectedDepartamento(e.target.value);
                setSelectedProvincia(''); // Resetear provincia al cambiar departamento
              }}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            >
              <option value="">Todos los departamentos</option>
              {departamentos.map(dep => (
                <option key={dep} value={dep}>{dep}</option>
              ))}
            </select>
          </div>

          {/* Filtro por provincia */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <select
              value={selectedProvincia}
              onChange={e => setSelectedProvincia(e.target.value)}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              disabled={!selectedDepartamento}
            >
              <option value="">Todas las provincias</option>
              {provinciasDelDepartamento.map(prov => (
                <option key={prov} value={prov}>{prov}</option>
              ))}
            </select>
          </div>

          {/* Filtro por fechas */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-500" />
            <input
              type="date"
              value={fechaInicio}
              onChange={e => setFechaInicio(e.target.value)}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Fecha inicio"
            />
            <span className="text-gray-500">a</span>
            <input
              type="date"
              value={fechaFin}
              onChange={e => setFechaFin(e.target.value)}
              className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
              placeholder="Fecha fin"
            />
          </div>
          
          {/* Búsqueda general */}
          <div className="flex items-center gap-2 md:ml-auto">
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar entidad..."
                className="border rounded pl-8 pr-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
         
        {lastUpdateDate && (
          <div className="text-xs text-gray-500 mt-2">
            Última actualización: {new Date(lastUpdateDate).toLocaleString()}
          </div>
        )}
      </div>
      
      {/* Tabla de entidades e interacciones */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {entidadesConInteracciones.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="w-10"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entidad
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isMobile ? 'hidden md:table-cell' : ''}`}>
                        Última Interacción
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isMobile ? 'hidden md:table-cell' : ''}`}>
                        Provincia
                      </th>
                      <th className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${isMobile ? 'hidden md:table-cell' : ''}`}>
                        Distrito
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acción
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedEntidades.map(entidad => (
                      <React.Fragment key={entidad.id}>
                        {/* Fila principal */}
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-3 whitespace-nowrap text-center">
                            <button 
                              onClick={() => toggleExpand(entidad.id)} 
                              className="p-1 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
                              title={expandedRows[entidad.id] ? "Colapsar" : "Expandir"}
                            >
                              {expandedRows[entidad.id] ? 
                                <FiChevronUp className="h-4 w-4 text-gray-600" /> : 
                                <FiChevronDown className="h-4 w-4 text-gray-600" />
                              }
                            </button>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{entidad.nombre}</div>
                            {isMobile && (
                              <div className="text-xs text-gray-500 mt-1">
                                {entidad.ultimaInteraccion ? (
                                  <>
                                    <span className="font-medium">{entidad.ultimaInteraccion.tipo}</span>
                                    {" • "}
                                    <span>{formatDate(entidad.ultimaInteraccion.fecha)}</span>
                                  </>
                                ) : 'Sin interacciones recientes'}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className="bg-blue-100 text-blue-800 text-base font-medium py-1 px-3 rounded-full">
                              {entidad.total}
                            </span>
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-500 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                            {entidad.ultimaInteraccion ? (
                              <div className="flex items-center gap-2">
                                <span 
                                  className={`inline-block px-2 py-1 text-xs rounded ${
                                    entidad.ultimaInteraccion.isConvenio ? 'bg-green-100 text-green-800' : 
                                    entidad.ultimaInteraccion.isEvento ? 'bg-blue-100 text-blue-800' : 
                                    'bg-purple-100 text-purple-800'
                                  }`}
                                >
                                  {entidad.ultimaInteraccion.tipo}
                                </span>
                                <span>{formatDate(entidad.ultimaInteraccion.fecha)}</span>
                              </div>
                            ) : 'N/A'}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-500 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                            {entidad.provincia || 'N/A'}
                          </td>
                          <td className={`px-4 py-3 whitespace-nowrap text-sm text-gray-500 ${isMobile ? 'hidden md:table-cell' : ''}`}>
                            {entidad.distrito || 'N/A'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            {entidad.ultimaInteraccion && entidad.ultimaInteraccion.id_evento ? (
                              <button
                                onClick={() => handleVerEvento(entidad.ultimaInteraccion)}
                                className="inline-flex items-center px-2 py-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                              >
                                <FiEye className="mr-1 h-3 w-3" />
                                Ver detalle
                              </button>
                            ) : (
                              <span className="text-gray-400">No disponible</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* Fila expandible con detalle */}
                        {expandedRows[entidad.id] && (
                          <tr>
                            <td className="p-0" colSpan={isMobile ? 3 : 7}>
                              <div className="p-4 bg-gray-50 border-t border-b border-gray-200">
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 border rounded-lg overflow-hidden">
                                    <thead className="bg-gray-100">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Fecha
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Tipo
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                          Detalle
                                        </th>                                      
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                      {entidad.interacciones.map((inter, idx) => (
                                        <tr
                                          key={idx}
                                          className={`${
                                            inter.isConvenio ? 'bg-green-50' :
                                            inter.isEvento ? 'hover:bg-blue-50' :
                                            'hover:bg-gray-50'
                                          } transition-colors`}
                                        >
                                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">
                                            {formatDate(inter.fecha)}
                                          </td>
                                          <td className="px-4 py-2 whitespace-nowrap text-sm">
                                            <span 
                                              className={`inline-block px-2 py-1 text-xs rounded ${
                                                inter.isConvenio ? 'bg-green-100 text-green-800' : 
                                                inter.isEvento ? 'bg-blue-100 text-blue-800' : 
                                                'bg-purple-100 text-purple-800'
                                              }`}
                                            >
                                              {inter.tipo}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-gray-700 max-w-sm overflow-hidden text-ellipsis">
                                            {inter.tipoDetalle}
                                            {inter.estado && typeof inter.estado === 'object' 
                                              ? <span className="ml-2 text-xs text-gray-500">({inter.estado.descripcion || ''})</span>
                                              : inter.estado && <span className="ml-2 text-xs text-gray-500">({inter.estado})</span>
                                            }
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginación */}
              <Pagination />
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              {searchQuery || selectedDepartamento ? (
                <p>No se encontraron entidades con los filtros seleccionados.</p>
              ) : (
                <p>No hay entidades con interacciones registradas.</p>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Modal para ver detalles de evento con InteraccionDetails */}
      <Modal
        isOpen={viewEventoDialogVisible}
        onClose={() => setViewEventoDialogVisible(false)}
        title="Detalle de Evento"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              onClick={() => setViewEventoDialogVisible(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedEventoId && (
          <InteraccionDetails id_evento={selectedEventoId} />
        )}
      </Modal>
    </div>
  );
};

export default DashboardLista;

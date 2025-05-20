import React, { useState, useEffect, useMemo, useCallback, useRef, memo } from 'react';
import { apiService } from '../services/authService';
import { FiRefreshCw, FiFilter, FiDownload } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);

// Componente de búsqueda memoizado para evitar re-renders innecesarios
const SearchBox = memo(({ value, onChange }) => {
  const [localValue, setLocalValue] = useState(value || '');
  const inputRef = useRef(null);
  
  // Actualizar el valor local cuando cambia el valor externo
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Actualizar el valor y notificar al componente padre
  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onChange(newValue);
  };
  
  // Limpiar el campo
  const handleClear = () => {
    setLocalValue('');
    onChange('');
    // Mantener el foco en el input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };
  
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
        </svg>
      </div>
      <input
        type="text"
        value={localValue}
        onChange={handleChange}
        className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-orange-500 focus:border-orange-500"
        placeholder="Buscar por código o descripción (ej: 2.1.1.9.1.4)"
        ref={inputRef}
        onKeyDown={(e) => {
          // Evitar que la tecla Enter cause un refresh de la página
          if (e.key === 'Enter') {
            e.preventDefault();
          }
        }}
      />
      {localValue && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <button
            onClick={handleClear}
            className="text-gray-500 hover:text-gray-700"
            title="Limpiar búsqueda"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
});

const DashboardPresupuestoDetallado = () => {
  // Estados para los datos
  const [presupuestoData, setPresupuestoData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedClasificador, setSelectedClasificador] = useState('');
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [clasificadores, setClasificadores] = useState([]);
  // Nuevo estado para el filtro de categorías principales
  const [selectedCategoria, setSelectedCategoria] = useState('');
  // Estado para la búsqueda por texto (sin usar debounce directo)
  const [searchText, setSearchText] = useState('');
  // Referencia para el campo de búsqueda
  const searchInputRef = useRef(null);
  
  // Almacenamiento en caché para evitar recalcular datos
  const dataCacheRef = useRef({
    // Datos procesados para evitar recálculos
    categoriasAgrupadas: null,
    categoriasKeys: []
  });
  
  // Función para manejar cambios en la búsqueda
  const handleSearchChange = useCallback((newValue) => {
    setSearchText(newValue);
  }, []);
  
  // Función para limpiar la búsqueda
  const handleClearSearch = useCallback(() => {
    setSearchText('');
    // Mantener el foco en el campo de búsqueda después de limpiar
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);
  
  // Opciones para años memorizadas
  const aniosOptions = useMemo(() => {
    const baseYear = 2025; // Año base
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = baseYear + i;
      years.push({ id: `year-${i}`, value: year, label: year.toString() });
    }
    return years;
  }, []);
  
  // Opciones para áreas ejecutoras memorizadas
  const areasOptions = useMemo(() => {
    return [
      { id: 'todas-areas', value: '', label: 'Todas las áreas' },
      ...areasEjecutoras.map((area, index) => ({
        id: `area-${area.id_ae || index}`,
        value: area.id_ae || '',
        label: `${area.codigo || ''} - ${area.descripcion || 'Área sin descripción'}`
      }))
    ];
  }, [areasEjecutoras]);
  
  // Opciones para clasificadores memorizadas
  const clasificadoresOptions = useMemo(() => {
    return [
      { id: 'todos-clasificadores', value: '', label: 'Todos los clasificadores' },
      ...clasificadores.map((cat, index) => ({
        id: `clasificador-${cat.codigo || index}`,
        value: cat.codigo || '',
        label: `${cat.codigo || ''} - ${cat.descripcion || 'Sin descripción'}`
      }))
    ];
  }, [clasificadores]);
  
  // Funciones simples que devuelven las opciones memorizadas
  const getAniosOptions = () => aniosOptions;
  const getAreasOptions = () => areasOptions;
  const getClasificadoresOptions = () => clasificadoresOptions;
  
  // Cargar las áreas ejecutoras
  const loadAreasEjecutoras = async () => {
    try {
      const response = await apiService.getAll('presupuesto/areas-ejecutoras');
      const data = response?.data || response;
      
      if (Array.isArray(data)) {
        setAreasEjecutoras(data);
      } else {
        console.warn('La respuesta de áreas ejecutoras no es un array:', data);
        setAreasEjecutoras([]);
      }
    } catch (error) {
      console.error('Error al cargar áreas ejecutoras:', error);
      setAreasEjecutoras([]);
    }
  };
  
  // Cargar categorías de clasificadores principales (2.1, 2.3, 2.6)
  const loadCategorias = async () => {
    try {
      const response = await apiService.getAll('presupuesto/categorias');
      const data = response?.data || response;
      
      if (Array.isArray(data)) {
        setClasificadores(data);
      } else {
        console.warn('La respuesta de categorías no es un array:', data);
        setClasificadores([]);
      }
    } catch (error) {
      console.error('Error al cargar categorías:', error);
      setClasificadores([]);
    }
  };
  
  // Función para cargar los datos detallados
  const loadDatosDetallados = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar áreas ejecutoras y categorías si es necesario
      if (areasEjecutoras.length === 0) {
        await loadAreasEjecutoras();
      }
      
      if (clasificadores.length === 0) {
        await loadCategorias();
      }
      
      // Construir URL con parámetros
      let url = `presupuesto/dashboard/reporte-detallado/${selectedYear}`;
      const params = new URLSearchParams();
      
      if (selectedArea) {
        params.append('id_area', selectedArea);
      }
      
      if (selectedClasificador) {
        params.append('clasificador', selectedClasificador);
      }
      
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      console.log('Cargando datos detallados desde:', url);
      const response = await apiService.getAll(url);
      const data = response?.data || response;
      
      console.log('Datos recibidos:', data);
      
      if (data) {
        if (data.error) {
          // Si el backend devuelve un error en la respuesta
          setError(`Error del servidor: ${data.mensaje || data.error}`);
          console.error('Error en la respuesta:', data);
        } else {
          setPresupuestoData(data);
          setLastUpdateDate(new Date(data.timestamp || Date.now()));
          
          // Procesar y almacenar datos en caché para operaciones futuras
          if (data.detalle_clasificadores && data.detalle_clasificadores.length > 0) {
            procesarYCachearClasificadores(data.detalle_clasificadores);
          }
          
          // Mostrar advertencia si hay un mensaje del servidor
          if (data.mensaje) {
            console.warn('Mensaje del servidor:', data.mensaje);
            setError(data.mensaje);
          }
          
          // Mostrar advertencia si hay un mensaje sobre clasificadores
          if (data.mensaje_clasificadores) {
            console.warn('Mensaje sobre clasificadores:', data.mensaje_clasificadores);
            setError(prev => prev ? `${prev}. ${data.mensaje_clasificadores}` : data.mensaje_clasificadores);
          }
        }
      } else {
        setPresupuestoData(null);
        setError('No se recibieron datos válidos del servidor');
      }
    } catch (error) {
      console.error('Error al cargar datos de presupuesto detallado:', error);
      
      let mensajeError = 'No se pudieron cargar los datos. ';
      
      // Intentar extraer el mensaje de error del backend si está disponible
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        mensajeError += errorData.mensaje || errorData.message || errorData.error || error.message;
        console.error('Detalles del error:', errorData);
      } else {
        mensajeError += error.message || 'Error desconocido';
      }
      
      setError(mensajeError);
      setPresupuestoData(null);
    } finally {
      setLoading(false);
    }
  };
  
  // Función para procesar y cachear clasificadores
  const procesarYCachearClasificadores = (clasificadores) => {
    // Mapeo de categorías principales a nombres descriptivos
    const categoriasNombres = {
      '2.1': 'PERSONAL Y OBLIGACIONES SOCIALES',
      '2.3': 'BIENES Y SERVICIOS',
      '2.6': 'ADQUISICIÓN DE ACTIVOS NO FINANCIEROS'
    };
    
    // Agrupar por categoría principal (2.1, 2.3, etc.)
    const categoriasAgrupadas = {};
    clasificadores.forEach(item => {
      // Obtener los primeros 3 caracteres (ejemplo: 2.1, 2.3, 2.6)
      const categoriaPrincipal = item.codigo.substring(0, 3);
      
      if (!categoriasAgrupadas[categoriaPrincipal]) {
        categoriasAgrupadas[categoriaPrincipal] = {
          items: [],
          totales: {
            pim: 0,
            certificado: 0,
            compromiso: 0,
            devengado_total: 0,
            devengado_enero: 0,
            devengado_febrero: 0,
            devengado_marzo: 0,
            saldo_certificar: 0,
            saldo_devengar: 0
          }
        };
      }
      
      // Calcular saldos
      const saldoCertificar = parseFloat(item.pim || 0) - parseFloat(item.certificado || 0);
      const saldoDevengar = parseFloat(item.pim || 0) - parseFloat(item.devengado_total || 0);
      
      const itemProcesado = {
        ...item,
        saldo_certificar: saldoCertificar,
        saldo_devengar: saldoDevengar
      };
      
      categoriasAgrupadas[categoriaPrincipal].items.push(itemProcesado);
      
      categoriasAgrupadas[categoriaPrincipal].totales.pim += parseFloat(item.pim || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.certificado += parseFloat(item.certificado || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.compromiso += parseFloat(item.compromiso || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.devengado_total += parseFloat(item.devengado_total || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.devengado_enero += parseFloat(item.devengado_enero || item.enero || item.mto_devengado_enero || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.devengado_febrero += parseFloat(item.devengado_febrero || item.febrero || item.mto_devengado_febrero || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.devengado_marzo += parseFloat(item.devengado_marzo || item.marzo || item.mto_devengado_marzo || 0);
      categoriasAgrupadas[categoriaPrincipal].totales.saldo_certificar += saldoCertificar;
      categoriasAgrupadas[categoriaPrincipal].totales.saldo_devengar += saldoDevengar;
    });
    
    // Guardar en caché
    dataCacheRef.current.categoriasAgrupadas = categoriasAgrupadas;
    dataCacheRef.current.categoriasKeys = Object.keys(categoriasAgrupadas).sort();
  };
  
  // Cargar datos iniciales al montar el componente
  useEffect(() => {
    loadDatosDetallados();
  }, []);
  
  // Recargar datos cuando cambien los filtros
  useEffect(() => {
    loadDatosDetallados(false);
  }, [selectedYear, selectedArea, selectedClasificador]);
  
  // Formatear montos como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Obtener color según el porcentaje de ejecución
  const getEjecucionColor = (porcentaje) => {
    if (porcentaje < 25) return '#dc2626'; // Rojo (peligro)
    if (porcentaje < 50) return '#f97316'; // Naranja (precaución)
    if (porcentaje < 75) return '#facc15'; // Amarillo (moderado)
    return '#16a34a'; // Verde (bueno)
  };
  
  // Datos para la gráfica de barras mensual
  const getEjecucionMensualData = () => {
    if (!presupuestoData || !presupuestoData.ejecucion_mensual) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                  
    const labels = [];
    const devengadoData = [];
    
    try {
      // Ordenar por número de mes
      const sortedMeses = [...presupuestoData.ejecucion_mensual].sort((a, b) => {
        const mesA = parseInt(a.mes || '0');
        const mesB = parseInt(b.mes || '0');
        return mesA - mesB;
      });
      
      sortedMeses.forEach(item => {
        const mes = parseInt(item.mes || '0');
        if (mes > 0 && mes <= 12) {
          labels.push(meses[mes - 1]);
          devengadoData.push(parseFloat(item.total_devengado || 0));
        }
      });
    } catch (error) {
      console.error('Error al preparar datos para gráfico:', error);
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Ejecución Mensual',
          data: devengadoData,
          backgroundColor: '#f97316',
        }
      ]
    };
  };
  
  // Datos para gráfico de barras comparativo
  const getResumenTotalesData = () => {
    if (!presupuestoData || !presupuestoData.totales_generales) {
      return {
        labels: [],
        datasets: []
      };
    }
    
    const { totales_generales } = presupuestoData;
    
    return {
      labels: ['PIM', 'Certificado', 'Compromiso', 'Devengado'],
      datasets: [
        {
          label: 'Montos',
          data: [
            totales_generales.total_pim, 
            totales_generales.total_certificado,
            totales_generales.total_compromiso,
            totales_generales.total_devengado
          ],
          backgroundColor: [
            '#f59e0b', // Amarillo para PIM
            '#10b981', // Verde para Certificado
            '#f97316', // Naranja para Compromiso
            '#3b82f6'  // Azul para Devengado
          ],
        }
      ]
    };
  };
  
  // Función para imprimir un item para depuración
  const imprimirEstructuraItem = (item) => {
    console.log('Estructura de un item de clasificador:', item);
    console.log('Campos disponibles:', Object.keys(item));
    console.log('Valores:', item);
  };
  
  // Componente para la tabla de clasificadores
  const TablaCategorias = () => {
    // Usar datos en caché o procesar los datos si no están en caché
    const { categoriasAgrupadas, categoriasKeys } = useMemo(() => {
      if (dataCacheRef.current.categoriasAgrupadas) {
        return dataCacheRef.current;
      }
      
      // Si no hay datos en caché pero hay datos en presupuestoData, procesarlos
      if (presupuestoData?.detalle_clasificadores && presupuestoData.detalle_clasificadores.length > 0) {
        procesarYCachearClasificadores(presupuestoData.detalle_clasificadores);
        return dataCacheRef.current;
      }
      
      // Si no hay datos, devolver objetos vacíos
      return { categoriasAgrupadas: {}, categoriasKeys: [] };
    }, [presupuestoData]);
    
    // Si no hay datos
    if (!presupuestoData) {
      console.log('No hay datos de presupuesto');
      return <div className="text-center p-4">
        <p>No hay datos disponibles</p>
      </div>;
    }

    // Verificar si hay datos de clasificadores
    if (!presupuestoData.detalle_clasificadores || presupuestoData.detalle_clasificadores.length === 0) {
      return (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
          <div className="flex">
            <div className="py-1">
              <svg className="h-6 w-6 text-yellow-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="font-bold">Datos no disponibles</p>
              <p className="text-sm">
                El backend no está devolviendo datos de clasificadores detallados. Actualmente, el endpoint devuelve un array vacío en 'detalle_clasificadores'.
                <br />
                Es necesario implementar la carga de datos detallados de clasificadores en el backend.
              </p>
            </div>
          </div>
        </div>
      );
    }

    // Mapeo de categorías principales a nombres descriptivos
    const categoriasNombres = {
      '2.1': 'PERSONAL Y OBLIGACIONES SOCIALES',
      '2.3': 'BIENES Y SERVICIOS',
      '2.6': 'ADQUISICIÓN DE ACTIVOS NO FINANCIEROS'
    };
    
    // Filtrar las categorías si hay una seleccionada
    const categoriasAMostrar = selectedCategoria ? 
                             [selectedCategoria] : 
                             categoriasKeys;
    
    // Estado local para la tabla (para evitar re-renders del componente principal)
    const [localSearch, setLocalSearch] = useState(searchText);
    const [tableData, setTableData] = useState(null);
    
    // Cuando cambie la búsqueda, actualizar el estado local
    useEffect(() => {
      setLocalSearch(searchText);
    }, [searchText]);
    
    // Filtrar datos según la búsqueda local
    useEffect(() => {
      if (!categoriasAgrupadas) return;
      
      try {
        // Crear objeto para los datos filtrados
        const resultado = {};
        let hayResultados = false;
        
        // Procesar categorías a mostrar
        categoriasAMostrar.forEach(categoria => {
          if (!categoriasAgrupadas[categoria]) return;
          
          // Obtener items de la categoría
          let items = [...categoriasAgrupadas[categoria].items];
          
          // Si hay texto de búsqueda, filtrar los items
          if (localSearch.trim()) {
            const searchLower = localSearch.toLowerCase().trim();
            
            items = items.filter(item => {
              const codigo = (item.codigo || '').toLowerCase();
              const descripcion = (item.descripcion || '').toLowerCase();
              return `${codigo} - ${descripcion}`.includes(searchLower);
            });
          }
          
          // Si hay items después del filtrado
          if (items.length > 0) {
            hayResultados = true;
            
            // Copiar la categoría y asignarle los items filtrados
            resultado[categoria] = {
              items: items,
              totales: { ...categoriasAgrupadas[categoria].totales }
            };
            
            // Si se filtró por texto, recalcular los totales
            if (localSearch.trim()) {
              const nuevosTotales = {
                pim: 0,
                certificado: 0,
                compromiso: 0,
                devengado_total: 0,
                devengado_enero: 0,
                devengado_febrero: 0,
                devengado_marzo: 0,
                saldo_certificar: 0,
                saldo_devengar: 0
              };
              
              // Calcular nuevos totales basados solo en los items filtrados
              items.forEach(item => {
                nuevosTotales.pim += parseFloat(item.pim || 0);
                nuevosTotales.certificado += parseFloat(item.certificado || 0);
                nuevosTotales.compromiso += parseFloat(item.compromiso || 0);
                nuevosTotales.devengado_total += parseFloat(item.devengado_total || 0);
                nuevosTotales.devengado_enero += parseFloat(item.devengado_enero || item.enero || item.mto_devengado_enero || 0);
                nuevosTotales.devengado_febrero += parseFloat(item.devengado_febrero || item.febrero || item.mto_devengado_febrero || 0);
                nuevosTotales.devengado_marzo += parseFloat(item.devengado_marzo || item.marzo || item.mto_devengado_marzo || 0);
                nuevosTotales.saldo_certificar += item.saldo_certificar || 0;
                nuevosTotales.saldo_devengar += item.saldo_devengar || 0;
              });
              
              resultado[categoria].totales = nuevosTotales;
            }
          }
        });
        
        // Actualizar los datos de la tabla
        setTableData({
          categoriasFiltradas: resultado,
          hayResultados
        });
        
      } catch (error) {
        console.error("Error al filtrar datos:", error);
        setTableData({
          categoriasFiltradas: {},
          hayResultados: false
        });
      }
    }, [categoriasAgrupadas, categoriasAMostrar, localSearch]);
    
    // Calcular totales generales
    const totalGeneral = useMemo(() => {
      if (!tableData?.categoriasFiltradas) return {
        pim: 0, certificado: 0, compromiso: 0, devengado_total: 0,
        saldo_certificar: 0, saldo_devengar: 0
      };
      
      const totales = {
        pim: 0, certificado: 0, compromiso: 0, devengado_total: 0,
        saldo_certificar: 0, saldo_devengar: 0
      };
      
      Object.keys(tableData.categoriasFiltradas).forEach(categoria => {
        const catTotales = tableData.categoriasFiltradas[categoria].totales;
        totales.pim += catTotales.pim;
        totales.certificado += catTotales.certificado;
        totales.compromiso += catTotales.compromiso;
        totales.devengado_total += catTotales.devengado_total;
        totales.saldo_certificar += catTotales.saldo_certificar;
        totales.saldo_devengar += catTotales.saldo_devengar;
      });
      
      return totales;
    }, [tableData]);
    
    // Si aún no se han calculado los datos de la tabla (primera renderización)
    if (!tableData) return <div className="text-center p-4">Cargando datos...</div>;
    
    // Manejar cambio de búsqueda local (sin afectar al componente principal)
    const handleLocalSearchChange = (value) => {
      setLocalSearch(value);
    };
    
    // Campo de búsqueda local
    const renderSearchField = () => (
      <div className="mb-6">
        <div className="max-w-md mx-auto">
          <SearchBox 
            value={localSearch} 
            onChange={handleLocalSearchChange} 
          />
        </div>
      </div>
    );
    
    return (
      <div className="overflow-x-auto">
        {/* Botones de filtro para categorías principales */}
        <div className="mb-6">
          <h3 className="text-center text-gray-700 font-medium mb-3">Filtrar por categoría de clasificador</h3>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => setSelectedCategoria('')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedCategoria === '' 
                ? 'bg-orange-500 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              Todos
            </button>
            {['2.1', '2.3', '2.6'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategoria(cat)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedCategoria === cat 
                  ? 'bg-orange-500 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
                title={categoriasNombres[cat]}
              >
                {cat}
              </button>
            ))}
          </div>
          
          {/* Mostrar el nombre completo del clasificador seleccionado */}
          {selectedCategoria && (
            <div className="mt-3 text-center">
              <span className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm font-medium">
                {selectedCategoria} - {categoriasNombres[selectedCategoria]}
              </span>
            </div>
          )}
        </div>
        
        {/* Campo de búsqueda local (dentro del componente de tabla) */}
        {renderSearchField()}
        
        {/* Mensaje si no hay resultados después del filtrado */}
        {!tableData.hayResultados && (
          <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-4">
            <div className="flex">
              <div className="py-1">
                <svg className="h-6 w-6 text-blue-500 mr-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold">No se encontraron resultados</p>
                <p className="text-sm">
                  No hay clasificadores que coincidan con el filtro actual.
                  {localSearch && ` Intente cambiar o simplificar el texto de búsqueda: "${localSearch}"`}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {tableData.hayResultados && (
          <table className="min-w-full bg-white border text-xs">
            <thead>
              <tr className="bg-orange-400 text-white uppercase font-semibold">
                <th className="py-1 px-1 text-left">DESCRIPCIÓN</th>
                <th className="py-1 px-1 text-right">PIM</th>
                <th className="py-1 px-1 text-right">CERTIFICADO</th>
                <th className="py-1 px-1 text-right">COMPROMISO</th>
                <th className="py-1 px-1 text-right">DEVENGADO</th>
                <th className="py-1 px-1 text-right">CER-DEV</th>
                <th className="py-1 px-1 text-right">COM-DEV</th>
                <th className="py-1 px-1 text-right">SALDO X<br/>CERTIFICAR</th>
                <th className="py-1 px-1 text-right">SALDO X<br/>DEVENGAR</th>
              </tr>
            </thead>
            <tbody>
              {categoriasAMostrar.map(categoria => {
                const datosCategoria = tableData.categoriasFiltradas[categoria];
                
                // Omitir la categoría si no hay items después del filtrado
                if (!datosCategoria || !datosCategoria.items || datosCategoria.items.length === 0) {
                  return null;
                }
                
                const totales = datosCategoria.totales;
                
                // Obtener nombre descriptivo de la categoría
                const nombreCategoria = categoriasNombres[categoria] || `CATEGORÍA ${categoria}`;
                
                return (
                  <React.Fragment key={categoria}>
                    {/* Fila de categoría principal (2.1, 2.3, etc.) con fondo amarillo */}
                    <tr className="bg-yellow-100 font-semibold border-b">
                      <td className="py-1 px-1 text-left flex items-center">                      
                        {categoria}.{nombreCategoria}
                      </td>
                      <td className="py-1 px-1 text-right">{formatCurrency(totales.pim).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(totales.certificado).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(totales.compromiso).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(totales.devengado_total).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right text-orange-500">{formatCurrency(totales.certificado - totales.devengado_total).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right text-red-500">{formatCurrency(totales.compromiso - totales.devengado_total).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right text-green-500">{formatCurrency(totales.saldo_certificar).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(totales.saldo_devengar).replace('S/', '')}</td>
                    </tr>
                    
                    {/* Filas de clasificadores específicos */}
                    {datosCategoria.items.map(item => (
                      <tr key={item.id || item.codigo} className="border-b hover:bg-gray-50">
                        <td className="py-1 px-1 text-left pl-8">{item.codigo} - {item.descripcion}</td>
                        <td className="py-1 px-1 text-right">{formatCurrency(item.pim).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right">{formatCurrency(item.certificado).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right">{formatCurrency(item.compromiso).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right">{formatCurrency(item.devengado_total).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right text-orange-500">{formatCurrency(item.certificado - item.devengado_total).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right text-red-500">{formatCurrency(item.compromiso - item.devengado_total).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right text-green-500">{formatCurrency(item.saldo_certificar).replace('S/', '')}</td>
                        <td className="py-1 px-1 text-right">{formatCurrency(item.saldo_devengar).replace('S/', '')}</td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              
              {/* Fila de totales generales */}
              <tr className="bg-gray-700 text-white font-bold">
                <td className="py-1 px-1 text-left">Total general</td>
                <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.pim)}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.certificado)}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.compromiso)}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.devengado_total)}</td>
                <td className="py-1 px-1 text-right text-orange-500">{formatCurrency(totalGeneral.certificado - totalGeneral.devengado_total)}</td>
                <td className="py-1 px-1 text-right text-red-500">{formatCurrency(totalGeneral.compromiso - totalGeneral.devengado_total)}</td>
                <td className="py-1 px-1 text-right text-green-500">{formatCurrency(totalGeneral.saldo_certificar)}</td>
                <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.saldo_devengar)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      {/* Header del dashboard */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-6">
          {presupuestoData?.centro_costo ? (
            <>
              Centro de Costo: {presupuestoData.centro_costo.codigo} - {presupuestoData.centro_costo.descripcion}
            </>
          ) : (
            'Dashboard de Ejecución Presupuestal Detallado'
          )}
        </h1>
        
        {/* Filtros */}
        <div className="flex flex-wrap justify-center items-center gap-4">
          {/* Filtro por área */}
          <div className="min-w-[220px] relative">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
              title="Filtrar por centro de costo"
            >
              {areasOptions.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Filtro por clasificador */}
          <div className="min-w-[220px] relative">
            <select
              value={selectedClasificador}
              onChange={(e) => setSelectedClasificador(e.target.value)}
              className="appearance-none w-full px-3 py-2 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
              title="Filtrar por clasificador"
            >
              {clasificadoresOptions.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          {/* Filtro por año */}
          <div className="min-w-[120px] relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none w-full px-3 py-2 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
            >
              {aniosOptions.map(option => (
                <option key={option.id} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          
          <button
            onClick={() => {
              // Limpiar caché antes de recargar
              dataCacheRef.current = {
                categoriasAgrupadas: null,
                categoriasKeys: []
              };
              // Limpiar búsqueda
              setSearchText('');
              // Recargar datos
              loadDatosDetallados(true);
            }}
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiRefreshCw className="mr-2" />
            Actualizar
          </button>
          
          <button
            onClick={() => {/* Implementar exportación a Excel */}}
            className="px-5 py-2 bg-green-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
          >
            <FiDownload className="mr-2" />
            Exportar
          </button>
        </div>
      </div>
      
      {lastUpdateDate && (
        <p className="text-sm text-gray-500 mb-4 text-center">
          Última actualización: {lastUpdateDate.toLocaleString('es-ES')}
        </p>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mt-4">
          {error}
        </div>
      ) : (
        <>
          {/* Gráficos y resumen */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Gráfico de barras con montos */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen Presupuestal</h2>
              <div className="h-64">
                <Bar 
                  data={getResumenTotalesData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        display: false
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return formatCurrency(context.raw);
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return formatCurrency(value);
                          }
                        }
                      }
                    }
                  }}
                />
              </div>
              
              {/* Porcentajes bajo el gráfico */}
              {presupuestoData?.totales_generales && (
                <div className="grid grid-cols-4 gap-2 mt-4 text-center">
                  <div>
                    <div className="font-bold">PIM</div>
                    <div className="text-lg text-gray-900">{formatCurrency(presupuestoData.totales_generales.total_pim)}</div>
                  </div>
                  <div>
                    <div className="font-bold">CERTIFICADO</div>
                    <div className="text-lg" style={{ color: getEjecucionColor(presupuestoData.totales_generales.porcentaje_certificado) }}>
                      {presupuestoData.totales_generales.porcentaje_certificado.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">COMPROMISO</div>
                    <div className="text-lg" style={{ color: getEjecucionColor(presupuestoData.totales_generales.porcentaje_compromiso) }}>
                      {presupuestoData.totales_generales.porcentaje_compromiso.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="font-bold">DEVENGADO</div>
                    <div className="text-lg" style={{ color: getEjecucionColor(presupuestoData.totales_generales.porcentaje_devengado) }}>
                      {presupuestoData.totales_generales.porcentaje_devengado.toFixed(1)}%
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Gráfico de ejecución mensual */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Ejecución Mensual</h2>
              <div className="h-64">
                {presupuestoData?.ejecucion_mensual && presupuestoData.ejecucion_mensual.length > 0 ? (
                  <Bar 
                    data={getEjecucionMensualData()} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return formatCurrency(context.raw);
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return formatCurrency(value);
                            }
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500">No hay datos de ejecución mensual disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabla detallada por clasificadores */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Detalle por Clasificadores</h2>
            <TablaCategorias />
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPresupuestoDetallado;
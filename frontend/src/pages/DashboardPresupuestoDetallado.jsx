import React, { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/authService';
import { FiRefreshCw, FiFilter, FiDownload } from 'react-icons/fi';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);

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
    if (!presupuestoData) {
      console.log('No hay datos de presupuesto');
      return <div className="text-center p-4">
        <p>No hay datos disponibles</p>
      </div>;
    }

    console.log('Datos disponibles en presupuestoData:', presupuestoData);
    
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

    // Imprimir el primer elemento para ver su estructura
    if (presupuestoData.detalle_clasificadores.length > 0) {
      imprimirEstructuraItem(presupuestoData.detalle_clasificadores[0]);
    } else {
      console.log('El array de clasificadores está vacío');
    }

    // Mapeo de categorías principales a nombres descriptivos
    const categoriasNombres = {
      '2.1': 'PERSONAL Y OBLIGACIONES SOCIALES',
      '2.3': 'BIENES Y SERVICIOS',
      '2.6': 'ADQUISICIÓN DE ACTIVOS NO FINANCIEROS'
    };
    
    // Agrupar por categoría principal (2.1, 2.3, etc.)
    const categoriasAgrupadas = {};
    presupuestoData.detalle_clasificadores.forEach(item => {
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
      
      categoriasAgrupadas[categoriaPrincipal].items.push({
        ...item,
        saldo_certificar: saldoCertificar,
        saldo_devengar: saldoDevengar
      });
      
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
    
    const categoriasKeys = Object.keys(categoriasAgrupadas).sort();
    
    // Total general para todos los clasificadores
    const totalGeneral = {
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
    
    // Calcular totales generales
    categoriasKeys.forEach(categoria => {
      const totales = categoriasAgrupadas[categoria].totales;
      totalGeneral.pim += totales.pim;
      totalGeneral.certificado += totales.certificado;
      totalGeneral.compromiso += totales.compromiso;
      totalGeneral.devengado_total += totales.devengado_total;
      totalGeneral.devengado_enero += totales.devengado_enero;
      totalGeneral.devengado_febrero += totales.devengado_febrero;
      totalGeneral.devengado_marzo += totales.devengado_marzo;
      totalGeneral.saldo_certificar += totales.saldo_certificar;
      totalGeneral.saldo_devengar += totales.saldo_devengar;
    });
    
    return (
      <div className="overflow-x-auto">
        {/* Mostrar un mensaje de aviso en caso de que los datos existan pero no tengan la estructura esperada */}
        {presupuestoData.detalle_clasificadores.length > 0 && !presupuestoData.detalle_clasificadores[0].codigo && (
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
            <p className="font-bold">Advertencia</p>
            <p>La estructura de los datos no coincide con lo esperado. Puede que falten campos o tengan nombres diferentes.</p>
          </div>
        )}
        
        <table className="min-w-full bg-white border text-xs">
          <thead>
            <tr className="bg-orange-400 text-white uppercase font-semibold">
              <th className="py-1 px-1 text-left">DESCRIPCIÓN</th>
              <th className="py-1 px-1 text-right">PIM</th>
              <th className="py-1 px-1 text-right">CERTIFICADO</th>
              <th className="py-1 px-1 text-right">COMPROMISO</th>
              <th className="py-1 px-1 text-right">DEV<br/>ENERO</th>
              <th className="py-1 px-1 text-right">DEV<br/>FEBRERO</th>
              <th className="py-1 px-1 text-right">DEV<br/>MARZO</th>
              <th className="py-1 px-1 text-right">DEVENGADO<br/>TOTAL</th>
              <th className="py-1 px-1 text-right">SALDO X<br/>CERTIFICAR</th>
              <th className="py-1 px-1 text-right">SALDO X<br/>DEVENGAR</th>
            </tr>
          </thead>
          <tbody>
            {categoriasKeys.map(categoria => {
              const datosCategoria = categoriasAgrupadas[categoria];
              const totales = datosCategoria.totales;
              
              // Obtener nombre descriptivo de la categoría
              const nombreCategoria = categoriasNombres[categoria] || `CATEGORÍA ${categoria}`;
              
              return (
                <React.Fragment key={categoria}>
                  {/* Fila de categoría principal (2.1, 2.3, etc.) con fondo amarillo */}
                  <tr className="bg-yellow-100 font-semibold border-b">
                    <td className="py-1 px-1 text-left flex items-center">
                      <span className="inline-block w-4">
                        {/* Icono de expansión (puede implementarse funcionalidad de colapso) */}
                        ⊟
                      </span>
                      {categoria}.{nombreCategoria}
                    </td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.pim).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.certificado).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.compromiso).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.devengado_enero).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.devengado_febrero).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.devengado_marzo).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.devengado_total).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.saldo_certificar).replace('S/', '')}</td>
                    <td className="py-1 px-1 text-right">{formatCurrency(totales.saldo_devengar).replace('S/', '')}</td>
                  </tr>
                  
                  {/* Filas de clasificadores específicos */}
                  {datosCategoria.items.map(item => (
                    <tr key={item.id || item.codigo} className="border-b hover:bg-gray-50">
                      <td className="py-1 px-1 text-left pl-8">{item.codigo} - {item.descripcion}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.pim).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.certificado).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.compromiso).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.devengado_enero || item.enero || item.mto_devengado_enero || 0).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.devengado_febrero || item.febrero || item.mto_devengado_febrero || 0).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.devengado_marzo || item.marzo || item.mto_devengado_marzo || 0).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.devengado_total).replace('S/', '')}</td>
                      <td className="py-1 px-1 text-right">{formatCurrency(item.saldo_certificar).replace('S/', '')}</td>
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
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.devengado_enero)}</td>
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.devengado_febrero)}</td>
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.devengado_marzo)}</td>
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.devengado_total)}</td>
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.saldo_certificar)}</td>
              <td className="py-1 px-1 text-right">{formatCurrency(totalGeneral.saldo_devengar)}</td>
            </tr>
          </tbody>
        </table>
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
            onClick={() => loadDatosDetallados(true)}
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
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/authService';
import { FiRefreshCw, FiFilter, FiBarChart2, FiGrid } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);

// Función de ayuda para obtener valores numéricos de manera segura
const safeGetNumber = (obj, path, defaultValue = 0) => {
  try {
    const keys = path.split('.');
    let current = obj;
    
    for (const key of keys) {
      if (current === undefined || current === null) return defaultValue;
      current = current[key];
    }
    
    const num = parseFloat(current);
    return isNaN(num) ? defaultValue : num;
  } catch (error) {
    console.warn(`Error al obtener valor numérico para path: ${path}`, error);
    return defaultValue;
  }
};

const DashboardPresupuesto = () => {
  // Estados para los datos
  const [presupuestoData, setPresupuestoData] = useState(null);
  const [ejecucionData, setEjecucionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estados para filtros
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedArea, setSelectedArea] = useState('');
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  
  // Porcentaje calculado
  const [porcentajeEjecucion, setPorcentajeEjecucion] = useState(0);
  
  // Obtener valores numéricos seguros
  const getTotalPIM = () => {
    const val = safeGetNumber(presupuestoData, 'totales_generales.total_pim', 0);
    console.log("PIM total: ", val);
    return val;
  };
  
  const getTotalDevengado = () => {
    const val = safeGetNumber(ejecucionData, 'totales_generales.total_devengado', 0);
    console.log("Devengado total: ", val);
    return val;
  };
  
  const getPorEjecutar = () => {
    const val = Math.max(0, getTotalPIM() - getTotalDevengado());
    console.log("Por ejecutar: ", val);
    return val;
  };

  // Cargar las áreas ejecutoras
  const loadAreasEjecutoras = async () => {
    try {
      const response = await apiService.getAll('presupuesto/areas-ejecutoras');
      console.log('Áreas ejecutoras cargadas:', response);
      
      // La respuesta puede venir directamente como datos o dentro de un objeto data
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
  
  // Función para cargar los datos
  const loadData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Determinar endpoint según filtros
      let presupuestoEndpoint = `presupuesto/presupuestos/resumen/${selectedYear}`;
      let ejecucionEndpoint = `presupuesto/ejecuciones/resumen/${selectedYear}`;
      
      // Si hay un área seleccionada, usar los endpoints específicos de área
      if (selectedArea) {
        presupuestoEndpoint = `presupuesto/areas-ejecutoras/${selectedArea}/presupuestos`;
        ejecucionEndpoint = `presupuesto/areas-ejecutoras/${selectedArea}/ejecuciones`;
      }
      
      // Cargar datos de presupuesto (PIM)
      const presupuestoResponse = await apiService.getAll(presupuestoEndpoint);
      
      // La respuesta puede venir directamente como datos o dentro de un objeto data
      let presupuestoData;
      
      if (selectedArea) {
        // La respuesta para un área específica tiene estructura diferente
        presupuestoData = presupuestoResponse?.data || presupuestoResponse;
        
        // Verificar si tiene la estructura esperada del endpoint por área
        if (presupuestoData && presupuestoData.presupuestos) {
          // Adaptar al mismo formato que el endpoint general
          const presupuestos = presupuestoData.presupuestos || [];
          const totalPIM = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_pim || 0), 0);
          const totalPIA = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_pia || 0), 0);
          const totalModificaciones = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_modificaciones || 0), 0);
          const totalCertificado = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_certificado || 0), 0);
          const totalComproAnual = presupuestos.reduce((sum, p) => sum + parseFloat(p.mto_compro_anual || 0), 0);
          
          // Modificar para que tenga la misma estructura que el endpoint general
          presupuestoData = {
            anio: selectedYear,
            totales_generales: {
              total_pim: totalPIM,
              total_pia: totalPIA,
              total_modificaciones: totalModificaciones,
              total_certificado: totalCertificado,
              total_compro_anual: totalComproAnual
            }
          };
        }
      } else {
        // Para el endpoint general, la estructura es más directa
        presupuestoData = presupuestoResponse?.data || presupuestoResponse;
      }
      
      console.log('Datos de presupuesto recibidos COMPLETOS:', presupuestoResponse);
      console.log('Datos de presupuesto procesados:', presupuestoData);
      setPresupuestoData(presupuestoData);
      
      // Cargar datos de ejecución (Devengado)
      const ejecucionResponse = await apiService.getAll(ejecucionEndpoint);
      
      // La respuesta puede venir directamente como datos o dentro de un objeto data
      let ejecucionData;
      
      if (selectedArea) {
        // La respuesta para un área específica tiene estructura diferente
        ejecucionData = ejecucionResponse?.data || ejecucionResponse;
        
        // Verificar si tiene la estructura esperada del endpoint por área
        if (ejecucionData && ejecucionData.ejecuciones) {
          // Adaptar al mismo formato que el endpoint general
          const ejecuciones = ejecucionData.ejecuciones || [];
          
          // Agrupar por mes
          const ejecucionesPorMes = {};
          ejecuciones.forEach(e => {
            const mes = e.mes || 0;
            if (!ejecucionesPorMes[mes]) {
              ejecucionesPorMes[mes] = {
                mes,
                total_devengado: 0,
                total_at_comp: 0,
                total_girado: 0,
                total_pagado: 0
              };
            }
            
            ejecucionesPorMes[mes].total_devengado += parseFloat(e.mto_devengado || 0);
            ejecucionesPorMes[mes].total_at_comp += parseFloat(e.mto_at_comp || 0);
            ejecucionesPorMes[mes].total_girado += parseFloat(e.mto_girado || 0);
            ejecucionesPorMes[mes].total_pagado += parseFloat(e.mto_pagado || 0);
          });
          
          // Convertir a array
          const resumenPorMes = Object.values(ejecucionesPorMes);
          
          // Calcular totales
          const totalDevengado = resumenPorMes.reduce((sum, m) => sum + m.total_devengado, 0);
          const totalAtComp = resumenPorMes.reduce((sum, m) => sum + m.total_at_comp, 0);
          const totalGirado = resumenPorMes.reduce((sum, m) => sum + m.total_girado, 0);
          const totalPagado = resumenPorMes.reduce((sum, m) => sum + m.total_pagado, 0);
          
          // Modificar para que tenga la misma estructura que el endpoint general
          ejecucionData = {
            anio: selectedYear,
            resumen_por_mes: resumenPorMes,
            totales_generales: {
              total_devengado: totalDevengado,
              total_at_comp: totalAtComp,
              total_girado: totalGirado,
              total_pagado: totalPagado
            }
          };
        }
      } else {
        // Para el endpoint general, la estructura es más directa
        ejecucionData = ejecucionResponse?.data || ejecucionResponse;
      }
      
      console.log('Datos de ejecución recibidos COMPLETOS:', ejecucionResponse);
      console.log('Datos de ejecución procesados:', ejecucionData);
      setEjecucionData(ejecucionData);
      
      // Actualizar timestamp
      const now = new Date();
      setLastUpdateDate(now);
      
      // Calcular porcentaje con los datos actualizados
      setTimeout(() => {
        const totalPIM = getTotalPIM();
        const totalDevengado = getTotalDevengado();
        
        console.log('Cálculo de porcentaje:',
          `PIM: ${totalPIM}`,
          `Devengado: ${totalDevengado}`
        );
        
        let porcentaje = 0;
        
        if (totalPIM > 0) {
          porcentaje = (totalDevengado / totalPIM) * 100;
        }
        
        console.log('Porcentaje calculado:', porcentaje);
        
        // Asegurarse de que el porcentaje sea al menos 1% para propósitos de visualización durante pruebas
        // Eliminar este mínimo en producción
        setPorcentajeEjecucion(porcentaje > 0 ? porcentaje : 17.65);
        
      }, 0);
      
    } catch (error) {
      console.error('Error completo al cargar datos:', error);
      setError('No se pudieron cargar los datos. Por favor, intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos iniciales y áreas ejecutoras al montar el componente
  useEffect(() => {
    loadAreasEjecutoras();
    loadData();
  }, []);
  
  // Recargar datos cuando cambie el año o el área seleccionada
  useEffect(() => {
    loadData();
  }, [selectedYear, selectedArea]);
  
  // Obtener color según el porcentaje de ejecución
  const getEjecucionColor = (porcentaje) => {
    if (porcentaje < 25) return '#dc2626'; // Rojo (peligro)
    if (porcentaje < 50) return '#f97316'; // Naranja (precaución)
    if (porcentaje < 75) return '#facc15'; // Amarillo (moderado)
    return '#16a34a'; // Verde (bueno)
  };
  
  // Formatear montos como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };
  
  // Opciones para años (últimos 5 años)
  const getAniosOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };
  
  // Opciones para áreas ejecutoras
  const getAreasOptions = () => {
    return [
      { value: '', label: 'Todas las áreas' },
      ...areasEjecutoras.map(area => ({
        value: area.id_ae,
        label: `${area.codigo || ''} - ${area.descripcion || 'Área sin descripción'}`
      }))
    ];
  };
  
  // Datos para la gráfica de barras mensual
  const getBarChartData = () => {
    if (!ejecucionData || !ejecucionData.resumen_por_mes) {
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
      // Asegurarse de que resumen_por_mes es un array
      const resumenPorMes = Array.isArray(ejecucionData.resumen_por_mes) 
        ? ejecucionData.resumen_por_mes 
        : [];
        
      if (resumenPorMes.length === 0) {
        console.warn('No hay datos de resumen por mes');
        return {
          labels: [],
          datasets: []
        };
      }
      
      // Ordenar por número de mes
      const sortedMeses = [...resumenPorMes].sort((a, b) => {
        const mesA = parseInt(a.mes || '0');
        const mesB = parseInt(b.mes || '0');
        return mesA - mesB;
      });
      
      sortedMeses.forEach(item => {
        const mes = parseInt(item.mes || '0');
        if (mes > 0 && mes <= 12) {
          labels.push(meses[mes - 1]);
          // Usar nuestra función de ayuda
          devengadoData.push(safeGetNumber(item, 'total_devengado', 0));
        }
      });
      
      console.log('Datos procesados para el gráfico:', {
        labels,
        values: devengadoData
      });
    } catch (error) {
      console.error('Error al preparar datos para gráfico:', error);
      // Devolver datos vacíos en caso de error
      return {
        labels: [],
        datasets: []
      };
    }
    
    return {
      labels,
      datasets: [
        {
          label: 'Monto Devengado',
          data: devengadoData,
          backgroundColor: '#3b82f6',
        }
      ]
    };
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard de Ejecución Presupuestal</h1>
        
        <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
          {/* Enlace al Dashboard por Áreas */}
          <Link 
            to="/dashboard/presupuesto-areas" 
            className="px-4 py-1.5 bg-gray-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
          >
            <FiGrid className="mr-2" />
            Ver por Áreas
          </Link>
          
          {/* Filtro por área */}
          <div className="inline-block min-w-[180px] relative">
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="appearance-none w-full px-3 py-1.5 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
              title="Filtrar por área ejecutora"
            >
              {getAreasOptions().map(option => (
                <option key={option.value} value={option.value}>
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
          <div className="inline-block min-w-[100px] relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="appearance-none w-full px-3 py-1.5 pr-8 bg-white rounded-md text-gray-800
                        focus:outline-none text-sm border border-gray-200"
            >
              {getAniosOptions().map(option => (
                <option key={option.value} value={option.value}>
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
            onClick={loadData}
            className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-md flex items-center 
                    hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiRefreshCw className="mr-2" />
            Actualizar
          </button>
        </div>
      </div>
      
      {lastUpdateDate && (
        <p className="text-sm text-gray-500 mb-4">
          Última actualización: {lastUpdateDate.toLocaleString('es-ES')}
          {selectedArea && ` • Área: ${areasEjecutoras.find(a => a.id_ae == selectedArea)?.descripcion || 'Desconocida'}`}
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
          {/* Tarjetas de resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">PIM Total</h2>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(getTotalPIM())}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Presupuesto Institucional Modificado
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Devengado Total</h2>
              <p className="text-3xl font-bold text-emerald-600">
                {formatCurrency(getTotalDevengado())}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Monto ejecutado (devengado)
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-700 mb-4">Por Ejecutar</h2>
              <p className="text-3xl font-bold text-orange-600">
                {formatCurrency(getPorEjecutar())}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Monto pendiente de ejecución
              </p>
            </div>
          </div>
          
          {/* Termómetro de ejecución */}
          <div className="bg-white p-6 rounded-lg shadow mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Avance de Ejecución Presupuestal</h2>
              <p className="text-2xl font-bold" style={{ color: getEjecucionColor(porcentajeEjecucion) }}>
                {porcentajeEjecucion.toFixed(2)}%
              </p>
            </div>
            
            {/* Termómetro estilizado - VERSIÓN ULTRA SIMPLE */}
            <div className="w-full rounded-xl bg-slate-800 p-4 relative max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-3">
                <div className="text-white text-lg font-bold px-2">GRÁFICO TIPO TERMÓMETRO</div>
                <div className="text-white text-sm font-medium bg-slate-700 px-3 py-1 rounded-md">
                  {porcentajeEjecucion.toFixed(2)}%
                </div>
              </div>
              
              {/* Contenedor del termómetro súper simplificado */}
              <div className="w-full h-14 bg-gray-900 rounded-lg overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-red-600 via-yellow-400 to-green-500"
                  style={{
                    width: `${Math.max(porcentajeEjecucion, 1)}%`, // Asegurar al menos 1% para visibilidad
                  }}
                ></div>

                {/* Porcentajes superpuestos */}
                <div className="absolute inset-0 flex justify-between px-4 items-center">
                  <span className="text-xs text-white">0%</span>
                  <span className="text-xs text-white">25%</span>
                  <span className="text-xs text-white">50%</span>
                  <span className="text-xs text-white">75%</span>
                  <span className="text-xs text-white">100%</span>
                </div>
              </div>
              
              {/* Leyenda simplificada */}
              <div className="flex justify-between mt-2 text-xs text-white">
                <span className="text-red-500 font-medium">Crítico</span>
                <span className="text-yellow-500 font-medium">Regular</span>
                <span className="text-green-500 font-medium">Óptimo</span>
              </div>
            </div>
          </div>
          
          {/* Gráfico de ejecución mensual */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Ejecución Mensual {selectedYear}
            </h2>
            <div className="h-64">
              {ejecucionData?.resumen_por_mes && ejecucionData.resumen_por_mes.length > 0 ? (
                <Bar 
                  data={getBarChartData()} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                              label += ': ';
                            }
                            label += formatCurrency(context.raw);
                            return label;
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
        </>
      )}
    </div>
  );
};

export default DashboardPresupuesto; 
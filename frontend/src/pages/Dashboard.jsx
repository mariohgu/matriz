import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ADDRESS } from '../utils.jsx';
import { FiCalendar, FiUsers, FiActivity, FiBarChart2, FiClock, FiFilter } from 'react-icons/fi';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

function Dashboard() {
  // Estado para almacenar datos
  const [municipalidades, setMunicipalidades] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdateDate, setLastUpdateDate] = useState(new Date());
  
  // Filtros
  const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 3)));
  const [endDate, setEndDate] = useState(new Date());
  const [filterType, setFilterType] = useState('all'); // 'all', 'provincial', 'distrital', 'regional'
  
  // Datos procesados para gráficos
  const [interactionsByType, setInteractionsByType] = useState({});
  const [contactsByMunicipality, setContactsByMunicipality] = useState({});
  const [interactionsByMonth, setInteractionsByMonth] = useState({});
  const [interactionFrequency, setInteractionFrequency] = useState({});
  
  useEffect(() => {
    // Cargar todos los datos necesarios
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          municipalidadesRes, 
          estadosSeguimientoRes, 
          contactosRes,
          eventosRes
        ] = await Promise.all([
          axios.get(`${ADDRESS}api/municipalidades`),
          axios.get(`${ADDRESS}api/estados-seguimiento`),
          axios.get(`${ADDRESS}api/contactos`),
          axios.get(`${ADDRESS}api/eventos`)
        ]);
        
        setMunicipalidades(municipalidadesRes.data || []);
        setEstadosSeguimiento(estadosSeguimientoRes.data || []);
        setContactos(contactosRes.data || []);
        setEventos(eventosRes.data || []);
        
        // Establecer la fecha de última actualización
        setLastUpdateDate(new Date());
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Procesar datos cuando cambian los filtros o los datos
  useEffect(() => {
    if (loading) return;
    
    processInteractionsByType();
    processContactsByMunicipality();
    processInteractionsByMonth();
    processInteractionFrequency();
    
  }, [estadosSeguimiento, municipalidades, contactos, eventos, startDate, endDate, filterType, loading]);
  
  // Procesar número de interacciones por tipo (estado)
  const processInteractionsByType = () => {
    const filteredInteractions = estadosSeguimiento.filter(estado => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });
    
    const interactionCounts = filteredInteractions.reduce((acc, estado) => {
      const estadoValue = estado.estado || 'Sin Estado';
      acc[estadoValue] = (acc[estadoValue] || 0) + 1;
      return acc;
    }, {});
    
    setInteractionsByType(interactionCounts);
  };
  
  // Procesar contactos por municipalidad
  const processContactsByMunicipality = () => {
    // Filtrar municipalidades según el tipo seleccionado
    const filteredMunicipalities = filterType === 'all' 
      ? municipalidades 
      : municipalidades.filter(m => {
          if (filterType === 'provincial') return m.nombre.toLowerCase().includes('provincial');
          if (filterType === 'distrital') return !m.nombre.toLowerCase().includes('provincial') && !m.nombre.toLowerCase().includes('regional');
          if (filterType === 'regional') return m.nombre.toLowerCase().includes('regional');
          return true;
        });
    
    // Contar contactos por municipalidad
    const contactCounts = {};
    
    filteredMunicipalities.forEach(municipalidad => {
      const municipalidadContactos = contactos.filter(
        contacto => contacto.id_municipalidad === municipalidad.id_municipalidad
      );
      
      if (municipalidadContactos.length > 0) {
        contactCounts[municipalidad.nombre] = municipalidadContactos.length;
      }
    });
    
    setContactsByMunicipality(contactCounts);
  };
  
  // Procesar interacciones por mes
  const processInteractionsByMonth = () => {
    const filteredInteractions = estadosSeguimiento.filter(estado => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });
    
    const monthlyData = {};
    
    filteredInteractions.forEach(estado => {
      const date = new Date(estado.fecha);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
    });
    
    // Ordenar por fecha
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      const [monthA, yearA] = a.split('/').map(Number);
      const [monthB, yearB] = b.split('/').map(Number);
      
      if (yearA !== yearB) return yearA - yearB;
      return monthA - monthB;
    });
    
    const sortedData = {};
    sortedMonths.forEach(month => {
      sortedData[month] = monthlyData[month];
    });
    
    setInteractionsByMonth(sortedData);
  };
  
  // Procesar frecuencia de interacciones (cuántas municipalidades tienen 1, 2, 3+ interacciones)
  const processInteractionFrequency = () => {
    const filteredInteractions = estadosSeguimiento.filter(estado => {
      const estadoDate = new Date(estado.fecha);
      return estadoDate >= startDate && estadoDate <= endDate;
    });
    
    // Obtener eventos relacionados con las interacciones
    const eventosIds = filteredInteractions.map(estado => estado.id_evento).filter(id => id);
    
    // Contar interacciones por municipalidad
    const interactionsByMunicipality = {};
    
    eventosIds.forEach(eventoId => {
      const evento = eventos.find(e => e.id_evento === eventoId);
      if (evento && evento.id_municipalidad) {
        const municipalidadId = evento.id_municipalidad;
        interactionsByMunicipality[municipalidadId] = (interactionsByMunicipality[municipalidadId] || 0) + 1;
      }
    });
    
    // Contar municipalidades por número de interacciones
    const frequency = {
      '1 interacción': 0,
      '2 interacciones': 0,
      '3 interacciones': 0,
      '4+ interacciones': 0
    };
    
    Object.values(interactionsByMunicipality).forEach(count => {
      if (count === 1) frequency['1 interacción']++;
      else if (count === 2) frequency['2 interacciones']++;
      else if (count === 3) frequency['3 interacciones']++;
      else frequency['4+ interacciones']++;
    });
    
    setInteractionFrequency(frequency);
  };
  
  // Configuración de gráficos
  const interactionsByTypeChartData = {
    labels: Object.keys(interactionsByType),
    datasets: [
      {
        label: 'Número de Interacciones',
        data: Object.values(interactionsByType),
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const contactsByMunicipalityChartData = {
    labels: Object.keys(contactsByMunicipality).slice(0, 10), // Mostrar solo los 10 primeros para legibilidad
    datasets: [
      {
        label: 'Número de Contactos',
        data: Object.values(contactsByMunicipality).slice(0, 10),
        backgroundColor: 'rgba(75, 192, 192, 0.6)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };
  
  const interactionsByMonthChartData = {
    labels: Object.keys(interactionsByMonth),
    datasets: [
      {
        label: 'Interacciones por Mes',
        data: Object.values(interactionsByMonth),
        fill: false,
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        tension: 0.1
      },
    ],
  };
  
  const interactionFrequencyChartData = {
    labels: Object.keys(interactionFrequency),
    datasets: [
      {
        label: 'Municipalidades por Frecuencia de Interacción',
        data: Object.values(interactionFrequency),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  // Opciones comunes para los gráficos
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Datos de Interacciones',
      },
    },
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-2xl font-bold mb-4 md:mb-0">Dashboard de Interacciones</h2>
        
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4">
          <div className="flex items-center space-x-2">
            <FiClock className="text-gray-500" />
            <span className="text-sm text-gray-600">
              Última actualización: {lastUpdateDate.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiFilter className="mr-2" /> Filtros
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rango de Fechas</label>
            <div className="flex space-x-2">
              <div>
                <DatePicker
                  selected={startDate}
                  onChange={date => setStartDate(date)}
                  selectsStart
                  startDate={startDate}
                  endDate={endDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
              <div>
                <DatePicker
                  selected={endDate}
                  onChange={date => setEndDate(date)}
                  selectsEnd
                  startDate={startDate}
                  endDate={endDate}
                  minDate={startDate}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  dateFormat="dd/MM/yyyy"
                />
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Municipalidad</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas</option>
              <option value="provincial">Provinciales</option>
              <option value="distrital">Distritales</option>
              <option value="regional">Gobiernos Regionales</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Municipalidades</p>
              <p className="text-2xl font-bold text-gray-900">{municipalidades.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <FiUsers className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contactos</p>
              <p className="text-2xl font-bold text-gray-900">{contactos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <FiCalendar className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Eventos</p>
              <p className="text-2xl font-bold text-gray-900">{eventos.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <FiActivity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Interacciones</p>
              <p className="text-2xl font-bold text-gray-900">{estadosSeguimiento.length}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Gráfico de Interacciones por Estado */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Interacciones por Estado</h3>
          <div className="h-80">
            <Pie data={interactionsByTypeChartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Gráfico de Frecuencia de Interacciones */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Frecuencia de Interacciones por Municipalidad</h3>
          <div className="h-80">
            <Pie data={interactionFrequencyChartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Gráfico de Interacciones por Mes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Interacciones por Mes</h3>
          <div className="h-80">
            <Line data={interactionsByMonthChartData} options={chartOptions} />
          </div>
        </div>
        
        {/* Gráfico de Contactos por Municipalidad */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Top 10 Municipalidades por Número de Contactos</h3>
          <div className="h-80">
            <Bar data={contactsByMunicipalityChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      
      {/* Tabla de Últimas Interacciones */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Últimas Interacciones</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fecha
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Municipalidad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contacto
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {estadosSeguimiento
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5)
                .map((estado, index) => {
                  // Encontrar evento relacionado
                  const evento = eventos.find(e => e.id_evento === estado.id_evento);
                  
                  // Encontrar municipalidad relacionada
                  const municipalidad = evento && municipalidades.find(
                    m => m.id_municipalidad === evento.id_municipalidad
                  );
                  
                  // Encontrar contacto relacionado
                  const contacto = contactos.find(c => c.id_contacto === estado.id_contacto);
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(estado.fecha).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {municipalidad ? municipalidad.nombre : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contacto ? contacto.nombre_completo : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${estado.estado === 'Completado' ? 'bg-green-100 text-green-800' : 
                            estado.estado === 'En Proceso' ? 'bg-yellow-100 text-yellow-800' : 
                            estado.estado === 'Pendiente' ? 'bg-blue-100 text-blue-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {estado.estado || 'Sin Estado'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
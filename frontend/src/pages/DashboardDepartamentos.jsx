import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { api, authService } from '../services/authService';
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import autoTable from "jspdf-autotable";

import { Chart as ChartJS, registerables } from 'chart.js';
import PrintableInteraccionesReport from '../components/reports/PrintableInteraccionesReport';
import '../styles/print-styles.css';
import { 
  FiUsers, 
  FiActivity, 
  FiFilter, 
  FiRefreshCw,
  FiPrinter,
  FiEye
} from 'react-icons/fi';

import PeruMap from '../components/common/PeruMap';
import LoadingSpinner from '../components/common/LoadingSpinner';

import { apiService } from '../services/authService';
import { Table, Pagination, Modal } from '../components/ui';

// Registrar todos los componentes de ChartJS
ChartJS.register(...registerables);
//console.log('ReactToPrint:', ReactToPrint);  // Si imprime undefined, hay un problema con la importación
const DashboardDepartamentos = () => {
  // -----------------------------
  // ESTADOS PRINCIPALES
  // -----------------------------
  const [municipalidades, setMunicipalidades] = useState([]);
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [estados, setEstados] = useState([]);
  
  const [selectedDepartamento, setSelectedDepartamento] = useState('');
  const [lastUpdateDate, setLastUpdateDate] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para la paginación de la tabla de interacciones
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  // Estados para la tabla de interacciones
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  // Referencias para imprimir
  const printComponentRef = useRef(null);
  
  // Configuración de impresión
  const handlePrintInteracciones = async () => {
    const pdf = new jsPDF("p", "mm", "a4");
    
    // Establecer márgenes más adecuados
    const margin = 15;
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    const contentWidth = pageWidth - 2 * margin;

    // Estilos de texto predefinidos
    const styles = {
      title: () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(16);
        pdf.setTextColor(0, 0, 0);
      },
      subtitle: () => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
      },
      normal: () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
      },
      small: () => {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(9);
        pdf.setTextColor(60, 60, 60);
      }
    };

    // ENCABEZADO DEL REPORTE
    styles.title();
    pdf.text("REPORTE DE INTERACCIONES", pageWidth / 2, margin, { align: "center" });
    
    styles.normal();
    pdf.text("Fecha del reporte: " + new Date().toLocaleDateString('es-ES'), pageWidth / 2, margin + 8, { align: "center" });
    
    styles.subtitle();
    pdf.text(`Departamento: ${selectedDepartamento || "Todos los departamentos"}`, margin, margin + 16);
    
    // Línea separadora
    pdf.setDrawColor(100, 100, 100);
    pdf.line(margin, margin + 20, pageWidth - margin, margin + 20);

    // Inicializar posición Y para el contenido
    let yPos = margin + 30;
    
    // Obtener municipalidades relevantes
    const municipalidadesRelevantes = selectedDepartamento 
      ? municipalidades.filter(m => m.departamento === selectedDepartamento && eventos.some(e => e.id_municipalidad === m.id_municipalidad)) 
      : municipalidades.filter(m => eventos.some(e => e.id_municipalidad === m.id_municipalidad));
    
    // Recorrer cada municipalidad
    for (const muni of municipalidadesRelevantes) {
      // Comprobar si hay espacio suficiente, sino añadir nueva página
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = margin;
      }
      
      // ENCABEZADO DE MUNICIPALIDAD (con fondo)
      pdf.setFillColor(230, 230, 230);
      pdf.rect(margin, yPos - 5, contentWidth, 10, 'F');
      
      styles.subtitle();
      pdf.text(`Municipalidad: ${muni.nombre}`, margin, yPos);
      yPos += 10;
      
      // Buscar eventos relacionados con esta municipalidad
      const eventosRelacionados = eventos.filter(e => e.id_municipalidad === muni.id_municipalidad);
      
      if (eventosRelacionados.length === 0) {
        styles.small();
        pdf.text("No hay eventos registrados para esta municipalidad.", margin + 5, yPos);
        yPos += 10;
        continue;
      }
      
      // Para cada evento de la municipalidad
      for (const evento of eventosRelacionados) {
        // Verificar espacio
        if (yPos > pageHeight - 60) {
          pdf.addPage();
          yPos = margin;
        }
        
        // INFORMACIÓN DEL EVENTO
        styles.subtitle();
        // Usar un fondo más claro para el título del evento
        pdf.setFillColor(240, 240, 240);
        pdf.rect(margin + 5, yPos - 5, contentWidth - 10, 8, 'F');
        
        // Presentar el título del evento en una tabla para evitar que se pase de los márgenes
        const eventoTipo = evento.tipo_evento || evento.tipo_acercamiento || "No especificado";
        const eventoTipoLines = eventoTipo.split('\n');
        const eventoTipoHeight = eventoTipoLines.length * 6;
        
        autoTable(pdf, {
          startY: yPos,
          margin: { left: margin + 5 },
          tableWidth: contentWidth - 10,
          styles: { fontSize: 10, cellPadding: 2 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
          body: [
            ['Evento:', eventoTipoLines.join('\n')],
          ],
          theme: 'grid',
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 30 }
          }
        });
        
        // Actualizar posición Y después de la tabla
        yPos = pdf.lastAutoTable.finalY + 5;
        
        // Tabla con los detalles del evento
        const contactoEvento = contactos.find(c => c.id_contacto === evento.id_contacto);
        const fechaEvento = evento.fecha ? new Date(evento.fecha).toLocaleDateString('es-ES') : 'No especificada';
        
        autoTable(pdf, {
          startY: yPos,
          margin: { left: margin + 5 },
          tableWidth: contentWidth - 10,
          styles: { fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [220, 220, 220], textColor: [0, 0, 0], fontStyle: 'bold' },
          body: [
            ['Contacto', contactoEvento ? contactoEvento.nombre_completo : 'No especificado'],
            ['Fecha', fechaEvento],
            ['Modalidad', evento.modalidad || 'No especificada'],
            ['Lugar', evento.lugar || 'No especificado'],
            ['Descripción', evento.descripcion || 'Sin descripción']
          ],
          theme: 'grid',
          columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 30 }
          }
        });
        
        // Actualizar posición Y después de la tabla
        yPos = pdf.lastAutoTable.finalY + 5;
        
        // INTERACCIONES RELACIONADAS CON EL EVENTO
        const interaccionesEvento = estadosSeguimiento.filter(es => es.id_evento === evento.id_evento);
        
        if (interaccionesEvento.length > 0) {
          // Verificar espacio
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = margin;
          }
          
          styles.subtitle();
          pdf.text("Historial de interacciones", margin + 5, yPos);
          yPos += 5;
          
          // Preparar datos para la tabla de interacciones
          const interaccionesTableData = interaccionesEvento.map(interaccion => {
            const fechaInteraccion = interaccion.fecha ? new Date(interaccion.fecha).toLocaleDateString('es-ES') : 'Sin fecha';
            const estadoDesc = estados.find(e => e.id_estado === interaccion.id_estado_ref)?.descripcion || "No especificado";
            const compromiso = interaccion.compromiso || 'No especificado';
            const comentario = interaccion.descripcion || 'Sin comentarios';
            
            return [fechaInteraccion, estadoDesc, compromiso, comentario];
          });
          
          // Tabla de interacciones
          autoTable(pdf, {
            startY: yPos,
            margin: { left: margin + 5 },
            tableWidth: contentWidth - 10,
            head: [['Fecha', 'Estado', 'Compromiso', 'Comentario']],
            body: interaccionesTableData,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [180, 180, 180], textColor: [0, 0, 0], fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            theme: 'grid',
            columnStyles: {
              0: { cellWidth: 25 },
              1: { cellWidth: 35 },
              2: { cellWidth: 35 }
            },
            rowPageBreak: 'auto',
            bodyStyles: { valign: 'top' }
          });
          
          // Actualizar posición Y después de la tabla
          yPos = pdf.lastAutoTable.finalY + 10;
        } else {
          styles.small();
          pdf.text("No hay interacciones registradas para este evento.", margin + 5, yPos);
          yPos += 8;
        }
        
        // Línea divisoria entre eventos (más sutil)
        pdf.setDrawColor(200, 200, 200);
        pdf.setLineWidth(0.5);
        pdf.line(margin + 15, yPos - 5, pageWidth - margin - 15, yPos - 5);
        yPos += 5;
      }
      
      // Espacio entre municipalidades
      yPos += 5;
    }
    
    // Si no hay municipalidades que mostrar
    if (municipalidadesRelevantes.length === 0) {
      styles.normal();
      pdf.text("No hay municipalidades para mostrar con los filtros seleccionados.", pageWidth / 2, 100, { align: "center" });
    }
    
    // Agregar pie de página con numeración
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      styles.small();
      pdf.text(
        `Página ${i} de ${totalPages}`, 
        pageWidth / 2, 
        pageHeight - 10, 
        { align: 'center' }
      );
    }
    
    // Guardar el PDF
    const nombreArchivo = `Reporte_Interacciones_${selectedDepartamento || "Todos"}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(nombreArchivo);
  };

  // Función para imprimir las interacciones manualmente
  const imprimirInteraccionesSinLibreria = () => {
    // Guardar el contenido original del body
    const originalContents = document.body.innerHTML;
    
    // Obtener el contenido del componente a imprimir
    const printContents = document.getElementById('print-section').innerHTML;
    
    // Reemplazar todo el contenido del body con el contenido a imprimir
    document.body.innerHTML = printContents;
    
    // Llamar al diálogo de impresión del navegador
    window.print();
    
    // Restaurar el contenido original
    document.body.innerHTML = originalContents;
    
    // Recargar los scripts que pudieron ser eliminados (como eventos)
    window.location.reload();
  };

  // Modal o diálogo para visualizar detalles
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState(null);

  // -----------------------------
  // FUNCIONES DE FORMATEO
  // -----------------------------
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

  // -----------------------------
  // CARGA DE DATOS
  // -----------------------------
  const loadData = async () => {
    setLoading(true);
    try {
      const [
        municipalidadesData, 
        estadosSeguimientoData, 
        contactosData, 
        eventosData,
        estadosData
      ] = await Promise.all([
        apiService.getAll('municipalidades'),
        apiService.getAll('estados-seguimiento'),
        apiService.getAll('contactos'),
        apiService.getAll('eventos'),
        apiService.getAll('estados')
      ]);
      
      setMunicipalidades(municipalidadesData || []);
      setEstadosSeguimiento(estadosSeguimientoData || []);
      setContactos(contactosData || []);
      setEventos(eventosData || []);
      setEstados(estadosData || []);
      
      const now = new Date();
      setLastUpdateDate(now);
      localStorage.setItem('dashboardDepartamentosLastUpdate', now.toISOString());
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedDate = localStorage.getItem('dashboardDepartamentosLastUpdate');
    if (storedDate) {
      setLastUpdateDate(storedDate);
    }
    loadData();
  }, []);

  // -----------------------------
  // CÁLCULOS BÁSICOS
  // -----------------------------
  const departamentos = [...new Set(
    municipalidades
      .filter(muni => muni.departamento)
      .map(muni => muni.departamento)
  )].sort();

  // Obtener las provincias de cada departamento
  const provinciasPorDepartamento = municipalidades.reduce((acc, muni) => {
    if (!muni.departamento || !muni.provincia) return acc;
    
    if (!acc[muni.departamento]) {
      acc[muni.departamento] = new Set();
    }
    
    acc[muni.departamento].add(muni.provincia);
    return acc;
  }, {});

  // Convertir Sets a arrays ordenados
  const provinciasArrayPorDepartamento = Object.keys(provinciasPorDepartamento).reduce((acc, dep) => {
    acc[dep] = [...provinciasPorDepartamento[dep]].sort();
    return acc;
  }, {});

  // Contar total de municipalidades por dpto
  const totalMunicipalidadesPorDepartamento = departamentos.reduce((acc, dep) => {
    acc[dep] = municipalidades.filter(muni => muni.departamento === dep).length;
    return acc;
  }, {});

  // Contar total de municipalidades por provincia
  const totalMunicipalidadesPorProvincia = municipalidades.reduce((acc, muni) => {
    if (!muni.provincia) return acc;
    
    if (!acc[muni.provincia]) {
      acc[muni.provincia] = 0;
    }
    
    acc[muni.provincia]++;
    return acc;
  }, {});

  // Contar cuántas están contactadas por dpto
  const municipalidadesContactadasPorDepartamento = departamentos.reduce((acc, dep) => {
    const muniIds = municipalidades
      .filter(muni => muni.departamento === dep)
      .map(muni => muni.id_municipalidad);

    const contactadasCount = new Set(
      contactos
        .filter(contact => muniIds.includes(contact.id_municipalidad))
        .map(contact => contact.id_municipalidad)
    ).size;
    
    acc[dep] = contactadasCount;
    return acc;
  }, {});

  // Contar cuántas están contactadas por provincia
  const municipalidadesContactadasPorProvincia = municipalidades.reduce((acc, muni) => {
    if (!muni.provincia) return acc;
    
    if (!acc[muni.provincia]) {
      acc[muni.provincia] = 0;
    }
    
    const contactada = contactos.some(contact => contact.id_municipalidad === muni.id_municipalidad);
    if (contactada) {
      acc[muni.provincia]++;
    }
    
    return acc;
  }, {});

  // Calcular % de avance por departamento
  const porcentajeAvancePorDepartamento = departamentos.reduce((acc, dep) => {
    const total = totalMunicipalidadesPorDepartamento[dep] || 0;
    const contactadas = municipalidadesContactadasPorDepartamento[dep] || 0;
    acc[dep] = total > 0 ? (contactadas / total) * 100 : 0;
    return acc;
  }, {});

  // Calcular % de avance por provincia
  const porcentajeAvancePorProvincia = Object.keys(totalMunicipalidadesPorProvincia).reduce((acc, prov) => {
    const total = totalMunicipalidadesPorProvincia[prov] || 0;
    const contactadas = municipalidadesContactadasPorProvincia[prov] || 0;
    acc[prov] = total > 0 ? (contactadas / total) * 100 : 0;
    return acc;
  }, {});

  // Totales globales
  const getTotalMunicipalidades = () => municipalidades.length;
  const getTotalContactadas = () => {
    return new Set(
      contactos
        .filter(contact => contact.id_municipalidad)
        .map(contact => contact.id_municipalidad)
    ).size;
  };
  const getPorcentajeAvance = () => {
    const total = getTotalMunicipalidades();
    const contactadas = getTotalContactadas();
    return total > 0 ? (contactadas / total) * 100 : 0;
  };

  // -----------------------------
  // FILTRADOS
  // -----------------------------
  // Filtrado por departamento seleccionado
  const filteredMunicipalidades = selectedDepartamento 
    ? municipalidades.filter(muni => muni.departamento === selectedDepartamento) 
    : municipalidades;

  // -----------------------------
  // GRÁFICO: MUNICIPALIDADES POR DEPARTAMENTO (Bar)
  // -----------------------------
  const departamentosChartData = {
    labels: departamentos,
    datasets: [
      {
        label: 'Total Municipalidades',
        data: departamentos.map(dep => totalMunicipalidadesPorDepartamento[dep] || 0),
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        borderColor: 'rgba(53, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: 'Municipalidades Contactadas',
        data: departamentos.map(dep => municipalidadesContactadasPorDepartamento[dep] || 0),
        backgroundColor: 'rgba(138,221,45,0.8)',
        borderColor: 'rgba(138,221,45,0.8)',
        borderWidth: 1,
      },
    ],
  };

  // -----------------------------
  // NUEVO GRÁFICO: MUNICIPALIDADES CONTACTADAS POR NIVEL
  // -----------------------------
  // Asumiendo que municipalidades tengan un campo "nivel"
  const contactedSet = new Set(
    contactos.map(c => c.id_municipalidad).filter(Boolean)
  );
  
  // Filtramos por departamento seleccionado si existe
  const contactedMunicipalitiesData = municipalidades
    .filter(m => contactedSet.has(m.id_municipalidad))
    .filter(m => selectedDepartamento ? m.departamento === selectedDepartamento : true);
  
  // Agrupamos por nivel
  const countsByNivel = {};
  contactedMunicipalitiesData.forEach(m => {
    const nivel = m.nivel || 'Sin Nivel';
    if (!countsByNivel[nivel]) {
      countsByNivel[nivel] = 0;
    }
    countsByNivel[nivel]++;
  });
  
  const nivelLabels = Object.keys(countsByNivel).sort();
  const nivelCounts = nivelLabels.map(n => countsByNivel[n]);

  const nivelChartData = {
    labels: nivelLabels,
    datasets: [
      {
        label: 'Municipalidades Contactadas',
        data: nivelCounts,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
      },
    ],
  };

  // -----------------------------
  // OBTENER DATOS DE MUNICIPALIDADES CONTACTADAS CON ÚLTIMA INTERACCIÓN
  // -----------------------------
  // Obtener las municipalidades contactadas con su última interacción
  const getMunicipalidadesContactadas = () => {
    // Filtrar municipalidades según departamento seleccionado
    const filteredMunis = selectedDepartamento 
      ? municipalidades.filter(m => m.departamento === selectedDepartamento)
      : municipalidades;
    
    // Obtener solo las que han sido contactadas
    const contactadasMunis = filteredMunis.filter(m => 
      contactos.some(c => c.id_municipalidad === m.id_municipalidad)
    );
    
    // Para cada municipalidad contactada, buscar su última interacción
    return contactadasMunis.map(muni => {
      // Encontrar todos los eventos relacionados con esta municipalidad
      const relatedEvents = eventos.filter(e => e.id_municipalidad === muni.id_municipalidad);
      
      // Si no hay eventos, devolver datos básicos
      if (relatedEvents.length === 0) {
        return {
          id: muni.id_municipalidad,
          nombre: muni.nombre,
          ultimaInteraccion: 'Sin interacciones',
          fecha: null
        };
      }
      
      // Ordenar eventos por fecha (más reciente primero)
      const sortedEvents = [...relatedEvents].sort((a, b) => 
        new Date(b.fecha || 0) - new Date(a.fecha || 0)
      );
      
      // Obtener el evento más reciente
      const lastEvent = sortedEvents[0];
      
      // Encontrar el estado de seguimiento para este evento
      const estadoSeg = estadosSeguimiento.find(es => es.id_estado === lastEvent.id_estado || es.id === lastEvent.estado_seguimiento_id);
      
      // Descripción del estado
      const estadoDesc = estadoSeg && estadoSeg.id_estado_ref
        ? estados.find(e => e.id_estado === estadoSeg.id_estado_ref)?.descripcion || 'Desconocido'
        : 'Desconocido';
      
      return {
        id: muni.id_municipalidad,
        nombre: muni.nombre,
        ultimaInteraccion: estadoDesc,
        fecha: lastEvent.fecha ? new Date(lastEvent.fecha) : null
      };
    })
    .filter(m => m.fecha) // Filtrar solo las que tienen fecha
    .sort((a, b) => b.fecha - a.fecha); // Ordenar por fecha más reciente
  };
  
  const municipalidadesContactadasConInteraccion = getMunicipalidadesContactadas();

  // -----------------------------
  // GRÁFICO: PROGRESO EN EL TIEMPO (Line)
  // -----------------------------
  const filteredInteractionsSeries = selectedDepartamento
    ? estadosSeguimiento.filter(estado => {
        const evento = eventos.find(e => e.id_evento === estado.id_evento);
        if (!evento) return false;
        
        const muni = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad);
        return muni && muni.departamento === selectedDepartamento;
      })
    : estadosSeguimiento;
  
  const interactionsByDate = {};
  filteredInteractionsSeries.forEach(interaction => {
    if (!interaction.fecha) return;
    const dateKey = new Date(interaction.fecha).toISOString().split('T')[0];
    if (!interactionsByDate[dateKey]) {
      interactionsByDate[dateKey] = 0;
    }
    interactionsByDate[dateKey]++;
  });
  const sortedDates = Object.keys(interactionsByDate).sort((a, b) => new Date(a) - new Date(b));
  const progressChartData = {
    labels: sortedDates,
    datasets: [
      {
        label: 'Total de Interacciones',
        data: sortedDates.map(d => interactionsByDate[d]),
        fill: false,
        borderColor: 'rgba(75, 192, 192, 1)',
        tension: 0.1,
      }
    ]
  };
  const progressChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' }
    },
    scales: {
      x: {
        title: { display: true, text: 'Fecha' }
      },
      y: {
        title: { display: true, text: 'Cantidad de Interacciones' },
        beginAtZero: true
      }
    }
  };

  // -----------------------------
  // TABLA DE ÚLTIMOS 10 ESTADOS SEGUIMIENTOS
  // -----------------------------
  const last10StatesData = [...eventos]
    .filter(e => e.fecha)
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 10)
    .map(e => {
      const muni = municipalidades.find(m => m.id_municipalidad === e.id_municipalidad);
      const state = estadosSeguimiento.find(
        es => es.id_estado === e.id_estado || es.id === e.estado_seguimiento_id
      );
      return {
        fecha: e.fecha,
        municipalidad: muni ? muni.nombre : 'No disponible',
        estado: state ? (state.nombre || state.descripcion) : 'No disponible',
        tipoReunion: e.tipo_evento || 'No disponible',
        eventoId: e.id_evento || e.id, 
      };
    });

    const handleViewState = async (eventoId) => {
      if (!eventoId) return;
    
      try {
        // 1️⃣ Obtener los detalles del evento
        const response = await api.get(`eventos/${eventoId}`);
        const evento = response.data;
    
        if (!evento) {
          console.error('No se encontró el evento.');
          return;
        }
    
        // 2️⃣ Buscar la municipalidad asociada al evento
        const municipalidad = municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad) || null;
    
        // 3️⃣ Buscar el contacto asociado al evento
        const contacto = contactos.find(c => c.id_contacto === evento.id_contacto) || null;
    
        // 4️⃣ Obtener la descripción del tipo de reunión (si existe)
        let tipoReunionDesc = 'N/A';
        if (evento.id_tipo_reunion) {
          const tipoReunionRes = await api.get(`tipos-reunion/${evento.id_tipo_reunion}`);
          tipoReunionDesc = tipoReunionRes.data?.descripcion || 'N/A';
        }
    
        // 5️⃣ Guardar los datos en el estado
        setSelectedInteraction({
          ...evento,
          tipoReunionDesc,
          municipalidad,
          contacto
        });
    
        // 6️⃣ Mostrar el modal
        setViewDialogVisible(true);
      } catch (error) {
        console.error('Error al obtener detalles del evento:', error);
      }
    };
    const lastStatesColumns = [
      {
        field: 'fecha',
        header: 'Fecha',
        body: (row) => formatDate(row.fecha),
      },
      {
        field: 'municipalidad',
        header: 'Nombre Municipalidad',
        body: (row) => {
          const evento = eventos.find(e => e.id_evento === row.eventoId);
          const municipalidad = evento ? municipalidades.find(m => m.id_municipalidad === evento.id_municipalidad) : null;
          return municipalidad ? municipalidad.nombre : 'N/A';
        }
      },
      {
        field: 'estado',
        header: 'Estado',
        body: (row) => (
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${row.estado === 'ESTADO 01' ? 'bg-green-100 text-green-800' :
              row.estado === 'ESTADO 02' ? 'bg-yellow-100 text-yellow-800' :
              row.estado === 'ESTADO 03' ? 'bg-blue-100 text-blue-800' :
              row.estado === 'ESTADO 04' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}
          >
            {row.estado}
          </span>
        ),
      },
      {
        field: 'tipoReunion',
        header: 'Tipo de Reunion',
        body: (row) => row.tipoReunion || 'N/A'
      },
      {
        field: 'visualizar',
        header: 'Visualizar',
        body: (row) => (
          <button
            onClick={() => handleViewState(row.eventoId)}
            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
          >
            Visualizar
          </button>
        )
      }
    ];

  // -----------------------------
  // CÁLCULOS PARA LA TABLA DE INTERACCIONES
  // -----------------------------
  // Definición de columnas para la tabla de interacciones
  const interaccionesColumns = [
    {
      field: 'fecha',
      header: 'Fecha',
      sortable: true,
      filterable: true,
      hideOnMobile: true,
      body: (item) => new Date(item.fecha).toLocaleDateString()
    },
    {
      field: 'municipalidad',
      header: 'Municipalidad',
      sortable: true,
      filterable: true,
      body: (item) => item.municipalidad ? item.municipalidad.nombre : 'N/A'
    },
    {
      field: 'contacto',
      header: 'Contacto',
      sortable: true,
      filterable: true,
      hideOnMobile: true,
      body: (item) => item.contacto ? item.contacto.nombre_completo : 'N/A'
    },
    {
      field: 'estado',
      header: 'Estado',
      sortable: true,
      filterable: true,
      body: (item) => (
        <span
          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
            ${
              item.id_estado_ref === 1 // Completado
                ? 'bg-green-100 text-green-800'
                : item.id_estado_ref === 2 // En Proceso
                ? 'bg-yellow-100 text-yellow-800'
                : item.id_estado_ref === 3 // Pendiente
                ? 'bg-blue-100 text-blue-800'
                : item.id_estado_ref === 4 // Cancelado
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
        >
          {item.estado_desc || 'N/A'}
        </span>
      )
    },
    {
      field: 'fecha_compromiso',
      header: 'Fecha Compromiso',
      sortable: true,
      filterable: true,
      hideOnMobile: true,
      body: (item) => item.fecha_compromiso 
        ? new Date(item.fecha_compromiso).toLocaleDateString()
        : 'N/A'
    }
  ];

  // Función para preparar los datos de interacciones para la tabla
  const getFilteredInteracciones = () => {
    const interacciones = estadosSeguimiento
      .filter((estado) => {
        // Filtrar por departamento seleccionado
        if (selectedDepartamento) {
          const evento = eventos.find((e) => e.id_evento === estado.id_evento);
          if (!evento) return false;
          
          const muni = municipalidades.find(
            (m) => m.id_municipalidad === evento.id_municipalidad
          );
          
          return muni && muni.departamento === selectedDepartamento;
        }
        
        return true;
      })
      .map((estado) => {
        const evento = eventos.find((e) => e.id_evento === estado.id_evento);
        const municipalidad = evento &&
          municipalidades.find(
            (m) => m.id_municipalidad === evento.id_municipalidad
          );
        const contacto = contactos.find((c) => c.id_contacto === estado.id_contacto);
        
        return {
          ...estado,
          evento,
          municipalidad,
          contacto,
          estado_desc: estados.find(e => e.id_estado === estado.id_estado_ref)?.descripcion || 'N/A'
        };
      });

    // Filtrado por campo de búsqueda
    let filteredData = interacciones;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredData = interacciones.filter(item => {
        const municipalidadNombre = item.municipalidad?.nombre?.toLowerCase() || '';
        const contactoNombre = item.contacto?.nombre_completo?.toLowerCase() || '';
        const estadoDesc = item.estado_desc?.toLowerCase() || '';
        
        return municipalidadNombre.includes(query) || 
               contactoNombre.includes(query) || 
               estadoDesc.includes(query) ||
               (item.descripcion && item.descripcion.toLowerCase().includes(query));
      });
    }
    
    // Ordenamiento
    if (sortField) {
      filteredData.sort((a, b) => {
        let valA, valB;
        
        if (sortField === 'municipalidad') {
          valA = a.municipalidad?.nombre?.toLowerCase() || '';
          valB = b.municipalidad?.nombre?.toLowerCase() || '';
        } else if (sortField === 'contacto') {
          valA = a.contacto?.nombre_completo?.toLowerCase() || '';
          valB = b.contacto?.nombre_completo?.toLowerCase() || '';
        } else if (sortField === 'estado') {
          valA = a.estado_desc?.toLowerCase() || '';
          valB = b.estado_desc?.toLowerCase() || '';
        } else {
          valA = a[sortField] || '';
          valB = b[sortField] || '';
        }
        
        if (typeof valA === 'string') {
          const compareResult = valA.localeCompare(valB);
          return sortOrder === 'asc' ? compareResult : -compareResult;
        } else {
          const compareResult = valA > valB ? 1 : valA < valB ? -1 : 0;
          return sortOrder === 'asc' ? compareResult : -compareResult;
        }
      });
    }
    
    return filteredData;
  };

  // Memoizar las interacciones filtradas para evitar cálculos innecesarios
  const filteredInteracciones = useMemo(() => {
    return getFilteredInteracciones();
  }, [estadosSeguimiento, eventos, municipalidades, contactos, selectedDepartamento, searchQuery, sortField, sortOrder]);

  // Obtener datos filtrados para cálculos
  const totalInteraccionesRecords = filteredInteracciones.length;
  const totalInteraccionesPages = Math.ceil(totalInteraccionesRecords / itemsPerPage);
  
  // Aplicar paginación a los datos filtrados
  const paginatedInteracciones = filteredInteracciones.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Ordenamiento para la tabla de interacciones
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  // Renderizar botones de acciones
  const renderInteraccionActions = (item) => {
    return (
      <button
        onClick={() => {
          setSelectedInteraction(item);
          setViewDialogVisible(true);
        }}
        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg transition duration-150 ease-in-out"
      >
        <FiEye className="mr-1" /> Ver
      </button>
    );
  };

  // -----------------------------
  // OPCIONES COMUNES DE GRÁFICO
  // -----------------------------
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return context.parsed.y;
          }
        }
      }
    },
  };

  // -----------------------------
  // ORDEN DESC Y PAGINACIÓN DE LA TABLA DEPARTAMENTOS
  // -----------------------------
  // Ordenar departamentos por % de avance (desc)
  const sortedDepartamentos = [...departamentos].sort((a, b) => {
    const avanceA = porcentajeAvancePorDepartamento[a] || 0;
    const avanceB = porcentajeAvancePorDepartamento[b] || 0;
    return avanceB - avanceA; // mayor a menor
  });

  // Paginación local
  const totalPages = Math.ceil(sortedDepartamentos.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const displayedDepartamentos = sortedDepartamentos.slice(startIndex, endIndex);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // Obtener color para la barra de avance
  const getAvanceColor = (valor) => {
    if (valor <= 20) return 'bg-red-600';
    if (valor <= 50) return 'bg-amber-500';
    if (valor <= 75) return 'bg-blue-600';
    return 'bg-green-600';
  };

  // -----------------------------
  // RENDER PRINCIPAL
  // -----------------------------
  return (
    <>
      {/* Componente para Imprimir */}
      <div id="print-section" style={{ position: 'absolute', left: '-9999px' }}>
        <PrintableInteraccionesReport 
          ref={printComponentRef}
          interacciones={filteredInteracciones}
          municipalidades={municipalidades}
          eventos={eventos}
          contactos={contactos}
          estados={estados}
          selectedDepartamento={selectedDepartamento}
        />
      </div>

      {/* Contenido del Dashboard (lo que se va a imprimir) */}
      <div id="print-area" className="p-6 max-w-full">
        {/* Encabezado y filtros */}
        <div className="flex flex-wrap items-center justify-between mb-6">
          <div className="w-full md:w-auto mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-gray-800">Dashboard por Departamentos</h1>
            <p className="text-sm text-gray-600">
              Última actualización: {lastUpdateDate ? formatDate(lastUpdateDate) : 'Nunca'}
              <button 
                onClick={loadData} 
                className="ml-2 text-blue-600 hover:text-blue-800 focus:outline-none text-xs"
              >
                Actualizar
              </button>

            </p>
          </div>

          <div className="w-full md:w-auto flex space-x-2">
            {/* Filtro de Departamento */}
            <div className="relative">
              <select 
                className="appearance-none rounded-lg border border-gray-300 bg-white pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedDepartamento}
                onChange={(e) => {
                  setSelectedDepartamento(e.target.value);
                  setCurrentPage(1); // Resetear paginación al cambiar el filtro
                }}
              >
                <option value="">Todos los departamentos</option>
                {departamentos.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                <FiFilter />
              </div>
            </div>
            
            <button 
              onClick={() => setSelectedDepartamento('')} 
              className="bg-gray-200 text-gray-700 rounded-lg px-3 py-2 text-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              Limpiar
            </button>
            
            <button 
              onClick={loadData} 
              className="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <FiRefreshCw className="mr-1" /> Actualizar
            </button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total Municipalidades */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total de Municipalidades</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedDepartamento
                    ? totalMunicipalidadesPorDepartamento[selectedDepartamento] || 0
                    : getTotalMunicipalidades()}
                </h3>
              </div>
              <span className="bg-blue-100 p-3 rounded-full">
                <FiUsers className="text-blue-500 text-xl" />
              </span>
            </div>
          </div>

          {/* Municipalidades Contactadas */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Municipalidades Contactadas</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedDepartamento
                    ? municipalidadesContactadasPorDepartamento[selectedDepartamento] || 0
                    : getTotalContactadas()}
                </h3>
              </div>
              <span className="bg-green-100 p-3 rounded-full">
                <FiUsers className="text-green-500 text-xl" />
              </span>
            </div>
          </div>

          {/* Porcentaje Avance */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Porcentaje de Avance</p>
                <h3 className="text-3xl font-bold text-gray-800">
                  {selectedDepartamento
                    ? (porcentajeAvancePorDepartamento[selectedDepartamento] || 0).toFixed(2)
                    : getPorcentajeAvance().toFixed(2)}%
                </h3>
              </div>
              <span className="bg-yellow-100 p-3 rounded-full">
                <FiActivity className="text-yellow-500 text-xl" />
              </span>
            </div>
          </div>
        </div>

        {/* Mapa y gráfico de municipalidades por departamento */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Mapa de Perú con leyenda fija */}
          <div className="bg-white p-6 rounded-lg shadow relative">
            <h3 className="text-lg font-semibold mb-4">Mapa de Avance por Departamento</h3>
            <div className="h-80 relative">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  <PeruMap 
                    departamentosData={porcentajeAvancePorDepartamento}
                    onSelectDepartamento={setSelectedDepartamento}
                    selectedDepartamento={selectedDepartamento}
                  />
                  {/* Leyenda fija dentro del contenedor */}
                  <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow text-sm">
                    <p className="font-bold mb-1">Avance:</p>
                    <ul>
                      <li>
                        <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
                        0-25%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-orange-500 mr-2"></span>
                        25-50%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
                        50-75%
                      </li>
                      <li>
                        <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
                        75-100%
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Gráfico de barras: Municipalidades por departamento */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">
              {selectedDepartamento 
                ? `Municipalidades Contactadas en ${selectedDepartamento}` 
                : 'Municipalidades por Departamento'}
            </h3>
            <div className="h-80 overflow-y-auto">
              {loading ? (
                <LoadingSpinner />
              ) : (
                selectedDepartamento ? (
                  municipalidadesContactadasConInteraccion.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Municipalidad
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Última Interacción
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Fecha
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {municipalidadesContactadasConInteraccion.map((muni) => (
                            <tr key={muni.id} className="hover:bg-gray-50">
                              <td className="px-6 py-3 text-sm text-gray-900">{muni.nombre}</td>
                              <td className="px-6 py-3 text-sm text-gray-500">{muni.ultimaInteraccion}</td>
                              <td className="px-6 py-3 text-sm text-gray-500">
                                {muni.fecha ? formatDate(muni.fecha) : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-500">No hay municipalidades contactadas en este departamento</p>
                    </div>
                  )
                ) : (
                  <Bar data={departamentosChartData} options={chartOptions} />
                )
              )}
            </div>
          </div>
        </div>

        {/* Gráficos adicionales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* NUEVO: Municipalidades Contactadas por Nivel */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Municipalidades Contactadas por Nivel</h3>
            <div className="h-80">
              {loading ? (
                <LoadingSpinner />
              ) : (
                nivelLabels.length > 0 ? (
                  <Bar data={nivelChartData} options={chartOptions} />
                ) : (
                  <div className="flex justify-center items-center h-full">
                    <p className="text-gray-500">No hay municipalidades con nivel definido o no se han contactado</p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Progreso en el Tiempo */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Progreso en el Tiempo</h3>
            <div className="h-80">
              {loading ? (
                <LoadingSpinner />
              ) : sortedDates.length > 0 ? (
                <Line data={progressChartData} options={progressChartOptions} />
              ) : (
                <p className="text-gray-500 flex items-center justify-center h-full">
                  Datos no disponibles
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tabla de estadísticas por departamento/provincia */}
        <div className="bg-white p-6 rounded-lg shadow mb-6 overflow-x-auto">
          <h3 className="text-lg font-semibold mb-4">
            {selectedDepartamento 
              ? `Estadísticas por Provincia en ${selectedDepartamento}` 
              : "Estadísticas por Departamento"}
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 border-b">
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {selectedDepartamento ? "Provincia" : "Departamento"}
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Municipalidades
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contactadas
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Avance
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="py-4 px-4 text-center">
                      <LoadingSpinner />
                    </td>
                  </tr>
                ) : selectedDepartamento ? (
                  // Mostrar estadísticas por provincia del departamento seleccionado
                  provinciasArrayPorDepartamento[selectedDepartamento] && 
                  provinciasArrayPorDepartamento[selectedDepartamento].length > 0 ? (
                    provinciasArrayPorDepartamento[selectedDepartamento].map(prov => {
                      const avance = porcentajeAvancePorProvincia[prov] || 0;
                      const colorBar = getAvanceColor(avance);
                      return (
                        <tr key={prov} className="hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {prov}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {totalMunicipalidadesPorProvincia[prov] || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {municipalidadesContactadasPorProvincia[prov] || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="mr-2">{avance.toFixed(2)}%</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`${colorBar} h-2.5 rounded-full`}
                                  style={{ width: `${avance}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                        No hay datos de provincias disponibles para {selectedDepartamento}
                      </td>
                    </tr>
                  )
                ) : (
                  // Mostrar estadísticas por departamento
                  sortedDepartamentos.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 px-4 text-center text-gray-500">
                        No hay datos disponibles
                      </td>
                    </tr>
                  ) : (
                    displayedDepartamentos.map(dep => {
                      const avance = porcentajeAvancePorDepartamento[dep] || 0;
                      const colorBar = getAvanceColor(avance);
                      return (
                        <tr
                          key={dep}
                          className={`hover:bg-gray-50 ${selectedDepartamento === dep ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedDepartamento(dep)}
                        >
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {dep}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {totalMunicipalidadesPorDepartamento[dep] || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            {municipalidadesContactadasPorDepartamento[dep] || 0}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <span className="mr-2">{avance.toFixed(2)}%</span>
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div
                                  className={`${colorBar} h-2.5 rounded-full`}
                                  style={{ width: `${avance}%` }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Botones de paginación solo se muestran para la vista de departamentos */}
          {!loading && !selectedDepartamento && sortedDepartamentos.length > 10 && (
            <div className="flex justify-end items-center mt-4 space-x-2">
              <button
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded-md border text-sm ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Anterior
              </button>
              <span className="text-sm text-gray-500">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded-md border text-sm ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-400' 
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                Siguiente
              </button>
            </div>
          )}
        </div>

        {/* Últimas Interacciones */}
        <div id="print-section" className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Últimas Interacciones</h3>
            <div className="flex space-x-2">
              <button
                onClick={handlePrintInteracciones}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FiPrinter className="mr-2" />
                ReactToPrint
              </button>
              <button
                onClick={imprimirInteraccionesSinLibreria}
                className="flex items-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                <FiPrinter className="mr-2" />
                Imprimir Tradicional
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {/* Tabla usando el componente Table */}
            <Table
              data={paginatedInteracciones}
              columns={interaccionesColumns}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              searchQuery={searchQuery}
              onSearch={(value) => {
                setSearchQuery(value);
                setCurrentPage(1); // Resetear a primera página cuando se busca
              }}
              loading={loading}
              emptyMessage="No hay interacciones recientes"
              actions={renderInteraccionActions}
              isMobile={window.innerWidth < 768}
              mobileColumns={['municipalidad', 'estado', 'acciones']}
            />
            
            {/* Paginación */}
            {totalInteraccionesRecords > 0 && (
              <div className="mt-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalInteraccionesPages}
                  onPageChange={setCurrentPage}
                  totalItems={totalInteraccionesRecords}
                  itemsPerPage={itemsPerPage}
                  onItemsPerPageChange={setItemsPerPage}
                />
              </div>
            )}
          </div>
        </div>

        {/* Modal para ver detalle de interacción */}
        <Modal
          isOpen={viewDialogVisible}
          onClose={() => setViewDialogVisible(false)}
          title="Detalle de Interacción"
          size="lg"
          footer={
            <div className="flex justify-end">
              <button
                onClick={() => setViewDialogVisible(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
              >
                Cerrar
              </button>
            </div>
          }
        >
          {selectedInteraction && (
            <div className="space-y-4">
              <div className="border-b pb-3">
                <div className="text-sm font-medium text-gray-500">Municipalidad</div>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedInteraction.municipalidad ? selectedInteraction.municipalidad.nombre : 'N/A'}
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="text-sm font-medium text-gray-500">Contacto</div>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedInteraction.contacto ? selectedInteraction.contacto.nombre_completo : 'N/A'}
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="text-sm font-medium text-gray-500">Estado</div>
                <div className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${
                        selectedInteraction.estado_desc === 'Completado'
                          ? 'bg-green-100 text-green-800'
                          : selectedInteraction.estado_desc === 'En Proceso'
                          ? 'bg-yellow-100 text-yellow-800'
                          : selectedInteraction.estado_desc === 'Pendiente'
                          ? 'bg-blue-100 text-blue-800'
                          : selectedInteraction.estado_desc === 'Cancelado'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                  >
                    {selectedInteraction.estado_desc}
                  </span>
                </div>
              </div>
              
              <div className="border-b pb-3">
                <div className="text-sm font-medium text-gray-500">Fecha</div>
                <div className="mt-1 text-sm text-gray-900">
                  {formatDate(selectedInteraction.fecha)}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-gray-500">Descripción</div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedInteraction.descripcion || 'Sin descripción'}
                </div>
              </div>
              <div className="border-b pb-3">
                <div className="text-sm font-medium text-gray-500">Fecha Compromiso</div>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedInteraction.fecha_compromiso ? formatDate(selectedInteraction.fecha_compromiso) : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-500">Compromiso</div>
                <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                  {selectedInteraction.compromiso || 'Sin compromiso'}
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </>
  );
};

export default DashboardDepartamentos;

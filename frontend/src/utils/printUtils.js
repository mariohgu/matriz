import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Genera un PDF con información de interacciones
 * @param {Object} options - Opciones de configuración
 * @param {Array} options.municipalidades - Lista de municipalidades
 * @param {Array} options.eventos - Lista de eventos
 * @param {Array} options.estadosSeguimiento - Lista de estados de seguimiento
 * @param {Array} options.contactos - Lista de contactos
 * @param {string} options.selectedDepartamento - Departamento seleccionado (o vacío para todos)
 * @param {Function} options.onComplete - Función a llamar cuando se complete la generación
 */
export const generateInteraccionesPDF = async ({
  municipalidades = [],
  eventos = [],
  estadosSeguimiento = [],
  contactos = [],
  selectedDepartamento = '',
  onComplete = null
}) => {
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
        // Cabecera de interacciones
        styles.normal();
        pdf.text("Interacciones:", margin + 5, yPos);
        yPos += 5;
        
        // Tabla de interacciones
        const interaccionesData = interaccionesEvento.map(interaccion => {
          const estadoName = interaccion.estado_seguimiento || 'No especificado';
          const fechaInteraccion = interaccion.fecha 
            ? new Date(interaccion.fecha).toLocaleDateString('es-ES') 
            : 'No especificada';
          
          return [
            fechaInteraccion,
            estadoName,
            interaccion.observacion || 'Sin observaciones'
          ];
        });
        
        autoTable(pdf, {
          startY: yPos,
          margin: { left: margin + 10 },
          tableWidth: contentWidth - 20,
          styles: { fontSize: 8, cellPadding: 2 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0], fontStyle: 'bold' },
          head: [['Fecha', 'Estado', 'Observación']],
          body: interaccionesData,
          theme: 'grid',
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 35 }
          }
        });
        
        // Actualizar posición Y después de la tabla
        yPos = pdf.lastAutoTable.finalY + 15;
      } else {
        styles.small();
        pdf.text("No hay interacciones registradas para este evento.", margin + 10, yPos);
        yPos += 15;
      }
    }
  }
  
  // Agregar pie de página con número de página
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    styles.small();
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Generar PDF
  pdf.save("reporte_interacciones.pdf");
  
  // Llamar a la función de callback si existe
  if (onComplete && typeof onComplete === 'function') {
    onComplete();
  }
  
  return pdf; // Devolver el objeto PDF por si se necesita para algo más
};

/**
 * Función más simple para generar PDF con una tabla de datos general
 * @param {Object} options - Opciones de configuración
 * @param {string} options.title - Título del reporte
 * @param {Array} options.headers - Cabeceras de la tabla ['Col1', 'Col2', ...]
 * @param {Array} options.data - Datos para la tabla [[val1, val2], [val1, val2], ...]
 * @param {Function} options.onComplete - Función a llamar cuando se complete la generación
 * @param {string} options.filename - Nombre del archivo PDF (sin extensión)
 */
export const generateTablePDF = ({
  title = 'Reporte',
  subtitle = '',
  headers = [],
  data = [],
  onComplete = null,
  filename = 'reporte'
}) => {
  const pdf = new jsPDF("p", "mm", "a4");
  
  // Configuración básica
  const margin = 15;
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  
  // Encabezado
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text(title.toUpperCase(), pageWidth / 2, margin, { align: "center" });
  
  // Subtítulo si existe
  if (subtitle) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(subtitle, pageWidth / 2, margin + 8, { align: "center" });
  }
  
  // Fecha del reporte
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.text("Fecha del reporte: " + new Date().toLocaleDateString('es-ES'), pageWidth / 2, margin + 16, { align: "center" });
  
  // Tabla principal
  autoTable(pdf, {
    startY: margin + 25,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [70, 70, 70], textColor: [255, 255, 255] },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: margin, right: margin }
  });
  
  // Agregar pie de página con número de página
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }
  
  // Guardar PDF
  pdf.save(`${filename}.pdf`);
  
  // Llamar a la función de callback si existe
  if (onComplete && typeof onComplete === 'function') {
    onComplete();
  }
  
  return pdf;
};

import React from 'react';

// Nota: No usamos forwardRef aquí, ya que lo manejaremos de otra manera
const InteraccionesReport = ({
  interacciones = [],
  municipalidades = [],
  eventos = [],
  contactos = [],
  estados = [],
  selectedDepartamento = ''
}) => {
  console.log("InteraccionesReport Props:", { interacciones, municipalidades, eventos, contactos, estados, selectedDepartamento });
  
  return (
    <div className="print-container" style={{ padding: '20px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 'bold', textAlign: 'center' }}>
        Informe de Interacciones
      </h1>
      {selectedDepartamento && (
        <h2 style={{ fontSize: '16px', textAlign: 'center' }}>
          Departamento: {selectedDepartamento}
        </h2>
      )}
      
      <p>Total de interacciones: {interacciones.length}</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Municipalidad</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Contacto</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Fecha</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Estado</th>
            <th style={{ border: '1px solid #ddd', padding: '8px' }}>Descripción</th>
          </tr>
        </thead>
        <tbody>
          {interacciones.map((interaccion, index) => (
            <tr key={index}>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {interaccion.municipalidad?.nombre || 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {interaccion.contacto?.nombre_completo || 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {interaccion.fecha ? new Date(interaccion.fecha).toLocaleDateString() : 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {interaccion.estado_desc || 'N/A'}
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                {interaccion.descripcion || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default InteraccionesReport;

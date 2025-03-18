import React, { forwardRef } from 'react';
import InteraccionesReport from './InteraccionesReport';

// Convertimos el componente de clase a un componente funcional con forwardRef
const PrintableInteraccionesReport = forwardRef((props, ref) => {
  const { 
    interacciones, 
    municipalidades, 
    eventos, 
    contactos, 
    estados, 
    selectedDepartamento 
  } = props;

  return (
    <div className="printable-component" ref={ref} style={{ width: '100%', minHeight: '500px', padding: '20px' }}>
      <InteraccionesReport 
        interacciones={interacciones}
        municipalidades={municipalidades}
        eventos={eventos}
        contactos={contactos}
        estados={estados}
        selectedDepartamento={selectedDepartamento}
      />
    </div>
  );
});

export default PrintableInteraccionesReport;

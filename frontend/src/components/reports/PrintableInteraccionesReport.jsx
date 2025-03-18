import React, { Component } from 'react';
import InteraccionesReport from './InteraccionesReport';

class PrintableInteraccionesReport extends Component {
  render() {
    const { 
      interacciones, 
      municipalidades, 
      eventos, 
      contactos, 
      estados, 
      selectedDepartamento 
    } = this.props;
  
    return (
      <div className="printable-component" style={{ width: '100%', minHeight: '500px', padding: '20px' }}>
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
  }
}

export default PrintableInteraccionesReport;

import React from 'react';
import * as XLSX from 'xlsx';
import { PiMicrosoftExcelLogoFill } from "react-icons/pi";

/**
 * Componente para exportar datos a Excel
 * @param {Object} props
 * @param {Array} props.data - Datos a exportar
 * @param {Array} props.columns - Columnas a exportar
 * @param {string} props.filename - Nombre del archivo Excel
 * @param {string} props.buttonText - Texto del botón (opcional)
 * @param {string} props.buttonClass - Clases CSS para el botón (opcional)
 */
const ExcelExport = ({ 
  data, 
  columns, 
  filename = 'export.xlsx',
  buttonText = 'Exportar a Excel',
  buttonClass = 'bg-green-600 hover:bg-green-700 text-white'
}) => {
  const exportToExcel = () => {
    // Preparar los datos para exportar
    const exportData = data.map(row => {
      const rowData = {};
      columns.forEach(column => {
        const value = column.body ? column.body(row) : row[column.field];
        rowData[column.header] = value || '';
      });
      return rowData;
    });

    // Crear libro de Excel
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Datos");

    // Ajustar el ancho de las columnas
    const colWidths = columns.map(() => ({ wch: 20 }));
    ws['!cols'] = colWidths;

    // Descargar el archivo
    XLSX.writeFile(wb, filename);
  };

  return (
    <button
      onClick={exportToExcel}
      className={`px-4 py-2 rounded-md flex items-center gap-2 ${buttonClass}`}
    >
      <PiMicrosoftExcelLogoFill className="h-4 w-4" />
      {buttonText}
    </button>
  );
};

export default ExcelExport; 
import React, { useState } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { Table, Modal } from './index';

const MunicipalidadesDetails = ({
  isOpen,
  onClose,
  provincia,
  municipalidades = [],
  eventos = [],
  departamento = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filtrar las municipalidades por provincia y departamento (si está seleccionado)
  const filteredMunicipalities = municipalidades.filter(muni => {
    return (
      muni.provincia === provincia &&
      (departamento ? muni.departamento === departamento : true) &&
      (searchQuery === '' || muni.nombre.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  // Ordenar las municipalidades
  const sortedMunicipalities = [...filteredMunicipalities].sort((a, b) => {
    let valA = a[sortField] || '';
    let valB = b[sortField] || '';
    
    if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = valB.toLowerCase();
      const result = valA.localeCompare(valB);
      return sortOrder === 'asc' ? result : -result;
    } else {
      const result = valA > valB ? 1 : valA < valB ? -1 : 0;
      return sortOrder === 'asc' ? result : -result;
    }
  });

  // Revisar si una municipalidad ha sido contactada
  const isContactada = (municipalidadId) => {
    return eventos.some(evento => evento.id_municipalidad === municipalidadId);
  };

  // Convertir a formato para la tabla
  const tableData = sortedMunicipalities.map(muni => ({
    ...muni,
    contactada: isContactada(muni.id_municipalidad)
  }));

  // Definir columnas para la tabla
  const columns = [
    {
      field: 'nombre',
      header: 'Municipalidad',
      sortable: true,
      filterable: true
    },
    {
      field: 'ubigeo',
      header: 'Ubigeo',
      sortable: true,
      filterable: true
    },
    {
      field: 'nivel',
      header: 'Nivel',
      sortable: true,
      filterable: true
    },
    {
      field: 'contactada',
      header: 'Contactada',
      sortable: true,
      filterable: true,
      body: (rowData) => (
        <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none rounded-full ${
          rowData.contactada 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
        }`}>
          {rowData.contactada ? 'Sí' : 'No'}
        </span>
      )
    }
  ];

  // Manejar cambios en el ordenamiento
  const handleSort = (field, order) => {
    setSortField(field);
    setSortOrder(order);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Municipalidades en ${provincia}`}
      size="xl"
      footer={
        <div className="flex justify-end">
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium"
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Información general */}
        <div className="mb-4">
          <p className="text-gray-700">
            <span className="font-medium">Provincia:</span> {provincia}
          </p>
          {departamento && (
            <p className="text-gray-700">
              <span className="font-medium">Departamento:</span> {departamento}
            </p>
          )}
          <p className="text-gray-700">
            <span className="font-medium">Total municipalidades:</span> {tableData.length}
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Contactadas:</span> {tableData.filter(m => m.contactada).length} ({
              tableData.length > 0
                ? Math.round((tableData.filter(m => m.contactada).length / tableData.length) * 100)
                : 0
            }%)
          </p>
        </div>

        {/* Búsqueda */}
        <div className="relative">
          <input
            type="text"
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar municipalidad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              onClick={() => setSearchQuery('')}
            >
              <FiX className="h-5 w-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <Table
            data={tableData}
            columns={columns}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            searchQuery={searchQuery}
            emptyMessage="No hay municipalidades disponibles"
            className="w-full"
          />
        </div>
      </div>
    </Modal>
  );
};

export default MunicipalidadesDetails;

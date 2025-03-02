import { useState, useEffect } from 'react';
import axios from 'axios';

const MunicipalidadesList = () => {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMunicipalidades = async () => {
      try {
        const response = await axios.get('https://matriz.ddev.site/api/municipalidades');
        setMunicipalidades(response.data || []); // Aseguramos que siempre sea un array
        setLoading(false);
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar las municipalidades');
        setLoading(false);
      }
    };

    fetchMunicipalidades();
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (error) return (
    <div className="text-red-500 text-center p-4">
      {error}
    </div>
  );

  if (!municipalidades || municipalidades.length === 0) return (
    <div className="text-gray-500 text-center p-4">
      No hay municipalidades para mostrar.
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Lista de Municipalidades</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {municipalidades.map((municipalidad) => (
          <div key={municipalidad.id_municipalidad} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-2">{municipalidad.nombre}</h2>
            <p className="text-gray-600 mb-2">Departamento: {municipalidad.departamento}</p>
            <p className="text-gray-600 mb-2">Provincia: {municipalidad.provincia}</p>
            <p className="text-gray-600 mb-2">Distrito: {municipalidad.distrito}</p>
            <p className="text-gray-600">Ubigeo: {municipalidad.ubigeo}</p>
            <div className="mt-4 flex justify-end space-x-2">
              <button 
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                onClick={() => {/* Implementar edición */}}
              >
                Editar
              </button>
              <button 
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                onClick={() => {/* Implementar eliminación */}}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MunicipalidadesList;

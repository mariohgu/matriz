import React from 'react';

function Dashboard() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Municipalidades</h3>
          <p className="text-3xl font-bold text-blue-600">0</p>
        </div>
        {/* Agregar más tarjetas de estadísticas según sea necesario */}
      </div>
    </div>
  );
}

export default Dashboard;

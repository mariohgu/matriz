import React, { useState, useEffect } from 'react';

const PeruMap = ({ departamentosData, onSelectDepartamento, selectedDepartamento }) => {
  // Estado para almacenar el departamento sobre el que se está pasando el ratón
  const [hoveredDepartamento, setHoveredDepartamento] = useState(null);
  
  // Definir colores basados en el porcentaje de avance
  const getColor = (departamento) => {
    if (!departamentosData || !departamentosData[departamento]) return '#e5e7eb'; // Gris si no hay datos
    
    const porcentaje = departamentosData[departamento];
    
    if (porcentaje >= 75) return '#10b981'; // Verde
    if (porcentaje >= 50) return '#3b82f6'; // Azul
    if (porcentaje >= 25) return '#f59e0b'; // Amarillo
    return '#ef4444'; // Rojo
  };
  
  // Determinar la opacidad de un departamento
  const getOpacity = (departamento) => {
    if (selectedDepartamento && selectedDepartamento !== departamento) return 0.5;
    if (hoveredDepartamento && hoveredDepartamento !== departamento) return 0.5;
    return 1;
  };

  // Diccionario de coordenadas para mostrar etiquetas de texto en el mapa
  const departamentoLabels = {
    'AMAZONAS': { x: 300, y: 160 },
    'ANCASH': { x: 260, y: 260 },
    'APURIMAC': { x: 340, y: 375 },
    'AREQUIPA': { x: 330, y: 450 },
    'AYACUCHO': { x: 320, y: 350 },
    'CAJAMARCA': { x: 250, y: 180 },
    'CALLAO': { x: 230, y: 300 },
    'CUSCO': { x: 380, y: 380 },
    'HUANCAVELICA': { x: 300, y: 340 },
    'HUANUCO': { x: 300, y: 250 },
    'ICA': { x: 270, y: 380 },
    'JUNIN': { x: 320, y: 300 },
    'LA LIBERTAD': { x: 230, y: 220 },
    'LAMBAYEQUE': { x: 220, y: 190 },
    'LIMA': { x: 250, y: 320 },
    'LORETO': { x: 380, y: 130 },
    'MADRE DE DIOS': { x: 450, y: 360 },
    'MOQUEGUA': { x: 330, y: 480 },
    'PASCO': { x: 300, y: 270 },
    'PIURA': { x: 200, y: 160 },
    'PUNO': { x: 380, y: 450 },
    'SAN MARTIN': { x: 330, y: 200 },
    'TACNA': { x: 350, y: 510 },
    'TUMBES': { x: 180, y: 130 },
    'UCAYALI': { x: 380, y: 290 }
  };

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 600 600" className="w-full h-full">
        {/* Contorno del mapa de Perú - usando un path simplificado */}
        <path 
          d="M180,130 Q200,150 220,160 Q250,180 250,220 Q240,240 230,260 Q220,280 250,300 Q270,320 260,340 Q240,360 250,380 Q270,400 290,420 Q310,450 330,480 Q350,500 370,510 Q390,500 410,480 Q430,450 450,420 Q470,390 490,360 Q510,320 530,280 Q540,240 550,200 Q560,160 570,120 Q550,100 530,80 Q500,70 470,80 Q440,100 410,130 Q380,150 350,130 Q320,120 290,130 Q260,140 230,130 Q200,120 180,130 Z"
          fill="#f3f4f6"
          stroke="#d1d5db"
          strokeWidth="2"
        />
        
        {/* Aquí se agregarían los paths detallados para cada departamento */}
        {/* Por ejemplo (usando formas muy simplificadas): */}
        
        {/* LIMA */}
        <path 
          d="M230,280 Q240,290 250,300 Q260,310 250,320 Q240,330 230,320 Q220,310 230,280 Z"
          fill={getColor('LIMA')}
          fillOpacity={getOpacity('LIMA')}
          stroke="#fff"
          strokeWidth="1"
          onMouseEnter={() => setHoveredDepartamento('LIMA')}
          onMouseLeave={() => setHoveredDepartamento(null)}
          onClick={() => onSelectDepartamento('LIMA')}
          style={{ cursor: 'pointer' }}
        />
        
        {/* AREQUIPA */}
        <path 
          d="M300,430 Q320,440 340,450 Q360,460 350,480 Q330,490 310,480 Q290,470 300,430 Z"
          fill={getColor('AREQUIPA')}
          fillOpacity={getOpacity('AREQUIPA')}
          stroke="#fff"
          strokeWidth="1"
          onMouseEnter={() => setHoveredDepartamento('AREQUIPA')}
          onMouseLeave={() => setHoveredDepartamento(null)}
          onClick={() => onSelectDepartamento('AREQUIPA')}
          style={{ cursor: 'pointer' }}
        />
        
        {/* CUSCO */}
        <path 
          d="M350,360 Q370,370 390,380 Q410,390 400,410 Q380,420 360,410 Q340,400 350,360 Z"
          fill={getColor('CUSCO')}
          fillOpacity={getOpacity('CUSCO')}
          stroke="#fff"
          strokeWidth="1"
          onMouseEnter={() => setHoveredDepartamento('CUSCO')}
          onMouseLeave={() => setHoveredDepartamento(null)}
          onClick={() => onSelectDepartamento('CUSCO')}
          style={{ cursor: 'pointer' }}
        />
        
        {/* PUNO */}
        <path 
          d="M360,420 Q380,430 400,440 Q420,450 410,470 Q390,480 370,470 Q350,460 360,420 Z"
          fill={getColor('PUNO')}
          fillOpacity={getOpacity('PUNO')}
          stroke="#fff"
          strokeWidth="1"
          onMouseEnter={() => setHoveredDepartamento('PUNO')}
          onMouseLeave={() => setHoveredDepartamento(null)}
          onClick={() => onSelectDepartamento('PUNO')}
          style={{ cursor: 'pointer' }}
        />
        
        {/* LORETO */}
        <path 
          d="M380,100 Q420,120 460,140 Q500,160 480,200 Q450,230 420,210 Q390,190 360,170 Q330,150 360,110 Q370,90 380,100 Z"
          fill={getColor('LORETO')}
          fillOpacity={getOpacity('LORETO')}
          stroke="#fff"
          strokeWidth="1"
          onMouseEnter={() => setHoveredDepartamento('LORETO')}
          onMouseLeave={() => setHoveredDepartamento(null)}
          onClick={() => onSelectDepartamento('LORETO')}
          style={{ cursor: 'pointer' }}
        />
        
        {/* Etiquetas de texto para los departamentos principales */}
        {Object.entries(departamentoLabels).map(([departamento, position]) => (
          <text
            key={departamento}
            x={position.x}
            y={position.y}
            fontSize="8"
            fontWeight={hoveredDepartamento === departamento || selectedDepartamento === departamento ? 'bold' : 'normal'}
            fill={hoveredDepartamento === departamento || selectedDepartamento === departamento ? '#000' : '#666'}
            textAnchor="middle"
            pointerEvents="none"
          >
            {departamento}
          </text>
        ))}
        
        {/* Tooltip para departamento hover */}
        {hoveredDepartamento && departamentosData && departamentosData[hoveredDepartamento] !== undefined && (
          <g>
            <rect
              x={departamentoLabels[hoveredDepartamento]?.x - 50 || 0}
              y={departamentoLabels[hoveredDepartamento]?.y - 30 || 0}
              width="100"
              height="20"
              fill="white"
              stroke="#ccc"
              rx="4"
              ry="4"
            />
            <text
              x={departamentoLabels[hoveredDepartamento]?.x || 0}
              y={departamentoLabels[hoveredDepartamento]?.y - 15 || 0}
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fill="#333"
            >
              {hoveredDepartamento}: {departamentosData[hoveredDepartamento].toFixed(2)}%
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};

export default PeruMap;

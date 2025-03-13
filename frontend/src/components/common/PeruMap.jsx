import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Importar configuración de iconos
import '../common/leaflet-icons';
import { createDepartmentIcon } from '../common/leaflet-icons';

// Nota: Necesitarás instalar: npm install react-leaflet leaflet
// También necesitarás importar los estilos CSS de Leaflet en tu index.js o App.js:
// import 'leaflet/dist/leaflet.css';

// Datos GeoJSON simplificados para Perú con departamentos
const PERU_GEO_DATA = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "LIMA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-77.1, -11.8], [-76.5, -11.8], [-76.5, -12.2], [-77.1, -12.2], [-77.1, -11.8]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "AREQUIPA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-72.5, -15.5], [-71.0, -15.5], [-71.0, -17.0], [-72.5, -17.0], [-72.5, -15.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "CUSCO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-73.5, -12.5], [-71.5, -12.5], [-71.5, -14.0], [-73.5, -14.0], [-73.5, -12.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "PUNO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-71.0, -14.0], [-69.5, -14.0], [-69.5, -17.0], [-71.0, -17.0], [-71.0, -14.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "LORETO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-77.0, -3.0], [-73.0, -3.0], [-73.0, -6.0], [-77.0, -6.0], [-77.0, -3.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "PIURA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-81.0, -4.5], [-79.5, -4.5], [-79.5, -6.0], [-81.0, -6.0], [-81.0, -4.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "LA LIBERTAD"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-79.5, -7.5], [-78.0, -7.5], [-78.0, -9.0], [-79.5, -9.0], [-79.5, -7.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "LAMBAYEQUE"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-80.5, -6.0], [-79.0, -6.0], [-79.0, -7.0], [-80.5, -7.0], [-80.5, -6.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "CAJAMARCA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-79.0, -5.5], [-77.5, -5.5], [-77.5, -7.5], [-79.0, -7.5], [-79.0, -5.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "AMAZONAS"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-78.5, -4.0], [-77.0, -4.0], [-77.0, -6.0], [-78.5, -6.0], [-78.5, -4.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "SAN MARTIN"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-77.5, -6.0], [-76.0, -6.0], [-76.0, -8.5], [-77.5, -8.5], [-77.5, -6.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "ANCASH"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-78.5, -8.5], [-77.0, -8.5], [-77.0, -10.5], [-78.5, -10.5], [-78.5, -8.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "HUANUCO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-77.0, -8.5], [-75.5, -8.5], [-75.5, -10.0], [-77.0, -10.0], [-77.0, -8.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "PASCO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-76.5, -10.0], [-75.0, -10.0], [-75.0, -11.0], [-76.5, -11.0], [-76.5, -10.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "JUNIN"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-76.0, -11.0], [-74.5, -11.0], [-74.5, -12.5], [-76.0, -12.5], [-76.0, -11.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "UCAYALI"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-75.0, -8.0], [-73.0, -8.0], [-73.0, -11.0], [-75.0, -11.0], [-75.0, -8.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "MADRE DE DIOS"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-72.0, -11.0], [-69.5, -11.0], [-69.5, -13.0], [-72.0, -13.0], [-72.0, -11.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "HUANCAVELICA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-75.5, -12.5], [-74.5, -12.5], [-74.5, -13.5], [-75.5, -13.5], [-75.5, -12.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "AYACUCHO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-74.5, -13.0], [-73.5, -13.0], [-73.5, -15.0], [-74.5, -15.0], [-74.5, -13.0]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "APURIMAC"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-73.5, -13.5], [-72.5, -13.5], [-72.5, -14.5], [-73.5, -14.5], [-73.5, -13.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "ICA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-76.5, -13.5], [-75.0, -13.5], [-75.0, -15.0], [-76.5, -15.0], [-76.5, -13.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "MOQUEGUA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-71.5, -16.5], [-70.5, -16.5], [-70.5, -17.5], [-71.5, -17.5], [-71.5, -16.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "TACNA"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-71.0, -17.5], [-69.5, -17.5], [-69.5, -18.5], [-71.0, -18.5], [-71.0, -17.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "TUMBES"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-81.0, -3.5], [-80.0, -3.5], [-80.0, -4.5], [-81.0, -4.5], [-81.0, -3.5]]]
      }
    },
    {
      "type": "Feature",
      "properties": {
        "NAME_1": "CALLAO"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[-77.2, -11.9], [-77.1, -11.9], [-77.1, -12.0], [-77.2, -12.0], [-77.2, -11.9]]]
      }
    }
  ]
};

// Centros aproximados de cada departamento (capitales)
const DEPARTMENT_CAPITALS = {
  "LIMA": { coords: [-12.0464, -77.0428], name: "Lima" },
  "AREQUIPA": { coords: [-16.4090, -71.5375], name: "Arequipa" },
  "CUSCO": { coords: [-13.5319, -71.9675], name: "Cusco" },
  "PUNO": { coords: [-15.8402, -70.0219], name: "Puno" },
  "LORETO": { coords: [-3.7491, -73.2538], name: "Iquitos" },
  "PIURA": { coords: [-5.1944, -80.6328], name: "Piura" },
  "LA LIBERTAD": { coords: [-8.1159, -79.0300], name: "Trujillo" },
  "LAMBAYEQUE": { coords: [-6.7701, -79.8448], name: "Chiclayo" },
  "CAJAMARCA": { coords: [-7.1638, -78.5003], name: "Cajamarca" },
  "AMAZONAS": { coords: [-6.2276, -77.8711], name: "Chachapoyas" },
  "SAN MARTIN": { coords: [-6.4858, -76.3472], name: "Moyobamba" },
  "ANCASH": { coords: [-9.5277, -77.5277], name: "Huaraz" },
  "HUANUCO": { coords: [-9.9306, -76.2422], name: "Huánuco" },
  "PASCO": { coords: [-10.6833, -76.2500], name: "Cerro de Pasco" },
  "JUNIN": { coords: [-12.0651, -75.2049], name: "Huancayo" },
  "UCAYALI": { coords: [-8.3791, -74.5539], name: "Pucallpa" },
  "MADRE DE DIOS": { coords: [-12.5933, -69.1891], name: "Puerto Maldonado" },
  "HUANCAVELICA": { coords: [-12.7869, -74.9731], name: "Huancavelica" },
  "AYACUCHO": { coords: [-13.1588, -74.2232], name: "Ayacucho" },
  "APURIMAC": { coords: [-13.6349, -72.8813], name: "Abancay" },
  "ICA": { coords: [-14.0678, -75.7286], name: "Ica" },
  "MOQUEGUA": { coords: [-17.1939, -70.9347], name: "Moquegua" },
  "TACNA": { coords: [-18.0146, -70.2536], name: "Tacna" },
  "TUMBES": { coords: [-3.5667, -80.4515], name: "Tumbes" },
  "CALLAO": { coords: [-12.0565, -77.1181], name: "Callao" }
};

const PeruMap = ({ departamentosData, onSelectDepartamento, selectedDepartamento }) => {
  const [hoveredDepartamento, setHoveredDepartamento] = useState(null);
  const mapRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const geoJsonLayerRef = React.useRef(null);

  // Función para determinar el color basado en el porcentaje
  const getColor = (departamento) => {
    if (!departamentosData || departamentosData[departamento] === undefined) {
      return '#CCCCCC'; // Color por defecto si no hay datos
    }
    const porcentaje = departamentosData[departamento];
    if (porcentaje >= 75) return '#10B981'; // Verde
    if (porcentaje >= 50) return '#3B82F6'; // Azul
    if (porcentaje >= 25) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  };

  // Estilo para cada feature (departamento)
  const styleFeature = (feature) => {
    const departamento = feature.properties.NAME_1;
    return {
      fillColor: getColor(departamento),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  // Inicialización del mapa usando useEffect
  useEffect(() => {
    // Si ya existe un mapa, no crear otro
    if (mapInstanceRef.current) return;

    // Crear mapa
    mapInstanceRef.current = L.map(mapRef.current, {
      center: [-9.1900, -75.0152], // Centro de Perú
      zoom: 5,
      zoomControl: false
    });

    // Añadir capa base de OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      opacity: 0.5
    }).addTo(mapInstanceRef.current);

    // Añadir control de zoom
    L.control.zoom({
      position: 'bottomright'
    }).addTo(mapInstanceRef.current);

    // Añadir capa de GeoJSON para departamentos
    const onEachFeature = (feature, layer) => {
      const departamento = feature.properties.NAME_1;
      
      // Eventos de hover y click
      layer.on({
        mouseover: (e) => {
          layer.setStyle({
            weight: 3,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.9
          });
          layer.bringToFront();
          setHoveredDepartamento(departamento);
        },
        mouseout: (e) => {
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(layer);
          }
          setHoveredDepartamento(null);
        },
        click: () => {
          if (onSelectDepartamento) {
            onSelectDepartamento(departamento);
          }
        }
      });
    };

    // Añadir la capa GeoJSON
    geoJsonLayerRef.current = L.geoJSON(PERU_GEO_DATA, {
      style: styleFeature,
      onEachFeature: onEachFeature
    }).addTo(mapInstanceRef.current);

    // Añadir marcadores para capitales
    Object.entries(DEPARTMENT_CAPITALS)
      .forEach(([dpto, data]) => {
        const { coords, name } = data;
        // Solo mostrar marcadores para departamentos importantes o el seleccionado inicialmente
        const importantes = ["LIMA", "AREQUIPA", "CUSCO", "PIURA"];
        if (selectedDepartamento === dpto || importantes.includes(dpto)) {
          const marker = L.marker(coords, {
            icon: createDepartmentIcon(getColor(dpto))
          }).addTo(mapInstanceRef.current);

          // Contenido del popup
          let popupContent = `
            <div class="text-center">
              <div class="font-bold">${name}</div>
              <div class="text-sm text-gray-600">Capital de ${dpto}</div>
          `;

          if (departamentosData && departamentosData[dpto] !== undefined) {
            const porcentaje = departamentosData[dpto];
            const colorClass = porcentaje >= 75 ? "bg-green-500" : 
                              porcentaje >= 50 ? "bg-blue-500" : 
                              porcentaje >= 25 ? "bg-yellow-500" : 
                              "bg-red-500";
            
            popupContent += `
              <div class="mt-2">
                <div class="text-xs text-gray-500">Avance</div>
                <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div class="h-2 rounded-full ${colorClass}" style="width: ${Math.min(100, porcentaje)}%"></div>
                </div>
                <div class="text-right mt-1 text-xs font-medium">${porcentaje.toFixed(1)}%</div>
              </div>
            `;
          }

          popupContent += `</div>`;
          marker.bindPopup(popupContent);
          
          // Evento de click para el marcador
          marker.on('click', () => {
            if (onSelectDepartamento) {
              onSelectDepartamento(dpto);
            }
          });
        }
      });

    // Limpieza al desmontar
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Solo se ejecuta una vez al montar

  // Efecto para actualizar el mapa cuando cambia el departamento seleccionado
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Actualizar el zoom y centro del mapa cuando cambia el departamento seleccionado
    if (selectedDepartamento && DEPARTMENT_CAPITALS[selectedDepartamento]) {
      mapInstanceRef.current.setView(
        DEPARTMENT_CAPITALS[selectedDepartamento].coords, 
        7, 
        { animate: true, duration: 1 }
      );
    } else {
      // Si no hay departamento seleccionado, mostrar todo Perú
      mapInstanceRef.current.setView(
        [-9.1900, -75.0152], 
        5, 
        { animate: true }
      );
    }
  }, [selectedDepartamento]);

  // Efecto para actualizar los colores cuando cambian los datos
  useEffect(() => {
    if (!geoJsonLayerRef.current) return;
    
    // Re-aplicar los estilos cuando cambian los datos
    geoJsonLayerRef.current.setStyle(styleFeature);
  }, [departamentosData]);

  return (
    <div className="h-full w-full relative">
      {/* Leyenda */}
      <div className="absolute bottom-5 right-5 bg-white p-2 rounded-md shadow-md z-10">
        <div className="text-sm font-bold mb-1">Avance:</div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-red-500 mr-1"></div>
          <span className="text-xs">0-25%</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-yellow-500 mr-1"></div>
          <span className="text-xs">25-50%</span>
        </div>
        <div className="flex items-center mb-1">
          <div className="w-4 h-4 bg-blue-500 mr-1"></div>
          <span className="text-xs">50-75%</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 mr-1"></div>
          <span className="text-xs">75-100%</span>
        </div>
      </div>
      
      {/* Div que contiene el mapa */}
      <div ref={mapRef} className="h-full w-full"></div>
    </div>
  );
};

export default PeruMap;

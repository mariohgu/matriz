import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// Importar configuración de iconos
import '../common/leaflet-icons';
import { createDepartmentIcon } from '../common/leaflet-icons';

// Datos GeoJSON simplificados para Perú con departamentos
import PERU_GEO_DATA from '../../utiles/peru_geo_data.json';

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
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const geoJsonLayerRef = useRef(null);
  const markersRef = useRef({});
  const featuresRef = useRef({});

  // Función para convertir nombres de departamentos a formato Capitalizado
  const formatDepartmentName = (name) => {
    if (!name) return name;
    // Convertir a minúsculas y capitalizar primera letra de cada palabra
    return name.toLowerCase().split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Función para buscar correspondencia en departamentosData (insensible a mayúsculas/minúsculas)
  const getDepartmentKey = (name) => {
    if (!departamentosData || !name) return null;
    // Buscar la clave exacta o la versión en mayúsculas
    const normalizedName = name.toUpperCase();
    return Object.keys(departamentosData).find(key => 
      key.toUpperCase() === normalizedName
    );
  };

  // Función para determinar el color basado en el porcentaje
  const getColor = (departamento) => {
    if (!departamentosData) return '#CCCCCC';
    
    // Encontrar la clave correcta en departamentosData
    const key = getDepartmentKey(departamento);
    
    if (!key || departamentosData[key] === undefined) {
      return '#CCCCCC'; // Color por defecto si no hay datos
    }
    
    const porcentaje = departamentosData[key];
    if (porcentaje >= 75) return '#10B981'; // Verde
    if (porcentaje >= 50) return '#3B82F6'; // Azul
    if (porcentaje >= 25) return '#F59E0B'; // Amarillo
    return '#EF4444'; // Rojo
  };

  // Estilo para cada feature (departamento)
  const styleFeature = (feature) => {
    const departamentoRaw = feature.properties.NAME_1;
    const departamentoFormatted = formatDepartmentName(departamentoRaw);
    const isSelected = selectedDepartamento === departamentoFormatted;
    
    return {
      fillColor: getColor(departamentoRaw),
      weight: isSelected ? 4 : 2,
      opacity: 1,
      color: isSelected ? '#666' : 'white',
      dashArray: isSelected ? '' : '3',
      fillOpacity: isSelected ? 0.9 : 0.7
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
      const departamentoRaw = feature.properties.NAME_1;
      const departamentoFormatted = formatDepartmentName(departamentoRaw);
      
      // Guardar referencia a la capa para acceso posterior
      featuresRef.current[departamentoRaw] = layer;
      
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
          setHoveredDepartamento(departamentoFormatted);
        },
        mouseout: (e) => {
          if (geoJsonLayerRef.current) {
            geoJsonLayerRef.current.resetStyle(layer);
            
            // Si este departamento está seleccionado, vuelve a aplicar el estilo de selección
            if (selectedDepartamento === departamentoFormatted) {
              layer.setStyle({
                weight: 4,
                color: '#666',
                dashArray: '',
                fillOpacity: 0.9
              });
              layer.bringToFront();
            }
          }
          setHoveredDepartamento(null);
        },
        click: (e) => {
          console.log("Click en departamento:", departamentoRaw, "-> formateado:", departamentoFormatted);
          // Aplicar el estilo seleccionado a este departamento
          if (onSelectDepartamento && typeof onSelectDepartamento === 'function') {
            onSelectDepartamento(departamentoFormatted);
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
    Object.entries(DEPARTMENT_CAPITALS).forEach(([dptoRaw, data]) => {
      const { coords, name } = data;
      const dpto = formatDepartmentName(dptoRaw);
      
      // Solo mostrar marcadores para departamentos importantes o el seleccionado inicialmente
      const importantes = ["LIMA", "AREQUIPA", "CUSCO", "PIURA"].map(d => formatDepartmentName(d));
      if (selectedDepartamento === dpto || importantes.includes(dpto)) {
        const marker = L.marker(coords, {
          icon: createDepartmentIcon(getColor(dptoRaw))
        }).addTo(mapInstanceRef.current);

        // Guardar referencia al marcador
        markersRef.current[dptoRaw] = marker;

        // Contenido del popup
        let popupContent = `
          <div class="text-center">
            <div class="font-bold">${name}</div>
            <div class="text-sm text-gray-600">Capital de ${dpto}</div>
        `;

        // Buscar la clave correcta para los datos de porcentaje
        const key = getDepartmentKey(dptoRaw);
        if (key && departamentosData && departamentosData[key] !== undefined) {
          const porcentaje = departamentosData[key];
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
          console.log("Click en marcador:", dptoRaw, "-> formateado:", dpto);
          if (onSelectDepartamento && typeof onSelectDepartamento === 'function') {
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
    if (!mapInstanceRef.current || !geoJsonLayerRef.current) return;

    console.log("Departamento seleccionado cambiado a:", selectedDepartamento);

    // Actualizar estilos para todos los departamentos
    Object.entries(featuresRef.current).forEach(([dptoRaw, layer]) => {
      const dptoFormatted = formatDepartmentName(dptoRaw);
      if (dptoFormatted === selectedDepartamento) {
        layer.setStyle({
          weight: 4,
          color: '#666',
          dashArray: '',
          fillOpacity: 0.9
        });
        layer.bringToFront();
      } else {
        layer.setStyle({
          weight: 2,
          color: 'white',
          dashArray: '3',
          fillOpacity: 0.7
        });
      }
    });

    // Buscar la capital correspondiente (versión mayúscula)
    const selectedDepartamentoUpper = selectedDepartamento ? selectedDepartamento.toUpperCase() : null;
    const capitalKey = Object.keys(DEPARTMENT_CAPITALS).find(key => 
      formatDepartmentName(key) === selectedDepartamento
    );

    // Actualizar el zoom y centro del mapa cuando cambia el departamento seleccionado
    if (selectedDepartamento && capitalKey && DEPARTMENT_CAPITALS[capitalKey]) {
      // Si es un departamento válido, hacer zoom a sus coordenadas
      mapInstanceRef.current.setView(
        DEPARTMENT_CAPITALS[capitalKey].coords, 
        7, 
        { animate: true, duration: 1 }
      );

      // Asegurar que el marcador existe para este departamento
      if (!markersRef.current[capitalKey]) {
        const { coords, name } = DEPARTMENT_CAPITALS[capitalKey];
        const marker = L.marker(coords, {
          icon: createDepartmentIcon(getColor(capitalKey))
        }).addTo(mapInstanceRef.current);

        // Guardar referencia al marcador
        markersRef.current[capitalKey] = marker;

        // Configurar popup similar al inicial
        let popupContent = `
          <div class="text-center">
            <div class="font-bold">${name}</div>
            <div class="text-sm text-gray-600">Capital de ${selectedDepartamento}</div>
        `;

        // Buscar la clave correcta para los datos de porcentaje
        const key = getDepartmentKey(capitalKey);
        if (key && departamentosData && departamentosData[key] !== undefined) {
          const porcentaje = departamentosData[key];
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
          console.log("Click en marcador (nuevo):", capitalKey, "-> formateado:", selectedDepartamento);
          if (onSelectDepartamento && typeof onSelectDepartamento === 'function') {
            onSelectDepartamento(selectedDepartamento);
          }
        });
      }
    } else {
      // Si no hay departamento seleccionado, mostrar todo Perú
      mapInstanceRef.current.setView(
        [-9.1900, -75.0152], 
        5, 
        { animate: true }
      );
    }
  }, [selectedDepartamento, departamentosData]);

  // Acotar el tamaño de visualización para evitar problemas de espacio
  const mapContainerStyle = {
    height: '100%',
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden'
  };

  return (
    <div style={mapContainerStyle}>
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

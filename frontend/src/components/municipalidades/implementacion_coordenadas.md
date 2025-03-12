# Implementación de campos X y Y en MunicipalidadesList

## 1. Actualizar el estado editData

Modifica el estado editData en el archivo MunicipalidadesList.jsx (líneas 21-30) para incluir los campos X y Y:

```jsx
const [editData, setEditData] = useState({
  id_municipalidad: '',
  nombre: '',
  departamento: '',
  region: '',
  provincia: '',
  distrito: '',
  ubigeo: '',
  nivel: '',
  X: '', // Nuevo campo para coordenada X (longitud)
  Y: ''  // Nuevo campo para coordenada Y (latitud)
});
```

## 2. Actualizar columnFilters (si lo usas para filtrar)

```jsx
const [columnFilters, setColumnFilters] = useState({
  nombre: '',
  region: '',
  departamento: '',
  provincia: '',
  distrito: '',
  ubigeo: '',
  nivel: '',
  X: '',
  Y: ''
});
```

## 3. Agregar campos X y Y al formulario de edición/creación

Agrega este bloque de código después del campo ubigeo en el formulario (aproximadamente línea 850):

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
  <div>
    <label htmlFor="X" className="block text-sm font-medium text-gray-700">
      Coordenada X (Longitud)
    </label>
    <input
      type="number"
      step="0.000001"
      id="X"
      value={editData.X || ''}
      onChange={(e) => setEditData({ ...editData, X: e.target.value })}
      placeholder="-77.8714"
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
  <div>
    <label htmlFor="Y" className="block text-sm font-medium text-gray-700">
      Coordenada Y (Latitud)
    </label>
    <input
      type="number"
      step="0.000001"
      id="Y"
      value={editData.Y || ''}
      onChange={(e) => setEditData({ ...editData, Y: e.target.value })}
      placeholder="-12.5678"
      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
    />
  </div>
</div>
```

## 4. Agregar campos X y Y al diálogo de visualización

Agrega este bloque de código dentro del diálogo de visualización, junto con los otros campos (cerca de la línea 715):

```jsx
<div>
  <p className="text-sm font-medium text-gray-500">Coordenadas</p>
  <p className="mt-1 text-sm text-gray-900">
    X: {selectedMunicipalidad.X || 'N/A'}, Y: {selectedMunicipalidad.Y || 'N/A'}
  </p>
</div>
```

## 5. Actualizar el handleCreateOrUpdateMunicipalidad (si lo tienes)

Si tienes una función que maneja la creación o actualización de una municipalidad, asegúrate de incluir los campos X y Y en el objeto que envías a la API:

```jsx
const handleCreateOrUpdateMunicipalidad = async () => {
  // Resto del código...
  
  const municipalidadData = {
    ubigeo: editData.ubigeo,
    nombre: editData.nombre,
    departamento: editData.departamento,
    provincia: editData.provincia,
    distrito: editData.distrito,
    region: editData.region,
    nivel: editData.nivel,
    X: editData.X || null,  // Convertir cadena vacía a null
    Y: editData.Y || null   // Convertir cadena vacía a null
  };
  
  // Resto del código...
};
```

## 6. Opcional: Agregar campos X y Y a la tabla

Si deseas mostrar las coordenadas en la tabla principal, agrega una nueva columna en el encabezado de la tabla:

```jsx
<th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Coordenadas
</th>
```

Y en el cuerpo de la tabla, agrega una nueva celda para cada fila:

```jsx
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  X: {municipalidad.X || 'N/A'}, Y: {municipalidad.Y || 'N/A'}
</td>
```

Asegúrate de que estas columnas respeten el diseño responsivo según las preferencias del usuario, ocultándolas en la vista móvil si es necesario.

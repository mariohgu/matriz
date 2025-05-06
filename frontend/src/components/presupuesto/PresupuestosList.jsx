import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiFilter } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

// Opciones de año para filtrar
const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 10 }, (_, i) => (
  { value: (currentYear - 5 + i).toString(), label: (currentYear - 5 + i).toString() }
));

export default function PresupuestosList() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('id_presupuesto');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    'areaEjecutora.descripcion': '',
    'clasificador.codigo': '',
    anio: '',
  });

  // Filtro especial por año
  const [selectedYear, setSelectedYear] = useState('');
  const [showResumen, setShowResumen] = useState(false);
  const [resumenData, setResumenData] = useState(null);

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogo para "ver detalles"
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedPresupuesto, setSelectedPresupuesto] = useState(null);

  // Diálogo unificado para crear / editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);  // false = crear, true = editar

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_presupuesto: '',
    id_ae: '',
    id_clasificador: '',
    fecha: '',
    anio: currentYear,
    mto_pia: 0,
    mto_modificaciones: 0,
    mto_pim: 0,
    mto_certificado: 0,
    mto_compro_anual: 0
  });

  // Lista de áreas ejecutoras y clasificadores para seleccionar en el formulario
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [clasificadores, setClasificadores] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // Diálogo para eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadPresupuestos();
    loadRelatedData();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEditMode && selectedPresupuesto) {
      // Asegurarse de que los valores del formulario estén actualizados con los datos seleccionados
      setFormData({
        id_presupuesto: selectedPresupuesto.id_presupuesto,
        id_ae: selectedPresupuesto.id_ae,
        id_clasificador: selectedPresupuesto.id_clasificador,
        fecha: selectedPresupuesto.fecha ? selectedPresupuesto.fecha.split('T')[0] : '',
        anio: selectedPresupuesto.anio,
        mto_pia: selectedPresupuesto.mto_pia,
        mto_modificaciones: selectedPresupuesto.mto_modificaciones,
        mto_pim: selectedPresupuesto.mto_pim,
        mto_certificado: selectedPresupuesto.mto_certificado,
        mto_compro_anual: selectedPresupuesto.mto_compro_anual
      });
    }
  }, [isEditMode, selectedPresupuesto]);

  // Añadir logs para depurar categorías 
  useEffect(() => {
    if (selectedPresupuesto && clasificadores.length && categorias.length) {
      console.log('Modal - Presupuesto seleccionado:', selectedPresupuesto);
      const cl = clasificadores.find(c => c.id_clasificador === selectedPresupuesto.id_clasificador);
      console.log('Modal - Clasificador encontrado:', cl);
      if (cl && cl.id_categoria) {
        const cat = categorias.find(c => c.id_categoria === cl.id_categoria);
        console.log('Modal - Categoría encontrada:', cat);
      }
    }
  }, [selectedPresupuesto, clasificadores, categorias]);

  // Cargar presupuestos (por defecto o filtrados por año)
  const loadPresupuestos = async (year = null) => {
    setLoading(true);
    try {
      let data;
      let endpoint = 'presupuesto/presupuestos';
      
      if (year) {
        endpoint = `presupuesto/presupuestos/anio/${year}`;
        data = await apiService.get(endpoint);
        console.log('Respuesta API por año:', data);
        
        // Verificar si las relaciones están cargadas correctamente
        if (data && data.data && Array.isArray(data.data.presupuestos)) {
          const presupuestosData = data.data.presupuestos;
          
          // Verificar si las relaciones están cargadas
          const relacionesCargadas = presupuestosData.some(item => 
            item.areaEjecutora && item.clasificador
          );
          
          if (!relacionesCargadas) {
            console.warn('Las relaciones (areaEjecutora, clasificador) no están cargadas en la respuesta:', 
              presupuestosData.slice(0, 2));
          }
          
          setPresupuestos(presupuestosData);
        } else if (data && Array.isArray(data.data)) {
          const presupuestosData = data.data;
          
          // Verificar si las relaciones están cargadas
          const relacionesCargadas = presupuestosData.some(item => 
            item.areaEjecutora && item.clasificador
          );
          
          if (!relacionesCargadas) {
            console.warn('Las relaciones (areaEjecutora, clasificador) no están cargadas en la respuesta:', 
              presupuestosData.slice(0, 2));
          }
          
          setPresupuestos(presupuestosData);
        } else {
          console.error('Formato de respuesta inesperado para presupuestos por año:', data);
          setPresupuestos([]);
        }
      } else {
        data = await apiService.getAll(endpoint);
        console.log('Respuesta API todos los presupuestos:', data);
        
        // Asegurarse de que siempre establecemos un array
        if (data && data.data && Array.isArray(data.data)) {
          const presupuestosData = data.data;
          
          // Verificar si las relaciones están cargadas
          const relacionesCargadas = presupuestosData.some(item => 
            item.areaEjecutora && item.clasificador
          );
          
          if (!relacionesCargadas) {
            console.warn('Las relaciones (areaEjecutora, clasificador) no están cargadas en la respuesta:', 
              presupuestosData.slice(0, 2));
          }
          
          setPresupuestos(presupuestosData);
        } else if (Array.isArray(data)) {
          const presupuestosData = data;
          
          // Verificar si las relaciones están cargadas
          const relacionesCargadas = presupuestosData.some(item => 
            item.areaEjecutora && item.clasificador
          );
          
          if (!relacionesCargadas) {
            console.warn('Las relaciones (areaEjecutora, clasificador) no están cargadas en la respuesta:', 
              presupuestosData.slice(0, 2));
          }
          
          setPresupuestos(presupuestosData);
        } else {
          console.error('Formato de respuesta inesperado para todos los presupuestos:', data);
          setPresupuestos([]);
        }
      }
    } catch (error) {
      console.error('Error al cargar presupuestos:', error);
      toast.showError('Error', 'No se pudieron cargar los presupuestos');
      setPresupuestos([]);
    } finally {
      setLoading(false);
    }
  };

  // Cargar resumen por año
  const loadResumen = async (year) => {
    if (!year) return;
    
    setLoading(true);
    try {
      const data = await apiService.get(`presupuesto/presupuestos/resumen/${year}`);
      console.log('Respuesta API resumen:', data);
      
      // Verificar que la respuesta tenga la estructura esperada
      if (data && data.data && data.data.anio && 
          data.data.resumen_por_area && Array.isArray(data.data.resumen_por_area) &&
          data.data.totales_generales) {
        setResumenData(data.data);
        setShowResumen(true);
      } else {
        console.error('Formato de respuesta inesperado para resumen:', data);
        toast.showWarning('Advertencia', 'El formato de los datos de resumen es incorrecto');
        setResumenData(null);
        setShowResumen(false);
      }
    } catch (error) {
      console.error('Error al cargar resumen:', error);
      toast.showError('Error', 'No se pudo cargar el resumen por año');
      setResumenData(null);
      setShowResumen(false);
    } finally {
      setLoading(false);
    }
  };

  // Función unificada para cargar todas las entidades relacionadas
  const loadRelatedData = async () => {
    try {
      console.log('Cargando datos relacionados...');
      const [areasEjec, clasif, cats] = await Promise.all([
        apiService.getAll('presupuesto/areas-ejecutoras'),
        apiService.getAll('presupuesto/clasificadores'),
        apiService.getAll('presupuesto/categorias')
      ]);
      
      console.log('Áreas ejecutoras cargadas:', areasEjec);
      console.log('Clasificadores cargados:', clasif);
      console.log('Categorías cargadas:', cats);
      
      // Asegurarse de que siempre son arrays
      const areasEjecArray = Array.isArray(areasEjec) ? areasEjec : (areasEjec?.data || []);
      const clasificadoresArray = Array.isArray(clasif) ? clasif : (clasif?.data || []);
      const categoriasArray = Array.isArray(cats) ? cats : (cats?.data || []);
      
      setAreasEjecutoras(areasEjecArray);
      setClasificadores(clasificadoresArray);
      setCategorias(categoriasArray);
      
      // Verificar estructura
      if (clasificadoresArray.length > 0) {
        console.log('Ejemplo de clasificador:', clasificadoresArray[0]);
        console.log('Tiene id_categoria?', clasificadoresArray[0].hasOwnProperty('id_categoria'));
      }
      
      if (categoriasArray.length > 0) {
        console.log('Ejemplo de categoría:', categoriasArray[0]);
        console.log('Tiene descripcion?', categoriasArray[0].hasOwnProperty('descripcion'));
      }
      
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      toast.showError('Error', 'No se pudieron cargar todos los datos relacionados');
      setAreasEjecutoras([]);
      setClasificadores([]);
      setCategorias([]);
    }
  };

  /* ==================================
   *  Crear / Editar (Modal unificado)
   * ================================== */
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_presupuesto: '',
      id_ae: '',
      id_clasificador: '',
      fecha: new Date().toISOString().split('T')[0],
      anio: currentYear,
      mto_pia: 0,
      mto_modificaciones: 0,
      mto_pim: 0,
      mto_certificado: 0,
      mto_compro_anual: 0
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedPresupuesto(rowData);
    setFormData({
      id_presupuesto: rowData.id_presupuesto,
      id_ae: rowData.id_ae,
      id_clasificador: rowData.id_clasificador,
      fecha: rowData.fecha ? rowData.fecha.split('T')[0] : '',
      anio: rowData.anio,
      mto_pia: rowData.mto_pia,
      mto_modificaciones: rowData.mto_modificaciones,
      mto_pim: rowData.mto_pim,
      mto_certificado: rowData.mto_certificado,
      mto_compro_anual: rowData.mto_compro_anual
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones básicas
      if (!formData.id_ae) {
        toast.showWarning('Advertencia', 'Debe seleccionar un área ejecutora');
        return;
      }
      if (!formData.id_clasificador) {
        toast.showWarning('Advertencia', 'Debe seleccionar un clasificador');
        return;
      }
      if (!formData.fecha) {
        toast.showWarning('Advertencia', 'La fecha es requerida');
        return;
      }

      // Convertir valores de montos a números
      const dataToSend = {
        ...formData,
        mto_pia: parseFloat(formData.mto_pia),
        mto_modificaciones: parseFloat(formData.mto_modificaciones),
        mto_pim: parseFloat(formData.mto_pim),
        mto_certificado: parseFloat(formData.mto_certificado),
        mto_compro_anual: parseFloat(formData.mto_compro_anual)
      };
      
      if (isEditMode && dataToSend.id_presupuesto) {
        // Actualizar
        await apiService.update('presupuesto/presupuestos', dataToSend.id_presupuesto, dataToSend);
        toast.showSuccess('Éxito', 'Presupuesto actualizado correctamente');
      } else {
        // Crear
        await apiService.create('presupuesto/presupuestos', dataToSend);
        toast.showSuccess('Éxito', 'Presupuesto creado correctamente');
      }

      setUpsertDialogVisible(false);
      // Recargar según el filtro actual
      if (selectedYear) {
        loadPresupuestos(selectedYear);
      } else {
        loadPresupuestos();
      }
    } catch (error) {
      console.error('Error al guardar presupuesto:', error);
      
      if (error.response && error.response.data) {
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
          toast.showError('Error de validación', errorMessages);
          return;
        } else if (error.response.data.message) {
          toast.showError('Error', error.response.data.message);
          return;
        }
      }
      
      toast.showError('Error', 'No se pudo guardar el presupuesto');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedPresupuesto(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedPresupuesto) return;
    try {
      await apiService.delete('presupuesto/presupuestos', selectedPresupuesto.id_presupuesto);
      toast.showSuccess('Éxito', 'Presupuesto eliminado correctamente');
      setDeleteDialogVisible(false);
      // Recargar según el filtro actual
      if (selectedYear) {
        loadPresupuestos(selectedYear);
      } else {
        loadPresupuestos();
      }
    } catch (error) {
      console.error('Error al eliminar presupuesto:', error);
      toast.showError('Error', 'No se pudo eliminar el presupuesto');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    // Simplemente establecer el presupuesto seleccionado y mostrar el modal
    setSelectedPresupuesto(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Filtro por año y resumen 
   * ================================== */
  const handleYearChange = (year) => {
    setSelectedYear(year);
    setShowResumen(false);
    if (year) {
      loadPresupuestos(year);
    } else {
      loadPresupuestos();
    }
  };

  const handleResumenClick = () => {
    if (selectedYear) {
      loadResumen(selectedYear);
    } else {
      toast.showWarning('Advertencia', 'Seleccione un año para ver el resumen');
    }
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  // Filtrado principal
  const getFilteredData = () => {
    // Verificación de seguridad para asegurarse de que presupuestos es un array
    if (!Array.isArray(presupuestos)) {
      console.error('presupuestos no es un array:', presupuestos);
      return [];
    }
    
    // Filtro de búsqueda global
    const filtered = presupuestos.filter((p) => {
      const searchFields = [
        p.areaEjecutora?.descripcion,
        p.clasificador?.codigo,
        p.anio?.toString(),
        p.mto_pia?.toString(),
        p.mto_pim?.toString()
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchArea =
        !columnFilters['areaEjecutora.descripcion'] ||
        (p.areaEjecutora?.descripcion?.toLowerCase() || '').includes(
          columnFilters['areaEjecutora.descripcion'].toLowerCase()
        );
      const matchClasificador =
        !columnFilters['clasificador.codigo'] ||
        (p.clasificador?.codigo?.toLowerCase() || '').includes(
          columnFilters['clasificador.codigo'].toLowerCase()
        );
      const matchAnio =
        !columnFilters.anio ||
        p.anio?.toString() === columnFilters.anio;

      return matchesSearch && matchArea && matchClasificador && matchAnio;
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      let aValue, bValue;
      
      // Manejar campos anidados como 'areaEjecutora.descripcion'
      if (sortField.includes('.')) {
        const parts = sortField.split('.');
        aValue = a[parts[0]]?.[parts[1]] || '';
        bValue = b[parts[0]]?.[parts[1]] || '';
      } else {
        aValue = a[sortField];
        bValue = b[sortField];
      }
      
      // Convertir a string para comparación si no son string
      if (typeof aValue !== 'string') aValue = aValue?.toString() || '';
      if (typeof bValue !== 'string') bValue = bValue?.toString() || '';
      
      if (sortOrder === 'asc') {
        return aValue.localeCompare(bValue, undefined, { numeric: true });
      } else {
        return bValue.localeCompare(aValue, undefined, { numeric: true });
      }
    });

    return sortedData;
  };

  // Paginación
  const applyPagination = (data) => {
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: data.slice(startIndex, endIndex),
      totalRecords,
      totalPages
    };
  };

  // Obtener data final
  const filteredData = getFilteredData();
  const { data: paginatedData, totalRecords, totalPages } = applyPagination(filteredData);

  /* ==================================
   *   Columnas de la tabla
   * ================================== */
  const columns = [
    {
      field: 'areaEjecutora.descripcion',
      header: 'Área Ejecutora',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        // Buscar por ID en la lista de áreas ejecutoras
        const areaEjecutora = areasEjecutoras.find(ae => ae.id_ae === rowData.id_ae);
        if (areaEjecutora) {
          return `${areaEjecutora.codigo ? areaEjecutora.codigo + ' - ' : ''} ${areaEjecutora.descripcion || 'Sin descripción'}`;
        } else if (rowData.id_ae) {
          return `ID: ${rowData.id_ae}`;
        } else {
          return 'N/A';
        }
      }
    },
    {
      field: 'clasificador.codigo',
      header: 'Clasificador',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        // Buscar por ID en la lista de clasificadores
        const clasificador = clasificadores.find(c => c.id_clasificador === rowData.id_clasificador);
        if (clasificador) {
          return (
            <div className="flex flex-col">
              <span className="font-medium">{clasificador.codigo_clasificador || ''}</span>
              {clasificador.descripcion && (
                <div 
                  className="text-xs text-gray-600 truncate max-w-xs cursor-help"
                  title={clasificador.descripcion}
                >
                  {clasificador.descripcion}
                </div>
              )}
            </div>
          );
        } else if (rowData.id_clasificador) {
          return `ID: ${rowData.id_clasificador}`;
        } else {
          return 'N/A';
        }
      }
    },
    {
      field: 'anio',
      header: 'Año',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.anio || 'N/A'
    },
    {
      field: 'mto_pia',
      header: 'PIA',
      sortable: true,
      body: (rowData) => formatCurrency(rowData.mto_pia)
    },
    {
      field: 'mto_pim',
      header: 'PIM',
      sortable: true,
      body: (rowData) => formatCurrency(rowData.mto_pim)
    },
    {
      field: 'mto_certificado',
      header: 'Certificado',
      sortable: true,
      body: (rowData) => formatCurrency(rowData.mto_certificado)
    }
  ];

  // Columnas en móvil
  const mobileColumns = ['areaEjecutora.descripcion', 'anio', 'mto_pim'];

  // Función para cambiar el orden
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Formatear montos como moneda
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Acciones de la tabla
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => handleView(rowData)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-full"
        title="Ver detalle"
      >
        <FiEye className="h-4 w-4" />
      </button>
      <button
        onClick={() => handleEdit(rowData)}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="h-4 w-4" />
      </button>
      <button
        onClick={() => confirmDelete(rowData)}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
      >
        <FiTrash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Componente para inputs y selects
  const renderFormField = (id, label, value, onChange, type = 'text', options = null) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {options ? (
        <select
          id={id}
          value={value || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccione {label}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          type={type}
          value={value || ''}
          onChange={onChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder={`Ingrese ${label.toLowerCase()}`}
          min={type === 'number' ? '0' : undefined}
          step={type === 'number' ? '0.01' : undefined}
        />
      )}
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800"> Resumen Presupuestos</h1>
        
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
          {/* Filtro por año */}
          <div className="flex items-center">
            <select
              value={selectedYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos los años</option>
              {yearOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleResumenClick}
              disabled={!selectedYear}
              className="ml-2 px-4 py-2 bg-gray-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              <FiFilter className="mr-2" />
              Ver Resumen
            </button>
          </div>
          
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiPlus className="mr-2" />
            Nuevo Presupuesto
          </button>
        </div>
      </div>

      {/* Mostrar resumen o listado normal */}
      {showResumen && resumenData ? (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Resumen Presupuestal {resumenData.anio}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-2 px-4 border-b text-left">Área Ejecutora</th>
                  <th className="py-2 px-4 border-b text-right">PIA</th>
                  <th className="py-2 px-4 border-b text-right">Modificaciones</th>
                  <th className="py-2 px-4 border-b text-right">PIM</th>
                  <th className="py-2 px-4 border-b text-right">Certificado</th>
                  <th className="py-2 px-4 border-b text-right">Comprometido</th>
                </tr>
              </thead>
              <tbody>
                {resumenData.resumen_por_area?.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                    <td className="py-2 px-4 border-b">
                      {item.codigo} - {item.descripcion}
                    </td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(item.total_pia)}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(item.total_modificaciones)}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(item.total_pim)}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(item.total_certificado)}</td>
                    <td className="py-2 px-4 border-b text-right">{formatCurrency(item.total_compro_anual)}</td>
                  </tr>
                ))}
                <tr className="bg-blue-100 font-semibold">
                  <td className="py-2 px-4 border-b">TOTAL</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(resumenData.totales_generales.total_pia)}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(resumenData.totales_generales.total_modificaciones)}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(resumenData.totales_generales.total_pim)}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(resumenData.totales_generales.total_certificado)}</td>
                  <td className="py-2 px-4 border-b text-right">{formatCurrency(resumenData.totales_generales.total_compro_anual)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              onClick={() => setShowResumen(false)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                     font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Volver al listado
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Búsqueda global */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar presupuestos..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <FiEye className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Tabla */}
          <Table
            data={paginatedData}
            columns={columns}
            mobileColumns={mobileColumns}
            isMobile={isMobile}
            hideGlobalSearch={true}
            showFiltersButton={true}
            sortField={sortField}
            sortOrder={sortOrder}
            onSort={handleSort}
            searchQuery={searchQuery}
            onSearch={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
            columnFilters={columnFilters}
            onColumnFilterChange={(columnName, value) => {
              setColumnFilters(prev => ({
                ...prev,
                [columnName]: value
              }));
              setCurrentPage(1);
            }}
            loading={loading}
            emptyMessage="No hay presupuestos disponibles"
            actions={renderActions}
          />

          {/* Paginación */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
            totalItems={totalRecords}
            className="mt-4"
          />
        </>
      )}

      {/* Modal para Ver Detalles */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles de Presupuesto"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                       font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedPresupuesto && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">Área Ejecutora</p>
                <p className="text-base">
                  {(() => {
                    // Buscar el área ejecutora por ID
                    const ae = areasEjecutoras.find(a => a.id_ae === selectedPresupuesto.id_ae);
                    if (ae) {
                      return `${ae.codigo ? ae.codigo + ' - ' : ''}${ae.descripcion || 'Sin descripción'}`;
                    } else if (selectedPresupuesto.id_ae) {
                      return `ID: ${selectedPresupuesto.id_ae}`;
                    } else {
                      return 'N/A';
                    }
                  })()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Clasificador</p>
                {(() => {
                  // Buscar el clasificador por ID
                  const cl = clasificadores.find(c => c.id_clasificador === selectedPresupuesto.id_clasificador);
                  if (cl) {
                    return (
                      <>
                        <p className="text-base font-semibold">{cl.codigo_clasificador || 'Sin código'}</p>
                        <p className="text-base mt-1 whitespace-pre-wrap">{cl.descripcion || 'Sin descripción'}</p>
                      </>
                    );
                  } else if (selectedPresupuesto.id_clasificador) {
                    return <p className="text-base">ID: {selectedPresupuesto.id_clasificador}</p>;
                  } else {
                    return <p className="text-base">N/A</p>;
                  }
                })()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Categoría</p>
                {(() => {
                  // Buscar el clasificador por ID y obtener su categoría
                  const cl = clasificadores.find(c => c.id_clasificador === selectedPresupuesto.id_clasificador);
                  
                  // Si el clasificador tiene la categoría anidada
                  if (cl && cl.categoria && cl.categoria.descripcion) {
                    return <p className="text-base">{cl.categoria.descripcion}</p>;
                  } 
                  // Si el clasificador tiene el ID de categoría, intentar buscarla en la colección
                  else if (cl && cl.id_categoria) {
                    const categoria = categorias.find(cat => cat.id_categoria === cl.id_categoria);
                    if (categoria) {
                      return <p className="text-base">{categoria.descripcion}</p>;
                    }
                    return <p className="text-base">ID Categoría: {cl.id_categoria}</p>;
                  } 
                  else {
                    return <p className="text-base">N/A</p>;
                  }
                })()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Año</p>
                <p className="text-base">{selectedPresupuesto.anio || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Fecha</p>
                <p className="text-base">{selectedPresupuesto.fecha ? new Date(selectedPresupuesto.fecha).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-500">PIA</p>
                <p className="text-base">{formatCurrency(selectedPresupuesto.mto_pia)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Modificaciones</p>
                <p className="text-base">{formatCurrency(selectedPresupuesto.mto_modificaciones)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">PIM</p>
                <p className="text-base">{formatCurrency(selectedPresupuesto.mto_pim)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Certificado</p>
                <p className="text-base">{formatCurrency(selectedPresupuesto.mto_certificado)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Comprometido Anual</p>
                <p className="text-base">{formatCurrency(selectedPresupuesto.mto_compro_anual)}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal unificado para CREAR / EDITAR Presupuesto */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderFormField(
            'id_ae',
            'Área Ejecutora',
            formData.id_ae,
            (e) => setFormData(prev => ({ ...prev, id_ae: e.target.value })),
            'select',
            areasEjecutoras.map(ae => ({ value: ae.id_ae, label: `${ae.codigo} - ${ae.descripcion}` }))
          )}
          
          {renderFormField(
            'id_clasificador',
            'Clasificador',
            formData.id_clasificador,
            (e) => setFormData(prev => ({ ...prev, id_clasificador: e.target.value })),
            'select',
            clasificadores.map(c => ({ value: c.id_clasificador, label: `${c.codigo_clasificador} - ${c.descripcion}` }))
          )}
          
          {renderFormField(
            'fecha',
            'Fecha',
            formData.fecha,
            (e) => setFormData(prev => ({ ...prev, fecha: e.target.value })),
            'date'
          )}
          
          {renderFormField(
            'anio',
            'Año',
            formData.anio,
            (e) => setFormData(prev => ({ ...prev, anio: e.target.value })),
            'number'
          )}
          
          {renderFormField(
            'mto_pia',
            'PIA',
            formData.mto_pia,
            (e) => setFormData(prev => ({ ...prev, mto_pia: e.target.value })),
            'number'
          )}
          
          {renderFormField(
            'mto_modificaciones',
            'Modificaciones',
            formData.mto_modificaciones,
            (e) => setFormData(prev => ({ ...prev, mto_modificaciones: e.target.value })),
            'number'
          )}
          
          {renderFormField(
            'mto_pim',
            'PIM',
            formData.mto_pim,
            (e) => setFormData(prev => ({ ...prev, mto_pim: e.target.value })),
            'number'
          )}
          
          {renderFormField(
            'mto_certificado',
            'Certificado',
            formData.mto_certificado,
            (e) => setFormData(prev => ({ ...prev, mto_certificado: e.target.value })),
            'number'
          )}
          
          {renderFormField(
            'mto_compro_anual',
            'Comprometido Anual',
            formData.mto_compro_anual,
            (e) => setFormData(prev => ({ ...prev, mto_compro_anual: e.target.value })),
            'number'
          )}
        </div>
      </Modal>

      {/* Confirmar Eliminación */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedPresupuesto
            ? `¿Está seguro de que desea eliminar este registro de presupuesto de ${selectedPresupuesto.areaEjecutora?.descripcion || 'área ejecutora'} para el año ${selectedPresupuesto.anio}?`
            : '¿Está seguro de que desea eliminar este presupuesto?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
} 
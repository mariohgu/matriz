import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiFilter, FiBarChart2 } from 'react-icons/fi';
import { api, apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast } from '../ui';

export default function EjecucionMensualList() {
  const [ejecuciones, setEjecuciones] = useState([]);
  const [areasEjecutoras, setAreasEjecutoras] = useState([]);
  const [clasificadores, setClasificadores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingRelaciones, setLoadingRelaciones] = useState(false);

  // Búsqueda, orden, filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    anio: '',
    mes: '',
    'areaEjecutora.descripcion': '',
    'clasificador.descripcion': '',
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Vista móvil
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Diálogos
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEjecucion, setSelectedEjecucion] = useState(null);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    id_ejecucion: '',
    id_ae: '',
    id_clasificador: '',
    fecha: '',
    anio: '',
    mes: '',
    mto_at_comp: 0,
    mto_devengado: 0,
    mto_girado: 0,
    mto_pagado: 0
  });

  // Estados para filtros especiales
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterAnio, setFilterAnio] = useState(new Date().getFullYear());
  const [filterMes, setFilterMes] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  
  // Estados para resumen anual
  const [showResumenDialog, setShowResumenDialog] = useState(false);
  const [resumenAnio, setResumenAnio] = useState(new Date().getFullYear());
  const [resumenData, setResumenData] = useState(null);
  const [loadingResumen, setLoadingResumen] = useState(false);

  const toast = useToast();

  // Cargar datos al montar
  useEffect(() => {
    loadEjecuciones();
    loadRelaciones();

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isEditMode && selectedEjecucion) {
      setFormData({
        id_ejecucion: selectedEjecucion.id,
        id_ae: selectedEjecucion.id_ae || '',
        id_clasificador: selectedEjecucion.id_clasificador || '',
        fecha: selectedEjecucion.fecha || '',
        anio: selectedEjecucion.anio || '',
        mes: selectedEjecucion.mes || '',
        mto_at_comp: selectedEjecucion.mto_at_comp || 0,
        mto_devengado: selectedEjecucion.mto_devengado || 0,
        mto_girado: selectedEjecucion.mto_girado || 0,
        mto_pagado: selectedEjecucion.mto_pagado || 0
      });
    }
  }, [isEditMode, selectedEjecucion]);

  const loadEjecuciones = async () => {
    setLoading(true);
    try {
      const response = await apiService.getAll('presupuesto/ejecuciones');
      const data = Array.isArray(response) ? response : response?.data || [];
      console.log('Ejecuciones recibidas:', response);
      setEjecuciones(data);
    } catch (error) {
      console.error('Error al cargar ejecuciones:', error);
      toast.showError('Error', 'No se pudieron cargar las ejecuciones mensuales');
      setEjecuciones([]);
    } finally {
      setLoading(false);
    }
  };

  const loadRelaciones = async () => {
    setLoadingRelaciones(true);
    try {
      // Cargar áreas ejecutoras
      const areasResponse = await apiService.getAll('presupuesto/areas-ejecutoras');
      const areasData = Array.isArray(areasResponse) ? areasResponse : areasResponse?.data || [];
      setAreasEjecutoras(areasData);

      // Cargar clasificadores
      const clasificadoresResponse = await apiService.getAll('presupuesto/clasificadores');
      const clasificadoresData = Array.isArray(clasificadoresResponse) ? clasificadoresResponse : clasificadoresResponse?.data || [];
      setClasificadores(clasificadoresData);
    } catch (error) {
      console.error('Error al cargar relaciones:', error);
      toast.showError('Error', 'No se pudieron cargar las áreas ejecutoras o clasificadores');
    } finally {
      setLoadingRelaciones(false);
    }
  };

  /* ==================================
   *  Crear / Editar (Modal unificado)
   * ================================== */
  const handleCreate = () => {
    setIsEditMode(false);
    const currentDate = new Date();
    setFormData({
      id_ejecucion: '',
      id_ae: '',
      id_clasificador: '',
      fecha: currentDate.toISOString().split('T')[0],
      anio: currentDate.getFullYear(),
      mes: currentDate.getMonth() + 1,
      mto_at_comp: 0,
      mto_devengado: 0,
      mto_girado: 0,
      mto_pagado: 0
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedEjecucion(rowData);
    setFormData({
      id_ejecucion: rowData.id,
      id_ae: rowData.id_ae || '',
      id_clasificador: rowData.id_clasificador || '',
      fecha: rowData.fecha || '',
      anio: rowData.anio || '',
      mes: rowData.mes || '',
      mto_at_comp: rowData.mto_at_comp || 0,
      mto_devengado: rowData.mto_devengado || 0,
      mto_girado: rowData.mto_girado || 0,
      mto_pagado: rowData.mto_pagado || 0
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    try {
      // Validaciones
      if (!formData.id_ae) {
        toast.showWarning('Advertencia', 'Debe seleccionar un área ejecutora');
        return;
      }
      
      if (!formData.id_clasificador) {
        toast.showWarning('Advertencia', 'Debe seleccionar un clasificador');
        return;
      }

      if (!formData.fecha) {
        toast.showWarning('Advertencia', 'La fecha no puede estar vacía');
        return;
      }

      if (!formData.anio || !formData.mes) {
        toast.showWarning('Advertencia', 'El año y mes son obligatorios');
        return;
      }

      // Validar montos (deben ser numéricos y positivos)
      const montos = ['mto_at_comp', 'mto_devengado', 'mto_girado', 'mto_pagado'];
      for (const campo of montos) {
        const valor = parseFloat(formData[campo]);
        if (isNaN(valor) || valor < 0) {
          toast.showWarning('Advertencia', `El campo ${campo} debe ser un número positivo`);
          return;
        }
        // Convertir a número para enviar
        formData[campo] = valor;
      }

      // Preparar datos
      const dataToSend = { ...formData };
      console.log('Datos a enviar:', dataToSend);
      
      if (isEditMode && dataToSend.id_ejecucion) {
        // Actualizar
        await apiService.update('presupuesto/ejecuciones', dataToSend.id_ejecucion, dataToSend);
        toast.showSuccess('Éxito', 'Ejecución mensual actualizada correctamente');
      } else {
        // Crear
        await apiService.create('presupuesto/ejecuciones', dataToSend);
        toast.showSuccess('Éxito', 'Ejecución mensual creada correctamente');
      }

      setUpsertDialogVisible(false);
      loadEjecuciones();
    } catch (error) {
      console.error('Error al guardar ejecución:', error);
      
      if (error.response && error.response.data) {
        console.error('Detalles del error:', error.response.data);
        
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors).flat().join('\n');
          toast.showError('Error de validación', errorMessages);
          return;
        } else if (error.response.data.message) {
          toast.showError('Error', error.response.data.message);
          return;
        }
      }
      
      toast.showError('Error', 'No se pudo guardar la ejecución mensual');
    }
  };

  /* ==================================
   *        Eliminar
   * ================================== */
  const confirmDelete = (rowData) => {
    setSelectedEjecucion(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedEjecucion) return;
    try {
      await apiService.delete('presupuesto/ejecuciones', selectedEjecucion.id);
      toast.showSuccess('Éxito', 'Ejecución mensual eliminada correctamente');
      setDeleteDialogVisible(false);
      loadEjecuciones();
    } catch (error) {
      console.error('Error al eliminar ejecución:', error);
      toast.showError('Error', 'No se pudo eliminar la ejecución mensual');
    }
  };

  /* ==================================
   *      Ver Detalle
   * ================================== */
  const handleView = (rowData) => {
    setSelectedEjecucion(rowData);
    setViewDialogVisible(true);
  };

  /* ==================================
   *  Búsqueda, Filtros y Orden
   * ================================== */
  const getFilteredData = () => {
    if (!Array.isArray(ejecuciones)) {
      return [];
    }
    
    // Filtro de búsqueda global
    const filtered = ejecuciones.filter((ejecucion) => {
      const searchFields = [
        ejecucion?.anio?.toString(),
        ejecucion?.mes?.toString(),
        ejecucion?.areaEjecutora?.descripcion,
        ejecucion?.clasificador?.descripcion,
        ejecucion?.mto_at_comp?.toString(),
        ejecucion?.mto_devengado?.toString()
      ].map((f) => f?.toLowerCase() || '');

      const matchesSearch =
        !searchQuery ||
        searchFields.some((field) => field.includes(searchQuery.toLowerCase()));

      // Filtros por columna
      const matchAnio =
        !columnFilters.anio ||
        (ejecucion?.anio?.toString() || '').includes(columnFilters.anio);
      
      const matchMes =
        !columnFilters.mes ||
        (ejecucion?.mes?.toString() || '').includes(columnFilters.mes);
      
      const matchArea =
        !columnFilters['areaEjecutora.descripcion'] ||
        (ejecucion?.areaEjecutora?.descripcion?.toLowerCase() || '').includes(columnFilters['areaEjecutora.descripcion'].toLowerCase());
      
      const matchClasificador =
        !columnFilters['clasificador.descripcion'] ||
        (ejecucion?.clasificador?.descripcion?.toLowerCase() || '').includes(columnFilters['clasificador.descripcion'].toLowerCase());

      return (
        matchesSearch &&
        matchAnio &&
        matchMes &&
        matchArea &&
        matchClasificador
      );
    });

    // Ordenamiento
    let sortedData = [...filtered];
    sortedData.sort((a, b) => {
      // Ordenamiento para campos anidados
      if (sortField === 'areaEjecutora.descripcion') {
        const aValue = a?.areaEjecutora?.descripcion || '';
        const bValue = b?.areaEjecutora?.descripcion || '';
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true });
      } 
      else if (sortField === 'clasificador.descripcion') {
        const aValue = a?.clasificador?.descripcion || '';
        const bValue = b?.clasificador?.descripcion || '';
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true });
      }
      // Ordenamiento para fechas
      else if (sortField === 'fecha') {
        const aValue = a?.[sortField] ? new Date(a[sortField]) : new Date(0);
        const bValue = b?.[sortField] ? new Date(b[sortField]) : new Date(0);
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Ordenamiento para valores numéricos
      else if (['anio', 'mes', 'mto_at_comp', 'mto_devengado', 'mto_girado', 'mto_pagado'].includes(sortField)) {
        const aValue = a?.[sortField] || 0;
        const bValue = b?.[sortField] || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      // Ordenamiento predeterminado para texto
      else {
        const aValue = a?.[sortField] || '';
        const bValue = b?.[sortField] || '';
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, undefined, { numeric: true })
          : bValue.localeCompare(aValue, undefined, { numeric: true });
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
      field: 'anio',
      header: 'Año',
      sortable: true,
      filterable: true
    },
    {
      field: 'mes',
      header: 'Mes',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const meses = [
          'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        return meses[(rowData.mes - 1)] || rowData.mes;
      }
    },
    {
      field: 'areaEjecutora.descripcion',
      header: 'Área Ejecutora',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        // Buscar por ID en la lista de áreas ejecutoras
        const areaEjecutora = areasEjecutoras.find(ae => ae.id_ae === rowData.id_ae);
        if (areaEjecutora) {
          return `${areaEjecutora.codigo ? areaEjecutora.codigo + ' - ' : ''}${areaEjecutora.descripcion || 'Sin descripción'}`;
        } else if (rowData.id_ae) {
          return `ID: ${rowData.id_ae}`;
        } else {
          return 'N/A';
        }
      }
    },
    {
      field: 'clasificador.descripcion',
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
      field: 'mto_at_comp',
      header: 'At. Comprometido',
      sortable: true,
      body: (rowData) => formatCurrency(rowData.mto_at_comp)
    },
    {
      field: 'mto_devengado',
      header: 'Devengado',
      sortable: true,
      body: (rowData) => formatCurrency(rowData.mto_devengado)
    }
  ];

  // Columnas en móvil
  const mobileColumns = ['anio', 'mes', 'mto_devengado'];

  // Función para formatear moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN',
      minimumFractionDigits: 2
    }).format(value || 0);
  };

  // Función para cambiar el orden
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
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
          onChange={(e) => {
            console.log(`Seleccionado ${id}:`, e.target.value);
            onChange(e);
          }}
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
          min={type === 'number' ? 0 : undefined}
          step={type === 'number' ? '0.01' : undefined}
        />
      )}
    </div>
  );

  // Opciones para selects
  const areasOptions = areasEjecutoras.map(area => ({
    value: area.id_ae,
    label: `${area.codigo} - ${area.descripcion}`
  }));

  const clasificadoresOptions = clasificadores.map(clasificador => ({
    value: clasificador.id_clasificador,
    label: `${clasificador.codigo_clasificador} - ${clasificador.descripcion}`
  }));

  const mesesOptions = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' }
  ];

  /* ==================================
   *  Filtro especializado por año/mes
   * ================================== */
  const handleFilterByAnioMes = async () => {
    if (!filterAnio) {
      toast.showWarning('Advertencia', 'Debe especificar un año');
      return;
    }
    
    if (!filterMes) {
      toast.showWarning('Advertencia', 'Debe especificar un mes');
      return;
    }
    
    setLoading(true);
    try {
      const response = await apiService.get(`presupuesto/ejecuciones/anio/${filterAnio}/mes/${filterMes}`);
      const data = response?.data?.ejecuciones || [];
      console.log('Ejecuciones filtradas por año/mes:', response);
      setEjecuciones(data);
      setIsFiltered(true);
      setShowFilterDialog(false);
      setCurrentPage(1);
      
      // Mostrar totales
      if (response?.data?.totales) {
        const totales = response.data.totales;
        toast.showInfo(
          'Totales',
          `Comprometido: ${formatCurrency(totales.mto_at_comp)}, 
           Devengado: ${formatCurrency(totales.mto_devengado)}, 
           Girado: ${formatCurrency(totales.mto_girado)}, 
           Pagado: ${formatCurrency(totales.mto_pagado)}`
        );
      }
    } catch (error) {
      console.error('Error al filtrar ejecuciones:', error);
      toast.showError('Error', 'No se pudieron filtrar las ejecuciones mensuales');
    } finally {
      setLoading(false);
    }
  };

  const resetFilters = () => {
    setIsFiltered(false);
    loadEjecuciones();
  };

  /* ==================================
   *      Resumen anual
   * ================================== */
  const loadResumenAnual = async () => {
    if (!resumenAnio) {
      toast.showWarning('Advertencia', 'Debe especificar un año');
      return;
    }
    
    setLoadingResumen(true);
    try {
      const response = await apiService.get(`presupuesto/ejecuciones/resumen/${resumenAnio}`);
      console.log('Resumen anual recibido:', response);
      setResumenData(response?.data || null);
    } catch (error) {
      console.error('Error al cargar resumen anual:', error);
      toast.showError('Error', 'No se pudo cargar el resumen anual');
      setResumenData(null);
    } finally {
      setLoadingResumen(false);
    }
  };

  // Opciones para años (últimos 5 años)
  const getAniosOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 5; i++) {
      const year = currentYear - i;
      years.push({ value: year, label: year.toString() });
    }
    return years;
  };

  const aniosOptions = getAniosOptions();

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado con acciones adicionales */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Ejecución Mensual</h1>
        <div className="flex flex-wrap gap-2">
          {isFiltered && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md flex items-center font-medium 
                       hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50"
            >
              Quitar filtros
            </button>
          )}
          <button
            onClick={() => setShowFilterDialog(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            <FiFilter className="mr-2" />
            Filtrar por Año/Mes
          </button>
          <button
            onClick={() => {
              setResumenAnio(new Date().getFullYear());
              setShowResumenDialog(true);
              loadResumenAnual();
            }}
            className="px-4 py-2 bg-emerald-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-50"
          >
            <FiBarChart2 className="mr-2" />
            Resumen Anual
          </button>
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          >
            <FiPlus className="mr-2" />
            Nueva Ejecución
          </button>
        </div>
      </div>

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
            placeholder="Buscar ejecuciones..."
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
        emptyMessage="No hay ejecuciones disponibles"
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

      {/* Modal para Ver Detalles */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles de Ejecución Mensual"
        size="lg"
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
        {selectedEjecucion && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha</p>
              <p className="text-base">{selectedEjecucion.fecha ? new Date(selectedEjecucion.fecha).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Año / Mes</p>
              <p className="text-base">
                {selectedEjecucion.anio || '-'} / {
                  selectedEjecucion.mes ? 
                  ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][(selectedEjecucion.mes - 1)] 
                  : '-'
                }
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Área Ejecutora</p>
              <p className="text-base">
                {(() => {
                  // Buscar el área ejecutora por ID
                  const ae = areasEjecutoras.find(a => a.id_ae === selectedEjecucion.id_ae);
                  if (ae) {
                    return `${ae.codigo ? ae.codigo + ' - ' : ''}${ae.descripcion || 'Sin descripción'}`;
                  } else if (selectedEjecucion.id_ae) {
                    return `ID: ${selectedEjecucion.id_ae}`;
                  } else {
                    return 'N/A';
                  }
                })()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Clasificador</p>
              <p className="text-base">
                {(() => {
                  // Buscar el clasificador por ID
                  const cl = clasificadores.find(c => c.id_clasificador === selectedEjecucion.id_clasificador);
                  if (cl) {
                    return `${cl.codigo_clasificador || ''} ${cl.descripcion ? '- ' + cl.descripcion : ''}`;
                  } else if (selectedEjecucion.id_clasificador) {
                    return `ID: ${selectedEjecucion.id_clasificador}`;
                  } else {
                    return 'N/A';
                  }
                })()}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monto Atención Comprometido</p>
              <p className="text-base">{formatCurrency(selectedEjecucion.mto_at_comp)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monto Devengado</p>
              <p className="text-base">{formatCurrency(selectedEjecucion.mto_devengado)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monto Girado</p>
              <p className="text-base">{formatCurrency(selectedEjecucion.mto_girado)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monto Pagado</p>
              <p className="text-base">{formatCurrency(selectedEjecucion.mto_pagado)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de creación</p>
              <p className="text-base">{new Date(selectedEjecucion.created_at).toLocaleString() || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Última actualización</p>
              <p className="text-base">{new Date(selectedEjecucion.updated_at).toLocaleString() || '-'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal unificado para CREAR / EDITAR */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Ejecución Mensual' : 'Nueva Ejecución Mensual'}
        size="lg"
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
            (e) => setFormData((prev) => ({ ...prev, id_ae: e.target.value })),
            'select',
            areasOptions
          )}
          {renderFormField(
            'id_clasificador',
            'Clasificador',
            formData.id_clasificador,
            (e) => setFormData((prev) => ({ ...prev, id_clasificador: e.target.value })),
            'select',
            clasificadoresOptions
          )}
          {renderFormField(
            'fecha',
            'Fecha',
            formData.fecha,
            (e) => setFormData((prev) => ({ ...prev, fecha: e.target.value })),
            'date'
          )}
          {renderFormField(
            'anio',
            'Año',
            formData.anio,
            (e) => setFormData((prev) => ({ ...prev, anio: e.target.value })),
            'number'
          )}
          {renderFormField(
            'mes',
            'Mes',
            formData.mes,
            (e) => setFormData((prev) => ({ ...prev, mes: e.target.value })),
            'select',
            mesesOptions
          )}
          {renderFormField(
            'mto_at_comp',
            'Monto Atención Comprometido',
            formData.mto_at_comp,
            (e) => setFormData((prev) => ({ ...prev, mto_at_comp: e.target.value })),
            'number'
          )}
          {renderFormField(
            'mto_devengado',
            'Monto Devengado',
            formData.mto_devengado,
            (e) => setFormData((prev) => ({ ...prev, mto_devengado: e.target.value })),
            'number'
          )}
          {renderFormField(
            'mto_girado',
            'Monto Girado',
            formData.mto_girado,
            (e) => setFormData((prev) => ({ ...prev, mto_girado: e.target.value })),
            'number'
          )}
          {renderFormField(
            'mto_pagado',
            'Monto Pagado',
            formData.mto_pagado,
            (e) => setFormData((prev) => ({ ...prev, mto_pagado: e.target.value })),
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
          selectedEjecucion
            ? `¿Está seguro de que desea eliminar la ejecución mensual del ${
                selectedEjecucion.mes ? 
                ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'][(selectedEjecucion.mes - 1)] 
                : ''
              } de ${selectedEjecucion.anio}?`
            : '¿Está seguro de que desea eliminar esta ejecución mensual?'
        }
        confirmLabel="Eliminar"
        variant="danger"
      />

      {/* Modal para Filtro por Año/Mes */}
      <Modal
        isOpen={showFilterDialog}
        onClose={() => setShowFilterDialog(false)}
        title="Filtrar por Año y Mes"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setShowFilterDialog(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium 
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={handleFilterByAnioMes}
            >
              Aplicar Filtro
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          {renderFormField(
            'filter_anio',
            'Año',
            filterAnio,
            (e) => setFilterAnio(e.target.value),
            'select',
            aniosOptions
          )}
          {renderFormField(
            'filter_mes',
            'Mes',
            filterMes,
            (e) => setFilterMes(e.target.value),
            'select',
            mesesOptions
          )}
        </div>
      </Modal>

      {/* Modal para Resumen Anual */}
      <Modal
        isOpen={showResumenDialog}
        onClose={() => setShowResumenDialog(false)}
        title={`Resumen Anual ${resumenAnio}`}
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md 
                       font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setShowResumenDialog(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-1/3">
              {renderFormField(
                'resumen_anio',
                'Seleccione Año',
                resumenAnio,
                (e) => setResumenAnio(e.target.value),
                'select',
                aniosOptions
              )}
            </div>
            <button
              type="button"
              className="px-4 py-2 mt-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md
                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              onClick={loadResumenAnual}
              disabled={loadingResumen}
            >
              {loadingResumen ? 'Cargando...' : 'Actualizar'}
            </button>
          </div>

          {loadingResumen ? (
            <div className="p-4 text-center">Cargando datos...</div>
          ) : resumenData ? (
            <>
              <div className="border rounded-lg overflow-hidden">
                <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">Totales Generales</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Comprometido</p>
                    <p className="text-lg font-semibold">{formatCurrency(resumenData.totales_generales?.total_at_comp || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Devengado</p>
                    <p className="text-lg font-semibold">{formatCurrency(resumenData.totales_generales?.total_devengado || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Girado</p>
                    <p className="text-lg font-semibold">{formatCurrency(resumenData.totales_generales?.total_girado || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pagado</p>
                    <p className="text-lg font-semibold">{formatCurrency(resumenData.totales_generales?.total_pagado || 0)}</p>
                  </div>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">Resumen Mensual</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mes</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comprometido</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Devengado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Girado</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resumenData.resumen_por_mes?.map((mes) => {
                        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                                       'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
                        const mesNombre = meses[parseInt(mes.mes) - 1] || `Mes ${mes.mes}`;
                        
                        return (
                          <tr key={mes.mes}>
                            <td className="px-6 py-4 whitespace-nowrap">{mesNombre}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(mes.total_at_comp)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(mes.total_devengado)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(mes.total_girado)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(mes.total_pagado)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {resumenData.resumen_por_area?.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <h3 className="text-lg font-medium p-4 bg-gray-50 border-b">Resumen por Área Ejecutora</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Área Ejecutora</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Comprometido</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Devengado</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Girado</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Pagado</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {resumenData.resumen_por_area.map((area) => (
                          <tr key={area.id_ae}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{area.codigo}</div>
                              <div className="text-sm text-gray-500">{area.descripcion}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(area.totales.total_at_comp)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(area.totales.total_devengado)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(area.totales.total_girado)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">{formatCurrency(area.totales.total_pagado)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-4 text-center">No hay datos disponibles para el año seleccionado.</div>
          )}
        </div>
      </Modal>
    </div>
  );
} 
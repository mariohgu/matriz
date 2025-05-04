import React, { useState, useEffect, useRef } from 'react';
import {
  FiEdit,
  FiTrash2,
  FiPlus,
  FiEye,
  FiSearch,
  FiChevronDown,
  FiChevronUp,
  FiCalendar
} from 'react-icons/fi';
import { apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';

export default function ConvenioSeguimientoList() {
  // ========= Estados principales =========
  const [conveniosSeguimiento, setConveniosSeguimiento] = useState([]);
  const [convenios, setConvenios] = useState([]);
  const [estadosConvenio, setEstadosConvenio] = useState([]);
  const [loading, setLoading] = useState(true);

  // Búsqueda global, filtros por columna, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({});

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal unificado (crear/editar)
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    id_convenio_seguimiento: '',
    id_convenio: '',
    fecha: new Date(),
    id_estado_convenio: '',
    comentarios: '',
    acciones_realizadas: '',
    alertas_identificadas: '',
    acciones_desarrollar: '',
    fecha_seguimiento: null
  });

  // Para ver detalles y eliminar
  const [selectedSeguimiento, setSelectedSeguimiento] = useState(null);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Dropdowns con búsqueda
  const [showConvenioDropdown, setShowConvenioDropdown] = useState(false);
  const [convenioSearchQuery, setConvenioSearchQuery] = useState('');
  const convenioDropdownRef = useRef(null);

  const [showEstadoDropdown, setShowEstadoDropdown] = useState(false);
  const [estadoSearchQuery, setEstadoSearchQuery] = useState('');
  const estadoDropdownRef = useRef(null);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Notificaciones
  const toast = useToast();
  
  // ========= useEffect de carga inicial =========
  useEffect(() => {
    loadConveniosSeguimiento();
    loadRelatedData();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Cerrar dropdowns al hacer clic afuera
    function handleClickOutside(e) {
      if (convenioDropdownRef.current && !convenioDropdownRef.current.contains(e.target)) {
        setShowConvenioDropdown(false);
      }
      if (estadoDropdownRef.current && !estadoDropdownRef.current.contains(e.target)) {
        setShowEstadoDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ========= Cargar data de backend =========
  const loadConveniosSeguimiento = async () => {
    try {
      setLoading(true);
      const data = await apiService.getAll('convenio-seguimiento');
      // Asegurémonos de que cada objeto tenga la propiedad id_convenio_seguimiento
      const processedData = data.map(item => {
        // Si no tiene id_convenio_seguimiento pero tiene id, crear el campo
        if (!item.id_convenio_seguimiento && item.id) {
          return {
            ...item,
            id_convenio_seguimiento: item.id
          };
        }
        return item;
      });
      
      setConveniosSeguimiento(processedData || []);
    } catch (error) {
      console.error('Error al cargar seguimientos de convenios:', error);
      toast.showError('Error', 'No se pudieron cargar los seguimientos de convenios');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      // Cargar convenios con su información completa
      const conveniosData = await apiService.getAll('convenios');
      
      // Cargar estados de convenio
      const estadosData = await apiService.getAll('estados-convenios');
      
      // Procesar convenios para asegurar que tengan la información completa
      const conveniosProcessed = await Promise.all(
        conveniosData.map(async (convenio) => {
          // Si el convenio no tiene la municipalidad cargada, cargarla
          if (!convenio.municipalidad && convenio.id_municipalidad) {
            try {
              const municipalidad = await apiService.getById('municipalidades', convenio.id_municipalidad);
              convenio.municipalidad = municipalidad;
            } catch (error) {
              console.warn(`No se pudo cargar la municipalidad para el convenio ${convenio.id_convenio}`);
            }
          }
          return convenio;
        })
      );
      
      setConvenios(conveniosProcessed || []);
      
      // Verificar y procesar los estados de convenio
      if (Array.isArray(estadosData) && estadosData.length > 0) {
        // Asegurarse de que cada estado tenga un nombre, usando descripción como fallback
        const estadosProcesados = estadosData.map(estado => ({
          ...estado,
          nombre: estado.nombre || estado.descripcion || 'Sin nombre'
        }));
        setEstadosConvenio(estadosProcesados);
      } else {
        console.warn('No se encontraron estados de convenio o el formato no es válido', estadosData);
        setEstadosConvenio([]);
        toast.showWarning('Advertencia', 'No se encontraron estados de convenio');
      }
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      console.error('Detalle del error:', error.response?.data || error.message);
      toast.showError('Error', 'No se pudieron cargar los datos relacionados');
    }
  };

  // =====================
  //  Función de ayuda para obtener el ID correcto
  // =====================
  const getSeguimientoId = (item) => {
    if (!item) return null;
    return item.id_convenio_seguimiento || item.id;
  };

  // =====================
  //  Crear / Editar
  // =====================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_convenio_seguimiento: '',
      id_convenio: '',
      fecha: new Date(),
      id_estado_convenio: '',
      comentarios: '',
      acciones_realizadas: '',
      alertas_identificadas: '',
      acciones_desarrollar: '',
      fecha_seguimiento: null
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedSeguimiento(rowData);

    // Usar el ID correcto
    const seguimientoId = getSeguimientoId(rowData);
    
    // Asegurarse de que id_estado_convenio sea tratado como número
    let estadoActualId = null;
    if (rowData.id_estado_convenio) {
      try {
        estadoActualId = Number(rowData.id_estado_convenio);
      } catch (error) {
        console.error('Error al convertir id_estado_convenio a número:', error);
        estadoActualId = '';
      }
    }
    
        // === fecha ===
        let fechaObj = null;
        if (rowData.fecha) {
          // 1) Extraemos solo la parte YYYY-MM-DD
          const fechaStr = typeof rowData.fecha === 'string'
            ? rowData.fecha.split('T')[0]
            : rowData.fecha.toISOString().split('T')[0];

          // 2) Parseamos año, mes y día
          const [year, month, day] = fechaStr.split('-').map(n => parseInt(n, 10));

          // 3) Construimos la fecha en hora local (00:00)
          fechaObj = new Date(year, month - 1, day);
        } else {
          fechaObj = new Date();
        }

        // === fecha_seguimiento ===
        let fechaSeguimientoObj = null;
        if (rowData.fecha_seguimiento) {
          // Igual: extraemos YYYY-MM-DD de la cadena o del Date
          const fsStr = typeof rowData.fecha_seguimiento === 'string'
            ? rowData.fecha_seguimiento.split('T')[0]
            : rowData.fecha_seguimiento.toISOString().split('T')[0];

          const [y, m, d] = fsStr.split('-').map(n => parseInt(n, 10));
          fechaSeguimientoObj = new Date(y, m - 1, d);
        }
        
    setFormData({
      id_convenio_seguimiento: seguimientoId,
      id: seguimientoId,
      id_convenio: rowData.id_convenio,
      fecha: fechaObj,
      id_estado_convenio: estadoActualId,
      comentarios: rowData.comentarios || '',
      acciones_realizadas: rowData.acciones_realizadas || '',
      alertas_identificadas: rowData.alertas_identificadas || '',
      acciones_desarrollar: rowData.acciones_desarrollar || '',
      fecha_seguimiento: fechaSeguimientoObj
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    // Validaciones mínimas
    if (!formData.id_convenio || !formData.fecha || !formData.id_estado_convenio) {
      toast.showWarning('Advertencia', 'Por favor llena los campos obligatorios');
      return;
    }

    const payload = {
      ...formData,
      fecha: formData.fecha
        ? new Date(
            formData.fecha.getFullYear(),
            formData.fecha.getMonth(),
            formData.fecha.getDate()
          ).toISOString().split('T')[0]
        : null,
      fecha_seguimiento: formData.fecha_seguimiento
        ? new Date(
            formData.fecha_seguimiento.getFullYear(),
            formData.fecha_seguimiento.getMonth(),
            formData.fecha_seguimiento.getDate()
          ).toISOString().split('T')[0]
        : null,
      // Asegurar que id_estado_convenio sea número
      id_estado_convenio: formData.id_estado_convenio ? parseInt(formData.id_estado_convenio, 10) : null
    };

    // Usar el ID correcto
    const seguimientoId = getSeguimientoId(formData);

    try {
      if (isEditMode && seguimientoId) {
        // Actualizar
        await apiService.update('convenio-seguimiento', seguimientoId, payload);
        toast.showSuccess('Éxito', 'Seguimiento de convenio actualizado');
      } else {
        // Crear nuevo
        await apiService.create('convenio-seguimiento', payload);
        toast.showSuccess('Éxito', 'Seguimiento de convenio creado');
      }
      setUpsertDialogVisible(false);
      loadConveniosSeguimiento();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.showError('Error', 'No se pudo guardar el seguimiento de convenio');
    }
  };

  // =====================
  //  Eliminar
  // =====================
  const confirmDelete = (rowData) => {
    setSelectedSeguimiento(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedSeguimiento) return;
    
    // Usar el ID correcto
    const seguimientoId = getSeguimientoId(selectedSeguimiento);
    
    try {
      await apiService.delete('convenio-seguimiento', seguimientoId);
      toast.showSuccess('Éxito', 'Seguimiento de convenio eliminado');
      setDeleteDialogVisible(false);
      loadConveniosSeguimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.showError('Error', 'No se pudo eliminar el seguimiento de convenio');
    }
  };

  // =====================
  //  Ver detalle
  // =====================
  const handleView = (rowData) => {
    setSelectedSeguimiento(rowData);
    setViewDialogVisible(true);
  };

  // =====================
  //  Formatear fecha
  // =====================
  const formatDate = (value) => {
    if (!value) return '';
  
    // Obtener la parte YYYY-MM-DD (si llega con T...)
    let dateStr = '';
    if (typeof value === 'string') {
      dateStr = value.split('T')[0];
    } else if (value instanceof Date) {
      // si es Date, convertir a ISO y extraer YYYY-MM-DD
      dateStr = value.toISOString().split('T')[0];
    } else {
      return '';
    }
  
    const [year, month, day] = dateStr.split('-');
    // Devolver DD/MM/YYYY
    return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
  };

  // =====================
  //  Obtener el nombre del estado convenio
  // =====================
  const getEstadoConvenioNombre = (id) => {
    if (!id) {
      return 'N/A';
    }
    
    try {
      // Intentar convertir a número para comparación
      const estadoId = Number(id);
      
      // Buscar el estado
      const estado = estadosConvenio.find(e => Number(e.id_estado_convenio) === estadoId);
      
      // Resultado de la búsqueda
      const resultado = estado?.nombre || estado?.descripcion || 'N/A';
      
      return resultado;
    } catch (error) {
      console.error('Error al obtener nombre de estado:', error);
      return 'N/A';
    }
  };

  // =====================
  //  Búsqueda y Filtros
  // =====================
  const applyFilters = () => {
    if (!conveniosSeguimiento || conveniosSeguimiento.length === 0) return [];
    let filtered = [...conveniosSeguimiento];

    // Búsqueda global
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        // Campos para text-search
        const convenio = convenios.find((c) => c.id_convenio === item.id_convenio);
        const codigoInterno = convenio?.codigo_interno?.toLowerCase() || '';
        const municipalidadNombre = convenio?.municipalidad?.nombre?.toLowerCase() || '';
        const codigoCui = convenio?.codigo_idea_cui?.toString().toLowerCase() || '';
        const ubigeo = convenio?.municipalidad?.ubigeo?.toLowerCase() || '';
        
        const estadoNombre = getEstadoConvenioNombre(item.id_estado_convenio)?.toLowerCase() || '';

        return (
          codigoInterno.includes(q) ||
          municipalidadNombre.includes(q) ||
          codigoCui.includes(q) ||
          ubigeo.includes(q) ||
          estadoNombre.includes(q) ||
          (item.comentarios || '').toLowerCase().includes(q) ||
          (item.acciones_realizadas || '').toLowerCase().includes(q) ||
          (item.alertas_identificadas || '').toLowerCase().includes(q) ||
          (item.acciones_desarrollar || '').toLowerCase().includes(q) ||
          formatDate(item.fecha).includes(q) ||
          formatDate(item.fecha_seguimiento).includes(q)
        );
      });
    }

    // Filtros por columna
    Object.entries(columnFilters).forEach(([field, value]) => {
      if (value) {
        const lowerVal = value.toLowerCase();
        filtered = filtered.filter((item) => {
          if (field === 'convenio.nombre') {
            const convenio = convenios.find((c) => c.id_convenio === item.id_convenio);
            if (!convenio) return false;
            
            const codigo = convenio.codigo_interno?.toLowerCase() || '';
            const municipalidadNombre = convenio.municipalidad?.nombre?.toLowerCase() || '';
            const codigoCui = convenio.codigo_idea_cui?.toString().toLowerCase() || '';
            
            return codigo.includes(lowerVal) || 
                   municipalidadNombre.includes(lowerVal) || 
                   codigoCui.includes(lowerVal);
          } else if (field === 'id_estado_convenio.descripcion') {
            const estadoNombre = getEstadoConvenioNombre(item.id_estado_convenio)?.toLowerCase() || '';
            return estadoNombre.includes(lowerVal);
          } else if (field === 'fecha') {
            return formatDate(item.fecha).includes(value);
          } else if (field === 'fecha_seguimiento') {
            return formatDate(item.fecha_seguimiento).includes(value);
          } else {
            // Para campos directos
            return (item[field] || '').toString().toLowerCase().includes(lowerVal);
          }
        });
      }
    });

    // Ordenar
    if (sortField) {
      filtered.sort((a, b) => {
        let valA, valB;
        if (sortField === 'convenio.nombre') {
          const convenioA = convenios.find((c) => c.id_convenio === a.id_convenio);
          const convenioB = convenios.find((c) => c.id_convenio === b.id_convenio);
          
          // Primero intentar ordenar por código interno
          valA = convenioA?.codigo_interno?.toLowerCase() || '';
          valB = convenioB?.codigo_interno?.toLowerCase() || '';
          
          // Si ambos tienen el mismo código interno o están vacíos, intentar por municipalidad
          if (valA === valB) {
            valA = convenioA?.municipalidad?.nombre?.toLowerCase() || '';
            valB = convenioB?.municipalidad?.nombre?.toLowerCase() || '';
          }
        } else if (sortField === 'id_estado_convenio.descripcion') {
          valA = getEstadoConvenioNombre(a.id_estado_convenio)?.toLowerCase() || '';
          valB = getEstadoConvenioNombre(b.id_estado_convenio)?.toLowerCase() || '';
        } else if (sortField === 'fecha' || sortField === 'fecha_seguimiento') {
          valA = a[sortField] ? new Date(a[sortField]) : new Date(0);
          valB = b[sortField] ? new Date(b[sortField]) : new Date(0);
        } else {
          valA = (a[sortField] || '').toString().toLowerCase();
          valB = (b[sortField] || '').toString().toLowerCase();
        }

        if (valA instanceof Date && valB instanceof Date) {
          return sortOrder === 'asc' ? valA - valB : valB - valA;
        } else {
          const result = valA.localeCompare(valB);
          return sortOrder === 'asc' ? result : -result;
        }
      });
    }

    return filtered;
  };

  const getPaginatedData = () => {
    const filteredData = applyFilters();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      data: filteredData.slice(startIndex, endIndex),
      totalRecords: filteredData.length
    };
  };

  const { data: paginatedData, totalRecords } = getPaginatedData();
  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  // =====================
  //  Definir columnas
  // =====================
  const columns = [
    {
      field: 'convenio.nombre',
      header: 'CONVENIO',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const convenio = convenios.find((c) => c.id_convenio === rowData.id_convenio);
        if (!convenio) return 'N/A';
        return (
          <div>
            <div className="font-medium">{convenio.municipalidad?.nombre || 'Sin municipalidad'}</div>
            <div className="text-xs text-gray-500">
              Interno: {convenio.codigo_interno || 'Sin código'}
              {convenio.codigo_idea_cui ? ` - CUI: ${convenio.codigo_idea_cui}` : ''}
            </div>
          </div>
        );
      }
    },
    {
      field: 'fecha',
      header: 'FECHA',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha) || 'N/A'
    },
    {
      field: 'id_estado_convenio.descripcion',
      header: 'ESTADO ACTUAL',
      sortable: true,
      filterable: true,
      body: (rowData) => {
        const nombre = getEstadoConvenioNombre(rowData.id_estado_convenio);
        return nombre;
      }
    },
    {
      field: 'fecha_seguimiento',
      header: 'FECHA SEGUIMIENTO',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha_seguimiento) || 'N/A'
    }
  ];

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

  const tableColumns = [...columns, { field: 'acciones', header: 'ACCIONES', body: renderActions }];

  // Columnas en móvil
  const mobileColumns = ['convenio.nombre', 'fecha', 'acciones'];

  // =====================
  // Render principal
  // =====================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Seguimiento de Convenios</h1>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
          onClick={handleCreate}
        >
          <FiPlus className="mr-2" />
          Nuevo Seguimiento
        </button>
      </div>

      {/* Búsqueda global */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar seguimientos de convenios..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-hidden">
        <Table
          data={paginatedData}
          columns={tableColumns}
          loading={loading}
          hideGlobalSearch={true}
          showFiltersButton={true}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={(field, order) => {
            setSortField(field);
            setSortOrder(order);
          }}
          emptyMessage="No hay seguimientos de convenios disponibles"
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
          isMobile={isMobile}
          mobileColumns={mobileColumns}
        />
      </div>

      {/* Paginación */}
      {totalRecords > 0 && (
        <div className="mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalRecords={totalRecords}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </div>
      )}

      {/* MODAL CREAR/EDITAR UNIFICADO */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Seguimiento de Convenio' : 'Nuevo Seguimiento de Convenio'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Convenio con búsqueda */}
          <div className="relative" ref={convenioDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Convenio <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowConvenioDropdown(!showConvenioDropdown)}
            >
              <span>
                {formData.id_convenio
                  ? (() => {
                      const convenio = convenios.find((conv) => conv.id_convenio.toString() === formData.id_convenio.toString());
                      if (!convenio) return 'Seleccione un convenio';
                      return convenio.municipalidad?.nombre || 'Sin municipalidad';
                    })()
                  : 'Seleccione un convenio'}
              </span>
              {showConvenioDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showConvenioDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar convenio..."
                      value={convenioSearchQuery}
                      onChange={(e) => setConvenioSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {convenios
                    .filter((conv) => {
                      const q = convenioSearchQuery.toLowerCase();
                      const codigo = conv.codigo_interno?.toLowerCase() || '';
                      const municipalidadNombre = conv.municipalidad?.nombre?.toLowerCase() || '';
                      const codigoCui = conv.codigo_idea_cui?.toString().toLowerCase() || '';
                      const ubigeo = conv.municipalidad?.ubigeo?.toLowerCase() || '';
                      
                      return codigo.includes(q) || 
                             municipalidadNombre.includes(q) || 
                             codigoCui.includes(q) || 
                             ubigeo.includes(q);
                    })
                    .map((conv) => (
                      <div
                        key={conv.id_convenio}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_convenio: conv.id_convenio
                          }));
                          setShowConvenioDropdown(false);
                        }}
                      >
                        <div className="font-medium">
                          {conv.municipalidad?.nombre || 'Sin municipalidad'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Interno: {conv.codigo_interno || 'Sin código'}
                          {conv.codigo_idea_cui ? ` - CUI: ${conv.codigo_idea_cui}` : ''} 
                          {conv.municipalidad?.ubigeo ? ` - Ubigeo: ${conv.municipalidad.ubigeo}` : ''}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha <span className="text-red-500">*</span>
            </label>
            <TailwindCalendar
              selectedDate={formData.fecha}
              onChange={(newDate) => setFormData((prev) => ({ ...prev, fecha: newDate }))}
              id="fecha"
              className="w-full"
            />
          </div>

          {/* Estado Actual con dropdown */}
          <div className="relative" ref={estadoDropdownRef}>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Estado Actual <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowEstadoDropdown(!showEstadoDropdown)}
            >
              <span>
                {formData.id_estado_convenio
                  ? getEstadoConvenioNombre(formData.id_estado_convenio)
                  : 'Seleccione un estado'}
              </span>
              {showEstadoDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showEstadoDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar estado..."
                      value={estadoSearchQuery}
                      onChange={(e) => setEstadoSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {estadosConvenio
                    .filter((estado) => {
                      const q = estadoSearchQuery.toLowerCase();
                      return (estado.nombre || estado.descripcion || '')?.toLowerCase().includes(q);
                    })
                    .map((estado) => (
                      <div
                        key={estado.id_estado_convenio}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          // Convertir el ID del estado a número antes de guardarlo
                          const estadoId = Number(estado.id_estado_convenio);
                          setFormData((prev) => ({ ...prev, id_estado_convenio: estadoId }));
                          setShowEstadoDropdown(false);
                        }}
                      >
                        <div className="font-medium">{estado.nombre || estado.descripcion || 'N/A'}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Fecha Seguimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Fecha de Seguimiento
            </label>
            <TailwindCalendar
              selectedDate={formData.fecha_seguimiento}
              onChange={(newDate) => setFormData((prev) => ({ ...prev, fecha_seguimiento: newDate }))}
              id="fecha_seguimiento"
              className="w-full"
            />
          </div>

          {/* Comentarios */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Comentarios
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.comentarios || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, comentarios: e.target.value }))}
            />
          </div>

          {/* Acciones Realizadas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Acciones Realizadas
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.acciones_realizadas || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, acciones_realizadas: e.target.value }))}
            />
          </div>

          {/* Alertas Identificadas */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Alertas Identificadas
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.alertas_identificadas || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, alertas_identificadas: e.target.value }))}
            />
          </div>

          {/* Acciones a Desarrollar */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Acciones a Desarrollar
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              value={formData.acciones_desarrollar || ''}
              onChange={(e) => setFormData((prev) => ({ ...prev, acciones_desarrollar: e.target.value }))}
            />
          </div>
        </div>
      </Modal>

      {/* Modal VER DETALLE */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalle de Seguimiento de Convenio"
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedSeguimiento && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Convenio:</h3>
              <p>
                {(() => {
                  const convenio = convenios.find((c) => c.id_convenio === selectedSeguimiento.id_convenio);
                  if (!convenio) return 'N/A';
                  return (
                    <>
                      {convenio.municipalidad?.nombre || 'Sin municipalidad'}
                      <br />
                      <span className="text-xs text-gray-500">
                        Interno: {convenio.codigo_interno || 'Sin código'}
                        {convenio.codigo_idea_cui ? ` - CUI: ${convenio.codigo_idea_cui}` : ''} 
                        {convenio.municipalidad?.ubigeo ? ` - Ubigeo: ${convenio.municipalidad.ubigeo}` : ''}
                      </span>
                    </>
                  );
                })()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Fecha:</h3>
              <p>{formatDate(selectedSeguimiento.fecha)}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Estado Actual:</h3>
              <p>
                {getEstadoConvenioNombre(selectedSeguimiento.id_estado_convenio)}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Fecha de Seguimiento:</h3>
              <p>{formatDate(selectedSeguimiento.fecha_seguimiento) || 'No especificada'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Comentarios:</h3>
              <p className="whitespace-pre-wrap">{selectedSeguimiento.comentarios || 'Sin comentarios'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Acciones Realizadas:</h3>
              <p className="whitespace-pre-wrap">{selectedSeguimiento.acciones_realizadas || 'No especificadas'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Alertas Identificadas:</h3>
              <p className="whitespace-pre-wrap">{selectedSeguimiento.alertas_identificadas || 'No especificadas'}</p>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Acciones a Desarrollar:</h3>
              <p className="whitespace-pre-wrap">{selectedSeguimiento.acciones_desarrollar || 'No especificadas'}</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Diálogo CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        message="¿Estás seguro de que deseas eliminar este seguimiento de convenio?"
        title="Confirmación"
        icon={<FiTrash2 />}
        acceptLabel="Eliminar"
        rejectLabel="Cancelar"
        acceptClassName="bg-red-600 text-white"
        onConfirm={handleDelete}
        onReject={() => setDeleteDialogVisible(false)}
      />
    </div>
  );
} 
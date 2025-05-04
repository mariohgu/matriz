import React, { useState, useEffect, useRef } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiEye, FiChevronUp, FiChevronDown, FiSearch } from 'react-icons/fi';
import { apiService } from '../../services/authService';
import { Table, Pagination, Modal, ConfirmDialog, useToast, TailwindCalendar } from '../ui';

// Opciones de tipo de convenio
const tipoConvenioOptions = [
  { value: '', label: 'Seleccione un tipo' },
  { value: 'Colaboración', label: 'Colaboración' },
  { value: 'Delegación', label: 'Delegación' },
  { value: 'Asistencia Técnica', label: 'Asistencia Técnica' },
  { value: 'Otros', label: 'Otros' }
];


export default function ConveniosList() {
  const [convenios, setConvenios] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [sectores, setSectores] = useState([]);
  const [direccionesLinea, setDireccionesLinea] = useState([]);
  const [estadosConvenio, setEstadosConvenio] = useState([]);

  const [loading, setLoading] = useState(false);

  // Búsqueda global, filtros, orden
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('fecha_firma');
  const [sortOrder, setSortOrder] = useState('desc');
  const [columnFilters, setColumnFilters] = useState({
    tipo_convenio: '',
    municipalidad: '',
    monto: '',
    fecha_firma: '',
    estado: '',
    sector: '',
    direccion_linea: ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Responsivo
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Modal de ver detalle
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedConvenio, setSelectedConvenio] = useState(null);

  // Modal unificado para crear/editar
  const [upsertDialogVisible, setUpsertDialogVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  // Datos del formulario para crear / editar
  const [formData, setFormData] = useState({
    id_convenio: '',
    id_municipalidad: '',
    tipo_convenio: '',
    monto: '',
    fecha_firma: '',
    id_estado_convenio: '',
    descripcion: '',
    codigo_convenio: '',
    codigo_idea_cui: '',
    descripcion_idea_cui: '',
    beneficiarios: '',
    codigo_interno: '',
    id_sector: '',
    id_direccion_linea: ''
  });

  // Modal de eliminar
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);

  // Notificaciones
  const toast = useToast();

  // ============== Estados y refs para los dropdowns con búsqueda ===========
  const [showMunicipalidadDropdown, setShowMunicipalidadDropdown] = useState(false);
  const [municipalidadSearchQuery, setMunicipalidadSearchQuery] = useState('');
  const municipalidadDropdownRef = useRef(null);

  const [showSectorDropdown, setShowSectorDropdown] = useState(false);
  const [sectorSearchQuery, setSectorSearchQuery] = useState('');
  const sectorDropdownRef = useRef(null);

  const [showDireccionLineaDropdown, setShowDireccionLineaDropdown] = useState(false);
  const [direccionLineaSearchQuery, setDireccionLineaSearchQuery] = useState('');
  const direccionLineaDropdownRef = useRef(null);

  const [showEstadoConvenioDropdown, setShowEstadoConvenioDropdown] = useState(false);
  const [estadoConvenioSearchQuery, setEstadoConvenioSearchQuery] = useState('');
  const estadoConvenioDropdownRef = useRef(null);

  useEffect(() => {
    loadConvenios();
    loadRelatedData();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);

    // Cerrar el dropdown al hacer clic fuera
    const handleClickOutside = (e) => {
      if (
        municipalidadDropdownRef.current &&
        !municipalidadDropdownRef.current.contains(e.target)
      ) {
        setShowMunicipalidadDropdown(false);
      }
      if (
        sectorDropdownRef.current &&
        !sectorDropdownRef.current.contains(e.target)
      ) {
        setShowSectorDropdown(false);
      }
      if (
        direccionLineaDropdownRef.current &&
        !direccionLineaDropdownRef.current.contains(e.target)
      ) {
        setShowDireccionLineaDropdown(false);
      }
      if (
        estadoConvenioDropdownRef.current &&
        !estadoConvenioDropdownRef.current.contains(e.target)
      ) {
        setShowEstadoConvenioDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadConvenios = async () => {
    setLoading(true);
    try {
      const data = await apiService.getAll('convenios');
      setConvenios(data || []);
    } catch (error) {
      console.error('Error al cargar convenios:', error);
      toast.showError('Error', 'No se pudieron cargar los convenios');
    } finally {
      setLoading(false);
    }
  };

  const loadRelatedData = async () => {
    try {
      console.log('Intentando cargar datos relacionados...');
      
      // Cargar municipalidades, sectores y direcciones
      const [muniData, sectoresData, direccionesData] = await Promise.all([
        apiService.getAll('municipalidades'),
        apiService.getAll('sectores'),
        apiService.getAll('direccion-linea')
      ]);
      
      setMunicipalidades(muniData || []);
      setSectores(sectoresData || []);
      setDireccionesLinea(direccionesData || []);
      
      // Cargar estados de convenio
      try {
        console.log('Cargando estados de convenio desde estados-convenios...');
        const estadosData = await apiService.getAll('estados-convenios');
        console.log('Estados de convenio cargados:', estadosData);
        
        if (Array.isArray(estadosData) && estadosData.length > 0) {
          setEstadosConvenio(estadosData);
        } else {
          console.warn('La respuesta de estados-convenios no contiene datos:', estadosData);
          setEstadosConvenio([]);
          toast.showWarning('Advertencia', 'No se encontraron estados de convenio');
        }
      } catch (estadosError) {
        console.error('Error al cargar estados-convenios:', estadosError);
        console.error('Detalle del error:', estadosError.response?.data || estadosError.message);
        setEstadosConvenio([]);
        toast.showError('Error', 'No se pudieron cargar los estados de convenio');
      }
    } catch (error) {
      console.error('Error al cargar datos relacionados:', error);
      console.error('Detalle del error:', error.response?.data || error.message);
      toast.showError('Error', 'No se pudieron cargar los datos relacionados');
    }
  };

  // ================== CREAR / EDITAR ==================
  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      id_convenio: '',
      id_municipalidad: '',
      tipo_convenio: '',
      monto: '',
      fecha_firma: '',
      id_estado_convenio: '',
      descripcion: '',
      codigo_convenio: '',
      codigo_idea_cui: '',
      descripcion_idea_cui: '',
      beneficiarios: '',
      codigo_interno: '',
      id_sector: '',
      id_direccion_linea: ''
    });
    setUpsertDialogVisible(true);
  };

  const handleEdit = (rowData) => {
    setIsEditMode(true);
    setSelectedConvenio(rowData);

    // Ajustar fecha a YYYY-MM-DD
    const fechaString = rowData.fecha_firma
      ? new Date(rowData.fecha_firma).toISOString().split('T')[0]
      : '';
    setFormData({
      id_convenio: rowData.id_convenio,
      id_municipalidad: rowData.id_municipalidad || '',
      tipo_convenio: rowData.tipo_convenio || '',
      monto: rowData.monto?.toString() || '',
      fecha_firma: fechaString,
      id_estado_convenio: rowData.id_estado_convenio || '',
      descripcion: rowData.descripcion || '',
      codigo_convenio: rowData.codigo_convenio || '',
      codigo_idea_cui: rowData.codigo_idea_cui?.toString() || '',
      descripcion_idea_cui: rowData.descripcion_idea_cui || '',
      beneficiarios: rowData.beneficiarios?.toString() || '',
      codigo_interno: rowData.codigo_interno || '',
      id_sector: rowData.id_sector || '',
      id_direccion_linea: rowData.id_direccion_linea || ''
    });
    setUpsertDialogVisible(true);
  };

  const handleSave = async () => {
    if (!formData.id_municipalidad || !formData.tipo_convenio || !formData.id_sector || 
        !formData.id_direccion_linea || !formData.codigo_interno) {
      toast.showWarning('Advertencia', 'Complete los campos obligatorios');
      return;
    }

    try {
      const payload = { ...formData };

      // isEditMode?
      if (isEditMode && payload.id_convenio) {
        await apiService.update('convenios', payload.id_convenio, payload);
        toast.showSuccess('Éxito', 'Convenio actualizado correctamente');
      } else {
        await apiService.create('convenios', payload);
        toast.showSuccess('Éxito', 'Convenio creado correctamente');
      }

      setUpsertDialogVisible(false);
      loadConvenios();
    } catch (error) {
      console.error('Error al guardar convenio:', error);
      toast.showError('Error', 'No se pudo guardar el convenio');
    }
  };

  // ================== ELIMINAR ==================
  const confirmDelete = (rowData) => {
    setSelectedConvenio(rowData);
    setDeleteDialogVisible(true);
  };

  const handleDelete = async () => {
    if (!selectedConvenio) return;
    try {
      await apiService.delete('convenios', selectedConvenio.id_convenio);
      toast.showSuccess('Éxito', 'Convenio eliminado correctamente');
      setDeleteDialogVisible(false);
      loadConvenios();
    } catch (error) {
      console.error('Error al eliminar convenio:', error);
      toast.showError('Error', 'No se pudo eliminar el convenio');
    }
  };

  // ================== VER DETALLE ==================
  const handleView = (rowData) => {
    setSelectedConvenio(rowData);
    setViewDialogVisible(true);
  };

  // ================== UTILS ==================
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatCurrency = (val) => {
    if (!val) return '';
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(val);
  };

  const getMunicipalidadName = (id) => {
    if (!id) return 'N/A';
    const muni = municipalidades.find((m) => m.id_municipalidad === Number(id));
    return muni?.nombre || 'N/A';
  };

  const getSectorName = (id) => {
    if (!id) return 'N/A';
    const sector = sectores.find((s) => s.id_sector === Number(id));
    return sector?.descripcion || 'N/A';
  };

  const getDireccionLineaName = (id) => {
    if (!id) return 'N/A';
    const direccion = direccionesLinea.find((d) => d.id_direccion_linea === Number(id));
    return direccion?.descripcion || 'N/A';
  };

  const getEstadoConvenioName = (id) => {
    if (!id) return 'N/A';
    const estado = estadosConvenio.find((e) => e.id_estado_convenio === Number(id));
    // Intentar obtener el nombre, si no existe usar descripción
    return estado?.nombre || estado?.descripcion || 'N/A';
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':      return 'Pendiente';
      case 'En proceso':     return 'En proceso';
      case 'Firmado':        return 'Firmado';
      case 'Cancelado':      return 'Cancelado';
      case 'Finalizado':     return 'Finalizado';
      default:               return 'N/A';
    }
  };

  // ================== FILTRO, ORDEN, PAGINACIÓN ==================
  const getFilteredData = () => {
    let filtered = convenios.filter((c) => {
      // Búsqueda global
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const muniName = getMunicipalidadName(c.id_municipalidad).toLowerCase() || '';
        const sectorName = getSectorName(c.id_sector).toLowerCase() || '';
        const direccionName = getDireccionLineaName(c.id_direccion_linea).toLowerCase() || '';
        const estadoConvenioName = getEstadoConvenioName(c.id_estado_convenio).toLowerCase() || '';
        
        const fields = [
          c.tipo_convenio?.toLowerCase() || '',
          muniName,
          sectorName,
          direccionName,
          estadoConvenioName,
          c.monto?.toString() || '',
          c.codigo_convenio?.toLowerCase() || '',
          c.codigo_idea_cui?.toString() || '',
          c.codigo_interno?.toLowerCase() || '',
          c.descripcion_idea_cui?.toLowerCase() || '',
          c.beneficiarios?.toString() || '',
          c.descripcion?.toLowerCase() || ''
        ];
        
        if (!fields.some((f) => f.includes(q))) {
          return false;
        }
      }

      // Filtros por columna
      if (columnFilters.tipo_convenio && !c.tipo_convenio?.toLowerCase().includes(columnFilters.tipo_convenio.toLowerCase())) {
        return false;
      }
      if (columnFilters.municipalidad) {
        const muni = getMunicipalidadName(c.id_municipalidad).toLowerCase();
        if (!muni.includes(columnFilters.municipalidad.toLowerCase())) return false;
      }
      if (columnFilters.sector) {
        const sector = getSectorName(c.id_sector).toLowerCase();
        if (!sector || !sector.includes(columnFilters.sector.toLowerCase())) return false;
      }
      if (columnFilters.direccion_linea) {
        const direccion = getDireccionLineaName(c.id_direccion_linea).toLowerCase();
        if (!direccion || !direccion.includes(columnFilters.direccion_linea.toLowerCase())) return false;
      }
      if (columnFilters.monto) {
        if (!c.monto?.toString().includes(columnFilters.monto)) return false;
      }
      if (columnFilters.fecha_firma) {
        const fdate = formatDate(c.fecha_firma);
        if (!fdate.includes(columnFilters.fecha_firma)) return false;
      }
      if (columnFilters.estado) {
        const estado = getEstadoConvenioName(c.id_estado_convenio).toLowerCase();
        if (!estado || !estado.includes(columnFilters.estado.toLowerCase())) return false;
      }

      return true;
    });

    // Ordenar
    filtered.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      // Manejo especial
      if (sortField === 'fecha_firma') {
        valA = valA ? new Date(valA).getTime() : 0;
        valB = valB ? new Date(valB).getTime() : 0;
      }
      if (sortField === 'monto') {
        valA = valA ? parseFloat(valA) : 0;
        valB = valB ? parseFloat(valB) : 0;
      }
      if (sortField === 'sector.descripcion') {
        valA = getSectorName(a.id_sector).toLowerCase();
        valB = getSectorName(b.id_sector).toLowerCase();
      }
      if (sortField === 'direccion_linea.descripcion') {
        valA = getDireccionLineaName(a.id_direccion_linea).toLowerCase();
        valB = getDireccionLineaName(b.id_direccion_linea).toLowerCase();
      }
      if (sortField === 'estadoConvenio.nombre') {
        valA = getEstadoConvenioName(a.id_estado_convenio).toLowerCase();
        valB = getEstadoConvenioName(b.id_estado_convenio).toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

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

  const filteredData = getFilteredData();
  const { data: paginatedData, totalRecords, totalPages } = applyPagination(filteredData);

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // ================== COLUMNAS DE TABLA ==================
  const columns = [
    {
      field: 'tipo_convenio',
      header: 'Tipo Convenio',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.tipo_convenio || 'N/A'
    },
    {
      field: 'municipalidad',
      header: 'Municipalidad',
      sortable: true,
      filterable: true,
      body: (rowData) => getMunicipalidadName(rowData.id_municipalidad) || 'N/A'
    },
    {
      field: 'sector.descripcion',
      header: 'Sector',
      sortable: true,
      filterable: true,
      body: (rowData) => getSectorName(rowData.id_sector) || 'N/A'
    },
    {
      field: 'monto',
      header: 'Monto',
      sortable: true,
      filterable: true,
      body: (rowData) => formatCurrency(rowData.monto)
    },
    {
      field: 'fecha_firma',
      header: 'Fecha Firma',
      sortable: true,
      filterable: true,
      body: (rowData) => formatDate(rowData.fecha_firma)
    },
    {
      field: 'estadoConvenio.nombre',
      header: 'Estado',
      sortable: true,
      filterable: true,
      body: (rowData) => getEstadoConvenioName(rowData.id_estado_convenio)
    },
    {
      field: 'codigo_interno',
      header: 'Código Interno',
      sortable: true,
      filterable: true,
      body: (rowData) => rowData.codigo_interno || 'N/A'
    }
  ];

  const mobileColumns = ['tipo_convenio', 'municipalidad', 'codigo_interno'];

  // ================== RENDER ACCIONES ==================
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

  // ================== RENDER PRINCIPAL ==================
  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Convenios</h1>
        <button
          onClick={handleCreate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium 
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Convenio
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
            placeholder="Buscar convenios..."
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
        onSearch={setSearchQuery}
        columnFilters={columnFilters}
        onColumnFilterChange={setColumnFilters}
        loading={loading}
        emptyMessage="No hay convenios disponibles"
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

      {/* Modal Ver Detalle */}
      <Modal
        isOpen={viewDialogVisible}
        onClose={() => setViewDialogVisible(false)}
        title="Detalles de Convenio"
        size="xl"
        footer={
          <div className="flex justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-gray-500"
              onClick={() => setViewDialogVisible(false)}
            >
              Cerrar
            </button>
          </div>
        }
      >
        {selectedConvenio && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Tipo de Convenio</p>
              <p className="text-base">{selectedConvenio.tipo_convenio || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Municipalidad</p>
              <p className="text-base">{getMunicipalidadName(selectedConvenio.id_municipalidad)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Sector</p>
              <p className="text-base">{getSectorName(selectedConvenio.id_sector)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Dirección de Línea</p>
              <p className="text-base">{getDireccionLineaName(selectedConvenio.id_direccion_linea)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Monto</p>
              <p className="text-base">{formatCurrency(selectedConvenio.monto)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Fecha de Firma</p>
              <p className="text-base">{formatDate(selectedConvenio.fecha_firma)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Estado</p>
              <p className="text-base">{getEstadoConvenioName(selectedConvenio.id_estado_convenio)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Código Interno</p>
              <p className="text-base">{selectedConvenio.codigo_interno || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Código de Convenio</p>
              <p className="text-base">{selectedConvenio.codigo_convenio || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Código IDEA/CUI</p>
              <p className="text-base">{selectedConvenio.codigo_idea_cui || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Beneficiarios</p>
              <p className="text-base">{selectedConvenio.beneficiarios || '-'}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Descripción IDEA/CUI</p>
              <p className="text-base whitespace-pre-wrap">
                {selectedConvenio.descripcion_idea_cui || 'Sin descripción'}
              </p>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-gray-500">Descripción</p>
              <p className="text-base whitespace-pre-wrap">
                {selectedConvenio.descripcion || 'Sin descripción'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal CREAR / EDITAR UNIFICADO */}
      <Modal
        isOpen={upsertDialogVisible}
        onClose={() => setUpsertDialogVisible(false)}
        title={isEditMode ? 'Editar Convenio' : 'Nuevo Convenio'}
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 
                         rounded-md font-medium focus:outline-none focus:ring-2 
                         focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setUpsertDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md
                         font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 
                         focus:ring-blue-500"
              onClick={handleSave}
            >
              {isEditMode ? 'Actualizar' : 'Guardar'}
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/** ======== MUNICIPALIDAD con SELECTBOX de búsqueda ======== */}
          <div className="relative" ref={municipalidadDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowMunicipalidadDropdown(!showMunicipalidadDropdown)}
            >
              <span>
                {formData.id_municipalidad
                  ? municipalidades.find(
                      (m) => m.id_municipalidad === Number(formData.id_municipalidad)
                    )?.nombre || 'Seleccione una municipalidad'
                  : 'Seleccione una municipalidad'}
              </span>
              {showMunicipalidadDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showMunicipalidadDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
                              rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar municipalidad..."
                      value={municipalidadSearchQuery}
                      onChange={(e) => setMunicipalidadSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {municipalidades
                    .filter((m) => {
                      const q = municipalidadSearchQuery.toLowerCase();
                      return (
                        m.nombre?.toLowerCase().includes(q) ||
                        (m.ubigeo || '').toLowerCase().includes(q) ||
                        (m.departamento || '').toLowerCase().includes(q)
                      );
                    })
                    .map((m) => (
                      <div
                        key={m.id_municipalidad}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_municipalidad: m.id_municipalidad
                          }));
                          setShowMunicipalidadDropdown(false);
                        }}
                      >
                        <div className="font-medium">{m.nombre || 'Municipalidad sin nombre'}</div>
                        <div className="text-xs text-gray-500">
                          [{m.ubigeo || 'Sin ubigeo'}, {m.departamento || 'Sin departamento'}]
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* TIPO DE CONVENIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Convenio <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.tipo_convenio || ''}
              onChange={(e) => setFormData({ ...formData, tipo_convenio: e.target.value })}
            >
              {tipoConvenioOptions.map((op) => (
                <option key={op.value} value={op.value}>
                  {op.label}
                </option>
              ))}
            </select>
          </div>

          {/** ======== SECTOR con SELECTBOX de búsqueda ======== */}
          <div className="relative" ref={sectorDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sector <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowSectorDropdown(!showSectorDropdown)}
            >
              <span>
                {formData.id_sector
                  ? sectores.find(
                      (s) => s.id_sector === Number(formData.id_sector)
                    )?.descripcion || 'Seleccione un sector'
                  : 'Seleccione un sector'}
              </span>
              {showSectorDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showSectorDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
                              rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar sector..."
                      value={sectorSearchQuery}
                      onChange={(e) => setSectorSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {sectores
                    .filter((s) => {
                      const q = sectorSearchQuery.toLowerCase();
                      return s.descripcion?.toLowerCase().includes(q);
                    })
                    .map((s) => (
                      <div
                        key={s.id_sector}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_sector: s.id_sector
                          }));
                          setShowSectorDropdown(false);
                        }}
                      >
                        <div className="font-medium">{s.descripcion || 'Sector sin descripción'}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/** ======== DIRECCION LINEA con SELECTBOX de búsqueda ======== */}
          <div className="relative" ref={direccionLineaDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección de Línea <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowDireccionLineaDropdown(!showDireccionLineaDropdown)}
            >
              <span>
                {formData.id_direccion_linea
                  ? direccionesLinea.find(
                      (d) => d.id_direccion_linea === Number(formData.id_direccion_linea)
                    )?.descripcion || 'Seleccione una dirección'
                  : 'Seleccione una dirección'}
              </span>
              {showDireccionLineaDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showDireccionLineaDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
                              rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar dirección..."
                      value={direccionLineaSearchQuery}
                      onChange={(e) => setDireccionLineaSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {direccionesLinea
                    .filter((d) => {
                      const q = direccionLineaSearchQuery.toLowerCase();
                      return d.descripcion?.toLowerCase().includes(q);
                    })
                    .map((d) => (
                      <div
                        key={d.id_direccion_linea}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_direccion_linea: d.id_direccion_linea
                          }));
                          setShowDireccionLineaDropdown(false);
                        }}
                      >
                        <div className="font-medium">{d.descripcion || 'Dirección sin descripción'}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* MONTO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Monto <span className="text-red-500">*</span>
            </label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">S/</span>
              </div>
              <input
                type="number"
                className="block w-full pl-7 pr-12 border border-gray-300 
                           rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.monto || ''}
                onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">PEN</span>
              </div>
            </div>
          </div>

          {/* FECHA_FIRMA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de Firma <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md p-2"
              value={formData.fecha_firma || ''}
              onChange={(e) => setFormData({ ...formData, fecha_firma: e.target.value })}
            />
          </div>

          {/** ======== ESTADO CONVENIO con SELECTBOX de búsqueda ======== */}
          <div className="relative" ref={estadoConvenioDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado <span className="text-red-500">*</span>
            </label>
            <div
              className="w-full border border-gray-300 rounded-md p-2 flex justify-between items-center cursor-pointer"
              onClick={() => setShowEstadoConvenioDropdown(!showEstadoConvenioDropdown)}
            >
              <span>
                {formData.id_estado_convenio
                  ? estadosConvenio.find(
                      (e) => e.id_estado_convenio === Number(formData.id_estado_convenio)
                    )?.nombre || 'Seleccione un estado'
                  : 'Seleccione un estado'}
              </span>
              {showEstadoConvenioDropdown ? <FiChevronUp /> : <FiChevronDown />}
            </div>
            {showEstadoConvenioDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 
                              rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="sticky top-0 bg-white p-2 border-b border-gray-200">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                      placeholder="Buscar estado..."
                      value={estadoConvenioSearchQuery}
                      onChange={(e) => setEstadoConvenioSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>
                <div className="py-1">
                  {estadosConvenio
                    .filter((e) => {
                      const q = estadoConvenioSearchQuery.toLowerCase();
                      return e.nombre?.toLowerCase().includes(q);
                    })
                    .map((e) => (
                      <div
                        key={e.id_estado_convenio}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setFormData((prev) => ({
                            ...prev,
                            id_estado_convenio: e.id_estado_convenio
                          }));
                          setShowEstadoConvenioDropdown(false);
                        }}
                      >
                        <div className="font-medium">{e.nombre || 'Estado sin nombre'}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* CÓDIGO INTERNO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Interno <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Ingrese el código interno"
              value={formData.codigo_interno || ''}
              onChange={(e) => setFormData({ ...formData, codigo_interno: e.target.value })}
              maxLength={20}
            />
          </div>

          {/* CÓDIGO CONVENIO */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código Convenio
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Ingrese el código del convenio"
              value={formData.codigo_convenio || ''}
              onChange={(e) => setFormData({ ...formData, codigo_convenio: e.target.value })}
              maxLength={20}
            />
          </div>

          {/* CÓDIGO IDEA/CUI */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Código IDEA/CUI
            </label>
            <input
              type="text"
              inputMode="numeric"       // muestra teclado numérico en móviles
              pattern="\d*"             // opcional: obliga a que solo haya dígitos
              maxLength={7}             // ahora sí funciona
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Ingrese el código IDEA/CUI"
              value={formData.codigo_idea_cui || ''}
              onChange={(e) => {
                // filtramos cualquier carácter no numérico
                const onlyNums = e.target.value.replace(/\D/g, '');
                setFormData({
                  ...formData,
                  codigo_idea_cui: onlyNums
                });
              }}
            />
          </div>


          {/* BENEFICIARIOS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Beneficiarios
            </label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded-md p-2"
              placeholder="Número de beneficiarios"
              value={formData.beneficiarios || ''}
              onChange={(e) => setFormData({ ...formData, beneficiarios: e.target.value })}
              min="0"
            />
          </div>

          {/* DESCRIPCIÓN IDEA/CUI */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción IDEA/CUI
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={2}
              placeholder="Descripción del proyecto IDEA/CUI"
              value={formData.descripcion_idea_cui || ''}
              onChange={(e) => setFormData({ ...formData, descripcion_idea_cui: e.target.value })}
              maxLength={250}
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md p-2"
              rows={3}
              placeholder="Descripción general del convenio"
              value={formData.descripcion || ''}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Modal CONFIRMAR ELIMINACIÓN */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={
          selectedConvenio
            ? `¿Está seguro de eliminar el convenio "${selectedConvenio.tipo_convenio}" con código "${selectedConvenio.codigo_interno}"?`
            : '¿Está seguro de eliminar este convenio?'
        }
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </div>
  );
}

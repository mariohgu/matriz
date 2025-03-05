import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode, addLocale } from 'primereact/api';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';

// Configuración del locale español
addLocale('es', {
    firstDayOfWeek: 1,
    dayNames: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
    dayNamesShort: ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'],
    dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
    monthNames: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
    monthNamesShort: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
    today: 'Hoy',
    clear: 'Limpiar'
});

export default function EventosList() {
  const [eventos, setEventos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [editData, setEditData] = useState({
    id_evento: '',
    id_municipalidad: '',
    id_contacto: '',
    tipo_acercamiento: '',
    lugar: '',
    fecha: null
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'municipalidad.nombre': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'contacto.nombre_completo': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    tipo_acercamiento: { value: null, matchMode: FilterMatchMode.CONTAINS },
    lugar: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fecha: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  useEffect(() => {
    loadEventos();
    loadMunicipalidades();
  }, []);

  const loadEventos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADDRESS}api/eventos`);
      setEventos(response.data || []);
    } catch (error) {
      console.error('Error al cargar eventos:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los eventos',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const response = await axios.get(`${ADDRESS}api/municipalidades`);
      setMunicipalidades(response.data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las municipalidades',
        life: 3000
      });
    }
  };

  const loadContactosPorMunicipalidad = async (municipalidadId) => {
    try {
      const response = await axios.get(`${ADDRESS}api/municipalidades/${municipalidadId}/contactos`);
      setContactos(response.data || []);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los contactos',
        life: 3000
      });
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleMunicipalidadChange = (e) => {
    const municipalidadId = e.value;
    setEditData(prev => ({
      ...prev,
      id_municipalidad: municipalidadId,
      id_contacto: '' // Reset contacto when municipalidad changes
    }));
    loadContactosPorMunicipalidad(municipalidadId);
  };

  const handleSave = async () => {
    try {
      const dataToSend = {
        ...editData,
        fecha: editData.fecha ? editData.fecha.toISOString().split('T')[0] : null
      };

      if (editData.id_evento) {
        await axios.put(`${ADDRESS}api/eventos/${editData.id_evento}`, dataToSend);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Evento actualizado correctamente',
          life: 3000
        });
      } else {
        await axios.post(`${ADDRESS}api/eventos`, dataToSend);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Evento creado correctamente',
          life: 3000
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_evento: '',
        id_municipalidad: '',
        id_contacto: '',
        tipo_acercamiento: '',
        lugar: '',
        fecha: null
      });
      loadEventos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el evento',
        life: 3000
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/eventos/${rowData.id_evento}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Evento eliminado correctamente',
        life: 3000
      });
      loadEventos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el evento',
        life: 3000
      });
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex justify-center gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          className="p-button-sm bg-blue-500 hover:bg-blue-600 border-blue-500"
          onClick={() => {
            setEditData(rowData);
            loadContactosPorMunicipalidad(rowData.id_municipalidad);
            setEditDialogVisible(true);
          }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          className="p-button-sm bg-red-500 hover:bg-red-600 border-red-500"
          onClick={() => {
            setSelectedEvento(rowData);
            setDeleteDialogVisible(true);
          }}
        />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-gray-800">Eventos</h2>
          <Button
            label="Nuevo Evento"
            icon="pi pi-plus"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            onClick={() => {
              setEditData({
                id_evento: '',
                id_municipalidad: '',
                id_contacto: '',
                tipo_acercamiento: '',
                lugar: '',
                fecha: null
              });
              setCreateDialogVisible(true);
            }}
          />
        </div>
        <div className="w-full sm:w-auto">
          <span className="p-input-icon-left w-full">
            <i className="pi pi-search" />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Buscar..."
              className="w-full"
            />
          </span>
        </div>
      </div>
    );
  };

  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData.fecha);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const dialogFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        onClick={() => {
          setEditDialogVisible(false);
          setCreateDialogVisible(false);
        }}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="bg-green-500 hover:bg-green-600 text-white"
        onClick={handleSave}
      />
    </div>
  );

  const deleteDialogFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        onClick={() => setDeleteDialogVisible(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="bg-red-500 hover:bg-red-600 text-white"
        onClick={() => {
          confirmDelete(selectedEvento);
          setDeleteDialogVisible(false);
        }}
      />
    </div>
  );

  return (
    <div className="card w-full p-4">
      <Toast ref={toast} />
      
      <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full" style={{ width: '100%' }}>
        {/* Contenedor adicional para forzar el ancho */}
        <div style={{ width: '100%', overflowX: 'hidden' }}>
          <DataTable
            ref={dt}
            value={eventos}
            selection={selectedEvento}
            onSelectionChange={(e) => setSelectedEvento(e.value)}
            dataKey="id_evento"
            paginator
            rows={10}
            filters={filters}
            filterDisplay="row"
            loading={loading}
            responsiveLayout="scroll"
            globalFilterFields={['municipalidad.nombre', 'contacto.nombre_completo', 'tipo_acercamiento', 'lugar', 'fecha']}
            header={renderHeader()}
            emptyMessage="No se encontraron eventos"
            className="p-datatable-sm w-full"
            showGridlines
            removableSort
            resizableColumns
            columnResizeMode="expand"
            style={{ width: '100%' }}
            tableStyle={{ width: '100%', tableLayout: 'fixed' }}
          >
            <Column 
              field="municipalidad.nombre" 
              header="Municipalidad" 
              sortable 
              filter 
              filterPlaceholder="Buscar por municipalidad"
              showFilterMenu={false}
              style={{ minWidth: '200px' }}
            />
            <Column 
              field="contacto.nombre_completo" 
              header="Contacto" 
              sortable 
              filter 
              filterPlaceholder="Buscar por contacto"
              showFilterMenu={false}
              style={{ minWidth: '200px' }}
            />
            <Column 
              field="tipo_acercamiento" 
              header="Tipo de Acercamiento" 
              sortable 
              filter 
              filterPlaceholder="Buscar por tipo"
              showFilterMenu={false}
              style={{ minWidth: '200px' }}
            />
            <Column 
              field="lugar" 
              header="Lugar" 
              sortable 
              filter 
              filterPlaceholder="Buscar por lugar"
              showFilterMenu={false}
              style={{ minWidth: '150px' }}
            />
            <Column 
              field="fecha" 
              header="Fecha" 
              sortable 
              filter 
              filterPlaceholder="Buscar por fecha"
              body={dateBodyTemplate}
              showFilterMenu={false}
              style={{ minWidth: '150px' }}
            />
            <Column 
              body={actionBodyTemplate} 
              exportable={false} 
              style={{ minWidth: '100px', textAlign: 'center' }}
            />
          </DataTable>
        </div>
      </div>

      <Dialog
        visible={editDialogVisible || createDialogVisible}
        style={{ width: '90%', maxWidth: '800px' }}
        header={editData.id_evento ? 'Editar Evento' : 'Nuevo Evento'}
        modal
        className="p-fluid"
        footer={dialogFooter}
        onHide={() => {
          setEditDialogVisible(false);
          setCreateDialogVisible(false);
          setEditData({
            id_evento: '',
            id_municipalidad: '',
            id_contacto: '',
            tipo_acercamiento: '',
            lugar: '',
            fecha: null
          });
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-field mb-4">
            <label htmlFor="municipalidad" className="block text-sm font-medium text-gray-700 mb-1">
              Municipalidad
            </label>
            <Dropdown
              id="municipalidad"
              value={editData.id_municipalidad}
              onChange={handleMunicipalidadChange}
              options={municipalidades}
              optionLabel="nombre"
              optionValue="id_municipalidad"
              placeholder="Seleccione una municipalidad"
              className="w-full"
            />
          </div>

          <div className="p-field mb-4">
            <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 mb-1">
              Contacto
            </label>
            <Dropdown
              id="contacto"
              value={editData.id_contacto}
              onChange={(e) => setEditData(prev => ({ ...prev, id_contacto: e.value }))}
              options={contactos}
              optionLabel="nombre_completo"
              optionValue="id_contacto"
              placeholder="Seleccione un contacto"
              className="w-full"
              disabled={!editData.id_municipalidad}
            />
          </div>

          <div className="p-field mb-4">
            <label htmlFor="lugar" className="block text-sm font-medium text-gray-700 mb-1">
              Lugar
            </label>
            <InputText
              id="lugar"
              value={editData.lugar}
              onChange={(e) => setEditData(prev => ({ ...prev, lugar: e.target.value }))}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="p-field mb-4">
            <label htmlFor="fecha" className="block text-sm font-medium text-gray-700 mb-1">
              Fecha
            </label>
            <Calendar
              id="fecha"
              value={editData.fecha ? new Date(editData.fecha) : null}
              onChange={(e) => setEditData(prev => ({ ...prev, fecha: e.value }))}
              dateFormat="dd/mm/yy"
              showIcon
              locale="es"
              className="w-full"
              showButtonBar
              panelClassName="p-4 bg-white rounded-lg shadow-lg border border-gray-200"
              inputClassName="w-full p-2 border rounded-md"
              nextIcon="pi pi-chevron-right"
              prevIcon="pi pi-chevron-left"
              todayButtonClassName="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
              clearButtonClassName="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            />
          </div>

          <div className="p-field mb-4 col-span-full">
            <label htmlFor="tipo_acercamiento" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Acercamiento
            </label>
            <textarea
              id="tipo_acercamiento"
              value={editData.tipo_acercamiento}
              onChange={(e) => setEditData(prev => ({ ...prev, tipo_acercamiento: e.target.value }))}
              className="w-full p-2 border rounded-md"
              rows={4}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={deleteDialogVisible}
        style={{ width: '450px' }}
        header="Confirmar"
        modal
        className="p-fluid"
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialogVisible(false)}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle text-yellow-500 mr-3" style={{ fontSize: '2rem' }} />
          {selectedEvento && (
            <span>
              ¿Está seguro que desea eliminar el evento?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}
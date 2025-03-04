import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { Dropdown } from 'primereact/dropdown';
import { MultiSelect } from 'primereact/multiselect';
import axios from 'axios';

export default function MunicipalidadesList() {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nombre: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    departamento: { value: null, matchMode: FilterMatchMode.IN },
    provincia: { value: null, matchMode: FilterMatchMode.CONTAINS },
    distrito: { value: null, matchMode: FilterMatchMode.CONTAINS },
    ubigeo: { value: null, matchMode: FilterMatchMode.EQUALS }
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [editData, setEditData] = useState({
    id: '',
    nombre: '',
    departamento: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
  });
  const toast = useRef(null);
  const dt = useRef(null);

  useEffect(() => {
    loadMunicipalidades();
  }, []);

  const loadMunicipalidades = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://matriz.ddev.site/api/municipalidades');
      setMunicipalidades(response.data || []);
    } catch (error) {
      console.error('Error al cargar municipalidades:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar las municipalidades',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;

    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleEdit = async () => {
    try {
      if (!selectedMunicipalidad?.id) {
        toast.current.show({
          severity: 'error',
          summary: 'Error',
          detail: 'ID de municipalidad no válido',
          life: 3000
        });
        return;
      }

      const updatedData = {
        ...editData,
        id: selectedMunicipalidad.id
      };

      await axios.put(`https://matriz.ddev.site/api/municipalidades/${selectedMunicipalidad.id}`, updatedData);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Municipalidad actualizada correctamente',
        life: 3000
      });
      setEditDialogVisible(false);
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al actualizar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al actualizar la municipalidad',
        life: 3000
      });
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`https://matriz.ddev.site/api/municipalidades/${selectedMunicipalidad.id}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Municipalidad eliminada correctamente',
        life: 3000
      });
      setDeleteDialogVisible(false);
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar la municipalidad',
        life: 3000
      });
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex gap-2 justify-center">
        <Button
          icon="pi pi-pencil"
          rounded
          outlined
          className="mr-2"
          onClick={() => {
            setSelectedMunicipalidad(rowData);
            setEditData({
              id: rowData.id,
              nombre: rowData.nombre,
              departamento: rowData.departamento,
              provincia: rowData.provincia,
              distrito: rowData.distrito,
              ubigeo: rowData.ubigeo,
            });
            setEditDialogVisible(true);
          }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          outlined
          severity="danger"
          onClick={() => {
            setSelectedMunicipalidad(rowData);
            setDeleteDialogVisible(true);
          }}
        />
      </div>
    );
  };

  const renderHeader = () => {
    return (
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h2 className="text-xl font-bold">Municipalidades</h2>
        <div className="w-full md:w-auto flex justify-end">
          <span className="p-input-icon-left w-full md:w-auto">
            <i className="pi pi-search" />
            <InputText
              value={globalFilterValue}
              onChange={onGlobalFilterChange}
              placeholder="Buscar municipalidad..."
              className="w-full md:w-[300px]"
            />
          </span>
        </div>
      </div>
    );
  };

  // Obtener departamentos únicos para el filtro
  const getDepartamentos = () => {
    const departamentos = new Set(municipalidades.map(m => m.departamento));
    return Array.from(departamentos).map(dep => ({ label: dep, value: dep }));
  };

  const departamentoFilterTemplate = (options) => {
    return (
      <MultiSelect
        value={options.value}
        options={getDepartamentos()}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Seleccionar departamentos"
        className="p-column-filter w-full"
        display="chip"
      />
    );
  };

  const editDialogFooter = (
    <div>
      <Button label="Cancelar" icon="pi pi-times" outlined onClick={() => setEditDialogVisible(false)} />
      <Button label="Guardar" icon="pi pi-check" onClick={handleEdit} />
    </div>
  );

  const deleteDialogFooter = (
    <div>
      <Button label="No" icon="pi pi-times" outlined onClick={() => setDeleteDialogVisible(false)} />
      <Button label="Sí" icon="pi pi-check" severity="danger" onClick={handleDelete} />
    </div>
  );

  return (
    <div className="card p-2 md:p-4 lg:p-6">
      <Toast ref={toast} />
      
      <DataTable
        ref={dt}
        value={municipalidades}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        dataKey="id"
        filters={filters}
        loading={loading}
        globalFilterFields={['nombre', 'departamento', 'provincia', 'distrito', 'ubigeo']}
        header={renderHeader}
        emptyMessage="No se encontraron municipalidades"
        className="p-datatable-gridlines"
        responsiveLayout="stack"
        breakpoint="960px"
        scrollable
        scrollHeight="calc(100vh - 300px)"
        filterDisplay="menu"
      >
        <Column 
          key="nombre"
          field="nombre" 
          header="Nombre" 
          sortable 
          filter 
          filterPlaceholder="Buscar por nombre"
          className="min-w-[200px]"
          showFilterMenu={false}
          filterMenuStyle={{ width: '14rem' }}
        />
        <Column 
          key="departamento"
          field="departamento" 
          header="Departamento" 
          sortable 
          filter 
          filterElement={departamentoFilterTemplate}
          showFilterMenu={true}
          filterMenuStyle={{ width: '14rem' }}
          className="min-w-[150px]"
        />
        <Column 
          key="provincia"
          field="provincia" 
          header="Provincia" 
          sortable 
          filter 
          filterPlaceholder="Buscar por provincia"
          showFilterMenu={false}
          filterMenuStyle={{ width: '14rem' }}
          className="min-w-[150px]"
        />
        <Column 
          key="distrito"
          field="distrito" 
          header="Distrito" 
          sortable 
          filter 
          filterPlaceholder="Buscar por distrito"
          showFilterMenu={false}
          filterMenuStyle={{ width: '14rem' }}
          className="min-w-[150px]"
        />
        <Column 
          key="ubigeo"
          field="ubigeo" 
          header="Ubigeo" 
          sortable 
          filter 
          filterPlaceholder="Buscar por ubigeo"
          showFilterMenu={false}
          filterMenuStyle={{ width: '14rem' }}
          className="min-w-[120px]"
        />
        <Column 
          key="actions"
          body={actionBodyTemplate} 
          exportable={false} 
          style={{ minWidth: '8rem' }}
          className="justify-center"
        />
      </DataTable>

      {/* Diálogo de Edición */}
      <Dialog
        visible={editDialogVisible}
        style={{ width: '90vw', maxWidth: '450px' }}
        header="Editar Municipalidad"
        modal
        className="p-fluid"
        footer={editDialogFooter}
        onHide={() => setEditDialogVisible(false)}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      >
        <div className="field">
          <label htmlFor="nombre">Nombre</label>
          <InputText
            id="nombre"
            value={editData.nombre}
            onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
            required
            autoFocus
          />
        </div>
        <div className="field">
          <label htmlFor="departamento">Departamento</label>
          <InputText
            id="departamento"
            value={editData.departamento}
            onChange={(e) => setEditData({ ...editData, departamento: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="provincia">Provincia</label>
          <InputText
            id="provincia"
            value={editData.provincia}
            onChange={(e) => setEditData({ ...editData, provincia: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="distrito">Distrito</label>
          <InputText
            id="distrito"
            value={editData.distrito}
            onChange={(e) => setEditData({ ...editData, distrito: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="ubigeo">Ubigeo</label>
          <InputText
            id="ubigeo"
            value={editData.ubigeo}
            onChange={(e) => setEditData({ ...editData, ubigeo: e.target.value })}
          />
        </div>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        visible={deleteDialogVisible}
        style={{ width: '90vw', maxWidth: '450px' }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialogVisible(false)}
        breakpoints={{ '960px': '75vw', '641px': '90vw' }}
      >
        <div className="flex align-items-center justify-content-center">
          <i className="pi pi-exclamation-triangle mr-3" style={{ fontSize: '2rem' }} />
          {selectedMunicipalidad && (
            <span>
              ¿Está seguro que desea eliminar la municipalidad <b>{selectedMunicipalidad.nombre}</b>?
            </span>
          )}
        </div>
      </Dialog>
    </div>
  );
}

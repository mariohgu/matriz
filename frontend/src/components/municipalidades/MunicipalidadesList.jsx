import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FilterMatchMode } from 'primereact/api';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';

export default function MunicipalidadesList() {
  const [municipalidades, setMunicipalidades] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedMunicipalidad, setSelectedMunicipalidad] = useState(null);
  const [editData, setEditData] = useState({
    id_municipalidad: '',
    nombre: '',
    departamento: '',
    region: '',
    provincia: '',
    distrito: '',
    ubigeo: '',
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);
  //const address = "http://127.0.0.1:8000/";

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nombre: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    region: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    departamento: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    provincia: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    distrito: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    ubigeo: { value: null, matchMode: FilterMatchMode.STARTS_WITH }
  });

  useEffect(() => {
    loadMunicipalidades();
  }, []);

  const loadMunicipalidades = async () => {
    setLoading(true);
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

  const handleSave = async () => {
    try {
      if (editData.id_municipalidad) {
        await axios.put(`${ADDRESS}api/municipalidades/${editData.id_municipalidad}`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Municipalidad actualizada correctamente',
          life: 3000
        });
      } else {
        await axios.post(`${ADDRESS}api/municipalidades`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Municipalidad creada correctamente',
          life: 3000
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_municipalidad: '',
        nombre: '',
        departamento: '',
        region: '',
        provincia: '',
        distrito: '',
        ubigeo: '',
      });
      loadMunicipalidades();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar la municipalidad',
        life: 3000
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/municipalidades/${rowData.id_municipalidad}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Municipalidad eliminada correctamente',
        life: 3000
      });
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
      <div className="flex justify-center gap-2">
        <Button
          icon="pi pi-pencil"
          rounded
          className="p-button-sm bg-blue-500 hover:bg-blue-600 border-blue-500"
          onClick={() => {
            setEditData(rowData);
            setEditDialogVisible(true);
          }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          className="p-button-sm bg-red-500 hover:bg-red-600 border-red-500"
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 bg-white border-b border-gray-200">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <h2 className="text-2xl font-bold text-gray-800">Municipalidades</h2>
          <Button
            label="Nueva Municipalidad"
            icon="pi pi-plus"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            onClick={() => {
              setEditData({
                id_municipalidad: '',
                nombre: '',
                departamento: '',
                region: '',
                provincia: '',
                distrito: '',
                ubigeo: '',
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
              placeholder="Buscar municipalidad..."
              className="w-full sm:w-[300px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-2"
            />
          </span>
        </div>
      </div>
    );
  };

  const editDialogFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        onClick={() => setEditDialogVisible(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="bg-green-500 hover:bg-green-600 text-white"
        onClick={handleSave}
      />
    </div>
  );

  const createDialogFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        onClick={() => setCreateDialogVisible(false)}
      />
      <Button
        label="Crear"
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
          confirmDelete(selectedMunicipalidad);
          setDeleteDialogVisible(false);
        }}
      />
    </div>
  );

  const dialogContent = (
    <>
      <div className="field mb-4">
        <label htmlFor="nombre" className="block text-gray-700 font-medium mb-2">
          Nombre
        </label>
        <InputText
          id="nombre"
          value={editData.nombre}
          onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="field">
          <label htmlFor="region" className="block text-gray-700 font-medium mb-2">
            Región
          </label>
          <InputText
            id="region"
            value={editData.region}
            onChange={(e) => setEditData({ ...editData, region: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="field">
          <label htmlFor="departamento" className="block text-gray-700 font-medium mb-2">
            Departamento
          </label>
          <InputText
            id="departamento"
            value={editData.departamento}
            onChange={(e) => setEditData({ ...editData, departamento: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="field">
          <label htmlFor="provincia" className="block text-gray-700 font-medium mb-2">
            Provincia
          </label>
          <InputText
            id="provincia"
            value={editData.provincia}
            onChange={(e) => setEditData({ ...editData, provincia: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="field">
          <label htmlFor="distrito" className="block text-gray-700 font-medium mb-2">
            Distrito
          </label>
          <InputText
            id="distrito"
            value={editData.distrito}
            onChange={(e) => setEditData({ ...editData, distrito: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
      <div className="field mt-4">
        <label htmlFor="ubigeo" className="block text-gray-700 font-medium mb-2">
          Ubigeo
        </label>
        <InputText
          id="ubigeo"
          value={editData.ubigeo}
          onChange={(e) => setEditData({ ...editData, ubigeo: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </>
  );

  return (
    <div className="flex-1 p-4 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <Toast ref={toast} />
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden w-full" style={{ width: '100%' }}>
          {/* Contenedor adicional para forzar el ancho */}
          <div style={{ width: '100%', overflowX: 'hidden' }}>
            <DataTable
              ref={dt}
              value={municipalidades}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25, 50]}
              dataKey="id_municipalidad"
              filters={filters}
              loading={loading}
              globalFilterFields={['nombre', 'region', 'departamento', 'provincia', 'distrito', 'ubigeo']}
              header={renderHeader}
              emptyMessage="No se encontraron municipalidades"
              className="p-datatable-responsive-demo w-full"
              responsiveLayout="stack"
              breakpoint="960px"
              stripedRows
              style={{ width: '100%' }}
              tableStyle={{ width: '100%', tableLayout: 'fixed' }}
            >
              <Column
                field="nombre"
                header="Nombre"
                sortable
                className="min-w-[200px]"
                bodyClassName="p-3"
              />
              <Column
                field="region"
                header="Región"
                sortable
                className="min-w-[150px]"
                bodyClassName="p-3"
              />
              <Column
                field="departamento"
                header="Departamento"
                sortable
                className="min-w-[150px]"
                bodyClassName="p-3"
              />
              <Column
                field="provincia"
                header="Provincia"
                sortable
                className="min-w-[150px]"
                bodyClassName="p-3"
              />
              <Column
                field="distrito"
                header="Distrito"
                sortable
                className="min-w-[150px]"
                bodyClassName="p-3"
              />
              <Column
                field="ubigeo"
                header="Ubigeo"
                sortable
                className="min-w-[120px]"
                bodyClassName="p-3"
              />
              <Column
                body={actionBodyTemplate}
                exportable={false}
                className="min-w-[130px] text-center"
                bodyClassName="p-3"
              />
            </DataTable>
          </div>
        </div>

        <Dialog
          visible={editDialogVisible}
          style={{ width: '95vw', maxWidth: '600px' }}
          header="Editar Municipalidad"
          modal
          className="p-fluid rounded-xl overflow-hidden"
          footer={editDialogFooter}
          onHide={() => setEditDialogVisible(false)}
          closeIcon="pi pi-times"
          closeButtonClassName="hover:bg-gray-100 rounded-full p-2 transition-colors"
        >
          {dialogContent}
        </Dialog>

        <Dialog
          visible={createDialogVisible}
          style={{ width: '95vw', maxWidth: '600px' }}
          header="Nueva Municipalidad"
          modal
          className="p-fluid rounded-xl overflow-hidden"
          footer={createDialogFooter}
          onHide={() => setCreateDialogVisible(false)}
          closeIcon="pi pi-times"
          closeButtonClassName="hover:bg-gray-100 rounded-full p-2 transition-colors"
        >
          {dialogContent}
        </Dialog>

        <Dialog
          visible={deleteDialogVisible}
          style={{ width: '95vw', maxWidth: '450px' }}
          header="Confirmar Eliminación"
          modal
          footer={deleteDialogFooter}
          onHide={() => setDeleteDialogVisible(false)}
          className="p-fluid rounded-xl overflow-hidden"
        >
          <div className="flex items-center gap-4 p-4">
            <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl" />
            <span className="text-gray-600">
              ¿Está seguro que desea eliminar la municipalidad <span className="font-bold">{selectedMunicipalidad?.nombre}</span>?
            </span>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

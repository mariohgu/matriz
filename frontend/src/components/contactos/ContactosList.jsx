import React, { useState, useRef, useEffect } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import axios from 'axios';

export default function ContactosList() {
  const [contactos, setContactos] = useState([]);
  const [municipalidades, setMunicipalidades] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedContacto, setSelectedContacto] = useState(null);
  const [editData, setEditData] = useState({
    id_contacto: '',
    id_municipalidad: '',
    nombre_completo: '',
    cargo: '',
    telefono: '',
    email: '',
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);
  const address = "http://127.0.0.1:8000/";

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    nombre_completo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    cargo: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    telefono: { value: null, matchMode: FilterMatchMode.CONTAINS },
    email: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    loadContactos();
    loadMunicipalidades();
  }, []);

  const loadContactos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${address}api/contactos`);
      setContactos(response.data || []);
    } catch (error) {
      console.error('Error al cargar contactos:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los contactos',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMunicipalidades = async () => {
    try {
      const response = await axios.get(`${address}api/municipalidades`);
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

  const onGlobalFilterChange = (e) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleSave = async () => {
    try {
      if (editData.id_contacto) {
        await axios.put(`${address}api/contactos/${editData.id_contacto}`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contacto actualizado correctamente',
          life: 3000
        });
      } else {
        await axios.post(`${address}api/contactos`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Contacto creado correctamente',
          life: 3000
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_contacto: '',
        id_municipalidad: '',
        nombre_completo: '',
        cargo: '',
        telefono: '',
        email: '',
      });
      loadContactos();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el contacto',
        life: 3000
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${address}api/contactos/${rowData.id_contacto}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Contacto eliminado correctamente',
        life: 3000
      });
      loadContactos();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el contacto',
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
            setSelectedContacto(rowData);
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
          <h2 className="text-2xl font-bold text-gray-800">Contactos</h2>
          <Button
            label="Nuevo Contacto"
            icon="pi pi-plus"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            onClick={() => {
              setEditData({
                id_contacto: '',
                id_municipalidad: '',
                nombre_completo: '',
                cargo: '',
                telefono: '',
                email: '',
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
              placeholder="Buscar contacto..."
              className="w-full sm:w-[300px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-2"
            />
          </span>
        </div>
      </div>
    );
  };

  const municipalidadBodyTemplate = (rowData) => {
    const municipalidad = municipalidades.find(m => m.id_municipalidad === rowData.id_municipalidad);
    return municipalidad ? municipalidad.nombre : '';
  };

  const dialogContent = (
    <>
      <div className="field mb-4">
        <label htmlFor="municipalidad" className="block text-gray-700 font-medium mb-2">
          Municipalidad
        </label>
        <Dropdown
          id="municipalidad"
          value={editData.id_municipalidad}
          options={municipalidades}
          onChange={(e) => setEditData({ ...editData, id_municipalidad: e.value })}
          optionLabel="nombre"
          optionValue="id_municipalidad"
          placeholder="Seleccione una municipalidad"
          className="w-full"
        />
      </div>
      <div className="field mb-4">
        <label htmlFor="nombre_completo" className="block text-gray-700 font-medium mb-2">
          Nombre Completo
        </label>
        <InputText
          id="nombre_completo"
          value={editData.nombre_completo}
          onChange={(e) => setEditData({ ...editData, nombre_completo: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="field mb-4">
        <label htmlFor="cargo" className="block text-gray-700 font-medium mb-2">
          Cargo
        </label>
        <InputText
          id="cargo"
          value={editData.cargo}
          onChange={(e) => setEditData({ ...editData, cargo: e.target.value })}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="field">
          <label htmlFor="telefono" className="block text-gray-700 font-medium mb-2">
            Teléfono
          </label>
          <InputText
            id="telefono"
            value={editData.telefono}
            onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="field">
          <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
            Email
          </label>
          <InputText
            id="email"
            value={editData.email}
            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            type="email"
          />
        </div>
      </div>
    </>
  );

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
          confirmDelete(selectedContacto);
          setDeleteDialogVisible(false);
        }}
      />
    </div>
  );

  return (
    <div className="flex-1 p-4 bg-gray-50 min-h-screen">
      <div className="max-w-[1400px] mx-auto">
        <Toast ref={toast} />
        
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <DataTable
            ref={dt}
            value={contactos}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25, 50]}
            dataKey="id_contacto"
            filters={filters}
            loading={loading}
            globalFilterFields={['nombre_completo', 'cargo', 'telefono', 'email']}
            header={renderHeader}
            emptyMessage="No se encontraron contactos"
            className="p-datatable-responsive-demo"
            responsiveLayout="stack"
            breakpoint="960px"
            stripedRows
          >
            <Column
              field="nombre_completo"
              header="Nombre Completo"
              sortable
              filter
              filterPlaceholder="Buscar por nombre"
              className="min-w-[200px]"
              bodyClassName="p-3"
            />
            <Column
              field="id_municipalidad"
              header="Municipalidad"
              sortable
              body={municipalidadBodyTemplate}
              className="min-w-[200px]"
              bodyClassName="p-3"
            />
            <Column
              field="cargo"
              header="Cargo"
              sortable
              filter
              filterPlaceholder="Buscar por cargo"
              className="min-w-[150px]"
              bodyClassName="p-3"
            />
            <Column
              field="telefono"
              header="Teléfono"
              sortable
              filter
              filterPlaceholder="Buscar por teléfono"
              className="min-w-[150px]"
              bodyClassName="p-3"
            />
            <Column
              field="email"
              header="Email"
              sortable
              filter
              filterPlaceholder="Buscar por email"
              className="min-w-[200px]"
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

        <Dialog
          visible={editDialogVisible}
          style={{ width: '95vw', maxWidth: '600px' }}
          header="Editar Contacto"
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
          header="Nuevo Contacto"
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
              ¿Está seguro que desea eliminar el contacto <span className="font-bold">{selectedContacto?.nombre_completo}</span>?
            </span>
          </div>
        </Dialog>
      </div>
    </div>
  );
}

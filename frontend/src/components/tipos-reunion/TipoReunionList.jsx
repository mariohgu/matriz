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

export default function TipoReunionList() {
  const [tiposReunion, setTiposReunion] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [selectedTipoReunion, setSelectedTipoReunion] = useState(null);
  const [editData, setEditData] = useState({
    id_tipo_reunion: '',
    descripcion: '',
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    descripcion: { value: null, matchMode: FilterMatchMode.STARTS_WITH },
  });

  useEffect(() => {
    loadTiposReunion();
  }, []);

  const loadTiposReunion = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADDRESS}api/tipos-reunion`);
      setTiposReunion(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de reunión:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los tipos de reunión',
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
      if (editData.id_tipo_reunion) {
        await axios.put(`${ADDRESS}api/tipos-reunion/${editData.id_tipo_reunion}`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de reunión actualizado correctamente',
          life: 3000
        });
      } else {
        await axios.post(`${ADDRESS}api/tipos-reunion`, editData);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Tipo de reunión creado correctamente',
          life: 3000
        });
      }
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_tipo_reunion: '',
        descripcion: '',
      });
      loadTiposReunion();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el tipo de reunión',
        life: 3000
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/tipos-reunion/${rowData.id_tipo_reunion}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Tipo de reunión eliminado correctamente',
        life: 3000
      });
      loadTiposReunion();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el tipo de reunión',
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
            setSelectedTipoReunion(rowData);
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
          <h2 className="text-2xl font-bold text-gray-800">Tipos de Reunión</h2>
          <Button
            label="Nuevo Tipo"
            icon="pi pi-plus"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            onClick={() => {
              setEditData({
                id_tipo_reunion: '',
                descripcion: '',
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
              placeholder="Buscar tipo de reunión..."
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
        className="p-button-text"
        onClick={() => {
          setEditDialogVisible(false);
          setCreateDialogVisible(false);
        }}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        className="bg-green-500 hover:bg-green-600"
        onClick={handleSave}
      />
    </div>
  );

  const deleteDialogFooter = (
    <div className="flex justify-end gap-2 pt-4">
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDeleteDialogVisible(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="bg-red-500 hover:bg-red-600"
        onClick={() => {
          confirmDelete(selectedTipoReunion);
          setDeleteDialogVisible(false);
        }}
      />
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 p-4">
      <div className="flex-1 flex flex-col max-w-[1400px] mx-auto w-full">
   
      <Toast ref={toast} />
      
      <div className="flex flex-col flex-grow bg-white rounded-xl shadow-lg overflow-hidden w-full" style={{ width: '100%' }}>
        {/* Contenedor adicional para forzar el ancho */}
        <div style={{ width: '100%', overflowX: 'hidden' }}>
          <DataTable
            ref={dt}
            value={tiposReunion}
            selection={selectedTipoReunion}
            onSelectionChange={(e) => setSelectedTipoReunion(e.value)}
            dataKey="id_tipo_reunion"
            paginator
            rows={10}
            filters={filters}
            filterDisplay="row"
            loading={loading}
            responsiveLayout="scroll"
            globalFilterFields={['descripcion']}
            header={renderHeader()}
            emptyMessage="No se encontraron tipos de reunión"
            className="p-datatable-sm w-full"
            showGridlines
            removableSort
            resizableColumns
            columnResizeMode="expand"
            style={{ width: '100%' }}
            tableStyle={{ width: '100%', tableLayout: 'fixed' }}
          >
            <Column 
              field="descripcion" 
              header="Descripción" 
              sortable 
              filter
              filterPlaceholder="Buscar por descripción"
              showFilterMenu={false}
              style={{ width: '80%' }}
              bodyClassName="p-3 whitespace-normal"
            />
            <Column 
              body={actionBodyTemplate} 
              exportable={false} 
              style={{ width: '20%', textAlign: 'center' }}
              bodyClassName="p-3"
            />
          </DataTable>
        </div>
      </div>
      
      <Dialog
        visible={editDialogVisible || createDialogVisible}
        style={{ width: '90%', maxWidth: '500px' }}
        header={editData.id_tipo_reunion ? 'Editar Tipo de Reunión' : 'Nuevo Tipo de Reunión'}
        modal
        className="p-fluid"
        footer={editDialogFooter}
        onHide={() => {
          setEditDialogVisible(false);
          setCreateDialogVisible(false);
          setEditData({
            id_tipo_reunion: '',
            descripcion: '',
          });
        }}
      >
        <div className="field mb-4">
          <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
            Descripción
          </label>
          <InputText
            id="descripcion"
            value={editData.descripcion}
            onChange={(e) => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
            className="w-full p-2 border rounded-md"
            autoFocus
          />
        </div>
      </Dialog>

      <Dialog
        visible={deleteDialogVisible}
        style={{ width: '450px' }}
        header="Confirmar"
        modal
        footer={deleteDialogFooter}
        onHide={() => setDeleteDialogVisible(false)}
      >
        <div className="confirmation-content">
          <i className="pi pi-exclamation-triangle text-yellow-500 mr-3" style={{ fontSize: '2rem' }} />
          {selectedTipoReunion && (
            <span>
              ¿Está seguro que desea eliminar este tipo de reunión?
            </span>
          )}
        </div>
      </Dialog>
    </div>
    </div>
  );
}

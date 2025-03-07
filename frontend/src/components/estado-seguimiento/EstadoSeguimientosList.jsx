import React, { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FilterMatchMode } from 'primereact/api';
import { InputTextarea } from 'primereact/inputtextarea';
import { FiSearch, FiPlus, FiTrash2, FiEdit, FiEye } from 'react-icons/fi';
import axios from 'axios';
import { ADDRESS } from '../../utils.jsx';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

export default function EstadoSeguimientosList() {
  const [estadosSeguimiento, setEstadosSeguimiento] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [tiposReunion, setTiposReunion] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [viewDialogVisible, setViewDialogVisible] = useState(false);
  const [selectedEstadoSeguimiento, setSelectedEstadoSeguimiento] = useState(null);
  const [editData, setEditData] = useState({
    id_estado: '',
    id_evento: '',
    id_contacto: '',
    id_tipo_reunion: '',
    fecha: null,
    estado: '',
    descripcion: '',
    compromiso: '',
    fecha_compromiso: null
  });
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useRef(null);
  const dt = useRef(null);

  const estadoOptions = [
    { label: 'Pendiente', value: 'Pendiente' },
    { label: 'En Proceso', value: 'En Proceso' },
    { label: 'Completado', value: 'Completado' },
    { label: 'Cancelado', value: 'Cancelado' }
  ];

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    'evento.municipalidad.nombre': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    'tipoReunion.nombre': { value: null, matchMode: FilterMatchMode.STARTS_WITH },
    fecha: { value: null, matchMode: FilterMatchMode.CONTAINS },
    estado: { value: null, matchMode: FilterMatchMode.CONTAINS },
    fecha_compromiso: { value: null, matchMode: FilterMatchMode.CONTAINS }
  });

  useEffect(() => {
    loadEstadosSeguimiento();
    loadEventos();
    loadTiposReunion();
  }, []);

  const loadEstadosSeguimiento = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${ADDRESS}api/estados-seguimiento`);
      setEstadosSeguimiento(response.data || []);
    } catch (error) {
      console.error('Error al cargar estados de seguimiento:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los estados de seguimiento',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadEventos = async () => {
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
    }
  };

  const loadTiposReunion = async () => {
    try {
      const response = await axios.get(`${ADDRESS}api/tipos-reunion`);
      console.log('Tipos de reunión cargados:', response.data);
      setTiposReunion(response.data || []);
    } catch (error) {
      console.error('Error al cargar tipos de reunión:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'No se pudieron cargar los tipos de reunión',
        life: 3000
      });
    }
  };

  const loadContactosPorEvento = async (eventoId) => {
    try {
      // Primero obtenemos el evento para saber su municipalidad
      const eventoResponse = await axios.get(`${ADDRESS}api/eventos/${eventoId}`);
      const evento = eventoResponse.data;
      
      if (evento && evento.id_municipalidad) {
        // Luego cargamos los contactos de esa municipalidad
        const response = await axios.get(`${ADDRESS}api/municipalidades/${evento.id_municipalidad}/contactos`);
        setContactos(response.data || []);
      } else {
        setContactos([]);
      }
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

  const handleSave = async () => {
    try {
      // Crear una copia del objeto para no modificar el estado directamente
      const dataToSend = { ...editData };
      
      // Asegurarse de que las fechas estén en el formato correcto para la API
      if (dataToSend.fecha && dataToSend.fecha instanceof Date) {
        dataToSend.fecha = dataToSend.fecha.toISOString().split('T')[0];
      }
      
      if (dataToSend.fecha_compromiso && dataToSend.fecha_compromiso instanceof Date) {
        dataToSend.fecha_compromiso = dataToSend.fecha_compromiso.toISOString().split('T')[0];
      }
      
      console.log('Datos a enviar:', dataToSend);
      
      if (dataToSend.id_estado) {
        // Asegurarse de que el ID existe y es válido
        const id = dataToSend.id_estado;
        console.log('Editando estado con ID:', id);
        
        await axios.put(`${ADDRESS}api/estados-seguimiento/${id}`, dataToSend);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado de seguimiento actualizado correctamente',
          life: 3000
        });
      } else {
        await axios.post(`${ADDRESS}api/estados-seguimiento`, dataToSend);
        toast.current.show({
          severity: 'success',
          summary: 'Éxito',
          detail: 'Estado de seguimiento creado correctamente',
          life: 3000
        });
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      setEditData({
        id_estado: '',
        id_evento: '',
        id_contacto: '',
        id_tipo_reunion: '',
        fecha: null,
        estado: '',
        descripcion: '',
        compromiso: '',
        fecha_compromiso: null
      });
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al guardar el estado de seguimiento',
        life: 3000
      });
    }
  };

  const confirmDelete = async (rowData) => {
    try {
      await axios.delete(`${ADDRESS}api/estados-seguimiento/${rowData.id_estado}`);
      toast.current.show({
        severity: 'success',
        summary: 'Éxito',
        detail: 'Estado de seguimiento eliminado correctamente',
        life: 3000
      });
      loadEstadosSeguimiento();
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.current.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Error al eliminar el estado de seguimiento',
        life: 3000
      });
    }
  };

  const actionBodyTemplate = (rowData) => {
    return (
      <div className="flex justify-center gap-2">
        <Button
          icon="pi pi-eye"
          rounded
          className="p-button-sm bg-purple-500 hover:bg-purple-600 border-purple-500"
          onClick={() => {
            setSelectedEstadoSeguimiento(rowData);
            setViewDialogVisible(true);
          }}
        />
        <Button
          icon="pi pi-pencil"
          rounded
          className="p-button-sm bg-blue-500 hover:bg-blue-600 border-blue-500"
          onClick={() => {
            // Asegurarse de que todas las propiedades del objeto rowData se copien correctamente
            const editableData = {
              id_estado: rowData.id_estado,
              id_evento: rowData.id_evento,
              id_contacto: rowData.id_contacto,
              id_tipo_reunion: rowData.id_tipo_reunion,
              fecha: rowData.fecha ? new Date(rowData.fecha) : null,
              estado: rowData.estado,
              descripcion: rowData.descripcion || '',
              compromiso: rowData.compromiso || '',
              fecha_compromiso: rowData.fecha_compromiso ? new Date(rowData.fecha_compromiso) : null
            };
            
            console.log('Datos para editar:', editableData);
            setEditData(editableData);
            setEditDialogVisible(true);
            
            if (rowData.id_evento) {
              loadContactosPorEvento(rowData.id_evento);
            }
          }}
        />
        <Button
          icon="pi pi-trash"
          rounded
          className="p-button-sm bg-red-500 hover:bg-red-600 border-red-500"
          onClick={() => {
            setSelectedEstadoSeguimiento(rowData);
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
          <h2 className="text-2xl font-bold text-gray-800">Estados de Seguimiento</h2>
          <Button
            label="Nuevo Estado"
            icon="pi pi-plus"
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all w-full sm:w-auto"
            onClick={() => {
              setEditData({
                id_estado: '',
                id_evento: '',
                id_contacto: '',
                id_tipo_reunion: '',
                fecha: null,
                estado: '',
                descripcion: '',
                compromiso: '',
                fecha_compromiso: null
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
              placeholder="Buscar estado..."
              className="w-full sm:w-[300px] rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent px-4 py-2"
            />
          </span>
        </div>
      </div>
    );
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const dateBodyTemplate = (rowData) => {
    return formatDate(rowData.fecha);
  };

  const fechaCompromisoBodyTemplate = (rowData) => {
    return formatDate(rowData.fecha_compromiso);
  };

  const eventoBodyTemplate = (rowData) => {
    const evento = eventos.find(e => e.id_evento === rowData.id_evento);
    if (!evento) return '';
    
    const municipalidad = evento.municipalidad?.nombre || '';
    const fecha = formatDate(evento.fecha);
    
    return `${municipalidad} - ${fecha}`;
  };

  const tipoReunionBodyTemplate = (rowData) => {
    const tipoReunion = tiposReunion.find(tr => tr.id_tipo_reunion === rowData.id_tipo_reunion);
    return tipoReunion ? tipoReunion.descripcion : '';
  };

  const estadoBodyTemplate = (rowData) => {
    return (
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${getEstadoClass(rowData.estado)}`}>
        {rowData.estado}
      </span>
    );
  };

  const getEstadoClass = (estado) => {
    switch (estado) {
      case 'Pendiente':
        return 'bg-yellow-100 text-yellow-800';
      case 'En Proceso':
        return 'bg-blue-100 text-blue-800';
      case 'Completado':
        return 'bg-green-100 text-green-800';
      case 'Cancelado':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const TailwindCalendar = ({ selectedDate, onChange, id, className }) => {
    const [currentDate, setCurrentDate] = useState(selectedDate || new Date());
    const [isOpen, setIsOpen] = useState(false);
    const calendarRef = useRef(null);

    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (calendarRef.current && !calendarRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, []);

    const getDaysInMonth = (year, month) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (year, month) => {
      return new Date(year, month, 1).getDay();
    };

    const handleDateClick = (day) => {
      const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      onChange({ value: newDate });
      setIsOpen(false);
    };

    const handlePrevMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const formatDate = (date) => {
      if (!date) return '';
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const renderCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      
      // Agregar días vacíos al principio del mes
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
      }
      
      // Agregar los días del mes
      for (let day = 1; day <= daysInMonth; day++) {
        const isSelected = selectedDate && 
                           selectedDate.getDate() === day && 
                           selectedDate.getMonth() === month && 
                           selectedDate.getFullYear() === year;
        
        const isToday = new Date().getDate() === day && 
                        new Date().getMonth() === month && 
                        new Date().getFullYear() === year;
        
        days.push(
          <button
            key={day}
            onClick={() => handleDateClick(day)}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors
                      ${isSelected ? 'bg-blue-500 text-white' : ''}
                      ${isToday && !isSelected ? 'border border-blue-500 text-blue-500' : ''}
                      ${!isSelected && !isToday ? 'hover:bg-gray-100' : ''}`}
          >
            {day}
          </button>
        );
      }
      
      return days;
    };

    return (
      <div className={`relative ${className}`} ref={calendarRef}>
        <div 
          className="flex items-center border border-gray-300 rounded-md p-2 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <input
            id={id}
            type="text"
            className="flex-grow outline-none cursor-pointer"
            value={formatDate(selectedDate)}
            readOnly
            placeholder="Seleccione una fecha"
          />
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>

        {isOpen && (
          <div className="absolute mt-1 z-50 bg-white rounded-md shadow-lg p-4 border border-gray-200 w-64">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={handlePrevMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="font-semibold">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
              <button 
                onClick={handleNextMonth}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map(day => (
                <div key={day} className="h-8 w-8 flex items-center justify-center text-xs text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {renderCalendarDays()}
            </div>
            
            <div className="mt-4 flex justify-between">
              <button 
                onClick={() => {
                  const today = new Date();
                  setCurrentDate(today);
                  onChange({ value: today });
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Hoy
              </button>
              <button 
                onClick={() => {
                  onChange({ value: null });
                  setIsOpen(false);
                }}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const dialogContent = (
    <>
      <div className="field mb-4">
        <label htmlFor="evento" className="block text-gray-700 font-medium mb-2">
          Evento (Municipalidad)
        </label>
        <Dropdown
          id="evento"
          value={editData.id_evento}
          options={eventos}
          onChange={(e) => {
            setEditData({ ...editData, id_evento: e.value, id_contacto: '' });
            if (e.value) {
              loadContactosPorEvento(e.value);
            } else {
              setContactos([]);
            }
          }}
          optionLabel={(option) => {
            const municipalidad = option.municipalidad?.nombre || '';
            const fecha = formatDate(option.fecha);
            return `${municipalidad} - ${fecha}`;
          }}
          optionValue="id_evento"
          placeholder="Seleccione un evento"
          className="w-full border border-gray-300 rounded-lg"
          filter
          showClear
        />
      </div>
      <div className="field mb-4">
        <label htmlFor="contacto" className="block text-gray-700 font-medium mb-2">
          Contacto
        </label>
        <Dropdown
          id="contacto"
          value={editData.id_contacto}
          options={contactos}
          onChange={(e) => setEditData({ ...editData, id_contacto: e.value })}
          optionLabel="nombre_completo"
          optionValue="id_contacto"
          placeholder="Seleccione un contacto"
          className="w-full border border-gray-300 rounded-lg"
          disabled={!editData.id_evento}
          filter
          showClear
        />
      </div>
      <div className="field mb-4">
        <label htmlFor="tipoReunion" className="block text-gray-700 font-medium mb-2">
          Tipo de Reunión
        </label>
        <Dropdown
          id="tipoReunion"
          value={editData.id_tipo_reunion}
          options={tiposReunion}
          onChange={(e) => setEditData({ ...editData, id_tipo_reunion: e.value })}
          optionLabel="descripcion"
          optionValue="id_tipo_reunion"
          placeholder="Seleccione un tipo de reunión"
          className="w-full border border-gray-300 rounded-lg"
          filter
          showClear
          itemTemplate={(option) => (
            <div className="dropdown-item-container">
              <span>{option.descripcion || 'Sin nombre'}</span>
            </div>
          )}
        />
      </div>
      
        <div className="field mb-4">
          <label htmlFor="fecha" className="block text-gray-700 font-medium mb-2">
            Fecha
          </label>
          <TailwindCalendar
            id="fecha"
            selectedDate={editData.fecha ? new Date(editData.fecha) : null}
            onChange={(e) => setEditData({ ...editData, fecha: e.value })}
            className="w-full"
          />
        </div>        
      
      <div className="field mb-4">
        <label htmlFor="descripcion" className="block text-gray-700 font-medium mb-2">
          Descripción
        </label>
        <InputTextarea
          id="descripcion"
          value={editData.descripcion}
          onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="field mb-4">
        <label htmlFor="compromiso" className="block text-gray-700 font-medium mb-2">
          Compromiso
        </label>
        <InputTextarea
          id="compromiso"
          value={editData.compromiso}
          onChange={(e) => setEditData({ ...editData, compromiso: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="field mb-4">
          <label htmlFor="fechaCompromiso" className="block text-gray-700 font-medium mb-2">
            Fecha de Compromiso
          </label>
          <TailwindCalendar
            id="fechaCompromiso"
            selectedDate={editData.fecha_compromiso ? new Date(editData.fecha_compromiso) : null}
            onChange={(e) => setEditData({ ...editData, fecha_compromiso: e.value })}
            className="w-full"
          />
        </div>
        <div className="field mb-4">
            <label htmlFor="estado" className="block text-gray-700 font-medium mb-2">
              Estado
            </label>
            <Dropdown
              id="estado"
              value={editData.estado}
              options={estadoOptions}
              onChange={(e) => setEditData({ ...editData, estado: e.value })}
              placeholder="Seleccione un estado"
              className="w-full border border-gray-300 rounded-lg"
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
    <div className="flex justify-center gap-3 w-full">
      <Button
        label="No"
        icon="pi pi-times"
        className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100 px-4"
        onClick={() => setDeleteDialogVisible(false)}
      />
      <Button
        label="Sí"
        icon="pi pi-check"
        className="bg-red-500 hover:bg-red-600 text-white px-4"
        onClick={() => {
          confirmDelete(selectedEstadoSeguimiento);
          setDeleteDialogVisible(false);
        }}
      />
    </div>
  );

  const viewDialogContent = selectedEstadoSeguimiento && (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="col-span-1 md:col-span-2">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Información del Seguimiento</h3>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Evento (Municipalidad)</label>
        <p className="text-gray-800">{eventoBodyTemplate(selectedEstadoSeguimiento)}</p>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Tipo de Reunión</label>
        <p className="text-gray-800">{tipoReunionBodyTemplate(selectedEstadoSeguimiento)}</p>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Contacto</label>
        <p className="text-gray-800">
          {contactos.find(c => c.id_contacto === selectedEstadoSeguimiento.id_contacto)?.nombre_completo || ''}
        </p>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Fecha</label>
        <p className="text-gray-800">{formatDate(selectedEstadoSeguimiento.fecha)}</p>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Estado</label>
        <p className="text-gray-800">{estadoBodyTemplate(selectedEstadoSeguimiento)}</p>
      </div>
      
      <div className="field">
        <label className="block text-gray-700 font-medium mb-1">Fecha de Compromiso</label>
        <p className="text-gray-800">{formatDate(selectedEstadoSeguimiento.fecha_compromiso)}</p>
      </div>
      
      <div className="field col-span-1 md:col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Descripción</label>
        <p className="text-gray-800 whitespace-pre-line">{selectedEstadoSeguimiento.descripcion}</p>
      </div>
      
      <div className="field col-span-1 md:col-span-2">
        <label className="block text-gray-700 font-medium mb-1">Compromiso</label>
        <p className="text-gray-800 whitespace-pre-line">{selectedEstadoSeguimiento.compromiso}</p>
      </div>
    </div>
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
              value={estadosSeguimiento}
              dataKey="id_estado"
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              loading={loading}
              filters={filters}
              header={renderHeader}
              emptyMessage="No se encontraron estados de seguimiento"
              className="p-datatable-responsive-demo w-full"
              responsiveLayout="stack"
              breakpoint="960px"
              showGridlines
              removableSort
              filterDisplay="row"
              globalFilterFields={['evento.municipalidad.nombre', 'tipoReunion.nombre', 'fecha', 'estado', 'fecha_compromiso']}
              filterIcon="pi pi-filter"
              filterIconClassName="text-gray-600 hover:text-blue-500"
              style={{ width: '100%' }}
              tableStyle={{ width: '100%', tableLayout: 'fixed' }}
            >
              <Column
                field="evento.municipalidad.nombre"
                header="Evento (Municipalidad)"
                body={eventoBodyTemplate}
                sortable
                filter
                filterPlaceholder="Buscar por municipalidad"
                className="min-w-[200px]"
                filterClassName="p-column-filter p-fluid p-column-filter-element"
                filterClearIcon="pi pi-times"
                filterApplyIcon="pi pi-check"
              />
              <Column
                field="tipoReunion.nombre"
                header="Tipo de Reunión"
                body={tipoReunionBodyTemplate}
                sortable
                filter
                filterPlaceholder="Buscar por tipo"
                className="min-w-[150px]"
                filterClassName="p-column-filter p-fluid p-column-filter-element"
                filterClearIcon="pi pi-times"
                filterApplyIcon="pi pi-check"
              />
              <Column
                field="fecha"
                header="Fecha"
                body={dateBodyTemplate}
                sortable
                filter
                filterPlaceholder="Buscar por fecha"
                className="min-w-[120px]"
                filterClassName="p-column-filter p-fluid p-column-filter-element"
                filterClearIcon="pi pi-times"
                filterApplyIcon="pi pi-check"
              />
              <Column
                field="estado"
                header="Estado"
                body={estadoBodyTemplate}
                sortable
                filter
                filterPlaceholder="Buscar por estado"
                className="min-w-[120px]"
                filterClassName="p-column-filter p-fluid p-column-filter-element"
                filterClearIcon="pi pi-times"
                filterApplyIcon="pi pi-check"
              />
              <Column
                field="fecha_compromiso"
                header="Fecha Compromiso"
                body={fechaCompromisoBodyTemplate}
                sortable
                filter
                filterPlaceholder="Buscar por fecha"
                className="min-w-[150px]"
                filterClassName="p-column-filter p-fluid p-column-filter-element"
                filterClearIcon="pi pi-times"
                filterApplyIcon="pi pi-check"
              />
              <Column
                body={actionBodyTemplate}
                header="Acciones"
                headerClassName="text-center"
                bodyClassName="text-center"
                className="min-w-[120px]"
              />
            </DataTable>
          </div>
        </div>
      </div>

      <Dialog
        header="Editar Estado de Seguimiento"
        visible={editDialogVisible}
        style={{ width: '90%', maxWidth: '700px' }}
        onHide={() => setEditDialogVisible(false)}
        footer={editDialogFooter}
        modal
        className="p-fluid"
        blockScroll={false}
      >
        {dialogContent}
      </Dialog>

      <Dialog
        header="Nuevo Estado de Seguimiento"
        visible={createDialogVisible}
        style={{ width: '90%', maxWidth: '700px' }}
        onHide={() => setCreateDialogVisible(false)}
        footer={createDialogFooter}
        modal
        className="p-fluid"
        blockScroll={false}
      >
        {dialogContent}
      </Dialog>

      <Dialog
        header="Confirmar Eliminación"
        visible={deleteDialogVisible}
        style={{ width: '400px', maxWidth: '90%' }}
        onHide={() => setDeleteDialogVisible(false)}
        footer={deleteDialogFooter}
        modal
        blockScroll={false}
        className="delete-confirmation-dialog"
        showHeader={true}
        closable={true}
        closeOnEscape={true}
        dismissableMask={true}
      >
        <div className="flex items-center justify-center p-4">
          <div className="flex flex-col items-center text-center">
            <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl mb-3" />
            <span className="text-gray-800 font-medium">¿Está seguro de que desea eliminar este estado de seguimiento?</span>
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Detalles del Estado de Seguimiento"
        visible={viewDialogVisible}
        style={{ width: '90%', maxWidth: '700px' }}
        onHide={() => setViewDialogVisible(false)}
        modal
        className="p-fluid"
        blockScroll={false}
        footer={
          <Button
            label="Cerrar"
            icon="pi pi-times"
            className="p-button-text text-gray-600 hover:text-gray-800 hover:bg-gray-100"
            onClick={() => setViewDialogVisible(false)}
          />
        }
      >
        {viewDialogContent}
      </Dialog>
    </div>
  );
}
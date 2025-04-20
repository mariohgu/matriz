import React, { useState, useEffect } from 'react';
import { FiEdit, FiTrash2, FiPlus, FiKey } from 'react-icons/fi';
import { api, authService, apiService } from '../../services/authService';
import { Pagination, Modal, ConfirmDialog, useToast } from '../ui';
import TableUsers from '../ui/TableUsers';

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
  const [changePasswordDialogVisible, setChangePasswordDialogVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({
    id: '',
    name: '',
    username: '',
    email: '',
    roles: [],
    password: '',
    password_confirmation: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [columnFilters, setColumnFilters] = useState({
    name: '',
    username: '',
    email: '',
    roles: ''
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const toast = useToast();

  useEffect(() => {
    loadUsers();
    loadRoles();
    
    // Añadir listener para detectar cambios en el tamaño de la ventana
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      toast.showError('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const response = await api.get('/roles');
      // Asegurarse de que estamos accediendo a la propiedad correcta
      const rolesData = response.data && Array.isArray(response.data) 
        ? response.data 
        : (response.data?.roles || []);
      
      // Asegurarse de que cada rol tiene al menos name e id
      const processedRoles = rolesData.map(role => {
        // Si role es directamente un string, convertirlo a objeto
        if (typeof role === 'string') {
          return { id: role, name: role };
        }
        // Si role es un objeto, asegurarse de que tiene name
        return {
          id: role.id || role.name || '',
          name: role.name || role.guard_name || '',
        };
      });
      
      setRoles(processedRoles);
    } catch (error) {
      console.error('Error al cargar roles:', error);
      toast.showError('Error', 'No se pudieron cargar los roles');
    }
  };

  const handleSave = async () => {
    try {
      const dataToSend = { ...editData };
      
      // Validaciones
      if (!dataToSend.name.trim()) {
        toast.showWarning('Advertencia', 'El nombre no puede estar vacío');
        return;
      }
      
      if (!dataToSend.username.trim()) {
        toast.showWarning('Advertencia', 'El nombre de usuario no puede estar vacío');
        return;
      }
      
      if (!dataToSend.email.trim()) {
        toast.showWarning('Advertencia', 'El correo electrónico no puede estar vacío');
        return;
      }
      
      // Si es un nuevo usuario, validar contraseña
      if (!dataToSend.id) {
        if (!dataToSend.password.trim()) {
          toast.showWarning('Advertencia', 'La contraseña no puede estar vacía');
          return;
        }
        
        if (dataToSend.password !== dataToSend.password_confirmation) {
          toast.showWarning('Advertencia', 'Las contraseñas no coinciden');
          return;
        }
      }
      
      if (dataToSend.id) {
        // Si es una actualización, eliminar campos de contraseña si están vacíos
        if (!dataToSend.password) {
          delete dataToSend.password;
          delete dataToSend.password_confirmation;
        }
        
        await api.put(`/users/${dataToSend.id}`, dataToSend);
        toast.showSuccess('Éxito', 'Usuario actualizado correctamente');
      } else {
        await api.post('/users', dataToSend);
        toast.showSuccess('Éxito', 'Usuario creado correctamente');
      }
      
      setEditDialogVisible(false);
      setCreateDialogVisible(false);
      resetEditData();
      loadUsers();
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        toast.showError('Error', firstError);
      } else {
        toast.showError('Error', 'No se pudo guardar el usuario');
      }
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/users/${selectedUser.id}`);
      toast.showSuccess('Éxito', 'Usuario eliminado correctamente');
      setDeleteDialogVisible(false);
      loadUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      toast.showError('Error', 'No se pudo eliminar el usuario');
    }
  };

  const handleChangePassword = async () => {
    try {
      if (!editData.password || !editData.password_confirmation) {
        toast.showWarning('Advertencia', 'Ambos campos de contraseña son obligatorios');
        return;
      }
      
      if (editData.password !== editData.password_confirmation) {
        toast.showWarning('Advertencia', 'Las contraseñas no coinciden');
        return;
      }
      
      await api.put(`/users/${selectedUser.id}`, {
        password: editData.password,
        password_confirmation: editData.password_confirmation
      });
      
      toast.showSuccess('Éxito', 'Contraseña actualizada correctamente');
      setChangePasswordDialogVisible(false);
      resetPasswordFields();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      toast.showError('Error', 'No se pudo cambiar la contraseña');
    }
  };

  // Sorting function
  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  // Filtering functions
  const filteredUsers = users.filter(user => {
    // Filtro de búsqueda general
    const searchFields = [
      user.name,
      user.username,
      user.email,
      user.roles?.map(r => r.name).join(', ')
    ];
    
    const matchesSearch = searchQuery === '' || 
      searchFields.some(field => 
        field && field.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    // Filtros por columna
    const matchesName = columnFilters.name === '' || 
      (user.name && user.name.toLowerCase().includes(columnFilters.name.toLowerCase()));
    
    const matchesUsername = columnFilters.username === '' || 
      (user.username && user.username.toLowerCase().includes(columnFilters.username.toLowerCase()));
    
    const matchesEmail = columnFilters.email === '' || 
      (user.email && user.email.toLowerCase().includes(columnFilters.email.toLowerCase()));
    
    const matchesRoles = columnFilters.roles === '' || 
      (user.roles && user.roles.some(role => 
        role.name.toLowerCase().includes(columnFilters.roles.toLowerCase())
      ));
    
    return matchesSearch && matchesName && matchesUsername && matchesEmail && matchesRoles;
  });

  // Sorting
  const sortedData = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortField] || '';
    let bValue = b[sortField] || '';
    
    // Para roles, obtener los nombres en string
    if (sortField === 'roles') {
      aValue = a.roles?.map(r => r.name).join(', ') || '';
      bValue = b.roles?.map(r => r.name).join(', ') || '';
    }
    
    if (sortOrder === 'asc') {
      return aValue.localeCompare(bValue, undefined, { numeric: true });
    } else {
      return bValue.localeCompare(aValue, undefined, { numeric: true });
    }
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const resetEditData = () => {
    setEditData({
      id: '',
      name: '',
      username: '',
      email: '',
      roles: [],
      password: '',
      password_confirmation: ''
    });
  };

  const resetPasswordFields = () => {
    setEditData(prev => ({
      ...prev,
      password: '',
      password_confirmation: ''
    }));
  };

  // Definición de columnas para la tabla
  const columns = [
    {
      field: 'name',
      header: 'Nombre',
      sortable: true,
      filterable: true,
      render: (rowData) => rowData.name || ''
    },
    {
      field: 'username',
      header: 'Usuario',
      sortable: true,
      filterable: true,
      render: (rowData) => rowData.username || ''
    },
    {
      field: 'email',
      header: 'Email',
      sortable: true,
      filterable: true,
      render: (rowData) => rowData.email || ''
    },
    {
      field: 'roles',
      header: 'Roles',
      sortable: true,
      filterable: true,
      render: (rowData) => (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(rowData.roles) ? rowData.roles.map(role => {
            // Generamos una key única para cada rol
            const key = typeof role === 'object' ? (role.id || role.name || Math.random()) : role;
            // Obtenemos el nombre del rol (string) para mostrarlo
            const roleName = typeof role === 'object' 
              ? (role.name || role.guard_name || role.nombre_rol || JSON.stringify(role)) 
              : role;
            
            return (
              <span key={key} className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                {roleName}
              </span>
            );
          }) : (
            <span className="italic text-gray-500 text-xs">Sin roles</span>
          )}
        </div>
      )
    }
  ];

  // Columnas para la vista móvil
  const mobileColumns = ['name', 'username'];

  // Componente de acciones para cada fila
  const renderActions = (rowData) => (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => {
          setSelectedUser(rowData);
          setEditData({
            id: rowData.id,
            name: rowData.name,
            username: rowData.username,
            email: rowData.email,
            roles: Array.isArray(rowData.roles) 
              ? rowData.roles.map(r => typeof r === 'string' ? r : (r.name || r.guard_name || ''))
              : [],
            password: '',
            password_confirmation: ''
          });
          setEditDialogVisible(true);
        }}
        className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"
        title="Editar"
      >
        <FiEdit className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedUser(rowData);
          resetPasswordFields();
          setChangePasswordDialogVisible(true);
        }}
        className="p-2 text-yellow-600 hover:bg-yellow-100 rounded-full"
        title="Cambiar Contraseña"
      >
        <FiKey className="h-4 w-4" />
      </button>
      <button
        onClick={() => {
          setSelectedUser(rowData);
          setDeleteDialogVisible(true);
        }}
        className="p-2 text-red-600 hover:bg-red-100 rounded-full"
        title="Eliminar"
        disabled={rowData.id === authService.getCurrentUser()?.id}
      >
        <FiTrash2 className={`h-4 w-4 ${rowData.id === authService.getCurrentUser()?.id ? 'opacity-50 cursor-not-allowed' : ''}`} />
      </button>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button
          onClick={() => {
            resetEditData();
            setCreateDialogVisible(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          <FiPlus className="mr-2" />
          Nuevo Usuario
        </button>
      </div>

      {/* Búsqueda global - Siempre visible */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Buscar usuarios..."
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>
      </div>

      {/* Tabla de Usuarios */}
      <TableUsers
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
        emptyMessage="No hay usuarios disponibles"
        actions={renderActions}
      />

      {/* Paginación */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={filteredUsers.length}
        className="mt-4"
      />

      {/* Modal de Edición */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Usuario"
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setEditDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre de usuario"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el email"
            />
          </div>
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Roles
            </label>
            <select
              id="roles"
              multiple
              value={editData.roles}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setEditData({ ...editData, roles: values });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: '6rem' }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Para seleccionar múltiples roles, mantenga presionada la tecla Ctrl (o Cmd en Mac) mientras hace clic.</p>
          </div>
          {!editData.id && (
            <>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <input
                  id="password"
                  type="password"
                  value={editData.password}
                  onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ingrese la contraseña"
                />
              </div>
              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <input
                  id="password_confirmation"
                  type="password"
                  value={editData.password_confirmation}
                  onChange={(e) => setEditData({ ...editData, password_confirmation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirme la contraseña"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Modal de Creación */}
      <Modal
        isOpen={createDialogVisible}
        onClose={() => setCreateDialogVisible(false)}
        title="Nuevo Usuario"
        size="xl"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setCreateDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleSave}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre"
            />
          </div>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el nombre de usuario"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese el email"
            />
          </div>
          <div>
            <label htmlFor="roles" className="block text-sm font-medium text-gray-700 mb-1">
              Roles
            </label>
            <select
              id="roles"
              multiple
              value={editData.roles}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, option => option.value);
                setEditData({ ...editData, roles: values });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              style={{ minHeight: '6rem' }}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.name}>
                  {role.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Para seleccionar múltiples roles, mantenga presionada la tecla Ctrl (o Cmd en Mac) mientras hace clic.</p>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la contraseña"
            />
          </div>
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Contraseña
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={editData.password_confirmation}
              onChange={(e) => setEditData({ ...editData, password_confirmation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirme la contraseña"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Cambio de Contraseña */}
      <Modal
        isOpen={changePasswordDialogVisible}
        onClose={() => setChangePasswordDialogVisible(false)}
        title="Cambiar Contraseña"
        size="md"
        footer={
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              onClick={() => setChangePasswordDialogVisible(false)}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleChangePassword}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Cambiando contraseña para: <span className="font-medium">{selectedUser?.name}</span></p>
          
          <div>
            <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              id="new_password"
              type="password"
              value={editData.password}
              onChange={(e) => setEditData({ ...editData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la nueva contraseña"
            />
          </div>
          
          <div>
            <label htmlFor="confirm_new_password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="confirm_new_password"
              type="password"
              value={editData.password_confirmation}
              onChange={(e) => setEditData({ ...editData, password_confirmation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirme la nueva contraseña"
            />
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmación para Eliminar */}
      <ConfirmDialog
        isOpen={deleteDialogVisible}
        onClose={() => setDeleteDialogVisible(false)}
        onConfirm={handleDelete}
        title="Confirmar Eliminación"
        message={`¿Está seguro que desea eliminar el usuario "${selectedUser?.name}"?`}
        confirmLabel="Eliminar"
        variant="danger"
      />
    </div>
  );
} 
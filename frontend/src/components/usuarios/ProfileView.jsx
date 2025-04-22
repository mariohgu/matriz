import React, { useState, useEffect } from 'react';
import { api, authService } from '../../services/authService';
import { Modal, useToast } from '../ui';
import { FiEdit, FiKey, FiUser } from 'react-icons/fi';

export default function ProfileView() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editDialogVisible, setEditDialogVisible] = useState(false);
  const [changePasswordDialogVisible, setChangePasswordDialogVisible] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    username: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    password: '',
    password_confirmation: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get('/profile');
      setUser(response.data.user);
      setProfileData({
        name: response.data.user.name,
        username: response.data.user.username,
        email: response.data.user.email
      });
    } catch (error) {
      console.error('Error al cargar perfil de usuario:', error);
      toast.showError('Error', 'No se pudo cargar el perfil del usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      // Validaciones
      if (!profileData.name.trim()) {
        toast.showWarning('Advertencia', 'El nombre no puede estar vacío');
        return;
      }
      
      if (!profileData.username.trim()) {
        toast.showWarning('Advertencia', 'El nombre de usuario no puede estar vacío');
        return;
      }
      
      if (!profileData.email.trim()) {
        toast.showWarning('Advertencia', 'El correo electrónico no puede estar vacío');
        return;
      }
      
      await api.put('/profile', profileData);
      
      // Actualizar los datos del usuario en localStorage
      await authService.getUserProfile();
      
      toast.showSuccess('Éxito', 'Perfil actualizado correctamente');
      setEditDialogVisible(false);
      loadUserProfile();
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      if (error.response && error.response.data && error.response.data.errors) {
        const firstError = Object.values(error.response.data.errors)[0][0];
        toast.showError('Error', firstError);
      } else {
        toast.showError('Error', 'No se pudo actualizar el perfil');
      }
    }
  };

  const handleChangePassword = async () => {
    try {
      // Validaciones
      if (!passwordData.current_password) {
        toast.showWarning('Advertencia', 'La contraseña actual es obligatoria');
        return;
      }
      
      if (!passwordData.password) {
        toast.showWarning('Advertencia', 'La nueva contraseña es obligatoria');
        return;
      }
      
      if (passwordData.password !== passwordData.password_confirmation) {
        toast.showWarning('Advertencia', 'Las contraseñas no coinciden');
        return;
      }
      
      await api.post('/change-password', passwordData);
      
      toast.showSuccess('Éxito', 'Contraseña actualizada correctamente');
      setChangePasswordDialogVisible(false);
      resetPasswordFields();
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      if (error.response && error.response.data) {
        toast.showError('Error', error.response.data.message || 'No se pudo cambiar la contraseña');
      } else {
        toast.showError('Error', 'No se pudo cambiar la contraseña');
      }
    }
  };

  const resetPasswordFields = () => {
    setPasswordData({
      current_password: '',
      password: '',
      password_confirmation: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-gray-600">No se pudo cargar la información del perfil.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna 1: Foto y acciones */}
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-gray-200 rounded-full p-8 w-32 h-32 flex items-center justify-center">
            <FiUser className="text-4xl text-gray-600" />
          </div>
          
          <div className="flex flex-col space-y-2 w-full">
            <button
              onClick={() => setEditDialogVisible(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md flex items-center justify-center font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 w-full"
            >
              <FiEdit className="mr-2" />
              Editar Perfil
            </button>
            
            <button
              onClick={() => {
                resetPasswordFields();
                setChangePasswordDialogVisible(true);
              }}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md flex items-center justify-center font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 w-full"
            >
              <FiKey className="mr-2" />
              Cambiar Contraseña
            </button>
          </div>
        </div>

        {/* Columna 2: Información del perfil */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Información Personal</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nombre</h3>
                <p className="text-base text-gray-900">{user.name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Nombre de Usuario</h3>
                <p className="text-base text-gray-900">{user.username}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="text-base text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Roles y Permisos</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Roles</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.roles?.map(role => (
                    <span key={role.id} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Permisos</h3>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.permissions?.map((permission, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Edición de Perfil */}
      <Modal
        isOpen={editDialogVisible}
        onClose={() => setEditDialogVisible(false)}
        title="Editar Perfil"
        size="lg"
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
              onClick={handleUpdateProfile}
            >
              Guardar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              id="name"
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de Usuario
            </label>
            <input
              id="username"
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
          <div>
            <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña Actual
            </label>
            <input
              id="current_password"
              type="password"
              value={passwordData.current_password}
              onChange={(e) => setPasswordData({ ...passwordData, current_password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese su contraseña actual"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Nueva Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={passwordData.password}
              onChange={(e) => setPasswordData({ ...passwordData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ingrese la nueva contraseña"
            />
          </div>
          
          <div>
            <label htmlFor="password_confirmation" className="block text-sm font-medium text-gray-700 mb-1">
              Confirmar Nueva Contraseña
            </label>
            <input
              id="password_confirmation"
              type="password"
              value={passwordData.password_confirmation}
              onChange={(e) => setPasswordData({ ...passwordData, password_confirmation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Confirme la nueva contraseña"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
} 
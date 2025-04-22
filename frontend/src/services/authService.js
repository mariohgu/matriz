import axios from 'axios';

<<<<<<< HEAD
//const API_URL = "https://matriz.ddev.site";
//const API_URL = "https://backendmatriz.pasaloaproduccion.com";
const API_URL = "http://127.0.0.1:8000";
=======
const API_URL = "https://matriz.ddev.site";
//const API_URL = "https://backendmatriz.pasaloaproduccion.com";
//const API_URL = "http://127.0.0.1:8000";
>>>>>>> bfeaa54696476c10c6f0203198c6c5a2cbd3903d

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token a todas las solicitudes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar respuestas y errores
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Si el error es 401 (Unauthorized) y no es un intento de renovación de token
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Aquí podrías implementar la lógica para renovar el token si tu backend lo soporta
        // const refreshToken = localStorage.getItem('refresh_token');
        // const response = await axios.post(`${API_URL}/api/refresh-token`, { refresh_token: refreshToken });
        // localStorage.setItem('access_token', response.data.access_token);
        // originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
        // return api(originalRequest);
        
        // Si no hay refresh token o funcionalidad de renovación, simplemente desloguear al usuario
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      } catch (refreshError) {
        console.error('Error renovando el token:', refreshError);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Servicio de autenticación
const authService = {
  // Registrar usuario
  register: async (name, username, email, password, password_confirmation) => {
    try {
      const response = await api.post('/register', {
        name,
        username,
        email,
        password,
        password_confirmation
      });
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Iniciar sesión
  login: async (username, password) => {
    try {
      const response = await api.post('/login', {
        username,
        password
      });
      
      if (response.data.access_token) {
        // Guardar token y usuario en localStorage
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Cerrar sesión
  logout: async () => {
    try {
      await api.post('/logout');
      // Limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Incluso si hay un error, limpiar localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
    }
  },

  // Obtener información del usuario actual
  getCurrentUser: () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) return null;
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Error al obtener el usuario actual:', error);
      // Si hay un error al parsear, limpiar los datos corruptos
      localStorage.removeItem('user');
      return null;
    }
  },

  // Verificar si el usuario está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Obtener información actualizada del usuario desde el servidor
  getUserProfile: async () => {
    try {
      const response = await api.get('/user');
      // Actualizar usuario en localStorage
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  },

  // Verificar si el usuario tiene un rol específico
  hasRole: (roleName) => {
    const user = authService.getCurrentUser();
    if (!user || !user.roles) return false;
    
    return user.roles.some(role => role.name === roleName || role.nombre_rol === roleName);
  },

  // Verificar si el usuario tiene un permiso específico
  hasPermission: (permissionName) => {
    const user = authService.getCurrentUser();
    if (!user || !user.roles) return false;
    
    for (const role of user.roles) {
      if (role.permisos && role.permisos.some(perm => perm.nombre_permiso === permissionName)) {
        return true;
      }
      // También verificar en la propiedad permissions si existe
      if (role.permissions && role.permissions.some(perm => perm === permissionName || perm.name === permissionName)) {
        return true;
      }
    }
    
    // Verificar también si hay permisos directos en el usuario
    if (user.permissions && Array.isArray(user.permissions)) {
      return user.permissions.some(perm => 
        perm === permissionName || 
        (typeof perm === 'object' && perm.name === permissionName)
      );
    }
    
    return false;
  }
};

// Servicio de API genérico para evitar duplicación de rutas
const apiService = {
  // Métodos CRUD genéricos
  getAll: async (resource) => {
    try {
      const response = await api.get(`/${resource}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${resource}:`, error);
      throw error;
    }
  },

  getById: async (resource, id) => {
    try {
      const response = await api.get(`/${resource}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${resource}/${id}:`, error);
      throw error;
    }
  },

  create: async (resource, data) => {
    try {
      const response = await api.post(`/${resource}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${resource}:`, error);
      throw error;
    }
  },

  update: async (resource, id, data) => {
    try {
      const response = await api.put(`/${resource}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${resource}/${id}:`, error);
      throw error;
    }
  },

  delete: async (resource, id) => {
    try {
      const response = await api.delete(`/${resource}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting ${resource}/${id}:`, error);
      throw error;
    }
  },

  // Método personalizado para búsquedas o filtros
  query: async (resource, queryParams) => {
    try {
      const response = await api.get(`/${resource}`, { params: queryParams });
      return response.data;
    } catch (error) {
      console.error(`Error querying ${resource}:`, error);
      throw error;
    }
  }
};

export { api, authService, apiService };

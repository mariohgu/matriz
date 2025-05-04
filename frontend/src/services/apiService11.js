import { api } from './authService';

// Servicio para manejar las operaciones de la API
const apiService = {
  // Municipalidades
  getMunicipalidades: async () => {
    try {
      const response = await api.get('/municipalidades');
      return response.data;
    } catch (error) {
      console.error('Error al obtener municipalidades:', error);
      throw error;
    }
  },
  
  getMunicipalidadById: async (id) => {
    try {
      const response = await api.get(`/municipalidades/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener municipalidad con ID ${id}:`, error);
      throw error;
    }
  },
  
  createMunicipalidad: async (data) => {
    try {
      const response = await api.post('/municipalidades', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear municipalidad:', error);
      throw error;
    }
  },
  
  updateMunicipalidad: async (id, data) => {
    try {
      const response = await api.put(`/municipalidades/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar municipalidad con ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteMunicipalidad: async (id) => {
    try {
      const response = await api.delete(`/municipalidades/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar municipalidad con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Eventos
  getEventos: async () => {
    try {
      const response = await api.get('/eventos');
      return response.data;
    } catch (error) {
      console.error('Error al obtener eventos:', error);
      throw error;
    }
  },
  
  getEventosByMunicipalidad: async (municipalidadId) => {
    try {
      const response = await api.get(`/municipalidades/${municipalidadId}/eventos`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener eventos de la municipalidad ${municipalidadId}:`, error);
      throw error;
    }
  },
  
  getEventosByFecha: async (fechaInicio, fechaFin) => {
    try {
      const response = await api.post('/eventos/por-fecha', {
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin
      });
      return response.data;
    } catch (error) {
      console.error('Error al obtener eventos por fecha:', error);
      throw error;
    }
  },
  
  createEvento: async (data) => {
    try {
      const response = await api.post('/eventos', data);
      return response.data;
    } catch (error) {
      console.error('Error al crear evento:', error);
      throw error;
    }
  },
  
  updateEvento: async (id, data) => {
    try {
      const response = await api.put(`/eventos/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar evento con ID ${id}:`, error);
      throw error;
    }
  },
  
  deleteEvento: async (id) => {
    try {
      const response = await api.delete(`/eventos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar evento con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Métodos genéricos para cualquier entidad
  getAll: async (entity) => {
    try {
      const response = await api.get(`/${entity}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener lista de ${entity}:`, error);
      throw error;
    }
  },
  
  getById: async (entity, id) => {
    try {
      const response = await api.get(`/${entity}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al obtener ${entity} con ID ${id}:`, error);
      throw error;
    }
  },
  
  create: async (entity, data) => {
    try {
      console.log(`Enviando datos a /${entity}:`, data);
      const response = await api.post(`/${entity}`, data);
      console.log(`Respuesta del servidor para ${entity}:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error al crear ${entity}:`, error);
      if (error.response) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  },
  
  update: async (entity, id, data) => {
    try {
      const response = await api.put(`/${entity}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error al actualizar ${entity} con ID ${id}:`, error);
      throw error;
    }
  },
  
  delete: async (entity, id) => {
    try {
      const response = await api.delete(`/${entity}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error al eliminar ${entity} con ID ${id}:`, error);
      throw error;
    }
  },
  
  // Método para cargar archivos
  uploadFile: async (endpoint, formData) => {
    try {
      const response = await api.post(`/${endpoint}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error(`Error al cargar archivo en ${endpoint}:`, error);
      if (error.response && error.response.data) {
        console.error('Detalles del error:', error.response.data);
      }
      throw error;
    }
  }
};

export default apiService;

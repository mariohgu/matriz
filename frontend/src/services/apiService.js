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

  // Puedes agregar más métodos para otras entidades como:
  // - Contactos
  // - Estados de seguimiento
  // - Oficios
  // - Convenios
  // etc.
};

export default apiService;

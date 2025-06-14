import axios from 'axios';

// A URL base da sua API Node.js.
// Em produção, usa caminho relativo, em desenvolvimento usa localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// A URL completa para a pasta de uploads, para exibir imagens.
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

const api = axios.create({
  baseURL: '/node_api', // Usando caminho relativo para o backend
  withCredentials: true, // Essencial para enviar cookies de sessão
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para garantir que não haja barras duplas nas URLs
api.interceptors.request.use(config => {
  if (config.url) {
    config.url = config.url.replace(/\/+/g, '/');
  }
  return config;
});

export default api; 
import axios from 'axios';

// A URL base da sua API Node.js.
// Em um ambiente de produção real, isso viria de uma variável de ambiente.
export const API_BASE_URL = 'http://localhost:3001';

// A URL completa para a pasta de uploads, para exibir imagens.
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Essencial para enviar cookies de sessão
});

export default api; 
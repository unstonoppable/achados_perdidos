import axios from 'axios';

// A URL base da sua API Node.js.
// Em produção, usa a URL do mesmo domínio, em desenvolvimento usa localhost
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// A URL completa para a pasta de uploads, para exibir imagens.
export const UPLOADS_URL = `${API_BASE_URL}/uploads`;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true, // Essencial para enviar cookies de sessão
});

export default api; 
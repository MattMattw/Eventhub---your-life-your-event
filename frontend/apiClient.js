// Ottiene l'URL di base dell'API dalle variabili d'ambiente di Vite
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Un wrapper per l'API fetch che gestisce la configurazione base,
 * il parsing JSON e la gestione degli errori.
 * @param {string} endpoint - L'endpoint da chiamare (es. '/users/login')
 * @param {object} options - Opzioni per la chiamata fetch (method, headers, body, etc.)
 * @returns {Promise<any>} - I dati dalla risposta JSON
 */
export const apiClient = async (endpoint, { body, ...customConfig } = {}) => {
  const headers = { 'Content-Type': 'application/json' };

  const config = {
    method: body ? 'POST' : 'GET',
    ...customConfig,
    headers: {
      ...headers,
      ...customConfig.headers,
    },
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Qualcosa è andato storto');
  }

  return response.json();
};
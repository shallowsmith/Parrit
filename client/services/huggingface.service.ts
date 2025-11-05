import api from './api';

/**
 * Client wrapper that calls the server-side inference proxy.
 * Server handles calling Hugging Face.
 */
export async function categorizeTransaction(text: string): Promise<{ raw?: any; mapped: string }> {
  const res = await api.post('/inference/category', { text });
  return res.data;
}

export default { categorizeTransaction };

/**
 * API Service
 *
 * Axios instance configured for making authenticated requests to the backend API.
 * Includes interceptors for:
 * - Automatic JWT token injection
 * - Token expiration handling and auto-refresh
 */

import axios from 'axios';
import { API_URL } from '@/config/constants';
import { auth } from '@/config/firebase';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token to all requests
api.interceptors.request.use(
  async (config) => {
    const token = await auth.currentUser?.getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and token expired, refresh and retry
    if (
      error.response?.status === 401 &&
      error.response?.data?.error === 'Token expired' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await auth.currentUser?.getIdToken(true);
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, reject the original error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

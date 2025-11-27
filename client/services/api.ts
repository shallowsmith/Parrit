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
    try {
      if (!auth.currentUser) {
        console.warn('[API] No current user found');
        return config;
      }
      const token = await auth.currentUser.getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token added to request:', config.url);
      } else {
        console.warn('[API] No token available for request:', config.url);
      }
    } catch (error) {
      console.error('[API] Error getting token:', error);
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

    // If 401 (any unauthorized error), try to refresh token and retry
    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      console.log('[API] 401 error detected, attempting token refresh...');
      originalRequest._retry = true;

      try {
        if (!auth.currentUser) {
          console.error('[API] Cannot refresh token - no current user');
          return Promise.reject(error);
        }

        // Force token refresh
        console.log('[API] Refreshing token...');
        const newToken = await auth.currentUser.getIdToken(true);
        if (newToken) {
          console.log('[API] Token refreshed successfully, retrying request...');
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api.request(originalRequest);
        } else {
          console.error('[API] Token refresh returned no token');
        }
      } catch (refreshError) {
        console.error('[API] Token refresh failed:', refreshError);
        // If refresh fails, reject the original error
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

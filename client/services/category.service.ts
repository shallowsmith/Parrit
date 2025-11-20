import api from './api';

export const categoryService = {
  getCategories: (userId: string) => api.get(`/users/${userId}/categories`),
};

export default categoryService;

// CRUD helpers
export const categoryServiceWritable = {
  getCategories: (userId: string) => api.get(`/users/${userId}/categories`),
  createCategory: (userId: string, body: any) => api.post(`/users/${userId}/categories`, body),
  updateCategory: (userId: string, id: string, body: any) => api.put(`/users/${userId}/categories/${id}`, body),
  deleteCategory: (userId: string, id: string) => api.delete(`/users/${userId}/categories/${id}`),
  dedupeCategories: (userId: string) => api.post(`/users/${userId}/categories/dedupe`),
};


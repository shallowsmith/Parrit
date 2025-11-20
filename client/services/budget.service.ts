import api from './api';

/**
 * Budget API service
 */
export const budgetService = {
  getBudgets: (userId: string) => api.get(`/users/${userId}/budgets`),
  getBudgetById: (userId: string, id: string) => api.get(`/users/${userId}/budgets/${id}`),
  updateBudget: (userId: string, id: string, body: any) => api.put(`/users/${userId}/budgets/${id}`, body),
  createBudget: (userId: string, body: any) => api.post(`/users/${userId}/budgets`, body),
};

export default budgetService;

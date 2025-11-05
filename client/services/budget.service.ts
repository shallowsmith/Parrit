import api from './api';

/**
 * Budget API service
 */
export const budgetService = {
  getBudgets: (userId: string) => api.get(`/users/${userId}/budgets`),
  getBudgetById: (userId: string, id: string) => api.get(`/users/${userId}/budgets/${id}`),
};

export default budgetService;

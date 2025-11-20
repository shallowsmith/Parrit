import api from './api';

export const transactionService = {
  /**
   * Create a transaction for a given user
   * @param userId backend profile id
   * @param payload CreateTransactionRequest-shaped object
   */
  createTransaction: (userId: string, payload: any) => {
    return api.post(`/users/${userId}/transactions`, payload);
  },
  getTransactions: (userId: string) => {
    return api.get(`/users/${userId}/transactions`);
  },
  updateTransaction: (userId: string, id: string, payload: any) => {
    return api.put(`/users/${userId}/transactions/${id}`, payload);
  },
  deleteTransaction: (userId: string, id: string) => {
    return api.delete(`/users/${userId}/transactions/${id}`);
  },
};

export default transactionService;

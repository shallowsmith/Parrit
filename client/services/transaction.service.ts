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
};

export default transactionService;

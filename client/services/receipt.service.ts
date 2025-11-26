import api from './api';

export const receiptService = {
  /**
   * Get all receipts for a given user
   * @param userId backend profile id
   */
  getReceipts: (userId: string) => {
    return api.get(`/users/${userId}/receipts`);
  },

  /**
   * Get a single receipt by ID
   * @param userId backend profile id
   * @param receiptId receipt document id
   */
  getReceipt: (userId: string, receiptId: string) => {
    return api.get(`/users/${userId}/receipts/${receiptId}`);
  },

  /**
   * Delete a receipt
   * @param userId backend profile id
   * @param receiptId receipt document id
   */
  deleteReceipt: (userId: string, receiptId: string) => {
    return api.delete(`/users/${userId}/receipts/${receiptId}`);
  },
};

export default receiptService;

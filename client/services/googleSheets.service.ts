/**
 * Google Sheets Export Service
 *
 * Service for exporting transactions to Google Sheets via OAuth 2.0.
 */

import api from './api';

export interface ExportResponse {
  success: boolean;
  message: string;
  sheetUrl: string;
  transactionCount: number;
}

export interface AuthRequiredResponse {
  error: string;
  authUrl: string;
  message: string;
}

export const googleSheetsService = {
  /**
   * Export transactions to Google Sheets
   * @param userId - The user ID
   * @returns Export response with sheet URL or auth URL if authorization needed
   */
  async exportTransactions(userId: string): Promise<ExportResponse | AuthRequiredResponse> {
    const response = await api.post(`/users/${userId}/google/export`);
    return response.data;
  },

  /**
   * Get Google OAuth authorization URL
   * @param userId - The user ID
   * @returns Authorization URL
   */
  getAuthUrl(userId: string): string {
    return `${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1'}/users/${userId}/google/auth`;
  },
};


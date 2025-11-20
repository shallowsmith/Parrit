/**
 * Google Sheets Service
 *
 * Handles Google Sheets API operations for exporting transaction data.
 * Uses OAuth 2.0 to create and update spreadsheets in user's Google Drive.
 */

import { google } from 'googleapis';
import type { sheets_v4 } from 'googleapis';

export class GoogleSheetsService {
  private oauth2Client: any;

  constructor() {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Sets the OAuth2 credentials (access token and refresh token)
   * @param accessToken - OAuth2 access token
   * @param refreshToken - OAuth2 refresh token (for token renewal)
   */
  setCredentials(accessToken: string, refreshToken?: string): void {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
  }

  /**
   * Refreshes the access token using the refresh token
   * @param refreshToken - OAuth2 refresh token
   * @returns New access token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials.access_token;
  }

  /**
   * Creates a new Google Sheet with transaction data
   * @param transactions - Array of transactions to export
   * @param sheetTitle - Title for the spreadsheet
   * @returns Google Sheet URL
   */
  async createSheetWithTransactions(
    transactions: any[],
    sheetTitle: string = 'Parrit Transactions Export'
  ): Promise<string> {
    const sheets = google.sheets({ version: 'v4', auth: this.oauth2Client });

    // Create new spreadsheet
    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: sheetTitle,
        },
      },
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }

    // Prepare data rows
    const headers = [
      'Date & Time',
      'Vendor',
      'Description',
      'Amount',
      'Payment Type',
      'Category ID',
    ];

    const rows = transactions.map((t) => {
      const date = typeof t.dateTime === 'string' ? new Date(t.dateTime) : new Date(t.dateTime);
      const dateTimeString = date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      return [
        dateTimeString,
        t.vendorName || '',
        t.description || '',
        t.amount || 0,
        t.paymentType || '',
        t.categoryId || '',
      ];
    });

    // Write data to sheet
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'A1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [headers, ...rows],
      },
    });

    // Format header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.6, blue: 0.9 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true,
                  },
                },
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)',
            },
          },
          {
            autoResizeDimensions: {
              dimensions: {
                sheetId: 0,
                dimension: 'COLUMNS',
                startIndex: 0,
                endIndex: 7,
              },
            },
          },
        ],
      },
    });

    return `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  /**
   * Gets the OAuth2 authorization URL
   * @param state - Optional state parameter for OAuth flow
   * @returns Authorization URL
   */
  getAuthUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
      state: state,
    });
  }

  /**
   * Exchanges authorization code for tokens
   * @param code - Authorization code from OAuth callback
   * @returns Tokens object with access_token and refresh_token
   */
  async getTokensFromCode(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
  }> {
    const { tokens } = await this.oauth2Client.getToken(code);
    return {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token,
    };
  }
}


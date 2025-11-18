import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { googleSheetsService } from '@/services/googleSheets.service';
import { API_URL } from '@/config/constants';

interface UseGoogleSheetsExportResult {
  exportToGoogleSheets: (userId: string) => Promise<void>;
  exporting: boolean;
}

/**
 * Custom hook for exporting transactions to Google Sheets
 * Handles OAuth flow, error handling, and loading state
 */
export function useGoogleSheetsExport(): UseGoogleSheetsExportResult {
  const [exporting, setExporting] = useState(false);

  const exportToGoogleSheets = async (userId: string) => {
    if (!userId) {
      Alert.alert('Error', 'No profile found. Please log in again.');
      return;
    }

    setExporting(true);

    try {
      const result = await googleSheetsService.exportTransactions(userId);

      // Check if authorization is required
      if ('authUrl' in result) {
        // Need to authorize - open OAuth URL
        const authUrl = result.authUrl.startsWith('http')
          ? result.authUrl
          : `${API_URL}${result.authUrl}`;
        const canOpen = await Linking.canOpenURL(authUrl);

        if (canOpen) {
          await Linking.openURL(authUrl);
          Alert.alert(
            'Authorization Required',
            'Please authorize Google Sheets access in your browser. After authorization, your transactions will be exported automatically.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert('Error', 'Unable to open authorization URL');
        }
      } else if ('sheetUrl' in result && result.success) {
        // Export successful - show success with link
        Alert.alert(
          'Export Successful',
          `Successfully exported ${result.transactionCount} transactions to Google Sheets.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Sheet',
              onPress: async () => {
                const canOpen = await Linking.canOpenURL(result.sheetUrl);
                if (canOpen) {
                  await Linking.openURL(result.sheetUrl);
                } else {
                  Alert.alert('Error', 'Unable to open Google Sheet');
                }
              },
            },
          ]
        );
      }
    } catch (error: any) {
      // Handle 401 response (authorization required) - this is expected for first-time users
      if (error.response?.status === 401) {
        const errorData = error.response?.data;

        // Check if it's the "Google authorization required" response (expected behavior)
        if (errorData?.authUrl) {
          const authUrl = errorData.authUrl.startsWith('http')
            ? errorData.authUrl
            : `${API_URL}${errorData.authUrl}`;

          const canOpen = await Linking.canOpenURL(authUrl);

          if (canOpen) {
            await Linking.openURL(authUrl);
            Alert.alert(
              'Authorization Required',
              'Please authorize Google Sheets access in your browser. After authorization, your transactions will be exported automatically.',
              [{ text: 'OK' }]
            );
            return; // Exit early - this is expected behavior, not an error
          } else {
            Alert.alert('Error', `Unable to open authorization URL: ${authUrl}`);
          }
        } else {
          // 401 but no authUrl - might be authentication issue
          const errorMessage =
            errorData?.error ||
            errorData?.message ||
            'Please make sure you are logged in and try again.';
          Alert.alert('Authentication Error', errorMessage);
        }
      } else {
        // Other errors - log these as actual errors
        console.error('Error exporting to Google Sheets:', error);
        Alert.alert(
          'Export Failed',
          error.response?.data?.error ||
            error.message ||
            'Failed to export transactions. Please try again.'
        );
      }
    } finally {
      setExporting(false);
    }
  };

  return {
    exportToGoogleSheets,
    exporting,
  };
}


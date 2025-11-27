import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import receiptService from '@/services/receipt.service';

export default function ReceiptDetails() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const [receipt, setReceipt] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!params.transactionData) {
      Alert.alert('Error', 'No transaction data provided');
      router.back();
      return;
    }

    try {
      const tx = JSON.parse(params.transactionData as string);
      setTransaction(tx);

      if (!tx.receiptId) {
        Alert.alert('Error', 'No receipt linked to this transaction');
        router.back();
        return;
      }

      // Fetch receipt details
      if (profile?.id) {
        console.log('🧾 [RECEIPT DETAILS] Fetching receipt:', tx.receiptId);
        receiptService.getReceipt(profile.id, tx.receiptId)
          .then((res) => {
            console.log('🧾 [RECEIPT DETAILS] Receipt data:', res.data);
            console.log('🧾 [RECEIPT DETAILS] Image URL:', res.data?.imageUrl);
            setReceipt(res.data);
          })
          .catch((err) => {
            console.error('❌ [RECEIPT DETAILS] Failed to load receipt:', err);
            Alert.alert('Error', 'Failed to load receipt details');
          })
          .finally(() => setLoading(false));
      }
    } catch (err) {
      console.error('Failed to parse transaction data:', err);
      Alert.alert('Error', 'Invalid transaction data');
      router.back();
    }
  }, [params.transactionData, profile?.id]);

  const handleLinkToTransaction = () => {
    // Navigate to home tab with transaction data in params to trigger edit modal
    console.log('🔗 [RECEIPT DETAILS] Navigating to home with transaction:', transaction?.id);

    router.push({
      pathname: '/(tabs)',
      params: {
        editTransaction: JSON.stringify(transaction)
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Loading receipt...</Text>
        </View>
      </View>
    );
  }

  if (!receipt || !transaction) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Receipt Details</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Receipt not found</Text>
        </View>
      </View>
    );
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Receipt Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Receipt Image */}
        {receipt.imageUrl && (
          <View style={styles.imageContainer}>
            {imageLoading && (
              <View style={styles.imageLoadingContainer}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.imageLoadingText}>Loading receipt image...</Text>
              </View>
            )}
            {imageError && (
              <View style={styles.imageErrorContainer}>
                <Text style={styles.imageErrorText}>Failed to load receipt image</Text>
                <Text style={styles.imageErrorSubtext}>Image URL: {receipt.imageUrl?.slice(0, 50)}...</Text>
              </View>
            )}
            {!imageError && (
              <Image
                source={{ uri: receipt.imageUrl }}
                style={styles.receiptImage}
                resizeMode="contain"
                onLoadStart={() => {
                  console.log('🖼️ [RECEIPT DETAILS] Image loading started');
                  setImageLoading(true);
                  setImageError(false);
                }}
                onLoad={() => {
                  console.log('✅ [RECEIPT DETAILS] Image loaded successfully');
                  setImageLoading(false);
                }}
                onError={(error) => {
                  console.error('❌ [RECEIPT DETAILS] Image failed to load:', error.nativeEvent.error);
                  console.error('❌ [RECEIPT DETAILS] Image URL:', receipt.imageUrl);
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            )}
          </View>
        )}

        {/* Transaction Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Merchant</Text>
            <Text style={styles.detailValue}>{transaction.vendorName || receipt.merchantName || 'Unknown'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Amount</Text>
            <Text style={styles.detailValueHighlight}>${Number(transaction.amount || receipt.amount || 0).toFixed(2)}</Text>
          </View>

          {transaction.description && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{transaction.description}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(transaction.dateTime || receipt.date)}</Text>
          </View>

          {transaction.paymentType && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Payment Type</Text>
              <Text style={styles.detailValue}>{transaction.paymentType}</Text>
            </View>
          )}

          {receipt.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes</Text>
              <Text style={styles.detailValue}>{receipt.notes}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Fixed Footer with Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.linkButton} onPress={handleLinkToTransaction}>
          <Text style={styles.linkButtonText}>View Transaction Details</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100, // Add space for fixed footer
  },
  imageContainer: {
    backgroundColor: '#10130F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    minHeight: 400,
    justifyContent: 'center',
  },
  receiptImage: {
    width: '100%',
    height: 400,
    borderRadius: 8,
  },
  imageLoadingContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLoadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  imageErrorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  imageErrorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 8,
    textAlign: 'center',
  },
  imageErrorSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
  },
  detailsCard: {
    backgroundColor: '#10130F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
  },
  detailLabel: {
    color: '#9CA3AF',
    fontSize: 14,
    flex: 1,
  },
  detailValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  detailValueHighlight: {
    color: '#10b981',
    fontSize: 16,
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1E1E1E',
  },
  linkButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});

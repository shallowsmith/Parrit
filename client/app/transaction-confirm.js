import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    TextInput,
    Button,
    Alert,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Image,
    ScrollView,
    Animated,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import categoryService, { categoryServiceWritable } from '@/services/category.service';
import transactionService from '@/services/transaction.service';
import { emit } from '@/utils/events';
import { DEFAULT_NEW_CATEGORY_COLOR } from '@/constants/categoryColors';

export default function TransactionConfirm({ route, navigation }) {
    const { extractedData, backendURL, userId } = route.params;
    const { profile } = useAuth();

    const [amount, setAmount] = useState(extractedData?.total?.toString() || '');
    const [merchant, setMerchant] = useState(extractedData?.merchant || '');
    const [description, setDescription] = useState(extractedData?.description || '');
    const [date, setDate] = useState(extractedData?.date || '');
    const [paymentType, setPaymentType] = useState('Card');
    const [receiptImage, setReceiptImage] = useState(null);
    const [categoryBuckets, setCategoryBuckets] = useState([{ id: 'misc', label: 'Misc' }]);
    const [categoryId, setCategoryId] = useState(extractedData?.category || 'misc');
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!profile?.id) return;
        (async () => {
        try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];
            const mapped = cats.map((c) => ({ id: c.id || c._id, label: c.name }));
            const withMisc = [{ id: 'misc', label: 'Misc' }, ...mapped];
            if (
            extractedData?.category &&
            !withMisc.find((c) => c.label.toLowerCase() === extractedData.category.toLowerCase())
            ) {
            withMisc.unshift({ id: 'ai', label: `${extractedData.category} (AI Suggested)` });
            }
            setCategoryBuckets(withMisc);
        } catch (err) {
            console.warn('Failed to load categories', err);
        }
        })();
    }, [profile?.id]);

    const handleAttachReceipt = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        });
        if (!result.canceled) setReceiptImage(result.assets[0].uri);
    };

    const saveTransaction = async () => {
        try {
        if (!amount || !merchant) {
            Alert.alert('Missing fields', 'Please fill in all required fields.');
            return;
        }

        let resolvedCategoryId = categoryId;
        const selected = categoryBuckets.find((c) => c.label === categoryId || c.id === categoryId);
        if (selected && selected.id !== 'ai') {
            // Use the actual category ID from the selected bucket
            resolvedCategoryId = selected.id;
        } else if (!selected && profile?.id) {
            // Create new category if it doesn't exist
            const created = await categoryServiceWritable.createCategory(profile.id, {
            name: categoryId.replace(' (AI Suggested)', ''),
            type: 'expense',
            userId: profile.id,
            color: DEFAULT_NEW_CATEGORY_COLOR,
            });
            resolvedCategoryId = created.data.id || created.data._id;
            emit('categories:changed');
        }

        // Format date to ISO 8601 datetime string
        const dateTimeISO = date ? new Date(date).toISOString() : new Date().toISOString();

        const payload = {
            userId: profile.id,
            vendorName: merchant,
            description: description || merchant,
            dateTime: dateTimeISO,
            amount: parseFloat(amount),
            paymentType: paymentType,
            categoryId: resolvedCategoryId,
        };

        const res = await fetch(`${backendURL}/api/v1/users/${userId}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error('Failed to save transaction');

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start(() => setSuccessModalVisible(true));
        } catch (err) {
        console.error(err);
        Alert.alert('Error', err.message);
        }
    };

    const handleCloseSuccess = () => {
        Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        }).start(() => {
        setSuccessModalVisible(false);
        navigation.navigate('Transactions');
        });
    };

    return (
        <View style={styles.container}>
        <Modal visible transparent animationType="slide">
            <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
                <Text style={styles.header}>Confirm Transaction</Text>

                <ScrollView>
                <Text style={styles.label}>Amount</Text>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />

                <Text style={styles.label}>Merchant</Text>
                <TextInput style={styles.input} value={merchant} onChangeText={setMerchant} />

                <Text style={styles.label}>Description</Text>
                <TextInput style={styles.input} value={description} onChangeText={setDescription} />

                <Text style={styles.label}>Category</Text>
                <View style={styles.chipsRow}>
                    {categoryBuckets.map((cat) => (
                    <TouchableOpacity key={cat.id} onPress={() => setCategoryId(cat.label)}>
                        <Text
                        style={[
                            styles.chip,
                            categoryId === cat.label && styles.chipSelected,
                            cat.label.includes('(AI Suggested)') && styles.aiChip,
                        ]}
                        >
                        {cat.label}
                        </Text>
                    </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Custom Category</Text>
                <TextInput
                    style={styles.input}
                    value={categoryId}
                    onChangeText={setCategoryId}
                    placeholder="e.g. Groceries"
                />

                <Text style={styles.label}>Date</Text>
                <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />

                <TouchableOpacity onPress={handleAttachReceipt} style={styles.attachButton}>
                    <Text style={styles.attachText}>Attach Receipt</Text>
                </TouchableOpacity>

                {receiptImage && <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />}

                <View style={styles.buttonRow}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
                    <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={saveTransaction}>
                    <Text style={styles.confirmText}>Confirm</Text>
                    </TouchableOpacity>
                </View>
                </ScrollView>
            </View>
            </View>
        </Modal>

        <Modal visible={successModalVisible} transparent animationType="none">
            <View style={styles.modalOverlay}>
            <Animated.View style={[styles.successModal, { opacity: fadeAnim }]}>
                <Text style={styles.successText}>✅ Transaction saved successfully!</Text>
                <Button title="OK" onPress={handleCloseSuccess} />
            </Animated.View>
            </View>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContainer: { backgroundColor: '#000', borderRadius: 12, padding: 20, maxHeight: '90%' },
    header: { color: '#fff', fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    label: { color: '#9CA3AF', marginTop: 10, marginBottom: 5 },
    input: { backgroundColor: '#1E1E1E', color: '#fff', borderRadius: 8, padding: 10, fontSize: 16 },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
    chip: {
    backgroundColor: '#222',
    color: '#fff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: '#333',
    },
    chipSelected: { backgroundColor: '#10b981', borderColor: '#10b981', color: '#072f15' },
    aiChip: { backgroundColor: '#2563EB', borderColor: '#2563EB', color: '#fff' },
    attachButton: { marginTop: 12, backgroundColor: '#2563EB', padding: 10, borderRadius: 8, alignItems: 'center' },
    attachText: { color: '#fff', fontWeight: 'bold' },
    receiptPreview: { width: '100%', height: 180, borderRadius: 8, marginTop: 10 },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    button: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center' },
    cancelButton: { backgroundColor: '#2A2A2A', marginRight: 8 },
    confirmButton: { backgroundColor: '#4CAF50', marginLeft: 8 },
    cancelText: { color: '#fff', fontWeight: 'bold' },
    confirmText: { color: '#fff', fontWeight: 'bold' },
    successModal: { backgroundColor: '#111', padding: 24, borderRadius: 10, alignItems: 'center' },
    successText: { color: '#10b981', fontSize: 18, fontWeight: '600', marginBottom: 10 },
});

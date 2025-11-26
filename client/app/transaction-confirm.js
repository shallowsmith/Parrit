import { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, ScrollView, Alert
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import categoryService, { categoryServiceWritable } from "@/services/category.service";
import transactionService from "@/services/transaction.service";
import { DEFAULT_NEW_CATEGORY_COLOR } from "@/constants/categoryColors";
import { emit } from "@/utils/events";

export default function TransactionConfirm() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { extractedData, receiptId } = params;
    const { profile } = useAuth();

    const data = extractedData ? JSON.parse(extractedData) : {};
    const [amount, setAmount] = useState(data.total?.toString() || "");
    const [merchant, setMerchant] = useState(data.merchant || "");
    const [description, setDescription] = useState(data.description || "");
    const [date, setDate] = useState(data.date || "");

    // Normalize category: "misc" -> "Uncategorized"
    const normalizedCategory = data.category === "misc" ? "Uncategorized" : data.category;
    const [categoryId, setCategoryId] = useState(normalizedCategory || "");
    const [categoryBuckets, setCategoryBuckets] = useState([]);
    const [paymentType, setPaymentType] = useState("Credit");
    const paymentTypes = ["Credit", "Debit", "Cash"];

    // Load categories
    useEffect(() => {
        if (!profile?.id) return;
        (async () => {
        try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];

            // Remove duplicates by name (case-insensitive)
            const uniqueCats = cats.reduce((acc, current) => {
                const existingIndex = acc.findIndex(
                    item => item.name.toLowerCase() === current.name.toLowerCase()
                );
                if (existingIndex === -1) {
                    acc.push(current);
                }
                return acc;
            }, []);

            const mapped = uniqueCats.map((c) => ({
            id: c.id || c._id,
            label: c.name,
            serverId: c.id || c._id,
            }));

            // Check if AI-suggested category already exists in user's categories (case-insensitive)
            const normalizedCat = data.category === "misc" ? "Uncategorized" : data.category;
            const existingCategory = mapped.find((c) => c.label.toLowerCase() === normalizedCat?.toLowerCase());

            if (existingCategory) {
                // Use the existing category's label (preserves user's capitalization)
                setCategoryId(existingCategory.label);
            } else if (normalizedCat) {
                // Add AI suggested category if it doesn't exist
                mapped.unshift({ id: "ai", label: `${normalizedCat} (AI Suggested)` });
                setCategoryId(`${normalizedCat} (AI Suggested)`);
            }

            setCategoryBuckets(mapped);
        } catch (err) {
            console.warn("Failed to load categories", err);
        }
        })();
    }, [profile?.id]);

    const saveTransaction = async () => {
        console.log("💾 Save transaction clicked");
        console.log("Data:", { merchant, amount, categoryId, profile: profile?.id });

        if (!merchant || !amount) {
            Alert.alert("Missing Info", "Please fill in required fields.");
            return;
        }
        try {
            // Resolve category ID
            let resolvedCategoryId = categoryId;

            // Remove " (AI Suggested)" suffix if present
            const cleanCategoryName = categoryId.replace(" (AI Suggested)", "");

            // Try to find the category by label (with or without AI suffix) or by ID
            const selected = categoryBuckets.find((c) =>
                c.label === categoryId ||
                c.label === cleanCategoryName ||
                c.id === categoryId
            );

            if (selected && selected.id === 'ai') {
                // AI suggested category - check if it exists in user's categories
                const existingCategory = categoryBuckets.find((c) =>
                    c.label.toLowerCase() === cleanCategoryName.toLowerCase() && c.id !== 'ai'
                );

                if (existingCategory) {
                    // Use existing category
                    resolvedCategoryId = existingCategory.id;
                } else {
                    // Create new category from AI suggestion
                    const created = await categoryServiceWritable.createCategory(profile.id, {
                        name: cleanCategoryName,
                        type: "expense",
                        userId: profile.id,
                        color: DEFAULT_NEW_CATEGORY_COLOR,
                    });
                    resolvedCategoryId = created.data.id || created.data._id;
                    emit("categories:changed");
                }
            } else if (selected) {
                // Existing category selected
                resolvedCategoryId = selected.id;
            } else if (!selected && profile?.id) {
                // Custom category entered - create it
                const created = await categoryServiceWritable.createCategory(profile.id, {
                    name: cleanCategoryName,
                    type: "expense",
                    userId: profile.id,
                    color: DEFAULT_NEW_CATEGORY_COLOR,
                });
                resolvedCategoryId = created.data.id || created.data._id;
                emit("categories:changed");
            }

            // Format date to ISO 8601 datetime string
            const dateTimeISO = date ? new Date(date).toISOString() : new Date().toISOString();

            // BOTH FLOWS: Create transaction in MongoDB
            // Note: Receipt scanning already created the receipt in ReceiptService.processReceipt()
            const transactionPayload = {
                userId: profile.id,
                vendorName: merchant,
                description: description || merchant,
                dateTime: dateTimeISO,
                amount: parseFloat(amount),
                paymentType: paymentType,
                categoryId: resolvedCategoryId,
                ...(receiptId && { receiptId }), // Link to receipt if this came from receipt scanning
            };

            console.log("💾 Creating transaction with payload:", transactionPayload);
            const result = await transactionService.createTransaction(profile.id, transactionPayload);
            console.log("✅ Transaction created:", result);

            // Show success alert
            Alert.alert("Saved", "Transaction created, receipt saved successfully");

            // Navigate directly to home page, replacing the current screen
            router.replace("/(tabs)");
        } catch (err) {
            console.error("❌ Error saving transaction:", err);
            Alert.alert("Error", err.message || "Failed to save transaction");
        }
    };

    return (
        <View style={styles.container}>
        <Modal visible={true} transparent animationType="slide">
            <View style={styles.overlay}>
            <View style={styles.modalContainer}>
                <ScrollView>
                <Text style={styles.header}>Confirm Receipt Details</Text>

                <Text style={styles.label}>Merchant</Text>
                <TextInput style={styles.input} value={merchant} onChangeText={setMerchant} />

                <Text style={styles.label}>Amount</Text>
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="decimal-pad"
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description"
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.chipsRow}>
                    {categoryBuckets.map((cat) => (
                    <TouchableOpacity key={cat.id} onPress={() => setCategoryId(cat.label)}>
                        <Text
                        style={[
                            styles.chip,
                            categoryId === cat.label && styles.chipSelected,
                            cat.label.includes("(AI Suggested)") && styles.aiChip,
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

                <Text style={styles.label}>Payment Type</Text>
                <View style={styles.chipsRow}>
                    {paymentTypes.map((type) => (
                    <TouchableOpacity key={type} onPress={() => setPaymentType(type)}>
                        <Text
                        style={[
                            styles.chip,
                            paymentType === type && styles.chipSelected,
                        ]}
                        >
                        {type}
                        </Text>
                    </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                />

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => router.back()}
                    >
                    <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style={[styles.button, styles.confirmButton]}
                    onPress={saveTransaction}
                    >
                    <Text style={styles.confirmText}>Save</Text>
                    </TouchableOpacity>
                </View>
                </ScrollView>
            </View>
            </View>
        </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
    modalContainer: { backgroundColor: "#000", borderRadius: 12, padding: 16, maxHeight: "90%" },
    header: { color: "#fff", fontSize: 20, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
    label: { color: "#9CA3AF", fontSize: 12, marginTop: 8, marginBottom: 4 },
    input: { backgroundColor: "#1E1E1E", color: "#fff", borderRadius: 6, padding: 8, borderWidth: 1, borderColor: "#333" },
    chipsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 6 },
    chip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 18, backgroundColor: "#222", color: "#fff", borderWidth: 1, borderColor: "#333", marginRight: 8, marginBottom: 8 },
    chipSelected: { backgroundColor: "#10b981", borderColor: "#10b981", color: "#072f15" },
    aiChip: { backgroundColor: "#2563EB", borderColor: "#2563EB", color: "#fff" },
    preview: { width: "100%", height: 180, borderRadius: 8, marginTop: 10 },
    buttonRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
    button: { flex: 1, padding: 12, borderRadius: 8, alignItems: "center" },
    cancelButton: { backgroundColor: "#2A2A2A", marginRight: 8 },
    confirmButton: { backgroundColor: "#10b981", marginLeft: 8 },
    cancelText: { color: "#fff", fontWeight: "bold" },
    confirmText: { color: "#000", fontWeight: "bold" },
    successModal: { backgroundColor: "#111", padding: 24, borderRadius: 10, alignItems: "center" },
    successText: { color: "#10b981", fontSize: 18, fontWeight: "600", marginBottom: 10 },
});

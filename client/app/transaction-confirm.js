import React, { useEffect, useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, Image, ScrollView, Button, Alert
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import categoryService, { categoryServiceWritable } from "@/services/category.service";
import { DEFAULT_NEW_CATEGORY_COLOR } from "@/constants/categoryColors";
import { emit } from "@/utils/events";

export default function TransactionConfirm({ route, navigation }) {
    const { extractedData, backendURL, userId } = route.params;
    const { profile } = useAuth();

    const data = extractedData ? JSON.parse(extractedData) : {};
    const [amount, setAmount] = useState(data.total?.toString() || "");
    const [merchant, setMerchant] = useState(data.merchant || "");
    const [description, setDescription] = useState(data.description || "");
    const [date, setDate] = useState(data.date || "");
    const [categoryId, setCategoryId] = useState(data.category || "misc");
    const [categoryBuckets, setCategoryBuckets] = useState([{ id: "misc", label: "Misc" }]);
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [receiptImage, setReceiptImage] = useState(null);

    // Load categories
    useEffect(() => {
        if (!profile?.id) return;
        (async () => {
        try {
            const res = await categoryService.getCategories(profile.id);
            const cats = Array.isArray(res.data) ? res.data : [];
            const mapped = cats.map((c) => ({
            id: c.id || c._id,
            label: c.name,
            serverId: c.id || c._id,
            }));
            const withMisc = [{ id: "misc", label: "Misc" }, ...mapped];
            if (data.category && !withMisc.find((c) => c.label.toLowerCase() === data.category.toLowerCase())) {
            withMisc.unshift({ id: "ai", label: `${data.category} (AI Suggested)` });
            }
            setCategoryBuckets(withMisc);
        } catch (err) {
            console.warn("Failed to load categories", err);
        }
        })();
    }, [profile?.id]);

    const saveTransaction = async () => {
        if (!merchant || !amount) {
        Alert.alert("Missing Info", "Please fill in required fields.");
        return;
        }
        try {
        let resolvedCategory = categoryId;
        const selected = categoryBuckets.find((c) => c.label === categoryId || c.id === categoryId);
        if (!selected && profile?.id) {
            const created = await categoryServiceWritable.createCategory(profile.id, {
            name: categoryId,
            type: "expense",
            userId: profile.id,
            color: DEFAULT_NEW_CATEGORY_COLOR,
            });
            resolvedCategory = created.data.name;
            emit("categories:changed");
        }

        const payload = {
            merchant,
            total: parseFloat(amount),
            description,
            category: resolvedCategory.replace(" (AI Suggested)", ""),
            date,
            receiptImage,
        };

        const res = await fetch(`${backendURL}/api/v1/users/${userId}/receipts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save transaction");
        setSuccessModalVisible(true);
        } catch (err) {
        console.error(err);
        Alert.alert("Error", err.message);
        }
    };

    return (
        <View style={styles.container}>
        <Modal visible transparent animationType="slide">
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

                <Text style={styles.label}>Date</Text>
                <TextInput
                    style={styles.input}
                    value={date}
                    onChangeText={setDate}
                    placeholder="YYYY-MM-DD"
                />

                {receiptImage && <Image source={{ uri: receiptImage }} style={styles.preview} />}

                <View style={styles.buttonRow}>
                    <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => navigation.goBack()}
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

        {/* ✅ Success Modal */}
        <Modal visible={successModalVisible} transparent animationType="fade">
            <View style={styles.overlay}>
            <View style={styles.successModal}>
                <Text style={styles.successText}>✅ Transaction saved successfully!</Text>
                <Button title="OK" onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate("Transactions");
                }} />
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

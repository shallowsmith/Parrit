import React, { useEffect, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    StyleSheet,
    Alert,
    ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";

export default function TransactionConfirm({ route, navigation }) {
    const { extractedData, backendURL, userId } = route.params;

    // 🧠 Set AI-predicted category as default
    const [transaction, setTransaction] = useState({
        amount: extractedData?.total?.toString() || "",
        merchant: extractedData?.merchant || "",
        description: extractedData?.description || "",
        category: extractedData?.category || "", // <-- AI-suggested category
        date: extractedData?.date || "",
        paymentType: "Card",
        receiptImage: null,
    });

    const [categories, setCategories] = useState([]);

    // 🔹 Fetch categories from backend
    useEffect(() => {
        const fetchCategories = async () => {
        try {
            const res = await fetch(`${backendURL}/api/v1/users/${userId}/categories`);
            const data = await res.json();

            // If the AI category is not in list, add it
            const catNames = data.map((c) => c.name);
            if (transaction.category && !catNames.includes(transaction.category)) {
            catNames.unshift(transaction.category + " (AI suggested)");
            }

            setCategories(catNames);
        } catch (err) {
            console.error("Failed to load categories:", err);
            setCategories(["Uncategorized"]);
        }
        };

        fetchCategories();
    }, []);

    const handleInputChange = (key, value) => {
        setTransaction({ ...transaction, [key]: value });
    };

    const handleAttachReceipt = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        });
        if (!result.canceled) {
        setTransaction({ ...transaction, receiptImage: result.assets[0].uri });
        }
    };

    const handleConfirm = async () => {
        try {
        const payload = {
            merchant: transaction.merchant,
            total: parseFloat(transaction.amount),
            description: transaction.description,
            category: transaction.category.replace(" (AI suggested)", ""),
            date: transaction.date,
            paymentType: transaction.paymentType,
            receiptImage: transaction.receiptImage,
        };

        const res = await fetch(`${backendURL}/api/v1/users/${userId}/receipts`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error("Failed to save transaction");

        Alert.alert("✅ Success", "Transaction saved successfully!");
        navigation.navigate("Transactions");
        } catch (err) {
        console.error(err);
        Alert.alert("❌ Error", err.message);
        }
    };

    return (
        <ScrollView style={styles.container}>
        <Text style={styles.header}>Confirm Transaction</Text>

        {/* AMOUNT */}
        <Text style={styles.label}>Amount</Text>
        <TextInput
            style={styles.input}
            placeholder="Enter amount"
            placeholderTextColor="#777"
            value={transaction.amount}
            onChangeText={(t) => handleInputChange("amount", t)}
            keyboardType="decimal-pad"
        />

        {/* MERCHANT */}
        <Text style={styles.label}>Merchant</Text>
        <TextInput
            style={styles.input}
            placeholder="Enter merchant"
            placeholderTextColor="#777"
            value={transaction.merchant}
            onChangeText={(t) => handleInputChange("merchant", t)}
        />

        {/* DESCRIPTION */}
        <Text style={styles.label}>Description</Text>
        <TextInput
            style={styles.input}
            placeholder="Add description"
            placeholderTextColor="#777"
            value={transaction.description}
            onChangeText={(t) => handleInputChange("description", t)}
        />

        {/* CATEGORY (AI suggested) */}
        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={transaction.category}
            onValueChange={(itemValue) => handleInputChange("category", itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
            >
            {categories.length === 0 ? (
                <Picker.Item label="Loading categories..." value="" />
            ) : (
                categories.map((cat, index) => (
                <Picker.Item key={index} label={cat} value={cat} />
                ))
            )}
            </Picker>
        </View>

        {/* PAYMENT TYPE */}
        <Text style={styles.label}>Payment Type</Text>
        <View style={styles.pickerContainer}>
            <Picker
            selectedValue={transaction.paymentType}
            onValueChange={(itemValue) => handleInputChange("paymentType", itemValue)}
            style={styles.picker}
            dropdownIconColor="#fff"
            >
            <Picker.Item label="Card" value="Card" />
            <Picker.Item label="Cash" value="Cash" />
            </Picker>
        </View>

        {/* DATE */}
        <Text style={styles.label}>Date</Text>
        <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#777"
            value={transaction.date}
            onChangeText={(t) => handleInputChange("date", t)}
        />

        {/* ATTACH RECEIPT */}
        <TouchableOpacity style={styles.attach} onPress={handleAttachReceipt}>
            <Image
            source={require("../assets/images/attach_icon.png")}
            style={styles.icon}
            />
            <Text style={styles.attachText}>Attach Receipt</Text>
        </TouchableOpacity>

        {transaction.receiptImage && (
            <Image
            source={{ uri: transaction.receiptImage }}
            style={styles.receiptPreview}
            />
        )}

        {/* BUTTONS */}
        <View style={styles.buttonRow}>
            <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            >
            <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
            style={[styles.button, styles.confirmButton]}
            onPress={handleConfirm}
            >
            <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0E0E0E", padding: 20 },
    header: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
        marginBottom: 20,
        textAlign: "center",
    },
    label: { color: "#B0B0B0", marginTop: 10, marginBottom: 5 },
    input: {
        backgroundColor: "#1E1E1E",
        color: "#FFFFFF",
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        fontSize: 16,
    },
    pickerContainer: {
        backgroundColor: "#1E1E1E",
        borderRadius: 8,
        overflow: "hidden",
    },
    picker: {
        color: "#FFFFFF",
        height: 50,
        width: "100%",
    },
    attach: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 20,
    },
    icon: { width: 20, height: 20, tintColor: "#FFFFFF", marginRight: 10 },
    attachText: { color: "#FFFFFF", fontSize: 16 },
    receiptPreview: {
        width: "100%",
        height: 200,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 30,
    },
    button: { flex: 1, alignItems: "center", padding: 12, borderRadius: 8 },
    cancelButton: { backgroundColor: "#2A2A2A", marginRight: 10 },
    confirmButton: { backgroundColor: "#4CAF50", marginLeft: 10 },
    cancelText: { color: "#FFFFFF", fontWeight: "bold" },
    confirmText: { color: "#FFFFFF", fontWeight: "bold" },
});

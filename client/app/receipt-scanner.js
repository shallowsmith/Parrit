import React, { useState } from "react";
import {
    View,
    Text,
    Button,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    TouchableOpacity,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

    export default function ReceiptScanner() {
    const router = useRouter();
    const { profile } = useAuth();
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const backendURL = process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '') || "http://localhost:3000";

    // Pick receipt image
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        });
        if (!result.canceled) setImageUri(result.assets[0].uri);
    };

    // Upload to backend for OCR + extraction
    const uploadImage = async () => {
        if (!imageUri) return;
        if (!profile?.id) {
        Alert.alert("Login Required", "Please sign in first.");
        return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("file", {
        uri: imageUri,
        name: "receipt.jpg",
        type: "image/jpeg",
        });

        try {
        // Create AbortController for custom timeout (2 minutes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 seconds

        const response = await fetch(
            `${backendURL}/api/v1/users/${profile.id}/receipts/scan`,
            {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data",
            },
            signal: controller.signal,
            }
        );

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log("🧾 Extracted Receipt Data:", data);

        if (data.success && data.data) {
            router.push({
            pathname: "/transaction-confirm",
            params: {
                extractedData: JSON.stringify(data.data),
                receiptId: data.id, // Pass the receipt ID from backend
                backendURL,
                userId: profile.id,
            },
            });
        } else {
            Alert.alert("Error", "Failed to extract receipt data. Try again.");
        }
        } catch (error) {
        console.error("Upload failed:", error);
        if (error.name === 'AbortError') {
            Alert.alert("Timeout", "Receipt processing took too long. Please try again or use a simpler receipt.");
        } else {
            Alert.alert("Error", "Something went wrong while uploading.");
        }
        } finally {
        setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                    <Text style={styles.header}>Scan Your Receipt</Text>
                    {imageUri && !loading && (
                        <TouchableOpacity
                        onPress={() => setImageUri(null)}
                        style={styles.closeButton}
                        >
                        <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <TouchableOpacity style={styles.actionButton} onPress={pickImage}>
                <Text style={styles.actionText}>Pick Receipt Image</Text>
                </TouchableOpacity>

                {imageUri && (
                <>
                    <Image source={{ uri: imageUri }} style={styles.preview} />
                    <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={uploadImage}
                    >
                    <Text style={styles.uploadText}>Upload and Extract Data</Text>
                    </TouchableOpacity>
                </>
                )}

                {loading && (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#10b981" />
                    <Text style={styles.loadingText}>Processing receipt...</Text>
                </View>
                )}
            </View>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#000" },
    contentContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        marginBottom: 20,
        position: "relative",
    },
    closeButton: {
        position: "absolute",
        right: 0,
        padding: 8,
    },
    closeText: { color: "#9CA3AF", fontSize: 24 },
    header: { color: "#fff", fontSize: 22, fontWeight: "700" },
    actionButton: {
        backgroundColor: "#7DA669",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    actionText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
    preview: {
        width: 250,
        height: 250,
        borderRadius: 10,
        marginVertical: 20,
        borderWidth: 1,
        borderColor: "#333",
    },
    uploadButton: {
        backgroundColor: "#10b981",
        paddingVertical: 12,
        borderRadius: 10,
        width: "100%",
        alignItems: "center",
    },
    uploadText: { color: "#fff", fontWeight: "bold" },
    loadingContainer: { marginTop: 20, alignItems: "center" },
    loadingText: { color: "#9CA3AF", marginTop: 8 },
});

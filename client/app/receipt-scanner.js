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
    Modal,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

    export default function ReceiptScanner() {
    const router = useRouter();
    const { profile } = useAuth();
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(true);
    const backendURL = "http://172.16.11.179:3000"; // ✅ Replace with your own local IP

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
        const response = await fetch(
            `${backendURL}/api/v1/users/${profile.id}/receipts/scan`,
            {
            method: "POST",
            body: formData,
            headers: {
                Accept: "application/json",
                "Content-Type": "multipart/form-data",
            },
            }
        );

        const data = await response.json();
        console.log("🧾 Extracted Receipt Data:", data);

        if (data.success && data.data) {
            setModalVisible(false);
            router.push({
            pathname: "/transaction-confirm",
            params: {
                extractedData: JSON.stringify(data.data),
                backendURL,
                userId: profile.id,
            },
            });
        } else {
            Alert.alert("Error", "Failed to extract receipt data. Try again.");
        }
        } catch (error) {
        console.error("Upload failed:", error);
        Alert.alert("Error", "Something went wrong while uploading.");
        } finally {
        setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
        <Modal visible={modalVisible} transparent animationType="slide">
            <View style={styles.overlay}>
            <View style={styles.modalContainer}>
                <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
                >
                <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.header}>Scan Your Receipt</Text>

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
        </Modal>
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        padding: 20,
    },
    modalContainer: {
        backgroundColor: "#000",
        borderRadius: 12,
        padding: 16,
        alignItems: "center",
    },
    closeButton: { position: "absolute", right: 12, top: 12 },
    closeText: { color: "#9CA3AF", fontSize: 20 },
    header: { color: "#fff", fontSize: 22, fontWeight: "700", marginBottom: 20 },
    actionButton: {
        backgroundColor: "#2563EB",
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
    uploadText: { color: "#000", fontWeight: "bold" },
    loadingContainer: { marginTop: 20, alignItems: "center" },
    loadingText: { color: "#9CA3AF", marginTop: 8 },
});

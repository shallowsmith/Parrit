import React, { useState } from "react";
import {
    View,
    Button,
    Image,
    ActivityIndicator,
    Alert,
    StyleSheet,
    Text,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";

export default function ReceiptScanner() {
    const router = useRouter();
    const [imageUri, setImageUri] = useState(null);
    const [loading, setLoading] = useState(false);
    const userId = "YOUR_USER_ID"; // 🔹 Replace with your actual user ID
    const backendURL = "http://192.168.1.23:3000"; // 🔹 Replace with your backend IP (check your machine’s local IP)

    // 🖼 Pick an image from gallery
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        });
        if (!result.canceled) {
        setImageUri(result.assets[0].uri);
        }
    };

    // 📤 Upload image to backend for OCR + AI extraction
    const uploadImage = async () => {
        if (!imageUri) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("file", {
        uri: imageUri,
        name: "receipt.jpg",
        type: "image/jpeg",
        });

        try {
        const response = await fetch(`${backendURL}/api/v1/users/${userId}/receipts/scan`, {
            method: "POST",
            body: formData,
        });

        const data = await response.json();
        console.log("Extracted Receipt Data:", data);

        if (data.success && data.data) {
            // Navigate to the confirmation screen with extracted data
            router.push({
            pathname: "/TransactionConfirm",
            params: {
                extractedData: JSON.stringify(data.data),
                backendURL,
                userId,
            },
            });
            setImageUri(null);
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
        <Text style={styles.header}>Receipt Scanner</Text>

        <Button title="Pick Receipt Image" onPress={pickImage} color="#4CAF50" />

        {imageUri && (
            <>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            <Button title="Upload and Extract Data" onPress={uploadImage} color="#2196F3" />
            </>
        )}

        {loading && (
            <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00FFB3" />
            <Text style={styles.loadingText}>Processing receipt...</Text>
            </View>
        )}
        </View>
    );
    }

    const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0E0E0E",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
    },
    header: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
    },
    imagePreview: {
        width: 250,
        height: 250,
        marginVertical: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#333",
    },
    loadingContainer: {
        marginTop: 20,
        alignItems: "center",
    },
    loadingText: {
        color: "#AAAAAA",
        marginTop: 10,
    },
});

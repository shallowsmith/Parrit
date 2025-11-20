// import React, { useEffect, useState } from "react";
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     Image,
//     StyleSheet,
//     Alert,
//     ScrollView,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import { useAuth } from "@/contexts/AuthContext";
// import huggingfaceService from "@/services/huggingface.service";
// import transactionService from "@/services/transaction.service";
// import categoryService, { categoryServiceWritable } from "@/services/category.service";
// import { extractAmount } from "@/utils/amount";
// import { mapTextToBucketByKeywords } from "@/utils/category";
// import { emit } from "@/utils/events";

// export default function VoiceTransactionConfirm({ route, navigation }) {
//     const { profile } = useAuth();
//     const { transcription, audioUri, backendURL } = route.params; // from VoiceRecorder or route
//     const [categories, setCategories] = useState<string[]>([]);
//     const [loading, setLoading] = useState(false);

//     const [transaction, setTransaction] = useState({
//         amount: "",
//         merchant: "",
//         description: transcription || "",
//         category: "",
//         date: new Date().toISOString().slice(0, 10),
//         paymentType: "Card",
//     });

//     // 🔹 Extract amount and merchant automatically
//     useEffect(() => {
//         if (transcription) {
//         const amt = extractAmount(transcription);
//         if (amt) setTransaction((p) => ({ ...p, amount: amt.toString() }));

//         const atMatch = transcription.match(/(?:at|from)\s+([\w&\.\'\- ]+)/i);
//         if (atMatch) setTransaction((p) => ({ ...p, merchant: atMatch[1].trim() }));
//         }
//     }, [transcription]);

//     // 🔹 Use HuggingFace or keyword map to predict category
//     useEffect(() => {
//         if (!transcription) return;
//         (async () => {
//         try {
//             const cleaned = transcription.replace(/\d+(\.\d{1,2})?/g, "").trim();
//             const aiRes = await huggingfaceService.categorizeTransaction(cleaned);
//             const mapped = aiRes?.mapped || mapTextToBucketByKeywords(transcription) || "Misc";
//             setTransaction((p) => ({ ...p, category: mapped }));
//         } catch (err) {
//             console.warn("AI category failed:", err);
//         }
//         })();
//     }, [transcription]);

//     // 🔹 Fetch categories from backend
//     useEffect(() => {
//         if (!profile?.id) return;
//         const fetchCats = async () => {
//         try {
//             const res = await categoryService.getCategories(profile.id);
//             const list = res.data?.map((c: any) => c.name) || [];
//             setCategories((prev) => {
//             if (transaction.category && !list.includes(transaction.category)) {
//                 return [transaction.category + " (AI suggested)", ...list];
//             }
//             return list;
//             });
//         } catch (err) {
//             console.error("Failed to load categories:", err);
//             setCategories(["Uncategorized"]);
//         }
//         };
//         fetchCats();
//     }, [profile?.id, transaction.category]);

//     // 🔹 Handle input change
//     const handleChange = (key: string, val: string) => {
//         setTransaction({ ...transaction, [key]: val });
//     };

//     // 🔹 Save transaction
//     const handleConfirm = async () => {
//         try {
//         setLoading(true);
//         const payload = {
//             userId: profile?.id,
//             vendorName: transaction.merchant || "Unknown",
//             description: transaction.description,
//             dateTime: new Date(transaction.date).toISOString(),
//             amount: parseFloat(transaction.amount),
//             paymentType: transaction.paymentType,
//             categoryId: transaction.category.replace(" (AI suggested)", ""),
//             audioUri,
//         };

//         const res = await transactionService.createTransaction(profile?.id, payload);
//         if (res.status === 201) {
//             Alert.alert("✅ Success", "Voice transaction saved successfully!");
//             emit("transactions:changed");
//             navigation.navigate("Transactions");
//         } else {
//             Alert.alert("Unexpected Response", `Status ${res.status}`);
//         }
//         } catch (err: any) {
//         console.error(err);
//         Alert.alert("❌ Error", err.message || "Failed to save transaction");
//         } finally {
//         setLoading(false);
//         }
//     };

//     return (
//         <ScrollView style={styles.container}>
//         <Text style={styles.header}>Confirm Voice Transaction</Text>

//         {/* DESCRIPTION (transcription) */}
//         <Text style={styles.label}>You said</Text>
//         <TextInput
//             style={[styles.input, { height: 100 }]}
//             multiline
//             editable={false}
//             value={transaction.description}
//         />

//         {/* AMOUNT */}
//         <Text style={styles.label}>Amount</Text>
//         <TextInput
//             style={styles.input}
//             placeholder="Enter amount"
//             placeholderTextColor="#777"
//             value={transaction.amount}
//             onChangeText={(t) => handleChange("amount", t)}
//             keyboardType="decimal-pad"
//         />

//         {/* MERCHANT */}
//         <Text style={styles.label}>Merchant</Text>
//         <TextInput
//             style={styles.input}
//             placeholder="Enter merchant name"
//             placeholderTextColor="#777"
//             value={transaction.merchant}
//             onChangeText={(t) => handleChange("merchant", t)}
//         />

//         {/* CATEGORY */}
//         <Text style={styles.label}>Category</Text>
//         <View style={styles.pickerContainer}>
//             <Picker
//             selectedValue={transaction.category}
//             onValueChange={(val) => handleChange("category", val)}
//             style={styles.picker}
//             dropdownIconColor="#fff"
//             >
//             {categories.length === 0 ? (
//                 <Picker.Item label="Loading categories..." value="" />
//             ) : (
//                 categories.map((cat, i) => (
//                 <Picker.Item key={i} label={cat} value={cat} />
//                 ))
//             )}
//             </Picker>
//         </View>

//         {/* PAYMENT TYPE */}
//         <Text style={styles.label}>Payment Type</Text>
//         <View style={styles.pickerContainer}>
//             <Picker
//             selectedValue={transaction.paymentType}
//             onValueChange={(val) => handleChange("paymentType", val)}
//             style={styles.picker}
//             dropdownIconColor="#fff"
//             >
//             <Picker.Item label="Card" value="Card" />
//             <Picker.Item label="Cash" value="Cash" />
//             <Picker.Item label="Apple Pay" value="Apple Pay" />
//             </Picker>
//         </View>

//         {/* DATE */}
//         <Text style={styles.label}>Date</Text>
//         <TextInput
//             style={styles.input}
//             placeholder="YYYY-MM-DD"
//             placeholderTextColor="#777"
//             value={transaction.date}
//             onChangeText={(t) => handleChange("date", t)}
//         />

//         {/* BUTTONS */}
//         <View style={styles.buttonRow}>
//             <TouchableOpacity
//             style={[styles.button, styles.cancelButton]}
//             onPress={() => navigation.goBack()}
//             >
//             <Text style={styles.cancelText}>Cancel</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//             style={[styles.button, styles.confirmButton]}
//             onPress={handleConfirm}
//             disabled={loading}
//             >
//             <Text style={styles.confirmText}>
//                 {loading ? "Saving..." : "Confirm"}
//             </Text>
//             </TouchableOpacity>
//         </View>
//         </ScrollView>
//     );
//     }

//     const styles = StyleSheet.create({
//     container: { flex: 1, backgroundColor: "#0E0E0E", padding: 20 },
//     header: {
//         color: "#FFFFFF",
//         fontSize: 20,
//         fontWeight: "bold",
//         marginBottom: 20,
//         textAlign: "center",
//     },
//     label: { color: "#B0B0B0", marginTop: 10, marginBottom: 5 },
//     input: {
//         backgroundColor: "#1E1E1E",
//         color: "#FFFFFF",
//         borderRadius: 8,
//         paddingHorizontal: 10,
//         paddingVertical: 8,
//         fontSize: 16,
//     },
//     pickerContainer: {
//         backgroundColor: "#1E1E1E",
//         borderRadius: 8,
//         overflow: "hidden",
//     },
//     picker: { color: "#FFFFFF", height: 50, width: "100%" },
//     buttonRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         marginTop: 30,
//     },
//     button: { flex: 1, alignItems: "center", padding: 12, borderRadius: 8 },
//     cancelButton: { backgroundColor: "#2A2A2A", marginRight: 10 },
//     confirmButton: { backgroundColor: "#4CAF50", marginLeft: 10 },
//     cancelText: { color: "#FFFFFF", fontWeight: "bold" },
//     confirmText: { color: "#FFFFFF", fontWeight: "bold" },
// });

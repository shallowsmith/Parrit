import { ImageAnnotatorClient } from "@google-cloud/vision";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import admin from "../config/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { ReceiptValidationError } from "../models/Receipt";

// Firestore reference
const db = admin.firestore();
const storage = admin.storage();
const receiptsCollection = db.collection("receipts");

interface ReceiptData {
  userId: string;
  merchantName: string;
  amount: number;
  date: Date;
  category?: string;
  imageUrl: string;
  paymentType?: string;
  notes?: string;
}

export class ReceiptService {
  constructor() {
    console.log("✅ Firebase ReceiptService initialized");
  }

  /**
   * ===========================
   * 🔹 CREATE RECEIPT
   * ===========================
   */
  async createReceipt(receiptData: any) {
    if (!receiptData.userId || !receiptData.merchantName || !receiptData.amount) {
      throw new ReceiptValidationError("Missing required fields");
    }

    const docRef = receiptsCollection.doc();
    await docRef.set({
      ...receiptData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const created = await docRef.get();
    return { id: docRef.id, ...created.data() };
  }

  /**
   * ===========================
   * 🔹 GET RECEIPT BY ID
   * ===========================
   */
  async getReceiptById(id: string) {
    const doc = await receiptsCollection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  /**
   * ===========================
   * 🔹 GET ALL USER RECEIPTS
   * ===========================
   */
  async getReceiptsByUserId(userId: string) {
    const snapshot = await receiptsCollection.where("userId", "==", userId).get();
    const receipts: any[] = [];
    snapshot.forEach((doc) => receipts.push({ id: doc.id, ...doc.data() }));
    return receipts;
  }

  /**
   * ===========================
   * 🔹 UPDATE RECEIPT
   * ===========================
   */
  async updateReceipt(id: string, updateData: any) {
    const docRef = receiptsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return null;

    await docRef.update({
      ...updateData,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = await docRef.get();
    return { id: docRef.id, ...updated.data() };
  }

  /**
   * ===========================
   * 🔹 DELETE RECEIPT
   * ===========================
   */
  async deleteReceipt(id: string): Promise<boolean> {
    const docRef = receiptsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    await docRef.delete();
    return true;
  }

  /**
   * ===========================
   * 🔹 PROCESS RECEIPT IMAGE
   * ===========================
   * Steps:
   * 1. OCR → Google Vision
   * 2. Categorize → Hugging Face
   * 3. Upload image → Firebase Storage
   * 4. Save metadata → Firestore
   */
  async processReceipt(userId: string, filePath: string) {
    try {
      const visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      // Step 1: Extract text
      const [result] = await visionClient.textDetection(filePath);
      const detections = result.textAnnotations;
      const fullText = detections?.[0]?.description || "";
      console.log("🧾 OCR Extracted Text:", fullText.slice(0, 150));

      // Step 2: Parse simple data from text
      const merchant = this.extractMerchant(fullText);
      const total = this.extractTotal(fullText);
      const date = this.extractDate(fullText);

      // Step 3: Predict category using Hugging Face
      const hfResponse = await fetch(
        "https://api-inference.huggingface.co/models/kuro-08/bert-transaction-categorization",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `Transaction: Payment at ${merchant} for ${total}`,
          }),
        }
      );

      let hfData: any;
      try {
        hfData = await hfResponse.json();
      } catch {
        hfData = [];
      }

      const category =
        (Array.isArray(hfData)
          ? (hfData[0]?.label || hfData?.[0]?.[0]?.label)
          : "Uncategorized") || "Uncategorized";

      // Step 4: Upload receipt image to Firebase Storage
      const bucket = storage.bucket();
      const fileName = `receipts/${userId}/${uuidv4()}${path.extname(filePath)}`;
      const [uploadedFile] = await bucket.upload(filePath, {
        destination: fileName,
        metadata: {
          metadata: {
            firebaseStorageDownloadTokens: uuidv4(),
          },
        },
      });

      const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
        uploadedFile.name
      )}?alt=media`;

      // Step 5: Remove local temp file
      fs.unlinkSync(filePath);

      // Step 6: Save receipt in Firestore
      const receiptData: ReceiptData = {
        userId,
        merchantName: merchant || "Unknown Merchant",
        amount: total || 0,
        date: date || new Date(),
        category,
        imageUrl,
        paymentType: "Card",
        notes: "Auto-extracted from receipt image",
      };

      const docRef = receiptsCollection.doc();
      await docRef.set({
        ...receiptData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { success: true, id: docRef.id, data: receiptData };
    } catch (error) {
      console.error("❌ Receipt processing failed:", error);
      throw new Error("Failed to process and save receipt");
    }
  }

  // --- 🔹 Helper Methods ---
  private extractMerchant(text: string): string {
    const lines = text.split("\n").map((l) => l.trim());
    return lines[0] || "Unknown Merchant";
  }

  private extractTotal(text: string): number {
    const match = text.match(/\$?\s?(\d+\.\d{2})/);
    return match ? parseFloat(match[1]) : 0;
  }

  private extractDate(text: string): Date | null {
    const match = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    return match ? new Date(match[1]) : null;
  }
}

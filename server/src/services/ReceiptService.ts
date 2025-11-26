import { ImageAnnotatorClient } from "@google-cloud/vision";
import fs from "fs";
import sharp from "sharp";
import admin from "../config/firebase-admin";
import { v4 as uuidv4 } from "uuid";
import { ReceiptValidationError } from "../models/Receipt";
import HuggingFaceService from "./HuggingFaceService";

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
   * Deletes receipt from Firestore and its image from Firebase Storage
   */
  async deleteReceipt(id: string): Promise<boolean> {
    const docRef = receiptsCollection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const receiptData = doc.data();

    // Delete the image from Firebase Storage if it exists
    if (receiptData?.imageUrl) {
      try {
        // Extract file path from imageUrl
        // URL format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}?alt=media
        const url = new URL(receiptData.imageUrl);
        const pathMatch = url.pathname.match(/\/o\/(.+)/);

        if (pathMatch) {
          const filePath = decodeURIComponent(pathMatch[1]);
          const bucket = storage.bucket();
          const file = bucket.file(filePath);

          console.log(`🗑️ Deleting receipt image: ${filePath}`);
          await file.delete();
          console.log(`✅ Successfully deleted receipt image from Storage`);
        }
      } catch (error) {
        console.error('Failed to delete receipt image from Storage:', error);
        // Continue with Firestore deletion even if Storage deletion fails
      }
    }

    // Delete the Firestore document
    await docRef.delete();
    console.log(`✅ Successfully deleted receipt ${id} from Firestore`);
    return true;
  }

  /**
   * ===========================
   * 🔹 PROCESS RECEIPT IMAGE
   * ===========================
   * Steps:
   * 1. OCR → Google Vision
   * 2. Categorize → Hugging Face (with timeout fallback)
   * 3. Upload image → Firebase Storage
   * 4. Save metadata → Firestore
   */
  async processReceipt(userId: string, filePath: string) {
    const startTime = Date.now();
    console.log(`⏱️ [RECEIPT] Starting receipt processing for user ${userId}`);

    try {
      // Step 1: Extract text with Google Vision OCR
      const ocrStart = Date.now();
      const visionClient = new ImageAnnotatorClient({
        keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      });

      const [result] = await visionClient.textDetection(filePath);
      const detections = result.textAnnotations;
      const fullText = detections?.[0]?.description || "";
      const ocrDuration = Date.now() - ocrStart;
      console.log(`✅ [RECEIPT] OCR completed in ${ocrDuration}ms`);
      console.log("🧾 OCR Extracted Text:", fullText.slice(0, 150));

      // Step 2: Parse simple data from text
      const parseStart = Date.now();
      const merchant = this.extractMerchant(fullText);
      const total = this.extractTotal(fullText);
      const date = this.extractDate(fullText);
      const parseDuration = Date.now() - parseStart;
      console.log(`✅ [RECEIPT] Text parsing completed in ${parseDuration}ms`);

      // Step 3: Predict category using HuggingFaceService (same as voice transactions)
      const hfStart = Date.now();
      console.log("🤖 [RECEIPT] Calling HuggingFace API for categorization...");
      console.log(`🤖 [RECEIPT] Input: Transaction at ${merchant} for $${total}`);

      const categoryResult = await HuggingFaceService.categorize(`${merchant} ${total}`);
      const category = categoryResult.mapped || "misc";

      const hfDuration = Date.now() - hfStart;
      console.log(`✅ [RECEIPT] HuggingFace categorization completed in ${hfDuration}ms: ${category}`);
      if (categoryResult.raw) {
        console.log("🤖 [RECEIPT] Raw HuggingFace response:", JSON.stringify(categoryResult.raw).slice(0, 200));
      }

      // Step 4: Compress image to reduce upload time
      const compressStart = Date.now();
      console.log("🗜️ [RECEIPT] Compressing image...");

      const compressedPath = `${filePath}-compressed.jpg`;
      await sharp(filePath)
        .resize(1600, 1600, { // Max 1600x1600, maintains aspect ratio
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({ quality: 85 }) // 85% quality
        .toFile(compressedPath);

      const originalSize = fs.statSync(filePath).size;
      const compressedSize = fs.statSync(compressedPath).size;
      const compressionRatio = ((1 - compressedSize / originalSize) * 100).toFixed(1);
      const compressDuration = Date.now() - compressStart;
      console.log(`✅ [RECEIPT] Image compressed in ${compressDuration}ms (${originalSize} → ${compressedSize} bytes, ${compressionRatio}% reduction)`);

      // Step 5: Upload compressed image to Firebase Storage
      const uploadStart = Date.now();
      console.log("☁️ [RECEIPT] Uploading to Firebase Storage...");

      const bucket = storage.bucket();
      const fileName = `receipts/${userId}/${uuidv4()}.jpg`;
      const [uploadedFile] = await bucket.upload(compressedPath, {
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

      const uploadDuration = Date.now() - uploadStart;
      console.log(`✅ [RECEIPT] Firebase upload completed in ${uploadDuration}ms`);

      // Step 6: Remove local temp files
      fs.unlinkSync(filePath);
      fs.unlinkSync(compressedPath);

      // Step 7: Save receipt in Firestore
      const firestoreStart = Date.now();
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

      const firestoreDuration = Date.now() - firestoreStart;
      console.log(`✅ [RECEIPT] Firestore save completed in ${firestoreDuration}ms`);

      const totalDuration = Date.now() - startTime;
      console.log(`✅ [RECEIPT] Total processing time: ${totalDuration}ms`);
      console.log(`📊 [RECEIPT] Breakdown: OCR=${ocrDuration}ms, Parse=${parseDuration}ms, HF=${Date.now() - hfStart}ms, Compress=${compressDuration}ms, Upload=${uploadDuration}ms, Firestore=${firestoreDuration}ms`);

      // Return data in format expected by client for transaction confirmation
      return {
        success: true,
        id: docRef.id,
        data: {
          merchant: receiptData.merchantName,
          total: receiptData.amount,
          date: receiptData.date instanceof Date ? receiptData.date.toISOString() : new Date().toISOString(),
          category: receiptData.category,
          description: `Purchase at ${receiptData.merchantName}`,
          imageUrl: receiptData.imageUrl
        }
      };
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error(`❌ [RECEIPT] Processing failed after ${totalDuration}ms:`, error);

      // Clean up temp files if they still exist
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        const compressedPath = `${filePath}-compressed.jpg`;
        if (fs.existsSync(compressedPath)) {
          fs.unlinkSync(compressedPath);
        }
      } catch (cleanupError) {
        console.error("Failed to clean up temp files:", cleanupError);
      }

      throw new Error("Failed to process and save receipt");
    }
  }

  // --- 🔹 Helper Methods ---
  private extractMerchant(text: string): string {
    const lines = text.split("\n").map((l) => l.trim());
    return lines[0] || "Unknown Merchant";
  }

  private extractTotal(text: string): number {
    // Look for total, amount due, balance, or similar patterns
    // More specific patterns that require proper currency formatting
    const totalPatterns = [
      /total[:\s]*\$\s*(\d+[,.]?\d*\.?\d{2})/i,
      /amount\s+due[:\s]*\$\s*(\d+[,.]?\d*\.?\d{2})/i,
      /balance[:\s]*\$\s*(\d+[,.]?\d*\.?\d{2})/i,
      /grand\s+total[:\s]*\$\s*(\d+[,.]?\d*\.?\d{2})/i,
      /subtotal[:\s]*\$\s*(\d+[,.]?\d*\.?\d{2})/i,
    ];

    // Try each pattern in order of priority
    for (const pattern of totalPatterns) {
      const match = text.match(pattern);
      if (match) {
        // Remove commas from number (e.g., "1,234.56" -> "1234.56")
        const numStr = match[1].replace(/,/g, '');
        const value = parseFloat(numStr);
        // Sanity check: receipt total should be reasonable (between $0.01 and $10,000)
        if (value > 0 && value < 10000) {
          return value;
        }
      }
    }

    // Fallback: find amounts with dollar signs and decimal points (proper currency format)
    // This excludes receipt numbers, phone numbers, etc.
    const currencyAmounts = text.match(/\$\s*(\d+(?:,\d{3})*\.?\d{2})/g);
    if (currencyAmounts && currencyAmounts.length > 0) {
      const amounts = currencyAmounts.map(a => {
        const cleaned = a.replace(/[$,\s]/g, '');
        return parseFloat(cleaned);
      }).filter(n => !isNaN(n) && n > 0 && n < 10000); // Reasonable range

      if (amounts.length > 0) {
        // Return the largest reasonable amount
        return Math.max(...amounts);
      }
    }

    return 0;
  }

  private extractDate(text: string): Date | null {
    // Try text-based date formats first (e.g., "June 6, 2025", "January 1, 2024")
    const monthNames = 'january|february|march|april|may|june|july|august|september|october|november|december';
    const textDateMatch = text.match(new RegExp(`(${monthNames})\\s+\\d{1,2},?\\s+\\d{4}`, 'i'));
    if (textDateMatch) {
      const parsedDate = new Date(textDateMatch[0]);
      if (!isNaN(parsedDate.getTime())) {
        // Combine receipt date with current time (time they scanned it)
        const now = new Date();
        parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        return parsedDate;
      }
    }

    // Try numeric date formats (MM/DD/YYYY, MM-DD-YYYY, etc.)
    const numericDateMatch = text.match(/(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/);
    if (numericDateMatch) {
      const parsedDate = new Date(numericDateMatch[1]);
      if (!isNaN(parsedDate.getTime())) {
        // Combine receipt date with current time (time they scanned it)
        const now = new Date();
        parsedDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());
        return parsedDate;
      }
    }

    return null;
  }
}

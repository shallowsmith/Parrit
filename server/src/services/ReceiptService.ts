import { ImageAnnotatorClient } from "@google-cloud/vision";
import fs from "fs";
//import fetch from "node-fetch";
import { z } from "zod";
import { ReceiptRepository } from "../repositories/ReceiptRepository";
import {
  ReceiptValidationError,
  validateCreateReceiptRequest,
  toReceiptResponse,
  updateReceiptSchema,
} from "../models/Receipt";
import type {
  ReceiptResponse,
  UpdateReceiptRequest,
} from "../models/Receipt";

/**
 * ReceiptService
 * --------------
 * Handles all business logic for receipts:
 * - OCR text extraction
 * - Transaction parsing
 * - Category prediction (via Hugging Face)
 * - Validation + MongoDB persistence
 */
export class ReceiptService {
  private receiptRepository: ReceiptRepository;

  constructor() {
    this.receiptRepository = new ReceiptRepository();
  }

  /** ✅ Create a new receipt manually */
  async createReceipt(receiptData: any): Promise<ReceiptResponse> {
    const validatedData = validateCreateReceiptRequest(receiptData);
    const createdReceipt = await this.receiptRepository.createReceipt(validatedData);
    return toReceiptResponse(createdReceipt);
  }

  /** 🔍 Get a receipt by ID */
  async getReceiptById(id: string): Promise<ReceiptResponse | null> {
    if (!id || typeof id !== "string") {
      throw new ReceiptValidationError("Invalid receipt ID");
    }
    const receipt = await this.receiptRepository.findReceiptById(id);
    return receipt ? toReceiptResponse(receipt) : null;
  }

  /** 📜 Get all receipts */
  async getAllReceipts(): Promise<ReceiptResponse[]> {
    const receipts = await this.receiptRepository.findAllReceipts();
    return receipts.map(toReceiptResponse);
  }

  /** 👤 Get receipts by user ID */
  async getReceiptsByUserId(userId: string): Promise<ReceiptResponse[]> {
    if (!userId || typeof userId !== "string") {
      throw new ReceiptValidationError("Invalid user ID");
    }
    const receipts = await this.receiptRepository.findByUserId(userId);
    return receipts.map(toReceiptResponse);
  }

  /** 🏷️ Get receipts by category ID */
  async getReceiptsByCategoryId(categoryId: string): Promise<ReceiptResponse[]> {
    if (!categoryId || typeof categoryId !== "string") {
      throw new ReceiptValidationError("Invalid category ID");
    }
    const receipts = await this.receiptRepository.findByCategoryId(categoryId);
    return receipts.map(toReceiptResponse);
  }

  /** ✏️ Update receipt */
  async updateReceipt(id: string, updateData: any): Promise<ReceiptResponse | null> {
    if (!id || typeof id !== "string") {
      throw new ReceiptValidationError("Invalid receipt ID");
    }

    const existingReceipt = await this.receiptRepository.findReceiptById(id);
    if (!existingReceipt) return null;

    let validatedData: Partial<UpdateReceiptRequest>;
    try {
      validatedData = updateReceiptSchema.parse(updateData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues[0]?.message || "Validation failed";
        throw new ReceiptValidationError(
          message,
          error.issues[0]?.path[0]?.toString()
        );
      }
      throw error;
    }

    const updatedReceipt = await this.receiptRepository.updateReceipt(id, validatedData);
    return updatedReceipt ? toReceiptResponse(updatedReceipt) : null;
  }

  /** 🗑️ Delete a receipt */
  async deleteReceipt(id: string): Promise<boolean> {
    if (!id || typeof id !== "string") {
      throw new ReceiptValidationError("Invalid receipt ID");
    }
    return await this.receiptRepository.deleteReceipt(id);
  }

  /** ⚙️ Initialize database indexes */
  async initializeIndexes(): Promise<void> {
    await this.receiptRepository.createIndexes();
  }

  /**
   * 🧾 Process scanned receipt image:
   *  1. Extract text (Google Vision)
   *  2. Parse total, date, merchant
   *  3. Predict category via Hugging Face
   *  4. Save to MongoDB
   */
  async processReceipt(userId: string, filePath: string): Promise<ReceiptResponse> {
    const visionClient = new ImageAnnotatorClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });

    const HF_API_URL =
      "https://api-inference.huggingface.co/models/kuro-08/bert-transaction-categorization";

    /** 🧠 Helper — Predict category using Hugging Face */
    async function predictCategory(description: string): Promise<string> {
      try {
        const response = await fetch(HF_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: description }),
        });

        const result = await response.json();
        if (Array.isArray(result) && result[0]?.label) {
          return result[0].label;
        } else if (Array.isArray(result) && result[0]?.length > 0) {
          return result[0][0]?.label || "Uncategorized";
        } else {
          return "Uncategorized";
        }
      } catch (error) {
        console.error("⚠️ Hugging Face API error:", error);
        return "Uncategorized";
      }
    }

    try {
      // STEP 1 — Extract text from image via OCR
      const [result] = await visionClient.textDetection(filePath);
      const detections = result.textAnnotations;
      const fullText = detections?.[0]?.description || "";

      console.log("🧾 OCR Extracted Text:", fullText.slice(0, 150));

      // STEP 2 — Parse text to extract merchant, date, total
      const merchantMatch = fullText.match(/(?:at|from)\s+([A-Za-z\s]+)/i);
      const totalMatch = fullText.match(/\bTotal\s*[:\-]?\s*\$?(\d+(\.\d{1,2})?)/i);
      const dateMatch = fullText.match(
        /\b(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})\b/
      );

      const merchant = merchantMatch?.[1]?.trim() || "Unknown Merchant";
      const total = totalMatch ? parseFloat(totalMatch[1]) : 0;
      const date = dateMatch ? new Date(dateMatch[1]) : new Date();

      // STEP 3 — Predict category via Hugging Face
      const description = `Transaction at ${merchant}: ${fullText.slice(0, 200)}`;
      const category = await predictCategory(description);

      // STEP 4 — Delete temporary file
      fs.unlinkSync(filePath);

      // STEP 5 — Save structured receipt
      const receiptData = {
        merchantName: merchant,
        amount: total,
        date,
        categoryId: category,
        userId,
        imageUrl: "",
        notes: "Auto-extracted and categorized via Hugging Face",
      };

      const validatedData = validateCreateReceiptRequest(receiptData);
      const createdReceipt = await this.receiptRepository.createReceipt(validatedData);

      // STEP 6 — Return formatted response with prediction
      const response = toReceiptResponse(createdReceipt);
      return {
        ...response,
        predictedCategory: category,
      };
    } catch (error) {
      console.error("❌ Receipt processing failed:", error);
      throw new Error("Failed to process and save receipt");
    }
  }
}

/**
 * Parrit - Voice Activated Finance Tracker
 * Main application entry point
 *
 * This file orchestrates:
 * - Database connection initialization
 * - Express server setup and middleware
 * - Route registration
 * - Swagger documentation
 * - Graceful shutdown handling
 */

import "dotenv/config";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
import DatabaseConnection from "./config/database";
import { ProfileService } from "./services/ProfileService";
import profileRoutes from "./routes/profile.routes";
import budgetRoutes from "./routes/budget.routes";
import categoryRoutes from "./routes/category.routes";
import transactionRoutes from "./routes/transaction.routes";
import receiptRoutes from "./routes/receipt.routes";
import spendingHistoryRoutes from "./routes/spendingHistory.routes";

// Create Express application instance
const app = express();
const PORT = 3000;

// Express middleware
app.use(express.json()); // Parse JSON request bodies

// Swagger documentation endpoint
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes registration
// Profile routes (with MongoDB integration)
app.use("/api/v1/profiles", profileRoutes);

// Other routes (currently using in-memory storage)
app.use("/api/v1/users/:id/budgets", budgetRoutes);
app.use("/api/v1/users/:userId/categories", categoryRoutes);
app.use("/api/v1/users/:userId/transactions", transactionRoutes);
app.use("/api/v1/users/:userId/receipts", receiptRoutes);

// Spending history routes (aggregated spending reports)
app.use("/api/v1/users/:userId/spending", spendingHistoryRoutes);

/**
 * Starts the application server.
 * Handles initialization sequence:
 * 1. Database connection
 * 2. Database indexes creation
 * 3. Express server startup
 */
async function startServer() {
  try {
    // Step 1: Establish MongoDB connection
    await DatabaseConnection.getInstance().connect();
    console.log("Database connected successfully");

    // Step 2: Initialize database indexes for optimal performance
    const profileService = new ProfileService();
    await profileService.initializeIndexes();
    console.log("Database indexes initialized");

    // Step 3: Start the Express server
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(
        `Swagger documentation available at http://localhost:${PORT}/docs`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

/**
 * Handles graceful shutdown on SIGINT (Ctrl+C)
 * Ensures database connections are properly closed
 */
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  try {
    // Close database connection
    await DatabaseConnection.getInstance().disconnect();
    console.log("Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

/**
 * Handles graceful shutdown on SIGTERM (process termination)
 * Ensures database connections are properly closed
 */
process.on("SIGTERM", async () => {
  console.log("Shutting down gracefully...");
  try {
    // Close database connection
    await DatabaseConnection.getInstance().disconnect();
    console.log("Database disconnected");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

// Start the application
startServer();

import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import profileRoutes from "./routes/profile.routes.js";
import budgetRoutes from "./routes/budget.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import transactionRoutes from "./routes/transaction.routes.js";
import receiptRoutes from "./routes/receipt.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// Swagger documentation
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// routes
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/users/:id/budgets", budgetRoutes);
app.use("/api/v1/users/{userId}/categories", categoryRoutes);
app.use("/api/v1/users/:userId/transactions", transactionRoutes);
app.use("/api/v1/users/:userId/receipts", receiptRoutes);

// app.get("/", (req, res) => {
//     res.send("Hello World");
// })

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/docs`);
});


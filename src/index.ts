import express from "express";
import profileRoutes from "./routes/profile.routes.js";

const app = express();
const PORT = 3000;

app.use(express.json());

// routes
app.use("/api/v1/profiles", profileRoutes);

// app.get("/", (req, res) => {
//     res.send("Hello World");
// })

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
})


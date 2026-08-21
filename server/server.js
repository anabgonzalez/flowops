import express from "express";
import dotenv from "dotenv"
import { connectDB, pool } from "./config/db.js"

dotenv.config()

const app = express();
const PORT = process.env.PORT || 5002

app.use(express.json()); // allows us to accept JSON data in the req.body

app.get("/api/health", async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT now()")
        res.status(200).json({ success: true, dbTime: rows[0].now })
    } catch (error) {
        res.status(500).json({ success: false, message: "Database unreachable" })
    }
});

app.listen(PORT, () => {
    connectDB();
    console.log('Server started at http://localhost:' + PORT);
});

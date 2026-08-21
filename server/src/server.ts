import express from "express"
import { healthResponseSchema } from "@flowops/shared"
import { connectDB, pool } from "./config/db.js"

const app = express()
const PORT = process.env.PORT || 5002

app.use(express.json()); // allows us to accept JSON data in the req.body

app.get("/api/health", async (_req, res) => {
    try {
        const { rows } = await pool.query("SELECT now()")
        const body = healthResponseSchema.parse({
            success: true,
            dbTime: (rows[0].now as Date).toISOString(),
        })
        res.status(200).json(body)
    } catch (error) {
        const body = healthResponseSchema.parse({
            success: false,
            message: "Database unreachable",
        })
        res.status(500).json(body)
    }
});

app.listen(PORT, () => {
    connectDB();
    console.log('Server started at http://localhost:' + PORT);
});

import pg from "pg"
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../.env") })

const { Pool } = pg

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true,
})

export const connectDB = async () => {
    try {
        const { rows } = await pool.query("SELECT now()")
        console.log(`Postgres connected: ${rows[0].now}`)
    } catch (error) {
        console.log(`Error: ${error.message}`)
        process.exit(1)
    }
}

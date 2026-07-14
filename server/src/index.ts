import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './config/db.js'
import healthRoute from './routes/health.route.js'

const PORT = process.env.PORT ?? 5002
const MONGO_URI = process.env.MONGO_URI

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/health', healthRoute)

async function start() {
  if (MONGO_URI) {
    await connectDB(MONGO_URI)
  } else {
    console.warn('MONGO_URI not set — starting without a database connection')
  }

  app.listen(PORT, () => {
    console.log(`FlowOps server listening on port ${PORT}`)
  })
}

start()

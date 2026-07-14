import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRoute from './routes/health.route.js'

const PORT = process.env.PORT ?? 5002

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/health', healthRoute)

app.listen(PORT, () => {
  console.log(`FlowOps server listening on port ${PORT}`)
})

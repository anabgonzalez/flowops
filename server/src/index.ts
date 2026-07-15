import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRoute from './routes/health.route.js'
import userRoutes from './routes/user.routes.js'
import customerRoutes from './routes/customer.routes.js'
import locationRoutes from './routes/location.routes.js'
import pricebookItemRoutes from './routes/pricebookItem.routes.js'
import jobRoutes from './routes/job.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import estimateRoutes from './routes/estimate.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const PORT = process.env.PORT ?? 5002
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN

const app = express()
app.use(cors({ origin: CLIENT_ORIGIN ?? true }))
app.use(express.json())

app.use('/api/health', healthRoute)
app.use('/api/users', userRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/pricebook-items', pricebookItemRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/estimates', estimateRoutes)
app.use('/api/invoices', invoiceRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`FlowOps server listening on port ${PORT}`)
})

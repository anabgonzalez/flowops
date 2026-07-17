import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import healthRoute from './routes/health.route.js'
import authRoutes from './routes/auth.routes.js'
import { requireAuth } from './middleware/requireAuth.js'
import { asyncHandler } from './middleware/asyncHandler.js'
import userRoutes from './routes/user.routes.js'
import rolePermissionsRoutes from './routes/rolePermissions.routes.js'
import customerRoutes from './routes/customer.routes.js'
import locationRoutes from './routes/location.routes.js'
import locationContactRoutes from './routes/locationContact.routes.js'
import pricebookItemRoutes from './routes/pricebookItem.routes.js'
import pricebookCategoryRoutes from './routes/pricebookCategory.routes.js'
import pricebookItemComponentRoutes from './routes/pricebookItemComponent.routes.js'
import pricebookResetRoutes from './routes/pricebookReset.routes.js'
import jobTypeRoutes from './routes/jobType.routes.js'
import tagRoutes from './routes/tag.routes.js'
import timeframeRoutes from './routes/timeframe.routes.js'
import dispatchRoutes from './routes/dispatch.routes.js'
import jobRoutes from './routes/job.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import estimateRoutes from './routes/estimate.routes.js'
import invoiceRoutes from './routes/invoice.routes.js'
import { errorHandler } from './middleware/errorHandler.js'

const PORT = process.env.PORT ?? 5002
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN

const app = express()
app.set('trust proxy', 1)
app.use(cors({ origin: CLIENT_ORIGIN ?? true }))
app.use(express.json())

app.use('/api/health', healthRoute)
app.use('/api/auth', authRoutes)

// Everything below requires a valid session. Mounted here (not per-router)
// so a new route file can't accidentally forget it.
app.use(asyncHandler(requireAuth))

app.use('/api/users', userRoutes)
app.use('/api/role-permissions', rolePermissionsRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/locations', locationRoutes)
app.use('/api/location-contacts', locationContactRoutes)
app.use('/api/pricebook', pricebookResetRoutes)
app.use('/api/pricebook-items', pricebookItemRoutes)
app.use('/api/pricebook-categories', pricebookCategoryRoutes)
app.use('/api/pricebook-item-components', pricebookItemComponentRoutes)
app.use('/api/job-types', jobTypeRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/timeframes', timeframeRoutes)
app.use('/api/dispatch', dispatchRoutes)
app.use('/api/jobs', jobRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/estimates', estimateRoutes)
app.use('/api/invoices', invoiceRoutes)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`FlowOps server listening on port ${PORT}`)
})

import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { CustomersPage } from './pages/CustomersPage'
import { CustomerDetailPage } from './pages/CustomerDetailPage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { PricebookPage } from './pages/PricebookPage'
import { PricebookItemDetailPage } from './pages/PricebookItemDetailPage'
import { TechniciansPage } from './pages/TechniciansPage'
import { TechnicianDetailPage } from './pages/TechnicianDetailPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/jobs" replace />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/jobs/:id" element={<JobDetailPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/:id" element={<CustomerDetailPage />} />
        <Route path="/pricebook" element={<PricebookPage />} />
        <Route path="/pricebook/:id" element={<PricebookItemDetailPage />} />
        <Route path="/technicians" element={<TechniciansPage />} />
        <Route path="/technicians/:id" element={<TechnicianDetailPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App

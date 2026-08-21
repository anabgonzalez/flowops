import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewBooking from './pages/NewBooking'
import Team from './pages/Team'
import DispatchBoard from './pages/DispatchBoard'
import TechJobs from './pages/TechJobs'
import TechJobDetail from './pages/TechJobDetail'
import ProtectedRoute from './components/ProtectedRoute'
import RequireRole from './components/RequireRole'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/booking/new"
        element={
          <ProtectedRoute>
            <NewBooking />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team"
        element={
          <ProtectedRoute>
            <RequireRole roles={['owner', 'gm']}>
              <Team />
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dispatch"
        element={
          <ProtectedRoute>
            <RequireRole roles={['owner', 'gm', 'office_manager', 'dispatcher']}>
              <DispatchBoard />
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech/jobs"
        element={
          <ProtectedRoute>
            <RequireRole roles={['service_technician', 'comfort_advisor', 'install_crew_lead', 'install_helper']}>
              <TechJobs />
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/tech/jobs/:jobId"
        element={
          <ProtectedRoute>
            <RequireRole roles={['service_technician', 'comfort_advisor', 'install_crew_lead', 'install_helper']}>
              <TechJobDetail />
            </RequireRole>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App

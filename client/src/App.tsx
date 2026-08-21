import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import NewBooking from './pages/NewBooking'
import Team from './pages/Team'
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
    </Routes>
  )
}

export default App

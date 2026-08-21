import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Provider } from './components/ui/provider.tsx'
import { AuthProvider } from './context/AuthContext.tsx'

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Provider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </Provider>
  </StrictMode>,
)

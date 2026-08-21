import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { session, loading } = useAuth()

    if (loading) {
        return (
            <Center minH="100vh">
                <Spinner size="lg" />
            </Center>
        )
    }

    if (!session) {
        return <Navigate to="/login" replace />
    }

    return <>{children}</>
}

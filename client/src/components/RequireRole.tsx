import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { Center, Spinner } from '@chakra-ui/react'
import type { UserRole } from '@flowops/shared'
import { useAuth } from '../context/AuthContext'

interface Props {
    roles: UserRole[]
    children: ReactNode
}

/** Use inside ProtectedRoute -- assumes a session already exists and only
 * gates on which role that session belongs to. */
export default function RequireRole({ roles, children }: Props) {
    const { profile, loading } = useAuth()

    if (loading) {
        return (
            <Center minH="100vh">
                <Spinner size="lg" />
            </Center>
        )
    }

    if (!profile || !roles.includes(profile.role)) {
        return <Navigate to="/" replace />
    }

    return <>{children}</>
}

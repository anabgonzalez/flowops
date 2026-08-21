import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { UserProfile } from '@flowops/shared'
import { supabase } from '../lib/supabase'
import { getCurrentUserProfile } from '../lib/auth'

interface AuthContextValue {
    session: Session | null
    profile: UserProfile | null
    loading: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession)
        })

        supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
            setSession(existingSession)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (!session) {
            setProfile(null)
            setLoading(false)
            return
        }

        setLoading(true)
        getCurrentUserProfile()
            .then(setProfile)
            .finally(() => setLoading(false))
    }, [session])

    return (
        <AuthContext.Provider value={{ session, profile, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}

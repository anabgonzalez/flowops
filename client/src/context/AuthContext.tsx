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
    // undefined = not yet determined, null = confirmed no session. These
    // are not the same thing: on the very first render, before
    // getSession() has resolved even once, session was previously
    // initialized to null -- indistinguishable from "confirmed signed
    // out" -- so the profile effect below immediately (and wrongly) took
    // the "if (!session)" branch on that very first render, setting
    // loading=false/profile=null before we'd actually checked anything.
    // RequireRole/ProtectedRoute would redirect away on that premature
    // state, and by the time the real session arrived, the route had
    // already changed and nothing was left mounted to correct it.
    const [session, setSession] = useState<Session | null | undefined>(undefined)
    const [profile, setProfile] = useState<UserProfile | null>(null)

    useEffect(() => {
        // getSession()'s promise is the authoritative initial read -- it
        // only resolves once the client has actually finished checking
        // storage. onAuthStateChange's own first emission can't be
        // trusted for that: on a cold load it fires an immediate
        // INITIAL_SESSION with session=null before storage has been
        // read, self-correcting via a follow-up SIGNED_IN event a moment
        // later. So: ignore onAuthStateChange entirely until getSession()
        // has resolved once; after that it's the correct source for
        // every real subsequent change (sign out elsewhere, token
        // refresh, etc.).
        let initialized = false

        supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
            initialized = true
            setSession(existingSession)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
            if (!initialized) return
            setSession(newSession)
        })

        return () => subscription.unsubscribe()
    }, [])

    useEffect(() => {
        if (session === undefined) return // still determining -- don't touch profile yet
        if (session === null) {
            setProfile(null)
            return
        }

        // Guard against a stale/aborted fetch from a superseded run (React
        // StrictMode double-invokes this effect in dev, and the first
        // run's request gets cancelled) landing after a newer run already
        // resolved.
        let cancelled = false
        getCurrentUserProfile()
            .then((p) => { if (!cancelled) setProfile(p) })
            .catch(() => { if (!cancelled) setProfile(null) })

        return () => { cancelled = true }
    }, [session])

    // Can't derive "still loading the profile" from a flag set inside the
    // effect above -- that flag update itself lands one render after
    // `session` first becomes truthy (effects run post-commit), so the
    // render in between would see session=Session, profile=null, and a
    // stale "not loading" flag, and RequireRole would redirect on it
    // before the fetch even started. Comparing profile identity against
    // the session directly has no such lag: it's derived in the same
    // render session changes in.
    const loading = session === undefined || (session !== null && profile?.id !== session.user.id)

    return (
        <AuthContext.Provider value={{ session: session ?? null, profile, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
    return ctx
}

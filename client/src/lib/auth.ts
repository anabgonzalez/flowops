import { userProfileSchema, type UserProfile } from '@flowops/shared'
import { supabase } from './supabase'

export async function signInWithPassword(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
}

export async function signUpWithPassword(email: string, password: string, fullName: string) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
    })
    if (error) throw error
    return data
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
        .from('user_profiles')
        .select('id, full_name, email, phone, role, division, is_active, created_at')
        .eq('id', user.id)
        .single()

    if (error) throw error
    return userProfileSchema.parse(data)
}

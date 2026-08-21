import { userProfileSchema, type UserProfile, type UserRole, type Division } from '@flowops/shared'
import { supabase } from './supabase'

const PROFILE_COLUMNS = 'id, full_name, email, phone, role, division, is_active, created_at, service_zip_codes'

export async function listTeamMembers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select(PROFILE_COLUMNS)
        .order('full_name', { ascending: true })
    if (error) throw error
    return data.map((row) => userProfileSchema.parse(row))
}

export async function updateTeamMember(
    id: string,
    updates: { role?: UserRole; division?: Division | null; is_active?: boolean; service_zip_codes?: string[] | null },
): Promise<UserProfile> {
    const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('id', id)
        .select(PROFILE_COLUMNS)
        .single()
    if (error) throw error
    return userProfileSchema.parse(data)
}

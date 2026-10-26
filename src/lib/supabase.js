import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
// Sites hosted inside a shared Supabase project keep their tables in their own schema.
const schema = import.meta.env.VITE_SUPABASE_SCHEMA || 'public'

export const isSupabaseConfigured = Boolean(url && key)
if (!isSupabaseConfigured) {
  console.warn('[Supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set — data calls will fail until they are')
}

// createClient throws on an empty URL, which would blank the whole app — a
// placeholder keeps every page rendering (queries then return an error the UI shows).
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-anon-key', {
  db: { schema },
})

import { createClient } from '@supabase/supabase-js'

// Ganti dua teks di bawah ini dengan data dari dashboard Supabase-mu
const supabaseUrl = 'https://prxzfbdmyihenluqdlwy.supabase.co'
const supabaseKey = 'sb_publishable_i0mIVPWMiWtdV9P7ZC0cOw_axbHqLQ8'

export const supabase = createClient(supabaseUrl, supabaseKey)
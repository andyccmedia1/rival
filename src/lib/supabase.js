import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Rival] Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify → Site settings → Environment variables, then redeploy.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
)

export const GOAL_OPTIONS = [
  { id: 'read', label: 'Read', emoji: '📖', color: '#7F77DD' },
  { id: 'exercise', label: 'Exercise', emoji: '🏃', color: '#1D9E75' },
  { id: 'hydrate', label: 'Hydrate', emoji: '💧', color: '#378ADD' },
  { id: 'meditate', label: 'Meditate', emoji: '🧘', color: '#D4537E' },
  { id: 'sleep', label: 'Sleep 8h', emoji: '🌙', color: '#534AB7' },
  { id: 'eat', label: 'Eat clean', emoji: '🥗', color: '#639922' },
  { id: 'journal', label: 'Journal', emoji: '✏️', color: '#BA7517' },
  { id: 'cold', label: 'Cold shower', emoji: '🧊', color: '#185FA5' },
]

export const AVATARS = ['🐉', '🦊', '🐺', '🦁', '🐯', '🦋', '🐸', '🐼', '🦄', '🐻', '🦅', '🐬']

export const DURATIONS = [
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 21, label: '21 days' },
  { days: 30, label: '30 days' },
]

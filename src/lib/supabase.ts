// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export type Message = {
  id: string
  recipient_id: string
  sender_name: string
  message: string
  image_url?: string
  card_style: string
  created_at: string
}

export type User = {
  id: string
  email: string
  user_metadata?: {
    display_name?: string
  }
}

export const CARD_STYLES = [
  {
    id: 'classic',
    name: 'クラシック',
    bgGradient: 'from-blue-50 to-indigo-100',
    borderColor: 'border-indigo-200',
    textColor: 'text-gray-800',
  },
  {
    id: 'warm',
    name: 'ウォーム',
    bgGradient: 'from-orange-50 to-yellow-100',
    borderColor: 'border-orange-200',
    textColor: 'text-gray-800',
  },
  {
    id: 'fresh',
    name: 'フレッシュ',
    bgGradient: 'from-green-50 to-emerald-100',
    borderColor: 'border-green-200',
    textColor: 'text-gray-800',
  },
  {
    id: 'romantic',
    name: 'ロマンティック',
    bgGradient: 'from-pink-50 to-rose-100',
    borderColor: 'border-pink-200',
    textColor: 'text-gray-800',
  },
  {
    id: 'purple',
    name: 'エレガント',
    bgGradient: 'from-purple-50 to-indigo-100',
    borderColor: 'border-purple-200',
    textColor: 'text-gray-800',
  },
  {
    id: 'minimal',
    name: 'ミニマル',
    bgGradient: 'from-gray-50 to-slate-100',
    borderColor: 'border-gray-300',
    textColor: 'text-gray-900',
  },
]
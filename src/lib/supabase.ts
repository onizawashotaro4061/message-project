// lib/supabase.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export const supabase = createClientComponentClient()

export type Message = {
  id: string
  recipient_id: string
  sender_id: string
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
    department?: string
    role?: string
    avatar_url?: string  // ← この行を追加
  }
}

export type CardStyle = {
  id: string
  name: string
  bgGradient: string
  borderColor: string
  textColor: string
  departments?: string[]
  roles?: string[]
}

export const CARD_STYLES: CardStyle[] = [
  // 共通カード（テーマカラー3種類のみ）
  {
    id: 'enkou',
    name: '焔紅',
    bgGradient: 'bg-[#B5364A]',
    borderColor: 'border-[#B5364A]',
    textColor: 'text-white',
  },
  {
    id: 'souen',
    name: '蒼炎',
    bgGradient: 'bg-[#3571B8]',
  borderColor: 'border-[#3571B8]',
    textColor: 'text-white',
  },
  {
    id: 'kikou',
    name: '軌光',
    bgGradient: 'bg-[#D8CE48]',
  borderColor: 'border-[#D8CE48]',
    textColor: 'text-black',
  },
  // 所属専用カード
  {
    id: 'shikoubu',
    name: '執行部',
    bgGradient: 'from-purple-900 via-indigo-900 to-purple-800',
    borderColor: 'border-purple-950',
    textColor: 'text-white',
    // departments: ['執行部'],
  },
  {
    id: 'uneikyoku',
    name: '運営局',
    bgGradient: 'from-cyan-200 to-cyan-300',
    borderColor: 'border-cyan-500',
    textColor: 'text-gray-800',
    // departments: ['運営局'],
  },
  {
    id: 'enshukyoku',
    name: '演出局',
    bgGradient: 'from-orange-200 to-orange-300',
    borderColor: 'border-orange-500',
    textColor: 'text-gray-800',
    // departments: ['演出局'],
  },
  {
    id: 'kaihatsukyoku',
    name: '開発局',
    bgGradient: 'from-purple-200 to-purple-300',
    borderColor: 'border-purple-500',
    textColor: 'text-gray-800',
    // departments: ['開発局'],
  },
  {
    id: 'kohokyoku',
    name: '広報局',
    bgGradient: 'from-pink-200 to-pink-300',
    borderColor: 'border-pink-500',
    textColor: 'text-gray-800',
    // departments: ['広報局'],
  },
  {
    id: 'zaimukyoku',
    name: '財務局',
    bgGradient: 'from-teal-200 to-teal-300',
    borderColor: 'border-teal-500',
    textColor: 'text-gray-800',
    // departments: ['財務局'],
  },
  {
    id: 'sankadantaikyoku',
    name: '参加団体局',
    bgGradient: 'from-yellow-200 to-yellow-300',
    borderColor: 'border-yellow-500',
    textColor: 'text-gray-800',
    // departments: ['参加団体局'],
  },
  {
    id: 'shogaikyoku',
    name: '渉外局',
    bgGradient: 'from-amber-200 to-amber-300',
    borderColor: 'border-amber-600',
    textColor: 'text-gray-800',
    // departments: ['渉外局'],
  },
  {
    id: 'seisakukyoku',
    name: '制作局',
    bgGradient: 'from-blue-300 to-blue-400',
    borderColor: 'border-blue-600',
    textColor: 'text-gray-800',
    // departments: ['制作局'],
  },
  {
    id: 'somukyoku',
    name: '総務局',
    bgGradient: 'from-lime-200 to-lime-300',
    borderColor: 'border-lime-500',
    textColor: 'text-gray-800',
    // departments: ['総務局'],
  },

  // 役職専用カード
  {
    id: 'executive',
    name: '役員専用',
    bgGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    borderColor: 'border-yellow-600',
    textColor: 'text-gray-900',
    // roles: ['executive'],
  },
  {
    id: 'vice_director',
    name: '副局長専用',
    bgGradient: 'from-slate-300 via-gray-300 to-slate-400',
    borderColor: 'border-gray-600',
    textColor: 'text-gray-900',
    // roles: ['vice_director'],
  },
  {
    id: 'section_chief',
    name: '部門長専用',
    bgGradient: 'from-cyan-400 via-teal-400 to-cyan-500',
    borderColor: 'border-cyan-600',
    textColor: 'text-gray-900',
    // roles: ['section_chief'],
  },
]
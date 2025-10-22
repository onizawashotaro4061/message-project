'use client'

import { useState, useEffect } from 'react'
import { supabase, CARD_STYLES, User } from '@/lib/supabase'
import Link from 'next/link'

// 所属の順序
const DEPARTMENT_ORDER = [
  '執行部',
  '運営局',
  '演出局',
  '開発局',
  '広報局',
  '財務局',
  '参加団体局',
  '渉外局',
  '制作局',
  '総務局',
]

type UserWithDept = User & {
  department?: string
  avatar_url?: string
}

type CardShape = 'rectangle' | 'square' | 'circle' | 'speech-bubble' | 'heart'

export default function SendMessagePage() {
  const [users, setUsers] = useState<UserWithDept[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [currentUser, setCurrentUser] = useState<UserWithDept | null>(null)
  const [message, setMessage] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('enkou')
  const [selectedShape, setSelectedShape] = useState<CardShape>('square')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    loadUsers()
    checkCurrentUser()
  }, [])

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUser({
        id: user.id,
        email: user.email || '',
        user_metadata: user.user_metadata || {},
        department: user.user_metadata?.department || '未分類',
        avatar_url: user.user_metadata?.avatar_url || '',
      })
    }
  }

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/get-users')
      if (!response.ok) {
        throw new Error('ユーザーリストの取得に失敗しました')
      }

      const data = await response.json()
      const formattedUsers = data.users.map((u: {
        id: string
        email: string
        user_metadata: { display_name?: string; department?: string }
      }) => ({
        id: u.id,
        email: u.email || '',
        user_metadata: u.user_metadata || {},
        department: u.user_metadata?.department || '未分類',
      }))
      
      formattedUsers.sort((a: UserWithDept, b: UserWithDept) => {
        const aIndex = DEPARTMENT_ORDER.indexOf(a.department || '未分類')
        const bIndex = DEPARTMENT_ORDER.indexOf(b.department || '未分類')
        const aOrder = aIndex === -1 ? 999 : aIndex
        const bOrder = bIndex === -1 ? 999 : bIndex
        
        if (aOrder !== bOrder) return aOrder - bOrder
        return (a.user_metadata?.display_name || '').localeCompare(b.user_metadata?.display_name || '')
      })
      
      setUsers(formattedUsers)
    } catch (error) {
      console.error('Error loading users:', error)
      alert('ユーザーリストの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const departments = Array.from(
    new Set(users.map(u => u.department || '未分類'))
  ).sort((a, b) => {
    const aIndex = DEPARTMENT_ORDER.indexOf(a)
    const bIndex = DEPARTMENT_ORDER.indexOf(b)
    const aOrder = aIndex === -1 ? 999 : aIndex
    const bOrder = bIndex === -1 ? 999 : bIndex
    return aOrder - bOrder
  })

  const roles = [
    { value: 'executive', label: '役員' },
    { value: 'vice_director', label: '副局長' },
    { value: 'section_chief', label: '部門長' },
  ]

  const filteredUsers = users.filter(user => {
    const displayName = user.user_metadata?.display_name || ''
    
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment
    const matchesRole = !selectedRole || user.user_metadata?.role === selectedRole
    const matchesSearch = !searchQuery || displayName.includes(searchQuery)
    
    return matchesDepartment && matchesRole && matchesSearch
  })

  const availableStyles = CARD_STYLES.filter(style => {
    if (!style.departments && !style.roles) return true
    if (style.departments && style.departments.includes(currentUser?.department || '')) return true
    if (style.roles && style.roles.includes(currentUser?.user_metadata?.role || '')) return true
    return false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId) {
      alert('送信先を選択してください')
      return
    }

    if (!currentUser?.id) {
      alert('ログインユーザー情報が取得できません')
      return
    }

    if (!currentUser?.user_metadata?.display_name) {
      alert('表示名が設定されていません')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('messages').insert({
        recipient_id: selectedUserId,
        sender_id: currentUser.id,
        sender_name: currentUser.user_metadata.display_name,
        sender_avatar_url: currentUser.user_metadata.avatar_url || '',
        message: message,
        card_style: selectedStyle,
        card_shape: selectedShape,
      })

      if (error) throw error
      setSubmitted(true)
      setMessage('')
      setSelectedStyle('enkou')
      setSelectedShape('square')
      setSelectedUserId('')
      setSelectedDepartment('')
      setSelectedRole('')
      setSearchQuery('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'エラーが発生しました'
      alert('エラーが発生しました: ' + errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            メッセージを送信しました！
          </h2>
          <p className="text-gray-600 mb-6">
            素敵なメッセージをありがとうございます。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setSubmitted(false)}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              もう一度送る
            </button>
            <Link
              href="/messages"
              className="block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition text-center"
            >
              メッセージを確認
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">メッセージを送る</h1>
          <Link
            href="/messages"
            className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-600 transition font-medium"
          >
            確認
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {loading ? (
            <div className="text-center text-gray-600">読み込み中...</div>
          ) : (
            <div className="space-y-6">
              {/* 所属で絞り込み */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属で絞り込み
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value)
                    setSelectedUserId('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">すべて</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* 役職で絞り込み */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  役職で絞り込み
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value)
                    setSelectedUserId('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">すべて</option>
                  {roles.map(role => (
                    <option key={role.value} value={role.value}>{role.label}</option>
                  ))}
                </select>
              </div>

              {/* 名前で検索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前で検索
                </label>
                <input
                  type="text"
                  placeholder="例: 山田"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedUserId('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              {/* 送信先選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信先を選択 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full px-4 py-3 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    size={Math.min(filteredUsers.length || 1, 8)}
                  >
                    <option value="">-- 選択してください --</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.user_metadata?.display_name || user.email}（{user.department}）
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {filteredUsers.length} 件のユーザーが見つかりました
                </p>
              </div>

              {/* メッセージ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メッセージ <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  maxLength={1000}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
                  placeholder="メッセージを入力してください..."
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {message.length} / 1000
                </p>
              </div>

              {/* カードの形選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  カードの形を選択 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedShape('square')}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedShape === 'square'
                        ? 'border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-2"></div>
                    <p className="text-sm font-medium text-gray-700">正方形</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShape('circle')}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedShape === 'circle'
                        ? 'border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-full aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-full mb-2"></div>
                    <p className="text-sm font-medium text-gray-700">丸型</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShape('speech-bubble')}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedShape === 'speech-bubble'
                        ? 'border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-full h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl mb-2 relative">
                      <div className="absolute -bottom-1 left-4 w-3 h-3 bg-gray-300 transform rotate-45"></div>
                    </div>
                    <p className="text-sm font-medium text-gray-700">吹き出し</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedShape('heart')}
                    className={`p-3 rounded-lg border-2 transition ${
                      selectedShape === 'heart'
                        ? 'border-indigo-600 ring-2 ring-indigo-300 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-400'
                    }`}
                  >
                    <div className="w-full aspect-square flex items-center justify-center mb-2">
                      <svg viewBox="0 0 100 100" className="w-16 h-16">
                        <path
                          d="M50,90 C50,90 10,60 10,35 C10,20 20,10 32.5,10 C40,10 47,15 50,22 C53,15 60,10 67.5,10 C80,10 90,20 90,35 C90,60 50,90 50,90 Z"
                          className="fill-gray-300"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-gray-700">ハート</p>
                  </button>
                </div>
                {selectedShape === 'heart' && (
                  <p className="text-xs text-amber-600 mt-2">
                    💝 ハート型は文字数が多い場合、省略表示されます
                  </p>
                )}
              </div>

              {/* カードデザイン選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  カードデザインを選択 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {availableStyles.map((style) => (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style.id)}
                      className={`p-3 rounded-lg border-2 transition ${
                        selectedStyle === style.id
                          ? 'border-indigo-600 ring-2 ring-indigo-300'
                          : 'border-gray-200 hover:border-indigo-400'
                      }`}
                    >
                      <div
                        className={`h-20 rounded bg-gradient-to-br ${style.bgGradient} mb-2 border ${style.borderColor}`}
                      />
                      <p className="text-sm font-medium text-gray-700">{style.name}</p>
                    </button>
                  ))}
                </div>
                {currentUser?.department && (
                  <p className="text-xs text-indigo-600 mt-2">
                    ✨ {currentUser.department}専用カードが使えます！
                  </p>
                )}
                {currentUser?.user_metadata?.role && (
                  <p className="text-xs text-purple-600 mt-1">
                    👑 役職専用カードが使えます！
                  </p>
                )}
              </div>

              {/* プレビュー */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">プレビュー</p>
                <MessageCardPreview
                  senderName={currentUser?.user_metadata?.display_name || 'あなた'}
                  recipientName={
                    selectedUserId 
                      ? users.find(u => u.id === selectedUserId)?.user_metadata?.display_name || '未選択'
                      : '未選択'
                  }
                  message={message}
                  cardStyle={selectedStyle}
                  cardShape={selectedShape}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !message || !selectedUserId}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {submitting ? '送信中...' : 'メッセージを送信'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageCardPreview({
  senderName,
  recipientName,
  message,
  cardStyle,
  cardShape,
}: {
  senderName: string
  recipientName: string
  message: string
  cardStyle: string
  cardShape: CardShape
}) {
  const style = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0]

  const getShapeClasses = () => {
    switch (cardShape) {
      case 'square':
        return 'aspect-square'
      case 'circle':
        return 'aspect-square rounded-full'
      case 'speech-bubble':
        return 'rounded-3xl relative after:content-[""] after:absolute after:-bottom-3 after:left-8 after:w-6 after:h-6 after:bg-gradient-to-br after:' + style.bgGradient.replace('from-', 'from-') + ' after:transform after:rotate-45'
      case 'heart':
        return 'aspect-square'
      default:
        return ''
    }
  }

  if (cardShape === 'heart') {
    return (
      <div className="flex justify-center">
        <div className="relative w-64 h-64">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <clipPath id="heartClip">
                <path d="M50,90 C50,90 10,60 10,35 C10,20 20,10 32.5,10 C40,10 47,15 50,22 C53,15 60,10 67.5,10 C80,10 90,20 90,35 C90,60 50,90 50,90 Z" />
              </clipPath>
            </defs>
            <rect width="100" height="100" className={`fill-current ${style.bgGradient.includes('from-') ? '' : 'bg-gradient-to-br ' + style.bgGradient}`} clipPath="url(#heartClip)" />
          </svg>
          <div className={`absolute inset-0 p-8 flex flex-col justify-center items-center text-center ${style.textColor}`} style={{ clipPath: "path('M50,90 C50,90 10,60 10,35 C10,20 20,10 32.5,10 C40,10 47,15 50,22 C53,15 60,10 67.5,10 C80,10 90,20 90,35 C90,60 50,90 50,90 Z')" }}>
            <p className="font-bold text-sm mb-2">{senderName}</p>
            <p className="text-xs whitespace-pre-wrap line-clamp-5 leading-tight">
              {message || 'メッセージ...'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} p-6 ${style.textColor} ${getShapeClasses()} flex flex-col overflow-hidden`}
    >
      <div className="mb-3">
        <p className="font-semibold text-base">{senderName || 'お名前'}</p>
        <p className="text-xs opacity-70">→ {recipientName}</p>
      </div>

      <div className="flex-1 flex items-center bg-white/20 backdrop-blur-sm rounded-lg p-3">
        <p className="whitespace-pre-wrap leading-relaxed text-sm">
          {message || 'メッセージがここに表示されます...'}
        </p>
      </div>
    </div>
  )
}
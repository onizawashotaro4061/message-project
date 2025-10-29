'use client'

import { useState, useEffect } from 'react'
import { supabase, CARD_STYLES, User } from '@/lib/supabase'
import Link from 'next/link'
import Image from 'next/image'

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

type CardShape = 'square' | 'circle' | 'speech-bubble' | 'octagon'

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
        card_shape: 'square',  // 固定
      })

      if (error) throw error
      setSubmitted(true)
      setMessage('')
      setSelectedStyle('enkou')
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
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            ← 戻る
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {loading ? (
            <div className="text-center py-8 text-gray-600">読み込み中...</div>
          ) : (
            <div className="space-y-6">
              {/* 送信先選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信先 <span className="text-red-500">*</span>
                </label>
                
                {/* フィルター */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">すべての所属</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>

                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  >
                    <option value="">すべての役職</option>
                    {roles.map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="名前で検索..."
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                  />
                </div>

                {/* ユーザーリスト */}
                <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <p className="p-4 text-gray-500 text-center">該当するユーザーがいません</p>
                  ) : (
                    filteredUsers.map((user) => (
                      <label
                        key={user.id}
                        className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 ${
                          selectedUserId === user.id ? 'bg-indigo-50' : ''
                        }`}
                      >
                        <input
                          type="radio"
                          name="recipient"
                          value={user.id}
                          checked={selectedUserId === user.id}
                          onChange={(e) => setSelectedUserId(e.target.value)}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {user.user_metadata?.display_name || user.email}
                          </p>
                          <p className="text-sm text-gray-500">{user.department}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
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
                      {style.hasBackgroundImage ? (
  <div className="relative h-20 rounded mb-2 border overflow-hidden">
    <Image
      src={style.backgroundImage || ''}
      alt={style.name}
      fill
      className="object-cover"
    />
  </div>
) : (
  <div
    className={`h-20 rounded bg-gradient-to-br ${style.bgGradient} mb-2 border ${style.borderColor}`}
  />
)}
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
                  message={message}
                  cardStyle={selectedStyle}
                  cardShape="square"  // 固定
                  senderAvatarUrl={currentUser?.avatar_url}
                  senderDepartment={currentUser?.department}
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
  message,
  cardStyle,
  cardShape,
  senderAvatarUrl,
  senderDepartment,
}: {
  senderName: string
  message: string
  cardStyle: string
  cardShape: CardShape
  senderAvatarUrl?: string
  senderDepartment?: string
}) {
  const style = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0]


  // グラデーションかどうかを判定
  const hasGradient = style.bgGradient.includes('from-')

  if (style.hasBackgroundImage) {
  return (
    <div className="flex justify-center">
      <div className="relative rounded-2xl overflow-hidden shadow-lg w-full max-w-sm"
        style={{
  backgroundImage: `url(${style.backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}}
      >
        {/* 半透明オーバーレイ */}
        {/* <div className={`absolute inset-0 ${hasGradient ? 'bg-gradient-to-br ' : ''}${style.bgGradient} opacity-70`}></div> */}
        {/* コンテンツ */}
        <div className={`relative p-5 ${style.textColor}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/60 shadow-md">
                {senderAvatarUrl ? (
                  <Image
                    src={senderAvatarUrl}
                    alt={senderName}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl">👤</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-base drop-shadow-lg">{senderName || 'あなた'}</p>
                  {senderDepartment && (
                    <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                      {senderDepartment}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 drop-shadow">
                  プレビュー
                </p>
              </div>
            </div>
            <div className="rounded-xl p-4">
              <p className="whitespace-pre-wrap leading-relaxed text-sm drop-shadow">
                {message || 'メッセージがここに表示されます...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center">
      <div
        className={`${hasGradient ? 'bg-gradient-to-br ' : ''}${style.bgGradient} border-2 ${style.borderColor} ${style.textColor} w-full max-w-sm rounded-3xl shadow-lg hover:shadow-2xl`}      >
        {cardShape === 'speech-bubble' && ( 

          <div
            className={`absolute -bottom-3 left-6 w-5 h-5 border-l-2 border-b-2 ${style.borderColor} transform rotate-315`}
            style={{
              background: `linear-gradient(to bottom right, var(--tw-gradient-stops))`,
              backgroundImage: style.bgGradient.includes('bg-[')
                ? `linear-gradient(to bottom right, ${style.bgGradient.match(/bg-\[(#[^\]]+)\]/)?.[1]}, ${style.bgGradient.match(/bg-\[(#[^\]]+)\]/)?.[1]})`
                : undefined
            }}
          />
        )}
        <div className="flex gap-3 mb-3 items-center justify-center px-5 pt-5">
          {/* アイコン画像 */}
          <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            {senderAvatarUrl ? (
              <Image
                src={senderAvatarUrl}
                alt={senderName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl">👤</div>
            )}
          </div>
          
          {/* 送信者情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-base">{senderName || 'あなた'}</p>
              {senderDepartment && (
                <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                  {senderDepartment}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80">
              プレビュー
            </p>
          </div>
        </div>

        <div className={`rounded-xl px-5 pb-5 ${cardShape === 'circle' ? 'flex-1 flex items-center justify-center' : ''}`}>
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message || 'メッセージがここに表示されます...'}
          </p>
        </div>
      </div>
    </div>
  )
}



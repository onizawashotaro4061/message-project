'use client'

import { useEffect, useState } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MessageWithRecipient = Message & {
  recipient_name?: string
  recipient_avatar_url?: string
  recipient_department?: string
  recipient_role?: string
  sender_avatar_url?: string
  sender_name?: string
}

type CurrentUser = {
  id: string
  email: string
  user_metadata: {
    display_name?: string
    department?: string
    role?: string
    avatar_url?: string
  }
  department: string
  avatar_url: string
}

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

export default function SentMessagesPage() {
  const [messages, setMessages] = useState<MessageWithRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<MessageWithRecipient | null>(null)
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date')
  const router = useRouter()

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      loadSentMessages(user.id)
    }
    
    checkUserAndLoad()
  }, [router])

  const loadSentMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // 受信者の名前、アバター、所属、役職を取得
      const messagesWithRecipients = await Promise.all(
        (data || []).map(async (msg) => {
          const response = await fetch('/api/get-user-by-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: msg.recipient_id })
          })

          if (response.ok) {
            const userData = await response.json()
            return {
              ...msg,
              recipient_name: userData.user?.user_metadata?.display_name || userData.user?.email || '不明',
              recipient_avatar_url: userData.user?.user_metadata?.avatar_url || null,
              recipient_department: userData.user?.user_metadata?.department || '未分類',
              recipient_role: userData.user?.user_metadata?.role || null
            }
          }

          return {
            ...msg,
            recipient_name: '不明',
            recipient_avatar_url: null,
            recipient_department: '未分類',
            recipient_role: null
          }
        })
      )

      setMessages(messagesWithRecipients)
    } catch (error) {
      console.error('Error loading sent messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('このメッセージを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.filter(m => m.id !== messageId))
      alert('メッセージを削除しました')
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('削除に失敗しました')
    }
  }

  // フィルタリングと並び替え
  const departments = Array.from(
    new Set(messages.map(m => m.recipient_department || '未分類'))
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

  const filteredAndSortedMessages = messages
    .filter(msg => {
      const matchesDepartment = !selectedDepartment || msg.recipient_department === selectedDepartment
      const matchesRole = !selectedRole || msg.recipient_role === selectedRole
      const matchesSearch = !searchQuery || (msg.recipient_name || '').includes(searchQuery)

      return matchesDepartment && matchesRole && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.recipient_name || '').localeCompare(b.recipient_name || '')
      } else {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-gray-600 text-lg">読み込み中...</div>
      </div>
    )
  }

  if (editingMessage) {
    return (
      <EditMessageForm
        message={editingMessage}
        onCancel={() => setEditingMessage(null)}
        onSave={(updatedMessage) => {
          setMessages(messages.map(m => m.id === updatedMessage.id ? updatedMessage : m))
          setEditingMessage(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">送信済みメッセージ</h1>
            <div className="space-x-2">
              <Link
                href="/messages"
                className="inline-block px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                受信メッセージ
              </Link>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📤</div>
            <p className="text-gray-600 text-lg font-semibold">
              送信済みメッセージがありません
            </p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              誰かにメッセージを送ってみましょう！
            </p>
            <Link
              href="/send"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              メッセージを送る
            </Link>
          </div>
        ) : (
          <>
            {/* フィルターと並び替え */}
            <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                  placeholder="送信先を検索..."
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'name')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                >
                  <option value="date">送信日時順</option>
                  <option value="name">送信先名順</option>
                </select>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  {filteredAndSortedMessages.length} 件 / {messages.length} 件
                </p>
                {(selectedDepartment || selectedRole || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedDepartment('')
                      setSelectedRole('')
                      setSearchQuery('')
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    フィルターをクリア
                  </button>
                )}
              </div>
            </div>

            {/* メッセージリスト */}
            <div className="space-y-4">
              {filteredAndSortedMessages.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <p className="text-gray-600 text-lg font-semibold">
                    条件に一致するメッセージがありません
                  </p>
                  <button
                    onClick={() => {
                      setSelectedDepartment('')
                      setSelectedRole('')
                      setSearchQuery('')
                    }}
                    className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
                  >
                    フィルターをクリア
                  </button>
                </div>
              ) : (
                filteredAndSortedMessages.map((msg) => (
                  <SentMessageCard
                    key={msg.id}
                    message={msg}
                    onEdit={() => setEditingMessage(msg)}
                    onDelete={() => handleDelete(msg.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SentMessageCard({
  message,
  onEdit,
  onDelete,
}: {
  message: MessageWithRecipient
  onEdit: () => void
  onDelete: () => void
}) {
  const style = CARD_STYLES.find((s) => s.id === message.card_style) || CARD_STYLES[0]

  if (style.hasBackgroundImage) {
    return (
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
        style={{
          backgroundImage: `url(${style.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className={`relative p-6 md:p-8 ${style.textColor}`}>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/60 shadow-md">
                {message.sender_avatar_url ? (
                  <img
                    src={message.sender_avatar_url}
                    alt={message.sender_name || '送信者'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xl">👤</div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-lg drop-shadow-lg">送信先: {message.recipient_name || '不明'}</p>
                  {message.recipient_department && (
                    <span className="px-2 py-0.5 bg-white/30 rounded text-xs font-medium">
                      {message.recipient_department}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 drop-shadow">
                  {new Date(message.created_at).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onEdit}
                className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition shadow-md"
              >
                編集
              </button>
              <button
                onClick={onDelete}
                className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition shadow-md"
              >
                削除
              </button>
            </div>
          </div>

          <p className="whitespace-pre-wrap leading-relaxed line-clamp-3 drop-shadow">
            {message.message}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition ${style.textColor}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start gap-3 flex-1">
          {/* 送信者のアイコン（sender_avatar_url を使用） */}
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/50">
            {message.sender_avatar_url ? (
              <img
                src={message.sender_avatar_url}
                alt={message.sender_name || '送信者'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-xl">👤</div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-lg">送信先: {message.recipient_name || '不明'}</p>
              {message.recipient_department && (
                <span className="px-2 py-0.5 bg-white/30 rounded text-xs font-medium">
                  {message.recipient_department}
                </span>
              )}
            </div>
            <p className="text-xs opacity-70">
              {new Date(message.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
          >
            削除
          </button>
        </div>
      </div>

      <p className="whitespace-pre-wrap leading-relaxed line-clamp-3">
        {message.message}
      </p>
    </div>
  )
}

function EditMessageForm({
  message,
  onCancel,
  onSave,
}: {
  message: MessageWithRecipient
  onCancel: () => void
  onSave: (message: MessageWithRecipient) => void
}) {
  const [messageText, setMessageText] = useState(message.message)
  const [selectedStyle, setSelectedStyle] = useState(message.card_style)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const loadCurrentUser = async () => {
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
    loadCurrentUser()
  }, [])

  const availableStyles = CARD_STYLES.filter(style => {
    if (!style.departments && !style.roles) return true
    if (style.departments && style.departments.includes(currentUser?.department || '')) return true
    if (style.roles && style.roles.includes(currentUser?.user_metadata?.role || '')) return true
    return false
  })

  const handleSave = async () => {
    if (!messageText.trim()) {
      alert('メッセージを入力してください')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          message: messageText,
          card_style: selectedStyle,
        })
        .eq('id', message.id)

      if (error) throw error

      onSave({
        ...message,
        message: messageText,
        card_style: selectedStyle,
      })
      alert('メッセージを更新しました')
    } catch (error) {
      alert('更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">メッセージを編集</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側: 編集エリア */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    メッセージ <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-xs font-medium ${messageText.length > 1000 ? 'text-red-600' : 'text-gray-500'}`}>
                    {messageText.length} / 1000
                  </span>
                </div>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  maxLength={1000}
                  rows={10}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
                  placeholder="メッセージを入力してください..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  カードデザイン <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
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
                          <img
                            src={style.backgroundImage}
                            alt={style.name}
                            className="absolute inset-0 w-full h-full object-cover"
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
                    ✨ {currentUser.department}専用カードが使えます
                  </p>
                )}
                {currentUser?.user_metadata?.role && (
                  <p className="text-xs text-purple-600 mt-1">
                    👑 役職専用カードが使えます
                  </p>
                )}
              </div>
            </div>

            {/* 右側: プレビューエリア */}
            <div className="lg:sticky lg:top-8 lg:self-start">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                プレビュー
              </label>
              <MessagePreview
                senderName={currentUser?.user_metadata?.display_name || message.sender_name || 'あなた'}
                recipientName={message.recipient_name || '受信者'}
                message={messageText}
                cardStyle={selectedStyle}
                senderAvatarUrl={currentUser?.avatar_url}
                senderDepartment={currentUser?.department}
              />
            </div>
          </div>

          <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={loading || !messageText.trim()}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
            >
              {loading ? '保存中...' : '変更を保存'}
            </button>
            <button
              onClick={onCancel}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MessagePreview({
  senderName,
  recipientName,
  message,
  cardStyle,
  senderAvatarUrl,
  senderDepartment,
}: {
  senderName: string
  recipientName: string
  message: string
  cardStyle: string
  senderAvatarUrl?: string
  senderDepartment?: string
}) {
  const style = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0]
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
          <div className={`relative p-5 ${style.textColor}`}>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/60 shadow-md">
                {senderAvatarUrl ? (
                  <img
                    src={senderAvatarUrl}
                    alt={senderName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-2xl">👤</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className="font-bold text-base drop-shadow-lg">{senderName}</p>
                  {senderDepartment && (
                    <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                      {senderDepartment}
                    </span>
                  )}
                </div>
                <p className="text-xs opacity-90 drop-shadow">
                  To: {recipientName}
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
        className={`${hasGradient ? 'bg-gradient-to-br ' : ''}${style.bgGradient} border-2 ${style.borderColor} ${style.textColor} w-full max-w-sm rounded-3xl shadow-lg hover:shadow-2xl transition-shadow`}
      >
        <div className="flex gap-3 mb-3 items-center justify-center px-5 pt-5">
          <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
            {senderAvatarUrl ? (
              <img
                src={senderAvatarUrl}
                alt={senderName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-2xl">👤</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-base">{senderName}</p>
              {senderDepartment && (
                <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                  {senderDepartment}
                </span>
              )}
            </div>
            <p className="text-xs opacity-80">
              To: {recipientName}
            </p>
          </div>
        </div>

        <div className="rounded-xl px-5 pb-5">
          <p className="whitespace-pre-wrap leading-relaxed text-sm">
            {message || 'メッセージがここに表示されます...'}
          </p>
        </div>
      </div>
    </div>
  )
}
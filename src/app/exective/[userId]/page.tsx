'use client'

import { useState, useEffect } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function ExecutiveMessagePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [userName, setUserName] = useState('')

  useEffect(() => {
    // URLからパスワードを取得
    const searchParams = new URLSearchParams(window.location.search)
    const password = searchParams.get('password')

    if (password) {
      setAuthenticated(true)
      loadMessages()
      loadUserName()
    }
  }, [])

  const loadUserName = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId)
      if (!error && user) {
        setUserName(user.user_metadata?.display_name || user.email || '')
      }
    } catch (error) {
      console.error('Error loading user:', error)
    }
  }

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            ご確認ください
          </h1>
          <p className="text-gray-600 mb-6">
            無効なアクセスです
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            ホームに戻る
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-gray-600 text-lg">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎉 {userName}さんへ
          </h1>
          <p className="text-gray-600 text-lg">
            みんなからのメッセージです
          </p>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg font-semibold">
              メッセージはまだありません
            </p>
            <p className="text-gray-500 text-sm mt-2">
              メッセージが届くまでお待ちください...
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 mb-4">
              {messages.length} 件のメッセージ
            </div>
            {messages.map((message) => (
              <MessageCard key={message.id} message={message} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageCard({ message }: { message: Message }) {
  const style =
    CARD_STYLES.find((s) => s.id === message.card_style) || CARD_STYLES[0]

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition ${style.textColor}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {message.sender_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-lg">{message.sender_name}</p>
            <p className="text-xs opacity-70">
              {new Date(message.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </div>

      {message.image_url && (
        <div className="mb-4 rounded-lg overflow-hidden">
          <img
            src={message.image_url}
            alt="Message"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      <p className="whitespace-pre-wrap leading-relaxed">
        {message.message}
      </p>
    </div>
  )
}
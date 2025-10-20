'use client'

import { useEffect, useState } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MessageWithSender = Message & {
  sender_avatar_url?: string
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      loadMessages(user.id)
    }
    
    checkUser()
  }, [router])

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // 送信者のアバターURLを取得
      const messagesWithAvatars = await Promise.all(
        (data || []).map(async (msg) => {
          const response = await fetch('/api/get-user-by-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: msg.sender_id })
          })
          
          if (response.ok) {
            const userData = await response.json()
            return {
              ...msg,
              sender_avatar_url: userData.user?.user_metadata?.avatar_url || null
            }
          }
          
          return { ...msg, sender_avatar_url: null }
        })
      )
      
      setMessages(messagesWithAvatars)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 transition"
                title="ホームへ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h1 className="text-3xl font-bold text-gray-800">あなたへのメッセージ</h1>
            </div>
            <div className="space-x-2">
              <Link
                href="/send"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                メッセージを送る
              </Link>
              <Link
                href="/sent"
                className="inline-block px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                送信済み
              </Link>
              <Link
                href="/profile"
                className="inline-block px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                プロフィール
              </Link>
              <Link
                href="/change-password"
                className="inline-block px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                パスワード変更
              </Link>
              <button
                onClick={handleLogout}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg font-semibold">
              まだメッセージがありません
            </p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              友達がメッセージを送るのを待ちましょう！
            </p>
            <Link
              href="/send"
              className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold"
            >
              メッセージを送る
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm font-semibold text-gray-700 mb-4">
              {messages.length} 件のメッセージ
            </div>
            {messages.map((msg) => (
              <MessageCard key={msg.id} messageData={msg} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MessageCard({ messageData }: { messageData: MessageWithSender }) {
  const style =
    CARD_STYLES.find((s) => s.id === messageData.card_style) || CARD_STYLES[0]

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition ${style.textColor}`}
    >
      <div className="flex items-start gap-4 mb-4">
        {/* アイコン画像 */}
        <div className="w-12 h-12 rounded-full bg-white/30 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/50">
          {messageData.sender_avatar_url ? (
            <img
              src={messageData.sender_avatar_url}
              alt={messageData.sender_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl">👤</div>
          )}
        </div>
        
        {/* 送信者情報 */}
        <div className="flex-1">
          <p className="font-semibold text-lg">{messageData.sender_name}</p>
          <p className="text-xs opacity-70">
            {new Date(messageData.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
      </div>

      <p className="whitespace-pre-wrap leading-relaxed">
        {messageData.message}
      </p>
    </div>
  )
}
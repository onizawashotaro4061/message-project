'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MessageWithSender = Message & {
  sender_avatar_url?: string
  sender_department?: string
  card_shape?: 'rectangle' | 'square' | 'circle' | 'speech-bubble' | 'octagon'
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

  // useMemoで自動的にソート（依存配列問題を解決）
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }, [messages])

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)

      if (error) throw error

      if (!data || data.length === 0) {
        setMessages([])
        setLoading(false)
        return
      }

      // ユニークなsender_idのリストを作成
      const uniqueSenderIds = [...new Set(data.map(msg => msg.sender_id))]

      // バッチAPIで一度に全ユーザー情報を取得
      const response = await fetch('/api/get-users-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: uniqueSenderIds })
      })

      let usersMap: Record<string, any> = {}

      if (response.ok) {
        const responseData = await response.json()
        usersMap = responseData.users || {}
      }

      // メッセージにユーザー情報をマッピング
      const messagesWithSenderInfo = data.map((msg) => {
        const senderInfo = usersMap[msg.sender_id]
        return {
          ...msg,
          sender_avatar_url: senderInfo?.user_metadata?.avatar_url || null,
          sender_department: senderInfo?.user_metadata?.department || '未分類',
          card_shape: msg.card_shape || 'square'
        }
      })

      setMessages(messagesWithSenderInfo)
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
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6 no-print">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-800 transition p-2 hover:bg-gray-100 rounded-lg"
                title="ホームへ"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">For you</h1>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Link
                href="/send"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium text-sm"
              >
                メッセージを送る
              </Link>
              <Link
                href="/sent"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-sm"
              >
                送信済み
              </Link>
              <Link
                href="/profile"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
              >
                プロフィール
              </Link>
              <Link
                href="/change-password"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm"
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

        {/* メッセージ一覧 */}
        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-7xl mb-6">📭</div>
            <p className="text-gray-800 text-xl font-bold mb-2">
              まだメッセージがありません
            </p>
            <p className="text-gray-500 text-base mb-8">
              友達がメッセージを送るのを待ちましょう！
            </p>
            <Link
              href="/send"
              className="inline-block px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold text-lg"
            >
              メッセージを送る
            </Link>
          </div>
        ) : (
          <>
            {/* タイル表示 */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {sortedMessages.map((msg) => (
                <div key={msg.id} className="break-inside-avoid mb-5">
                  <MessageCard messageData={msg} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MessageCard({
  messageData
}: {
  messageData: MessageWithSender
}) {
  const style = CARD_STYLES.find((s) => s.id === messageData.card_style) || CARD_STYLES[0]


  if (style.hasBackgroundImage) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
      style={{
  backgroundImage: `url(${style.backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat'
}}
    >
      {/* 半透明オーバーレイ */}
      <div className={`absolute inset-0 ${style.bgGradient} opacity-0`}></div>
      {/* コンテンツ */}
      <div className={`relative p-5 ${style.textColor}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-md">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-bold text-base drop-shadow-lg">{messageData.sender_name}</p>
              {messageData.sender_department && (
                <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                  {messageData.sender_department}
                </span>
              )}
            </div>
            <p className="text-xs opacity-90 drop-shadow">
              {new Date(messageData.created_at).toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <div className="rounded-xl p-4">
          <p className="whitespace-pre-wrap leading-relaxed text-sm drop-shadow">
            {messageData.message}
          </p>
        </div>
      </div>
    </div>
  )
}
  return (
    <div className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} transition-all duration-300 ${style.textColor} rounded-2xl shadow-lg hover:shadow-2xl`}>
      <div className="flex gap-3 mb-3 items-center justify-center px-5 pt-5">
        {/* アイコン画像 */}
        <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
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
        <div className={`flex-1 min-w-0`}>
          <div className={`flex items-center gap-2 mb-1 flex-wrap`}>
            <p className="font-bold text-base">{messageData.sender_name}</p>
            {messageData.sender_department && (
              <span className="px-1.5 py-0.5 bg-white/30 rounded text-xs font-medium whitespace-nowrap">
                {messageData.sender_department}
              </span>
            )}
          </div>
          <p className="text-xs opacity-80">
            {new Date(messageData.created_at).toLocaleString('ja-JP', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
      </div>

      <div className="rounded-xl px-5 pb-5">
        <p className="whitespace-pre-wrap leading-relaxed text-sm">
          {messageData.message}
        </p>
      </div>
    </div>
  )
}
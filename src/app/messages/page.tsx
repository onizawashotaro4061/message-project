'use client'

import { useEffect, useState } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MessageWithSender = Message & {
  sender_avatar_url?: string
  sender_department?: string
  card_shape?: 'rectangle' | 'square' | 'circle' | 'speech-bubble' | 'octagon'
}

type SortType = 'latest'

// 所属の順序（削除可能ですが、念のため残しておきます）
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

export default function MessagesPage() {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [sortedMessages, setSortedMessages] = useState<MessageWithSender[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null)
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

  useEffect(() => {
    sortMessages()
  }, [messages])

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)

      if (error) throw error
      
      const messagesWithSenderInfo = await Promise.all(
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
              sender_avatar_url: userData.user?.user_metadata?.avatar_url || null,
              sender_department: userData.user?.user_metadata?.department || '未分類',
              card_shape: msg.card_shape || 'square'
            }
          }
          
          return { 
            ...msg, 
            sender_avatar_url: null,
            sender_department: '未分類',
            card_shape: 'square' as const
          }
        })
      )
      
      setMessages(messagesWithSenderInfo)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const sortMessages = () => {
    const sorted = [...messages]
    sorted.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    setSortedMessages(sorted)
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            {/* コントロールバー（メッセージ件数のみ） */}
            <div className="bg-white rounded-lg px-4 py-3 shadow-sm mb-5">
              <p className="text-sm font-semibold text-gray-700">
                {messages.length} 件のメッセージ
              </p>
            </div>

            {/* タイル表示 */}
            <div className="columns-1 md:columns-2 lg:columns-3 gap-5">
              {sortedMessages.map((msg) => (
                <div key={msg.id} className="break-inside-avoid mb-5">
                  <MessageCard 
                    messageData={msg}
                    isExpanded={expandedMessageId === msg.id}
                    onToggleExpand={() => setExpandedMessageId(expandedMessageId === msg.id ? null : msg.id)}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* モーダル（ハート型展開用） */}
      {expandedMessageId && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setExpandedMessageId(null)}
        >
          <div 
            className="bg-white rounded-2xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <ExpandedMessageModal 
              messageData={sortedMessages.find(m => m.id === expandedMessageId)!}
              onClose={() => setExpandedMessageId(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function MessageCard({ 
  messageData, 
  isExpanded,
  onToggleExpand 
}: { 
  messageData: MessageWithSender
  isExpanded: boolean
  onToggleExpand: () => void
}) {
  const style = CARD_STYLES.find((s) => s.id === messageData.card_style) || CARD_STYLES[0]
  const shape = messageData.card_shape || 'square'


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
      <div className={`absolute inset-0 ${style.bgGradient} opacity-70`}></div>
      {/* コンテンツ */}
      <div className={`relative p-5 ${style.textColor}`}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-white/40 flex items-center justify-center overflow-hidden flex-shrink-0 border-2 border-white/60 shadow-md">
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

function ExpandedMessageModal({ 
  messageData, 
  onClose 
}: { 
  messageData: MessageWithSender
  onClose: () => void
}) {
  const style = CARD_STYLES.find((s) => s.id === messageData.card_style) || CARD_STYLES[0]

  return (
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
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
          <div>
            <div className="flex items-center gap-2">
              <p className="font-bold text-xl text-gray-900">{messageData.sender_name}</p>
              {messageData.sender_department && (
                <span className="px-2 py-1 bg-gray-200 rounded text-xs font-medium text-gray-700">
                  {messageData.sender_department}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500">
              {new Date(messageData.created_at).toLocaleString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className={`bg-gradient-to-br ${style.bgGradient} ${style.textColor} rounded-2xl p-6 border-2 ${style.borderColor}`}>
        <p className="whitespace-pre-wrap leading-relaxed text-base">
          {messageData.message}
        </p>
      </div>
    </div>
  )
}
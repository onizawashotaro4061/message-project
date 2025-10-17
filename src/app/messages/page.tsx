'use client'

import { useEffect, useState } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { User } from '@supabase/supabase-js';

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    loadMessages(user.id)
  }

  const loadMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setMessages(data || [])
    } catch (error: unknown) { // any の代わりに unknown を使う
  // error が本当にErrorオブジェクトか確認してからプロパティにアクセスする
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error('An unknown error occurred');
  }
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
            <h1 className="text-3xl font-bold text-gray-800">あなたへのメッセージ</h1>
            <div className="space-x-2">
              <Link
                href="/send"
                className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
              >
                メッセージを送る
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
          <Image
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
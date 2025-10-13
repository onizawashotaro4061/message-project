'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'

export default function SendMessagePage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.userId as string

  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          recipient_id: userId,
          sender_name: senderName,
          message: message,
        })

      if (error) throw error

      setSubmitted(true)
      setSenderName('')
      setMessage('')
    } catch (error: any) {
      alert('エラーが発生しました: ' + error.message)
    } finally {
      setLoading(false)
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
            あなたの温かいメッセージが届きました。
          </p>
          <button
            onClick={() => setSubmitted(false)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            もう一度送る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💌</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            メッセージを送る
          </h1>
          <p className="text-gray-600">
            心のこもったメッセージを書いてください
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              あなたのお名前
            </label>
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="山田太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              maxLength={1000}
              rows={8}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              placeholder="メッセージを入力してください..."
            />
            <p className="text-xs text-gray-500 mt-1 text-right">
              {message.length} / 1000
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
          >
            {loading ? '送信中...' : 'メッセージを送信'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-xs text-yellow-800">
            💡 このメッセージは受け取り手のみが閲覧できます。他の人には見えません。
          </p>
        </div>
      </div>
    </div>
  )
}
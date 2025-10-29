'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const checkUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      router.push('/messages')
    }
  }, [router])

  useEffect(() => {
    checkUser()
  }, [checkUser])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      router.push('/messages')
    } catch {
      setMessage('❌ メールアドレスまたはパスワードが正しくありません')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">寄せ書き</h1>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        {message && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
            {message}
          </div>
        )}

        <div className="mt-6">
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4 mb-4">
            <div className="flex items-start gap-2 mb-2">
              <div className="text-2xl">🔑</div>
              <div className="flex-1">
                <p className="text-sm font-bold text-blue-900 mb-2">
                  役職者向け初回ログイン情報
                </p>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>📧 メールアドレス：明治メールを使用</p>
                  <p className="font-semibold mt-3">🔐 初回仮パスワード：</p>
                  <div className="ml-4 space-y-1">
                    <p>• 役員：<code className="bg-blue-100 px-2 py-1 rounded font-mono font-bold text-blue-900">meiji2024</code></p>
                    <p>• 副局長・部門長：<code className="bg-blue-100 px-2 py-1 rounded font-mono font-bold text-blue-900">Meidaisai141</code></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="text-center">
            <Link href="/signup" className="text-sm text-indigo-600 hover:underline font-medium">
              アカウントをお持ちでない方は新規登録
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
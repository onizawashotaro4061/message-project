'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

const DEPARTMENTS = [
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

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [department, setDepartment] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const router = useRouter()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // ファイルサイズチェック（5MB以上は拒否）
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください')
        return
      }

      try {
        // 画像を圧縮（最大200KB、最大幅512px）
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 512,
          useWebWorker: true,
          initialQuality: 0.8,
        }
        const compressedFile = await imageCompression(file, options)
        
        setAvatarFile(compressedFile)
        const reader = new FileReader()
        reader.onload = (e) => {
          setAvatarPreview(e.target?.result as string)
        }
        reader.readAsDataURL(compressedFile)
      } catch (error) {
        console.error('画像の圧縮に失敗しました:', error)
        alert('画像の処理に失敗しました')
      }
    }
  }

  const uploadAvatar = async (userId: string): Promise<string | null> => {
    if (!avatarFile) return null
    
    try {
      const fileName = `${userId}-${Date.now()}`
      const { error } = await supabase.storage
        .from('avatars')
        .upload(`public/${fileName}`, avatarFile)
      
      if (error) throw error
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(`public/${fileName}`)
      
      return publicUrl
    } catch (error) {
      console.error('アイコンアップロードエラー:', error)
      return null
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // バリデーション
    if (password !== confirmPassword) {
      setMessage('パスワードが一致しません')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage('パスワードは6文字以上で設定してください')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (!displayName.trim()) {
      setMessage('お名前を入力してください')
      setMessageType('error')
      setLoading(false)
      return
    }

    if (!department) {
      setMessage('所属を選択してください')
      setMessageType('error')
      setLoading(false)
      return
    }

    try {
      // まずアカウントを作成
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName.trim(),
            department: department,
          },
        },
      })

      if (signUpError) throw signUpError
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // アイコンがある場合はアップロード
      let avatarUrl = null
      if (avatarFile) {
        avatarUrl = await uploadAvatar(authData.user.id)
        
        // avatar_urlをuser_metadataに追加
        if (avatarUrl) {
          await supabase.auth.updateUser({
            data: {
              display_name: displayName.trim(),
              department: department,
              avatar_url: avatarUrl,
            }
          })
        }
      }

      setMessage('✅ アカウントを作成しました！ログインページに移動します...')
      setMessageType('success')

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アカウント作成に失敗しました'
      setMessage('❌ ' + errorMessage)
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💌</div>
          <h1 className="text-3xl font-bold text-gray-800">新規登録</h1>
          <p className="text-gray-600 text-sm mt-2">寄せ書きアカウントを作成</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {/* アイコン画像 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              アイコン画像（任意）
            </label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="アイコンプレビュー"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl">👤</div>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-input"
                />
                <label
                  htmlFor="avatar-input"
                  className="cursor-pointer inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm"
                >
                  画像を選択
                </label>
                {avatarFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview('')
                    }}
                    className="ml-2 text-sm text-red-600 hover:text-red-800"
                  >
                    削除
                  </button>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  推奨: 正方形の画像（自動で200KB以下に圧縮）
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              maxLength={50}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="山田太郎"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              所属 <span className="text-red-500">*</span>
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">選択してください</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              メールアドレス <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@meiji.ac.jp"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="6文字以上"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              パスワード（確認） <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="もう一度入力"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '登録中...' : 'アカウント作成'}
          </button>
        </form>

        {message && (
          <div className={`mt-4 p-3 rounded-lg text-sm ${
            messageType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-indigo-600 hover:underline">
            すでにアカウントをお持ちの方はログイン
          </Link>
        </div>
      </div>
    </div>
  )
}
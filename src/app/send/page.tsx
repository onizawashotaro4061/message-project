'use client'

import { useState, useEffect } from 'react'
import { supabase, CARD_STYLES, User } from '@/lib/supabase'
import Link from 'next/link'

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
}

export default function SendMessagePage() {
  const [users, setUsers] = useState<UserWithDept[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const [currentUser, setCurrentUser] = useState<UserWithDept | null>(null)
  const [message, setMessage] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('classic')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
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
      
      // 所属順にソート
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

  // 部署一覧を取得
  const departments = Array.from(
    new Set(users.map(u => u.department || '未分類'))
  ).sort((a, b) => {
    const aIndex = DEPARTMENT_ORDER.indexOf(a)
    const bIndex = DEPARTMENT_ORDER.indexOf(b)
    const aOrder = aIndex === -1 ? 999 : aIndex
    const bOrder = bIndex === -1 ? 999 : bIndex
    return aOrder - bOrder
  })

  // フィルタリングされたユーザーを取得
  const filteredUsers = users.filter(user => {
    const displayName = user.user_metadata?.display_name || ''
    
    const matchesDepartment = !selectedDepartment || user.department === selectedDepartment
    const matchesSearch = !searchQuery || displayName.includes(searchQuery)
    
    return matchesDepartment && matchesSearch
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}`
      const { error } = await supabase.storage
        .from('message-images')
        .upload(`public/${fileName}`, imageFile)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage
        .from('message-images')
        .getPublicUrl(`public/${fileName}`)
      return publicUrl
    } catch (error) {
      console.error('Image upload error:', error)
      alert('画像アップロードに失敗しました')
      return null
    }
  }

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
      let imageUrl = null
      if (imageFile) {
        imageUrl = await uploadImage()
      }

      const { error } = await supabase.from('messages').insert({
        recipient_id: selectedUserId,
        sender_id: currentUser.id,
        sender_name: currentUser.user_metadata.display_name,
        message: message,
        image_url: imageUrl,
        card_style: selectedStyle,
      })

      if (error) throw error
      setSubmitted(true)
      setMessage('')
      setSelectedStyle('classic')
      setSelectedUserId('')
      setSelectedDepartment('')
      setSearchQuery('')
      setImageFile(null)
      setImagePreview('')
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
          <h1 className="text-3xl font-bold text-gray-800">💌 メッセージを送る</h1>
          <Link
            href="/messages"
            className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-600 transition font-medium"
          >
            確認
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {loading ? (
            <div className="text-center text-gray-600">読み込み中...</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 所属で絞り込み */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  所属で絞り込み
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => {
                    setSelectedDepartment(e.target.value)
                    setSelectedUserId('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                >
                  <option value="">すべて</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* 名前で検索 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名前で検索
                </label>
                <input
                  type="text"
                  placeholder="例: 山田"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedUserId('')
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
                />
              </div>

              {/* 送信先選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  送信先を選択 <span className="text-red-500">*</span>
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    className="w-full px-4 py-3 focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
                    size={Math.min(filteredUsers.length || 1, 8)}
                  >
                    <option value="">-- 選択してください --</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.user_metadata?.display_name || user.email}（{user.department}）
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {filteredUsers.length} 件のユーザーが見つかりました
                </p>
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

              {/* 画像アップロード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  画像（任意）
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-input"
                  />
                  {imagePreview ? (
                    <div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-48 mx-auto rounded-lg mb-2"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null)
                          setImagePreview('')
                        }}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        削除
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="image-input" className="cursor-pointer">
                      <div className="text-4xl mb-2">🖼️</div>
                      <p className="text-gray-600">クリックして画像を選択</p>
                      <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF など</p>
                    </label>
                  )}
                </div>
              </div>

              {/* カードデザイン選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  カードデザインを選択 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {CARD_STYLES.map((style) => (
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
                      <div
                        className={`h-20 rounded bg-gradient-to-br ${style.bgGradient} mb-2 border ${style.borderColor}`}
                      />
                      <p className="text-sm font-medium text-gray-700">{style.name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* プレビュー */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-3">プレビュー</p>
                <MessageCardPreview
                  senderName={currentUser?.user_metadata?.display_name || 'あなた'}
                  message={message}
                  imagePreview={imagePreview}
                  cardStyle={selectedStyle}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !message || !selectedUserId}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
              >
                {submitting ? '送信中...' : 'メッセージを送信'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function MessageCardPreview({
  senderName,
  message,
  imagePreview,
  cardStyle,
}: {
  senderName: string
  message: string
  imagePreview?: string
  cardStyle: string
}) {
  const style = CARD_STYLES.find((s) => s.id === cardStyle) || CARD_STYLES[0]

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} rounded-xl p-6 ${style.textColor}`}
    >
      <div className="mb-4">
        <p className="font-semibold text-lg">{senderName || 'お名前'}</p>
        <p className="text-xs opacity-70">今</p>
      </div>

      {imagePreview && (
        <div className="mb-4 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full max-h-64 object-cover"
          />
        </div>
      )}

      <p className="whitespace-pre-wrap leading-relaxed text-sm">
        {message || 'メッセージがここに表示されます...'}
      </p>
    </div>
  )
}
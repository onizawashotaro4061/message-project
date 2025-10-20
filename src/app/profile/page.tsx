'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import imageCompression from 'browser-image-compression'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [displayName, setDisplayName] = useState('')
  const [department, setDepartment] = useState('')
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string>('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUserProfile()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/login')
        return
      }

      setUser(user)
      setDisplayName(user.user_metadata?.display_name || '')
      setDepartment(user.user_metadata?.department || '')
      setCurrentAvatarUrl(user.user_metadata?.avatar_url || '')
      setAvatarPreview(user.user_metadata?.avatar_url || '')
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('画像サイズは5MB以下にしてください')
        return
      }

      try {
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

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null
    
    try {
      // 古いアバターを削除
      if (currentAvatarUrl) {
        const oldFileName = currentAvatarUrl.split('/').pop()
        if (oldFileName) {
          await supabase.storage
            .from('avatars')
            .remove([`public/${oldFileName}`])
        }
      }

      // 新しいアバターをアップロード
      const fileName = `${user.id}-${Date.now()}`
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

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      let newAvatarUrl = currentAvatarUrl

      // 新しい画像がある場合はアップロード
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl
        }
      }

      // ユーザー情報を更新
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          department: department,
          avatar_url: newAvatarUrl,
        }
      })

      if (error) throw error

      alert('プロフィールを更新しました！')
      setCurrentAvatarUrl(newAvatarUrl)
      setAvatarFile(null)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('更新に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!confirm('アイコンを削除しますか？')) return

    setSaving(true)
    try {
      // Storageから削除
      if (currentAvatarUrl) {
        const fileName = currentAvatarUrl.split('/').pop()
        if (fileName) {
          await supabase.storage
            .from('avatars')
            .remove([`public/${fileName}`])
        }
      }

      // user_metadataから削除
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: displayName,
          department: department,
          avatar_url: null,
        }
      })

      if (error) throw error

      setCurrentAvatarUrl('')
      setAvatarPreview('')
      setAvatarFile(null)
      alert('アイコンを削除しました')
    } catch (error) {
      console.error('Error removing avatar:', error)
      alert('削除に失敗しました')
    } finally {
      setSaving(false)
    }
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">プロフィール設定</h1>
            <Link
              href="/messages"
              className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-600 transition font-medium"
            >
              メッセージへ
            </Link>
          </div>

          <div className="space-y-6">
            {/* アイコン */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                アイコン画像
              </label>
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-gray-300">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="アイコンプレビュー"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">👤</div>
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
                  <div className="space-y-2">
                    <label
                      htmlFor="avatar-input"
                      className="cursor-pointer inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium"
                    >
                      画像を変更
                    </label>
                    {currentAvatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={saving}
                        className="block text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        アイコンを削除
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    推奨: 正方形の画像（自動で200KB以下に圧縮）
                  </p>
                </div>
              </div>
            </div>

            {/* 表示名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                表示名
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                maxLength={50}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            {/* 所属 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                所属
              </label>
              <input
                type="text"
                value={department}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">所属は変更できません</p>
            </div>

            {/* メールアドレス */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={user?.email || ''}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">メールアドレスは変更できません</p>
            </div>

            {/* 保存ボタン */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {saving ? '保存中...' : '変更を保存'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
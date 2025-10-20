'use client'

import { useEffect, useState } from 'react'
import { supabase, Message, CARD_STYLES } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type MessageWithRecipient = Message & {
  recipient_name?: string
}

export default function SentMessagesPage() {
  const [messages, setMessages] = useState<MessageWithRecipient[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMessage, setEditingMessage] = useState<MessageWithRecipient | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkUserAndLoad = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      loadSentMessages(user.id)
    }
    
    checkUserAndLoad()
  }, [router])

  const loadSentMessages = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      
      // 受信者の名前を取得
      const messagesWithRecipients = await Promise.all(
        (data || []).map(async (msg) => {
          const response = await fetch('/api/get-user-by-id', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: msg.recipient_id })
          })
          
          if (response.ok) {
            const userData = await response.json()
            return {
              ...msg,
              recipient_name: userData.user?.user_metadata?.display_name || userData.user?.email || '不明'
            }
          }
          
          return { ...msg, recipient_name: '不明' }
        })
      )
      
      setMessages(messagesWithRecipients)
    } catch (error) {
      console.error('Error loading sent messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    if (!confirm('このメッセージを削除しますか？')) return

    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)

      if (error) throw error

      setMessages(messages.filter(m => m.id !== messageId))
      alert('メッセージを削除しました')
    } catch (error) {
      console.error('Error deleting message:', error)
      alert('削除に失敗しました')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="text-gray-600 text-lg">読み込み中...</div>
      </div>
    )
  }

  if (editingMessage) {
    return (
      <EditMessageForm
        message={editingMessage}
        onCancel={() => setEditingMessage(null)}
        onSave={(updatedMessage) => {
          setMessages(messages.map(m => m.id === updatedMessage.id ? updatedMessage : m))
          setEditingMessage(null)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">送信済みメッセージ</h1>
            <div className="space-x-2">
              <Link
                href="/messages"
                className="inline-block px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                受信メッセージ
              </Link>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="text-6xl mb-4">📤</div>
            <p className="text-gray-600 text-lg font-semibold">
              送信済みメッセージがありません
            </p>
            <p className="text-gray-500 text-sm mt-2 mb-6">
              誰かにメッセージを送ってみましょう！
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
              {messages.length} 件の送信済みメッセージ
            </div>
            {messages.map((msg) => (
              <SentMessageCard
                key={msg.id}
                message={msg}
                onEdit={() => setEditingMessage(msg)}
                onDelete={() => handleDelete(msg.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SentMessageCard({
  message,
  onEdit,
  onDelete,
}: {
  message: MessageWithRecipient
  onEdit: () => void
  onDelete: () => void
}) {
  const style = CARD_STYLES.find((s) => s.id === message.card_style) || CARD_STYLES[0]

  return (
    <div
      className={`bg-gradient-to-br ${style.bgGradient} border-2 ${style.borderColor} rounded-2xl p-6 md:p-8 shadow-lg hover:shadow-xl transition ${style.textColor}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="font-semibold text-lg">送信先: {message.recipient_name || '不明'}</p>
          <p className="text-xs opacity-70">
            {new Date(message.created_at).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
          >
            編集
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition"
          >
            削除
          </button>
        </div>
      </div>

      {message.image_url && (
        <div className="mb-4 rounded-lg overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={message.image_url}
            alt="Message"
            className="w-full max-h-96 object-cover"
          />
        </div>
      )}

      <p className="whitespace-pre-wrap leading-relaxed line-clamp-3">
        {message.message}
      </p>
    </div>
  )
}

function EditMessageForm({
  message,
  onCancel,
  onSave,
}: {
  message: MessageWithRecipient
  onCancel: () => void
  onSave: (message: MessageWithRecipient) => void
}) {
  const [messageText, setMessageText] = useState(message.message)
  const [selectedStyle, setSelectedStyle] = useState(message.card_style)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(message.image_url || '')
  const [loading, setLoading] = useState(false)

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
      alert('画像アップロードに失敗しました')
      return null
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      let imageUrl = message.image_url
      if (imageFile) {
        const uploadedUrl = await uploadImage()
        if (uploadedUrl) {
          imageUrl = uploadedUrl
        }
      }

      const { error } = await supabase
        .from('messages')
        .update({
          message: messageText,
          image_url: imageUrl,
          card_style: selectedStyle,
        })
        .eq('id', message.id)

      if (error) throw error

      onSave({
        ...message,
        message: messageText,
        image_url: imageUrl || undefined,
        card_style: selectedStyle,
      })
      alert('メッセージを更新しました')
    } catch (error) {
      alert('更新に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">メッセージを編集</h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ
              </label>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 resize-none text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                画像
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="edit-image-input"
                />
                {imagePreview ? (
                  <div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-48 mx-auto rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className="mt-2 text-sm text-red-600 hover:text-red-800"
                    >
                      削除
                    </button>
                  </div>
                ) : (
                  <label htmlFor="edit-image-input" className="cursor-pointer">
                    <div className="text-4xl mb-2">🖼️</div>
                    <p className="text-gray-600">クリックして画像を選択</p>
                  </label>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                カードデザイン
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

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {loading ? '保存中...' : '保存'}
              </button>
              <button
                onClick={onCancel}
                className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
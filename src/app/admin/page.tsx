'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// 役員12名のデータ
const EXECUTIVES = [
  { name: '鞠子輝', email: 'eb230455@meiji.ac.jp', department: '執行部' },
  { name: '熊木麻由', email: 'ed230440@meiji.ac.jp', department: '執行部' },
  { name: '柴崎龍星', email: 'eh230332@meiji.ac.jp', department: '執行部' },
  { name: '工藤海人', email: 'ec230882@meiji.ac.jp', department: '運営局' },
  { name: '金子紗千', email: 'ec231551@meiji.ac.jp', department: '演出局' },
  { name: '伊藤夏輝', email: 'ec230178@meiji.ac.jp', department: '開発局' },
  { name: '米倉大智', email: 'eh230386@meiji.ac.jp', department: '広報局' },
  { name: '井内愉羽', email: 'ea230985@meiji.ac.jp', department: '財務局' },
  { name: '齋藤銀平', email: 'eg230621@meiji.ac.jp', department: '参加団体局' },
  { name: '佐名木 理登', email: 'eb231167@meiji.ac.jp', department: '渉外局' },
  { name: '成瀬壮太', email: 'ed230207@meiji.ac.jp', department: '制作局' },
  { name: '木村優里', email: 'ed230352@meiji.ac.jp', department: '総務局' },
]

type CreatedUser = {
  name: string
  email: string
  department: string
  created: boolean
  error?: string
}

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CreatedUser[]>([])
  const [adminPassword, setAdminPassword] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const handleAuthenticate = (e: React.FormEvent) => {
    e.preventDefault()
    if (adminPassword === 'admin123') {
      setIsAuthenticated(true)
    } else {
      alert('パスワードが違います')
    }
  }

  const createExecutiveAccounts = async () => {
    setLoading(true)

    try {
      const response = await fetch('/api/create-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password: 'admin123' }),
      })

      if (!response.ok) {
        throw new Error('API呼び出しに失敗しました')
      }

      const data = await response.json()
      const createdResults = data.results as CreatedUser[]

      setResults(createdResults)
      const successCount = createdResults.filter((r) => r.created).length
      alert(`${successCount}/${EXECUTIVES.length} 人のアカウントを作成しました`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'アカウント作成に失敗しました'
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const downloadResults = () => {
    if (results.length === 0) {
      alert('結果がありません')
      return
    }

    const csv = [
      'name,email,department,tempPassword,status,error',
      ...results.map(r => `"${r.name}","${r.email}","${r.department}","meiji2024","${r.created ? '成功' : '失敗'}","${r.error || ''}"`),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'executive_accounts_results.csv'
    a.click()
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">管理画面</h1>
          <form onSubmit={handleAuthenticate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                管理パスワード
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="パスワードを入力"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              ログイン
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">🔧 管理画面</h1>
            <div className="space-x-2">
              <Link href="/" className="px-4 py-2 text-indigo-600 hover:bg-indigo-50 rounded-lg border border-indigo-600 transition font-medium">
                ホーム
              </Link>
              <button
                onClick={() => {
                  setIsAuthenticated(false)
                  setAdminPassword('')
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-300 transition font-medium"
              >
                ログアウト
              </button>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👔 役員アカウント作成（12名）</h2>
            <p className="text-gray-600 mb-6">
              以下のボタンをクリックすると、役員12名のアカウントが自動作成されます。
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 font-semibold mb-2">📋 作成対象</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div><span className="font-semibold">執行部:</span> 3名</div>
                <div><span className="font-semibold">運営局:</span> 1名</div>
                <div><span className="font-semibold">演出局:</span> 1名</div>
                <div><span className="font-semibold">開発局:</span> 1名</div>
                <div><span className="font-semibold">広報局:</span> 1名</div>
                <div><span className="font-semibold">財務局:</span> 1名</div>
                <div><span className="font-semibold">参加団体局:</span> 1名</div>
                <div><span className="font-semibold">渉外局:</span> 1名</div>
                <div><span className="font-semibold">制作局:</span> 1名</div>
                <div><span className="font-semibold">総務局:</span> 1名</div>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-300">
                <p className="text-sm text-blue-800 font-semibold">🔑 仮パスワード: <code className="bg-white px-2 py-1 rounded">meiji2024</code></p>
                <p className="text-xs text-blue-700 mt-1">ログイン後、各自でパスワード変更できます</p>
              </div>
            </div>

            <button
              onClick={createExecutiveAccounts}
              disabled={loading || results.length > 0}
              className="px-8 py-4 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-lg"
            >
              {loading ? '作成中...' : results.length > 0 ? '✅ 作成完了' : '🚀 12名のアカウントを作成'}
            </button>
          </div>

          {results.length > 0 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800">
                  📊 作成結果 ({results.filter(r => r.created).length}/{results.length} 成功)
                </h2>
                <button
                  onClick={downloadResults}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
                >
                  結果をダウンロード
                </button>
              </div>

              <div className="overflow-x-auto max-h-96 overflow-y-auto border border-gray-300 rounded-lg">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-semibold">名前</th>
                      <th className="px-4 py-2 font-semibold">所属</th>
                      <th className="px-4 py-2 font-semibold">メール</th>
                      <th className="px-4 py-2 font-semibold">状態</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result, index) => (
                      <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-2 font-semibold">{result.name}</td>
                        <td className="px-4 py-2 text-indigo-600 font-medium">{result.department}</td>
                        <td className="px-4 py-2 text-xs text-gray-600">{result.email}</td>
                        <td className="px-4 py-2">
                          {result.created ? (
                            <span className="text-green-600 font-semibold">✅ 成功</span>
                          ) : (
                            <span className="text-red-600 font-semibold">❌ 失敗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
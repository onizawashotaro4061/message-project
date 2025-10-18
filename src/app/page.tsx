'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          寄せ書き
        </h1>
        <p className="text-xl text-gray-700 mb-8 leading-relaxed">
          大切な人へのメッセージを、
          <br />
          素敵なカードデザインで送ろう
        </p>

        <div className="space-y-4 mb-12">
          <Link
            href="/send"
            className="block px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg hover:shadow-xl"
          >
            メッセージを送る
          </Link>
          <Link
            href="/login"
            className="block px-8 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg hover:bg-gray-900 transition shadow-lg hover:shadow-xl"
          >
            メッセージを確認
          </Link>
          <Link
            href="/signup"
            className="block px-8 py-4 bg-green-600 text-white rounded-xl font-bold text-lg hover:bg-green-700 transition shadow-lg hover:shadow-xl"
          >
            ✨ 新規登録
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-gray-900 mb-2">豊富なデザイン</h3>
            <p className="text-sm text-gray-600">
              6種類のカードデザインから選べます
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">✍️</div>
            <h3 className="font-bold text-gray-900 mb-2">1000文字</h3>
            <p className="text-sm text-gray-600">
              たっぷり1000文字までメッセージが書けます
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🔐</div>
            <h3 className="font-bold text-gray-900 mb-2">プライベート</h3>
            <p className="text-sm text-gray-600">
              あなたへのメッセージはあなただけが見れます
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
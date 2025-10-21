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
            className="block px-8 py-4 bg-purple-800 text-white rounded-xl font-bold text-lg hover:bg-purple-900 transition shadow-lg hover:shadow-xl"
          >
            メッセージを送る
          </Link>
          <Link
            href="/messages"
            className="block px-8 py-4 bg-[#B5364A] text-white rounded-xl font-bold text-lg hover:bg-[#8B2837] transition shadow-lg hover:shadow-xl"
          >
            メッセージを確認
          </Link>
          
          {/* 新規登録とログインを横並びに */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/login"
              className="block px-8 py-4 bg-[#3571B8] text-white rounded-xl font-bold text-lg hover:bg-[#2A5A93] transition shadow-lg hover:shadow-xl"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="block px-8 py-4 bg-[#D8CE48] text-white rounded-xl font-bold text-lg hover:bg-[#B8AE38] transition shadow-lg hover:shadow-xl"
            >
              新規登録
            </Link>
            
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">🎨</div>
            <h3 className="font-bold text-gray-900 mb-2">豊富なデザイン</h3>
            <p className="text-sm text-gray-600">
              様々なカードデザインから選べます
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-4xl mb-3">✍️</div>
            <h3 className="font-bold text-gray-900 mb-2">1000文字</h3>
            <p className="text-sm text-gray-600">
              1000文字までメッセージが書けます
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
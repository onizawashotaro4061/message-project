// app/api/get-users/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Service Role Keyでクライアント作成
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const users = data.users.map(u => ({
      id: u.id,
      email: u.email || '',
      user_metadata: u.user_metadata || {},
    }))

    return NextResponse.json({ users })
  } catch (error: unknown) { // ← より安全な'unknown'型に変更
  console.error('API Error:', error)

  // 返却するエラーメッセージを安全に取得するための変数を定義
  let errorMessage = 'サーバーで予期せぬエラーが発生しました。';

  // errorがJavaScriptの標準的なErrorオブジェクトかを確認する
  if (error instanceof Error) {
    errorMessage = error.message; // Errorオブジェクトであれば、安全に.messageプロパティを取得
  }

  // 安全に取得したエラーメッセージをレスポンスとして返す
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  )
  }
}
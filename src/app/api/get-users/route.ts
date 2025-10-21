// app/api/get-users/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'

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

    // 全ユーザーを取得（ページネーション対応）
    let allUsers: User[] = []
    let page = 1
    const perPage = 1000 // 1ページあたりの取得数

    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({
        page: page,
        perPage: perPage
      })

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      allUsers = allUsers.concat(data.users)

      // 取得したユーザー数がperPageより少なければ終了
      if (data.users.length < perPage) {
        break
      }

      page++
    }

    const users = allUsers.map(u => ({
      id: u.id,
      email: u.email || '',
      user_metadata: u.user_metadata || {},
    }))

    return NextResponse.json({ users })
  } catch (error: unknown) {
    console.error('API Error:', error)

    let errorMessage = 'サーバーで予期せぬエラーが発生しました。'

    if (error instanceof Error) {
      errorMessage = error.message
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
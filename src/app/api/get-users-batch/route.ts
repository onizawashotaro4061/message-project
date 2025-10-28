import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { userIds } = await request.json()

    // 入力検証
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid user IDs' },
        { status: 400 }
      )
    }

    // 環境変数チェック
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing required environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // 一度に全ユーザー情報を取得
    const usersMap: Record<string, any> = {}

    // Supabase Authは一度に複数ユーザーを取得できないので、
    // Promise.allで並列実行して効率化
    const userPromises = userIds.map(async (userId) => {
      try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
        if (!error && data?.user) {
          return { userId, user: data.user }
        }
        return { userId, user: null }
      } catch {
        return { userId, user: null }
      }
    })

    const results = await Promise.all(userPromises)

    results.forEach(({ userId, user }) => {
      if (user) {
        usersMap[userId] = {
          id: user.id,
          email: user.email,
          user_metadata: user.user_metadata
        }
      }
    })

    return NextResponse.json({ users: usersMap })
  } catch (error) {
    console.error('Unexpected error in get-users-batch:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

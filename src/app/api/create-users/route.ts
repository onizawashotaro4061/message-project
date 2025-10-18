// app/api/create-users/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    // 管理パスワードチェック
    const { password } = await request.json()
    
    if (password !== 'admin123') {
      return NextResponse.json({ error: '認証エラー' }, { status: 401 })
    }

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

    const results = []

    for (const executive of EXECUTIVES) {
      try {
        // 仮パスワード: meiji2024
        const tempPassword = 'meiji2024'

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: executive.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            display_name: executive.name,
            department: executive.department,
          },
        })

        if (error) {
          results.push({
            ...executive,
            created: false,
            error: error.message,
          })
        } else {
          results.push({
            ...executive,
            created: true,
            tempPassword: tempPassword,
          })
        }

        console.log(`✅ アカウント作成: ${executive.name}`)
      } catch (error: unknown) { // ← より安全なunknown型に変更
  // エラーメッセージを安全に取得するための変数を定義
  let errorMessage = '不明なエラーが発生しました';

  // errorがErrorオブジェクトか確認し、そうであればmessageプロパティを取得
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  results.push({
    ...executive,
    created: false,
    error: errorMessage, // ← 安全に取得したメッセージを使用
  })
  console.error(`❌ 失敗: ${executive.name} - ${errorMessage}`)
      }
    }

    return NextResponse.json({ results })
  } catch (error: unknown) { // ← より安全なunknown型に変更
  console.error('API Error:', error)

  let errorMessage = 'サーバーで予期せぬエラーが発生しました。';

  // errorがErrorオブジェクトか確認し、そうであればmessageプロパティを取得
  if (error instanceof Error) {
    errorMessage = error.message;
  }

  // 安全に取得したエラーメッセージをレスポンスとして返す
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  )
  }
}
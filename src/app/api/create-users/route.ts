// app/api/create-users/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 役員12名のデータ
const EXECUTIVES = [
  { name: '鞠子輝', furigana: 'まりことeru', email: 'eb230455@meiji.ac.jp', department: '執行部' },
  { name: '熊木麻由', furigana: 'くまきまゆ', email: 'ed230440@meiji.ac.jp', department: '執行部' },
  { name: '柴崎龍星', furigana: 'しばさきりゅうせい', email: 'eh230332@meiji.ac.jp', department: '執行部' },
  { name: '工藤海人', furigana: 'くどうかいと', email: 'ec230882@meiji.ac.jp', department: '運営局' },
  { name: '金子紗千', furigana: 'かねこさち', email: 'ec231551@meiji.ac.jp', department: '演出局' },
  { name: '伊藤夏輝', furigana: 'いとうなつき', email: 'ec230178@meiji.ac.jp', department: '開発局' },
  { name: '米倉大智', furigana: 'よねくらだいち', email: 'eh230386@meiji.ac.jp', department: '広報局' },
  { name: '井内愉羽', furigana: 'いうちゆわ', email: 'ea230985@meiji.ac.jp', department: '財務局' },
  { name: '齋藤銀平', furigana: 'さいとうぎんぺい', email: 'eg230621@meiji.ac.jp', department: '参加団体局' },
  { name: '佐名木 理登', furigana: 'さなきりと', email: 'eb231167@meiji.ac.jp', department: '渉外局' },
  { name: '成瀬壮太', furigana: 'なるせそうた', email: 'ed230207@meiji.ac.jp', department: '制作局' },
  { name: '木村優里', furigana: 'きむらゆり', email: 'ed230352@meiji.ac.jp', department: '総務局' },
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
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          ...executive,
          created: false,
          error: errorMessage,
        })
        console.error(`❌ 失敗: ${executive.name} - ${errorMessage}`)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('API Error:', error)
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
// app/api/create-section-chiefs/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 部門長21名のデータ
const SECTION_CHIEFS = [
  { name: '伊藤 春輝', email: 'eb240342@meiji.ac.jp', department: '参加団体局' },
  { name: '渡辺 美羽', email: 'eh240126@meiji.ac.jp', department: '広報局' },
  { name: '松元 健太朗', email: 'ec240717@meiji.ac.jp', department: '開発局' },
  { name: '小野 のどか', email: 'ec240131@meiji.ac.jp', department: '渉外局' },
  { name: '川島 慎大', email: 'ec240928@meiji.ac.jp', department: '運営局' },
  { name: '星野 莉亜', email: 'eh240178@meiji.ac.jp', department: '渉外局' },
  { name: '伊藤 汰海', email: 'eb240270@meiji.ac.jp', department: '制作局' },
  { name: '小出 有祟', email: 'eg240233@meiji.ac.jp', department: '運営局' },
  { name: '野村 駿介', email: 'eb240759@meiji.ac.jp', department: '開発局' },
  { name: '松田 莉歩', email: 'eb240190@meiji.ac.jp', department: '演出局' },
  { name: '吉田 瞬', email: 'eb240739@meiji.ac.jp', department: '演出局' },
  { name: '畑中 康佑', email: 'eb240956@meiji.ac.jp', department: '総務局' },
  { name: '和田 隼', email: 'eb240625@meiji.ac.jp', department: '広報局' },
  { name: '城川 三司朗', email: 'eb240165@meiji.ac.jp', department: '制作局' },
  { name: '湯淺 文音', email: 'ec240546@meiji.ac.jp', department: '財務局' },
  { name: '柏 翔介', email: 'eb241025@meiji.ac.jp', department: '参加団体局' },
  { name: '野間 帆南美', email: 'eg240524@meiji.ac.jp', department: '制作局' },
  { name: '井内愉美子', email: 'eb241037@meiji.ac.jp', department: '運営局' },
  { name: '田口 莉子', email: 'ed242046@meiji.ac.jp', department: '制作局' },
  { name: '草階 萌音', email: 'ec241668@meiji.ac.jp', department: '参加団体局' },
  { name: '村上 佑成', email: 'eh240243@meiji.ac.jp', department: '渉外局' },
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

    for (const sectionChief of SECTION_CHIEFS) {
      try {
        // 部門長は全員新規作成
        const tempPassword = 'Meidaisai141'

        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: sectionChief.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: {
            display_name: sectionChief.name,
            department: sectionChief.department,
            role: 'section_chief',
          },
        })

        if (error) {
          results.push({
            ...sectionChief,
            created: false,
            error: error.message,
          })
        } else {
          results.push({
            ...sectionChief,
            created: true,
            tempPassword: tempPassword,
          })
        }
        console.log(`✅ アカウント作成: ${sectionChief.name}`)
      } catch (error: unknown) {
        let errorMessage = '不明なエラーが発生しました'
        if (error instanceof Error) {
          errorMessage = error.message
        }
        results.push({
          ...sectionChief,
          created: false,
          error: errorMessage,
        })
        console.error(`❌ 失敗: ${sectionChief.name} - ${errorMessage}`)
      }
    }

    return NextResponse.json({ results })
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
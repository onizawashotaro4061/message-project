// app/api/create-vice-directors/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// 副局長27名のデータ
const VICE_DIRECTORS = [
  { name: '佐久間陽', email: 'eh230343@meiji.ac.jp', department: '参加団体局' },
  { name: '波平 三輝', email: 'eb230245@meiji.ac.jp', department: '参加団体局' },
  { name: '杉本 涼', email: 'eb230483@meiji.ac.jp', department: '参加団体局' },
  { name: '岡村 匠真', email: 'ea230557@meiji.ac.jp', department: '開発局' },
  { name: '青木 航世', email: 'ec231207@meiji.ac.jp', department: '開発局' },
  { name: '城戸康之介', email: 'ea230236@meiji.ac.jp', department: '広報局' },
  { name: '西山 由梨花', email: 'ed230025@meiji.ac.jp', department: '広報局' },
  { name: '西村 隼', email: 'eh230333@meiji.ac.jp', department: '広報局' },
  { name: '柴田 遥', email: 'eb231126@meiji.ac.jp', department: '制作局' },
  { name: '梅山 翔央', email: 'ed231113@meiji.ac.jp', department: '制作局' },
  { name: '柴田 芽依', email: 'ec230797@meiji.ac.jp', department: '制作局' },
  { name: '工藤 大智', email: 'eh230159@meiji.ac.jp', department: '制作局' },
  { name: '足立 光琉', email: 'eg230102@meiji.ac.jp', department: '財務局' },
  { name: '坂本 龍太', email: 'eb231163@meiji.ac.jp', department: '財務局' },
  { name: '小川 大翔', email: 'eb230269@meiji.ac.jp', department: '財務局' },
  { name: '曽田 結加', email: 'ed230291@meiji.ac.jp', department: '総務局' },
  { name: '深石 遥月', email: 'eg230076@meiji.ac.jp', department: '総務局' },
  { name: '小出 理名', email: 'eb231150@meiji.ac.jp', department: '総務局' },
  { name: '霜田 航輝', email: 'ec231151@meiji.ac.jp', department: '運営局' },
  { name: '藤井 永樹', email: 'ed230401@meiji.ac.jp', department: '運営局' },
  { name: '和田直樹', email: 'ed230061@meiji.ac.jp', department: '運営局' },
  { name: '中井 菜希', email: 'eh230406@meiji.ac.jp', department: '演出局' },
  { name: '福田 至', email: 'eh230270@meiji.ac.jp', department: '演出局' },
  { name: '重田 梨亜', email: 'ed232085@meiji.ac.jp', department: '渉外局' },
  { name: '田島 千尋', email: 'ed232112@meiji.ac.jp', department: '渉外局' },
  { name: '出口 明輝', email: 'eg230428@meiji.ac.jp', department: '渉外局' },
  { name: '竹内 悠花', email: 'eb230449@meiji.ac.jp', department: '渉外局' },
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

    for (const viceDirector of VICE_DIRECTORS) {
      try {
        // 既存ユーザーをチェック
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
        const existingUser = existingUsers.users.find(u => u.email === viceDirector.email)

        if (existingUser) {
          // 既存ユーザーの場合は役職だけ追加
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                ...existingUser.user_metadata,
                role: 'vice_director',
              }
            }
          )

          if (updateError) {
            results.push({
              ...viceDirector,
              created: false,
              updated: false,
              error: updateError.message,
            })
          } else {
            results.push({
              ...viceDirector,
              created: false,
              updated: true,
              message: '役職を追加しました',
            })
          }
          console.log(`✅ 役職追加: ${viceDirector.name}`)
        } else {
          // 新規ユーザー作成
          const tempPassword = 'Meidaisai141'

          const { data, error } = await supabaseAdmin.auth.admin.createUser({
            email: viceDirector.email,
            password: tempPassword,
            email_confirm: true,
            user_metadata: {
              display_name: viceDirector.name,
              department: viceDirector.department,
              role: 'vice_director',
            },
          })

          if (error) {
            results.push({
              ...viceDirector,
              created: false,
              error: error.message,
            })
          } else {
            results.push({
              ...viceDirector,
              created: true,
              tempPassword: tempPassword,
            })
          }
          console.log(`✅ アカウント作成: ${viceDirector.name}`)
        }
      } catch (error: unknown) {
        let errorMessage = '不明なエラーが発生しました'
        if (error instanceof Error) {
          errorMessage = error.message
        }
        results.push({
          ...viceDirector,
          created: false,
          error: errorMessage,
        })
        console.error(`❌ 失敗: ${viceDirector.name} - ${errorMessage}`)
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
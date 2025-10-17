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
  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
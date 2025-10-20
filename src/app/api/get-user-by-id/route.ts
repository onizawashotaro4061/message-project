import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()
    
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    
    if (error) throw error
    
    return NextResponse.json({ user: data.user })
  } catch (error) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
}
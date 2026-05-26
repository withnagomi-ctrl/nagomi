import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function DELETE(request) {
  const cookieStore = await cookies()
  const { postId } = await request.json()

  if (!postId) {
    return Response.json({ error: 'Missing postId' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return Response.json({ error: 'Not authorized' }, { status: 403 })
  }

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { error: deleteError } = await adminSupabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (deleteError) {
    return Response.json({ error: deleteError.message }, { status: 500 })
  }

  const { error: auditError } = await adminSupabase
    .from('admin_audit_logs')
    .insert({
      admin_id: user.id,
      action_type: 'delete_post',
      target_type: 'post',
      target_id: postId,
      reason: 'Post deleted by admin',
      metadata: {
        source: 'admin_dashboard',
      },
    })

  if (auditError) {
    return Response.json({
      error: `Post deleted, but audit log failed: ${auditError.message}`,
    }, { status: 500 })
  }

  return Response.json({ success: true })
}
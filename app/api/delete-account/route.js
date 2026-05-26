import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function DELETE(request) {
  const cookieStore = await cookies()

  // Get the current user using their session
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

  // Use service role to delete the auth user
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Delete data that references this user first

    // Notifications received by this user
    await adminSupabase
    .from('notifications')
    .delete()
    .eq('user_id', user.id)

    // Notifications caused by this user, if you added actor_id
    await adminSupabase
    .from('notifications')
    .delete()
    .eq('actor_id', user.id)

    // Follows
    await adminSupabase
    .from('follows')
    .delete()
    .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)

    // Blocks
    await adminSupabase
    .from('blocks')
    .delete()
    .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`)

    // Mutes
    await adminSupabase
    .from('mutes')
    .delete()
    .or(`muter_id.eq.${user.id},muted_id.eq.${user.id}`)

    // Messages
    await adminSupabase
    .from('messages')
    .delete()
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    // Reports made by or against this user
    await adminSupabase
    .from('reports')
    .delete()
    .or(`reporter_id.eq.${user.id},reported_user_id.eq.${user.id}`)

    // Mood room messages
    await adminSupabase
    .from('mood_messages')
    .delete()
    .eq('user_id', user.id)

    // Room presence
    await adminSupabase
    .from('room_presence')
    .delete()
    .eq('user_id', user.id)

    // Comment reactions
    await adminSupabase
    .from('comment_reactions')
    .delete()
    .eq('user_id', user.id)

    // Post reactions
    await adminSupabase
    .from('reactions')
    .delete()
    .eq('user_id', user.id)

    // Comments
    await adminSupabase
    .from('comments')
    .delete()
    .eq('user_id', user.id)

    // Posts
    await adminSupabase
    .from('posts')
    .delete()
    .eq('user_id', user.id)

    // Admin audit logs referencing this user
    await adminSupabase
    .from('admin_audit_logs')
    .delete()
    .or(`admin_id.eq.${user.id},target_id.eq.${user.id}`)

    // Delete profile after related rows are gone
    await adminSupabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

    // Delete auth user last
    const { error } = await adminSupabase.auth.admin.deleteUser(user.id)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ success: true })
}
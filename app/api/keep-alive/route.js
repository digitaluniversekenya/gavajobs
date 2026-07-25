import { createClient } from '@supabase/supabase-js'

// Never cache this route — every call must actually hit the database
export const dynamic = 'force-dynamic'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

export async function GET() {
  const { error } = await supabase.from('jobs').select('display_id').limit(1)
  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
  return Response.json({ ok: true, ts: new Date().toISOString() })
}
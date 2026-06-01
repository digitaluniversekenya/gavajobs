import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oixxczwpkmlatxnufjsw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9peHhjendwa21sYXR4bnVmanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3MzAyODYsImV4cCI6MjA5NTMwNjI4Nn0.EUUimK-RoDZvB_JSbSgPaCi5tqaJIBFx08Jd2Ic3r2w'

const supabase = createClient(supabaseUrl, supabaseKey)

function slugify(title, employer, id) {
  const clean = (str) =>
    str.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 40)
  const titleSlug = clean(title || '')
  const empSlug = clean(employer || '').slice(0, 20)
  const idSlug = (id || '').replace(/_/g, '-')
  return `${titleSlug}-${empSlug}-${idSlug}`
}

async function run() {
  const { data: jobs, error } = await supabase.from('jobs').select('id, display_id, title, employer')
  if (error) { console.error('Failed to fetch jobs:', error); return }
  console.log(`Found ${jobs.length} jobs. Generating slugs...`)
  for (const job of jobs) {
    const slug = slugify(job.title, job.employer, job.display_id)
    const { error: updateError } = await supabase.from('jobs').update({ slug }).eq('id', job.id)
    if (updateError) console.error(`Failed to update ${job.display_id}:`, updateError)
    else console.log(`✓ ${job.display_id} → ${slug}`)
  }
  console.log('Done!')
}

run()
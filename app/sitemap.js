import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

const BASE_URL = 'https://gavajobs.co.ke'

// Rebuild the sitemap at most once an hour so newly added jobs get included
export const revalidate = 3600

export default async function sitemap() {
  const { data: jobs } = await supabase
    .from('jobs')
    .select('slug, added_date')
    .eq('status', 'published')
    .not('slug', 'is', null)

  const jobPages = (jobs || []).map((job) => ({
    url: `${BASE_URL}/jobs/${job.slug}`,
    lastModified: job.added_date ? new Date(job.added_date) : new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    ...jobPages,
  ]
}
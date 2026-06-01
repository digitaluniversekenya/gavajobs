import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)
function dl(deadline) {
  if (!deadline) return { text: 'See advert', color: '#9A9A94', closed: false, urgent: false }
  const deadlineTime = new Date(deadline + 'T17:00:00+03:00')
  const now = new Date()
  if (now > deadlineTime) return { text: 'Closed', color: '#9A9A94', closed: true, urgent: false }
  const diff = Math.ceil((deadlineTime - now) / 864e5)
  if (diff <= 0) return { text: 'Closes today', color: '#C8102E', closed: false, urgent: true }
  if (diff <= 3) return { text: `${diff} days left`, color: '#C8102E', closed: false, urgent: true }
  if (diff <= 7) return { text: `${diff} days left`, color: '#C47F17', closed: false, urgent: false }
  return { text: `${diff} days left`, color: '#5C5C5C', closed: false, urgent: false }
}
import { C } from '../../../constants/theme'
import Link from 'next/link'

export async function generateMetadata({ params: paramsPromise }) {
  const params = await paramsPromise
  const { data: job } = await supabase
    .from('jobs')
    .select('title, employer, county, deadline, about, ai_summary, edu_min')
    .eq('slug', params.slug)
    .single()

  if (!job) return { title: 'Job Not Found – GavaJobs' }

  return {
    title: `${job.title} at ${job.employer} – GavaJobs Kenya`,
    description: `${job.employer} is hiring a ${job.title} in ${job.county}. Minimum qualification: ${job.edu_min}. Deadline: ${job.deadline}. Apply on GavaJobs.`,
    openGraph: {
      title: `${job.title} at ${job.employer}`,
      description: `${job.employer} is hiring in ${job.county}. Deadline: ${job.deadline}.`,
      url: `https://gavajobs.co.ke/jobs/${params.slug}`,
    },
  }
}

export default async function JobPage({ params: paramsPromise }) {
  const params = await paramsPromise
  console.log('Looking for slug:', params.slug)
  const { data: job, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('slug', params.slug)
    .single()
  console.log('Job found:', !!job, 'Error:', error?.message)

  if (!job) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:'"Outfit",sans-serif', background:C.bg }}>
        <div style={{ fontSize:48, marginBottom:16 }}>🔍</div>
        <h1 style={{ fontSize:24, fontWeight:700, color:C.text, marginBottom:8 }}>Job not found</h1>
        <p style={{ fontSize:14, color:C.text2, marginBottom:24 }}>This job may have been removed or the link is incorrect.</p>
        <Link href="/" style={{ fontSize:14, fontWeight:600, color:C.red, textDecoration:'none' }}>← Browse all jobs</Link>
      </div>
    )
  }

  const d = dl(job.deadline)
  const initials = (job.employer || '').match(/\b[A-Z]/g)?.slice(0,2).join('') || '?'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.about || job.ai_summary || '',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.employer,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.county,
        addressCountry: 'KE',
      },
    },
    datePosted: job.added_date,
    validThrough: job.deadline + 'T17:00:00+03:00',
    employmentType: 'FULL_TIME',
    educationRequirements: job.edu_min,
    identifier: {
      '@type': 'PropertyValue',
      name: 'GavaJobs',
      value: job.display_id,
    },
  }

  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:'"Outfit",-apple-system,sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      
      <div style={{ height:4, background:`linear-gradient(90deg,${C.black} 33%,${C.red} 33% 66%,${C.green} 66%)` }}/>
      
      <header style={{ background:C.white, borderBottom:`1px solid ${C.border}`, padding:'12px 16px' }}>
        <div style={{ maxWidth:720, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ fontWeight:700, fontSize:20, textDecoration:'none' }}>
            <span style={{ color:C.black }}>Gava</span>
            <span style={{ color:C.red }}>Jobs</span>
            <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'inline-block', marginLeft:2, verticalAlign:'baseline' }}/>
          </Link>
          <Link href="/" style={{ fontSize:13, color:C.text2, textDecoration:'none', fontWeight:500 }}>← All jobs</Link>
        </div>
      </header>

      <main style={{ maxWidth:720, margin:'0 auto', padding:'24px 16px 60px' }}>
        <div style={{ display:'flex', gap:14, alignItems:'flex-start', marginBottom:20 }}>
          <div style={{ width:52, height:52, borderRadius:12, background:C.black, color:C.white, fontSize:16, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            {initials}
          </div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:22, fontWeight:700, color:C.text, lineHeight:1.25, marginBottom:6 }}>{job.title}</h1>
            <p style={{ fontSize:15, color:C.text2, marginBottom:6 }}>{job.employer}</p>
            <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:C.text2, flexWrap:'wrap' }}>
              <span>{job.county}</span>
              <span style={{ color:C.border }}>·</span>
              <span>{job.edu_min}</span>
              {job.posts > 1 && <><span style={{ color:C.border }}>·</span><span>{job.posts} posts</span></>}
              <span style={{ color:C.border }}>·</span>
              <span style={{ fontWeight:600, color:d.urgent?C.red:d.color }}>{d.text}</span>
            </div>
          </div>
        </div>

        {job.ai_summary && (
          <div style={{ background:C.blueSoft, border:`1px solid #BFDBFE`, borderRadius:10, padding:16, marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:'#1D4ED8' }}/>
              <span style={{ fontSize:11, fontWeight:700, color:'#1D4ED8', textTransform:'uppercase', letterSpacing:'.04em' }}>At a glance</span>
            </div>
            <p style={{ fontSize:14, color:C.text, lineHeight:1.6 }}>{job.ai_summary}</p>
          </div>
        )}

        {!d.closed && (() => {
          const urlMatch = (job.how_to_apply||'').match(/https?:\/\/[^\s,)]+|www\.[^\s,)]+/)
          const emailMatch = (job.how_to_apply||'').match(/[\w.-]+@[\w.-]+\.\w+/)
          const applyUrl = urlMatch ? (urlMatch[0].startsWith('http') ? urlMatch[0] : 'https://'+urlMatch[0]) : null
          const applyEmail = !applyUrl && emailMatch ? emailMatch[0] : null
          return (
            <a href={applyUrl || (applyEmail ? `mailto:${applyEmail}` : '#how-to-apply')} target={applyUrl?'_blank':'_self'} rel="noreferrer"
              style={{ display:'block', background:C.red, color:C.white, fontFamily:'inherit', fontSize:15, fontWeight:700, padding:'14px 20px', borderRadius:12, cursor:'pointer', textDecoration:'none', textAlign:'center', marginBottom:20 }}>
              {applyUrl ? `Apply now` : applyEmail ? `Apply via email` : 'See how to apply below'}
            </a>
          )
        })()}

        <div style={{ background:C.white, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', marginBottom:20 }}>
          {[['Sector', job.sector], ['Grade', job.grade], ['Reference', job.ref], ['Deadline', job.deadline], ['Posts', job.posts]].filter(([,v]) => v && v !== '').map(([k,v], i, a) => (
            <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'11px 16px', borderBottom:i<a.length-1?`1px solid ${C.border}`:'none', fontSize:13 }}>
              <span style={{ color:C.text2 }}>{k}</span>
              <span style={{ color:C.text, fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>

        {job.about && (
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>About</h2>
            <p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.about}</p>
          </div>
        )}

        {job.responsibilities?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Key Responsibilities</h2>
            {job.responsibilities.filter(r => r).map((r, i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:'relative', marginBottom:6 }}>
                <span style={{ position:'absolute', left:0, color:C.text3 }}>•</span>{r}
              </div>
            ))}
          </div>
        )}

        {job.requirements?.length > 0 && (
          <div style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>Requirements</h2>
            {job.requirements.filter(r => r).map((r, i) => (
              <div key={i} style={{ fontSize:13, color:C.text2, lineHeight:1.6, paddingLeft:16, position:'relative', marginBottom:6 }}>
                <span style={{ position:'absolute', left:0, color:C.green }}>✓</span>{r}
              </div>
            ))}
          </div>
        )}

        {job.chapter_six && (
          <div style={{ background:'#FFFBEB', border:`1px solid #FDE68A`, borderRadius:10, padding:14, marginBottom:20 }}>
            <div style={{ fontSize:12, fontWeight:700, color:'#92400E', marginBottom:6 }}>CHAPTER SIX</div>
            <p style={{ fontSize:12, color:'#92400E', lineHeight:1.5 }}>This role requires Chapter Six compliance — proof is only needed once you're offered the job, not at application time.</p>
          </div>
        )}

        {job.how_to_apply && (
          <div id="how-to-apply" style={{ marginBottom:20 }}>
            <h2 style={{ fontSize:13, fontWeight:700, color:C.text3, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10 }}>How to Apply</h2>
            <p style={{ fontSize:14, color:C.text2, lineHeight:1.7 }}>{job.how_to_apply}</p>
          </div>
        )}

        <div style={{ marginTop:32, paddingTop:20, borderTop:`1px solid ${C.border}`, textAlign:'center' }}>
          <Link href="/" style={{ fontSize:14, fontWeight:600, color:C.red, textDecoration:'none' }}>
            ← Browse all jobs on GavaJobs
          </Link>
          <p style={{ fontSize:11, color:C.text3, marginTop:12, lineHeight:1.5 }}>
            GavaJobs is not an official website of the Government of Kenya.
          </p>
        </div>
      </main>
    </div>
  )
}
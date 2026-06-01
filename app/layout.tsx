import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], weight: ['400','500','600','700','800'] })

export const metadata = {
  title: 'GavaJobs — Kenya Government Job Matching',
  description: 'Know which Kenya government jobs match your qualifications. Build your profile and see your match score on every vacancy.',
  keywords: 'Kenya government jobs, public sector jobs Kenya, PSC jobs, civil service Kenya',
  openGraph: {
    title: 'GavaJobs — Kenya Government Job Matching',
    description: 'Know which Kenya government jobs match your qualifications.',
    url: 'https://gavajobs.co.ke',
    siteName: 'GavaJobs',
  },
  icons: {
    icon: '/icon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={outfit.className} style={{ margin:0, padding:0, background:'#F4F4F2' }}>
        <script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/sw.js')
    })
  }
`}} />
        {children}
      </body>
    </html>
  )
}
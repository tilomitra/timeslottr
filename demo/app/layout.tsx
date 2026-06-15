import type { Metadata } from 'next'
import { JetBrains_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import { Github } from 'lucide-react'
// Tailwind tokens/utilities for the Playground. Nextra's own theme CSS is loaded
// via a <link> below (copied to /public by the `copy:theme` script) so it does
// not pass through — and get mangled by — this app's Tailwind v3 pipeline.
import './globals.css'
import { cn } from '@/lib/utils'

// Mona Sans is not in next/font/google's bundled list for this Next version, so
// self-host the variable (wght 200–900) woff2 files via next/font/local.
const mona = localFont({
  src: [
    { path: './fonts/Mona-Sans-latin.woff2', weight: '200 900', style: 'normal' },
    { path: './fonts/Mona-Sans-latin-italic.woff2', weight: '200 900', style: 'italic' },
  ],
  variable: '--font-mona',
  display: 'swap',
})
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: {
    default: 'timeslottr — Time slot & availability engine',
    template: '%s — timeslottr',
  },
  description:
    'A zero-dependency, timezone-aware TypeScript library for generating time slots and computing multi-party availability.',
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⏳</text></svg>",
  },
}

const navbar = (
  <Navbar
    logo={<span className="font-semibold tracking-tight">timeslottr</span>}
    projectLink="https://github.com/tilomitra/timeslottr"
    projectIcon={<Github className="h-5 w-5" />}
  />
)

const footer = (
  <Footer>
    <span>
      MIT License · Built by{' '}
      <a
        href="https://twitter.com/tilomitra"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4"
      >
        Tilo Mitra
      </a>
    </span>
  </Footer>
)

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      suppressHydrationWarning
      className={cn(mona.variable, mono.variable)}
    >
      <Head
        // Claude-docs-inspired palette: a warm terracotta/clay accent and a
        // soft ivory canvas (vs. Nextra's default blue-on-white). These feed
        // Nextra's `--nextra-primary-*` / `--nextra-bg` tokens; globals.css
        // warms the gray/neutral scales to match.
        color={{
          hue: { light: 15, dark: 18 },
          saturation: { light: 63, dark: 65 },
          lightness: { light: 47, dark: 63 },
        }}
        backgroundColor={{ light: '#faf9f5', dark: '#1a1917' }}
      >
        {/* Nextra's prebuilt theme CSS, served statically (see copy:theme script). */}
        <link rel="stylesheet" href="/nextra-theme.css" />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/tilomitra/timeslottr/tree/master/demo"
          editLink="Edit this page on GitHub"
          sidebar={{ defaultMenuCollapseLevel: 1 }}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}

"use client"

import Link from "next/link"
import { Github, Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useState } from "react"

const navItems = [
  { href: "#examples", label: "Examples" },
  { href: "#playground", label: "Playground" },
  { href: "#api", label: "API" },
]

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur border-b border-border/40">
      <div className="container mx-auto flex h-16 max-w-screen-2xl items-center px-4 sm:px-8">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-semibold text-lg tracking-tight">
              timeslottr
            </span>
          </Link>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center space-x-1">
          {navItems.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end space-x-2">
          <nav className="flex items-center space-x-2">
            <Link
              href="https://github.com/tilomitra/timeslottr"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted hover:text-foreground h-9 w-9 px-0"
            >
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="inline-flex md:hidden items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-muted hover:text-foreground h-9 w-9 px-0"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </nav>
        </div>
      </div>

      {/* Mobile nav dropdown */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/40 bg-background/95 backdrop-blur">
          <nav className="container mx-auto flex flex-col px-4 py-3 space-y-1">
            {navItems.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground hover:bg-muted"
              >
                {label}
              </a>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}

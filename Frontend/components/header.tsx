"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AGLogo } from "./ag-logo"
import { Menu, X } from "lucide-react"
import Link from "next/link"

interface HeaderProps {
    onInquireNow?: () => void
}

export function Header({ onInquireNow }: HeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
                <Link href="/" aria-label="AG AI Admissions home">
                    <AGLogo />
                </Link>
                <nav aria-label="Main navigation" className="hidden items-center gap-4 text-sm font-medium text-slate-700 lg:flex">
                    <Link className="transition-colors hover:text-blue-800" href="/about">About</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/programmes/ug">Undergraduate</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/programmes/pg">Postgraduate</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/programmes/phd">PhD</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/scholarships">Scholarships</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/get-help">Get help</Link>
                    <Link className="transition-colors hover:text-blue-800" href="/counselor/login">Counselor portal</Link>
                </nav>
                <div className="flex items-center gap-2">
                    {onInquireNow ? (
                        <Button className="hidden bg-blue-800 font-semibold text-white hover:bg-blue-900 sm:inline-flex" onClick={onInquireNow}>
                            Inquire
                        </Button>
                    ) : null}
                    <Link href="/apply">
                        <Button className="bg-blue-800 px-3 font-semibold text-white hover:bg-blue-900 sm:px-4">
                            <span className="sm:hidden">Apply</span>
                            <span className="hidden sm:inline">Apply now</span>
                        </Button>
                    </Link>
                    <button
                        aria-expanded={menuOpen}
                        aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
                        className="rounded-md p-2 text-slate-700 hover:bg-slate-100 lg:hidden"
                        onClick={() => setMenuOpen((open) => !open)}
                        type="button"
                    >
                        {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
                    </button>
                </div>
            </div>
            {menuOpen && (
                <nav aria-label="Mobile navigation" className="grid gap-1 border-t border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 lg:hidden">
                    {[
                        ["About", "/about"],
                        ["Undergraduate", "/programmes/ug"],
                        ["Postgraduate", "/programmes/pg"],
                        ["PhD", "/programmes/phd"],
                        ["Scholarships", "/scholarships"],
                        ["Get help", "/get-help"],
                        ["Counselor portal", "/counselor/login"],
                    ].map(([label, href]) => (
                        <Link className="rounded-md px-3 py-2 hover:bg-slate-50 hover:text-blue-800" href={href} key={href} onClick={() => setMenuOpen(false)}>
                            {label}
                        </Link>
                    ))}
                </nav>
            )}
        </header>
    )
}

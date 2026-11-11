"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { RotateCw } from "lucide-react"

export default function CounselorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const router = useRouter()
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

    useEffect(() => {
        // Check authentication JWT
        const auth = sessionStorage.getItem("counselor_auth")
        if (auth && auth.split('.').length === 3) {
            try {
                const payloadPart = auth.split('.')[1].replace(/-/g, "+").replace(/_/g, "/")
                const paddedPayload = payloadPart.padEnd(Math.ceil(payloadPart.length / 4) * 4, "=")
                const payload = JSON.parse(atob(paddedPayload))
                if (payload.exp && Date.now() > payload.exp) {
                    sessionStorage.removeItem("counselor_auth")
                    setIsAuthenticated(false)
                    if (pathname !== "/counselor/login") {
                        router.push("/counselor/login")
                    }
                } else {
                    setIsAuthenticated(true)
                }
            } catch {
                setIsAuthenticated(false)
                if (pathname !== "/counselor/login") {
                    router.push("/counselor/login")
                }
            }
        } else {
            setIsAuthenticated(false)
            if (pathname !== "/counselor/login") {
                router.push("/counselor/login")
            }
        }
    }, [pathname, router])

    // While checking auth, show a clean loading spinner to prevent UI flash
    if (isAuthenticated === null) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center gap-2">
                <RotateCw className="w-8 h-8 text-[#1d4ed8] animate-spin" />
                <span className="text-gray-500 text-sm font-medium font-sans">Checking session auth...</span>
            </div>
        )
    }

    // Avoid redirect loops by rendering children immediately on login page
    if (!isAuthenticated && pathname !== "/counselor/login") {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center gap-2">
                <RotateCw className="w-8 h-8 text-[#1d4ed8] animate-spin" />
                <span className="text-gray-500 text-sm font-medium font-sans">Redirecting to login...</span>
            </div>
        )
    }

    return <>{children}</>
}

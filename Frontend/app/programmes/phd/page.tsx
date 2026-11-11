"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Monitor, Radio, Settings, Zap } from "lucide-react"

const PhDDisciplines = [
    {
        name: "Computer Science and Engineering",
        icon: Monitor,
    },
    {
        name: "Electronics and Communication Engineering",
        icon: Radio,
    },
    {
        name: "Electrical and Electronics Engineering",
        icon: Settings,
    },
    {
        name: "Mechanical Engineering",
        icon: Zap,
    },
]

export default function PhDProgrammesPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            <main className="flex-1 py-16 px-4 md:px-8 max-w-7xl mx-auto w-full mt-16">
                {/* Title Section */}
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        Doctor of Philosophy <span className="text-[#2563eb]">(Ph.D)</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                        Explore an illustrative doctoral pathway in engineering and technology. Details shown are sample content, not an official admissions policy.
                    </p>
                </div>

                {/* Disciplines Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {PhDDisciplines.map((discipline, idx) => (
                        <Card key={idx} className="border-0 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white rounded-2xl overflow-hidden p-8 flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-[#1d4ed8]/10 flex items-center justify-center text-[#1d4ed8] mb-6">
                                <discipline.icon className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 leading-snug">
                                {discipline.name}
                            </h3>
                        </Card>
                    ))}
                </div>
            </main>

            {/* Basic brand footer */}
            <footer className="bg-[#0f172a] text-white py-8 mt-24 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} AG AI Admissions.</p>
                    <p>Programme details are illustrative.</p>
                </div>
            </footer>
        </div>
    )
}

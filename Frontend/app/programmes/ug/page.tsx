"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, Calendar, Milestone, ShieldCheck } from "lucide-react"

const BTechBranches = [
    {
        name: "Computer Science and Engineering",
        code: "CSE",
        intake: 240,
        catA: 168,
        catB: 72,
    },
    {
        name: "Information Technology",
        code: "INF",
        intake: 120,
        catA: 84,
        catB: 36,
    },
    {
        name: "Electronics and Communication Engineering",
        code: "ECE",
        intake: 180,
        catA: 126,
        catB: 54,
    },
    {
        name: "CSE (Artificial Intelligence and Data Science)",
        code: "CAD",
        intake: 180,
        catA: 126,
        catB: 54,
    },
    {
        name: "CSE (Artificial Intelligence and Machine Learning)",
        code: "CSM",
        intake: 180,
        catA: 126,
        catB: 54,
    },
    {
        name: "Computer Science and Business System",
        code: "CSB",
        intake: 60,
        catA: 42,
        catB: 18,
    },
    {
        name: "Mechanical Engineering",
        code: "MEC",
        intake: 60,
        catA: 42,
        catB: 18,
    },
    {
        name: "Electrical and Electronics Engineering",
        code: "EEE",
        intake: 60,
        catA: 42,
        catB: 18,
    },
    {
        name: "Civil Engineering",
        code: "CIV",
        intake: 60,
        catA: 42,
        catB: 18,
    },
]

export default function UGProgrammesPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            <main className="flex-1 py-12 px-4 md:px-8 max-w-7xl mx-auto w-full mt-16">
                {/* Title Section */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        BACHELOR OF TECHNOLOGY <span className="text-[#1d4ed8]">[B.TECH.]</span>
                    </h1>
                    <div className="mt-4 flex flex-wrap justify-center items-center gap-4 md:gap-8 text-lg font-medium text-gray-600">
                        <span className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-[#1d4ed8]" />
                            COURSE DURATION : <strong className="text-gray-900">FOUR YEARS</strong>
                        </span>
                        <span className="hidden md:inline text-gray-300">|</span>
                        <span className="flex items-center gap-2">
                            <Milestone className="w-5 h-5 text-[#123d72]" />
                            SAMPLE COUNSELLING CODE : <strong className="text-[#123d72]">AGB</strong>
                        </span>
                    </div>
                </div>

                {/* Branches Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {BTechBranches.map((branch, idx) => (
                        <Card key={idx} className="border-t-4 border-t-[#1d4ed8] shadow-md hover:shadow-lg transition-all duration-300 bg-white">
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start gap-4 mb-4">
                                    <h3 className="text-lg font-bold text-gray-950 leading-snug">
                                        {branch.name}
                                    </h3>
                                </div>
                                <div className="text-sm font-semibold text-gray-500 mb-4 flex items-center gap-1.5">
                                    Branch Code:{" "}
                                    <span className="text-[#123d72] font-bold text-base">
                                        {branch.code}
                                    </span>
                                </div>
                                <hr className="border-gray-200 my-4" />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Illustrative intake:</span>
                                        <span className="font-bold text-gray-900">{branch.intake}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-650">
                                        <span>Category 'A' Seats:</span>
                                        <span className="font-semibold text-gray-800">{branch.catA}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-650">
                                        <span>Category 'B' Seats:</span>
                                        <span className="font-semibold text-gray-800">{branch.catB}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Fee Structure banner */}
                <div className="bg-[#eff6ff] border-2 border-yellow-200 rounded-xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-extrabold text-gray-900">
                            Fee Structure for B.Tech Course
                        </h2>
                        <p className="text-sm text-gray-500 font-medium">
                            Illustrative sample fee — confirm official rates before use
                        </p>
                    </div>
                    <div className="text-left md:text-right">
                        <div className="text-2xl md:text-3xl font-black text-[#1d4ed8]">
                            Rs. 1,03,000.00 <span className="text-sm font-medium text-gray-500">per year</span>
                        </div>
                    </div>
                </div>
            </main>

            {/* Basic brand footer */}
            <footer className="bg-[#0f172a] text-white py-8 mt-12 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} AG AI Admissions.</p>
                    <p>Programme and fee figures are illustrative.</p>
                </div>
            </footer>
        </div>
    )
}

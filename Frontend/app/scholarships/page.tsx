"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { CheckSquare, Info, ShieldCheck, Check } from "lucide-react"

const newDocumentsList = [
    "Completed scholarship application",
    "Academic transcripts or examination results",
    "Proof of identity",
    "Proof of household income (for need-based support)",
    "Entrance examination score or rank (if applicable)",
    "Admission offer or application reference",
    "Bank account details for an approved award",
]

const renewalDocumentsList = [
    "Scholarship renewal application",
    "Most recent academic results",
    "Updated proof of household income (if applicable)",
    "Proof of continued enrollment",
    "Bank details (if they have changed)",
]

export default function ScholarshipsPage() {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Header />

            <main className="flex-1 py-16 px-4 md:px-8 max-w-5xl mx-auto w-full mt-16">
                {/* Title Section */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center space-x-2 bg-[#1d4ed8]/10 text-[#1d4ed8] px-4 py-1.5 rounded-full text-sm font-semibold mb-4 border border-[#1d4ed8]/20">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Scholarship Policies</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
                        SCHOLARSHIPS & FINANCIAL SUPPORT
                    </h1>
                    <p className="mt-2 text-sm md:text-base font-bold text-[#123d72] tracking-widest uppercase">
                        Illustrative student financial-support guidance
                    </p>
                </div>

                {/* Eligibility Section */}
                <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden mb-10">
                    <div className="bg-[#1d4ed8] py-4 px-6 md:px-8 text-white flex items-center space-x-3">
                        <Info className="w-6 h-6" />
                        <h2 className="text-xl font-bold tracking-wide">Eligibility</h2>
                    </div>
                    <CardContent className="p-6 md:p-8 space-y-4 text-gray-700 leading-relaxed">
                        <div className="flex items-start space-x-3">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1 shrink-0">
                                <Check className="w-3 h-3" />
                            </div>
                            <p>
                                The sample portal illustrates merit-based awards and need-based tuition assistance. No award is guaranteed.
                            </p>
                        </div>
                        <div className="flex items-start space-x-3 border-t border-gray-100 pt-4">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mt-1 shrink-0">
                                <Check className="w-3 h-3" />
                            </div>
                            <p>
                                Eligibility, award amounts, deadlines, and required evidence must be set by the institution and checked against applicable rules before use.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Required Documents Section */}
                <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden mb-10">
                    <div className="bg-[#2563eb] py-5 px-6 md:px-8 text-white">
                        <h2 className="text-xl font-bold tracking-wide">Example documents for a new application</h2>
                        <p className="text-xs text-blue-200 mt-1 leading-snug">
                            This list is illustrative only. Request only information necessary to assess a real scholarship application.
                        </p>
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {newDocumentsList.map((doc, idx) => (
                                <li key={idx} className="flex items-start space-x-3">
                                    <CheckSquare className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-700 leading-snug">{doc}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>

                {/* Procedure for Renewal Section */}
                <Card className="border-0 shadow-md bg-white rounded-2xl overflow-hidden">
                    <div className="bg-[#123d72] py-5 px-6 md:px-8 text-white">
                        <h2 className="text-xl font-bold tracking-wide">Procedure for Renewal</h2>
                        <p className="text-xs text-blue-100 mt-1 leading-snug">
                            Renewal requirements vary by award and should be published by the institution.
                        </p>
                    </div>
                    <CardContent className="p-6 md:p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2 flex items-center space-x-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#123d72]"></span>
                            <span>Documents Required</span>
                        </h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renewalDocumentsList.map((doc, idx) => (
                                <li key={idx} className="flex items-start space-x-3">
                                    <CheckSquare className="w-5 h-5 text-[#123d72] shrink-0 mt-0.5" />
                                    <span className="text-sm text-gray-700 leading-snug">{doc}</span>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f172a] text-white py-8 mt-24 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-4 text-center space-y-2 text-sm text-gray-400">
                    <p>© {new Date().getFullYear()} AG AI Admissions.</p>
                    <p>Scholarship guidance shown is not an official policy.</p>
                </div>
            </footer>
        </div>
    )
}

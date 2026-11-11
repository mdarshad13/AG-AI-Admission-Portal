"use client"

import { Header } from "@/components/header"
import { Card, CardContent } from "@/components/ui/card"
import { Award, BookOpen, Building, CheckCircle2, GraduationCap, Users } from "lucide-react"

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-7xl mx-auto px-4 py-12 md:py-16">
                {/* Page Title */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight">
                        ABOUT AG AI ADMISSIONS
                    </h1>
                    <div className="w-20 h-1 bg-[#1d4ed8] mt-4"></div>
                </div>

                {/* About the sample institution */}
                <div className="grid lg:grid-cols-12 gap-12 items-start mb-20">
                    <div className="lg:col-span-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#123d72] mb-6">
                            A SMARTER WAY TO APPLY
                        </h2>
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                            AG AI Admissions is a student-focused admissions portal that brings programme discovery, application steps, scholarship guidance, and AI-assisted support into one accessible experience.
                        </p>
                        <p className="text-gray-700 text-lg leading-relaxed mb-6">
                            All institution details, programme offerings, fees, and policies shown here are sample content. They do not represent an accredited institution or an official admissions offer.
                        </p>

                        <div className="grid sm:grid-cols-2 gap-6 mt-8">
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-[#1d4ed8] flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-[#0f172a]">Academic Rigor</h4>
                                    <p className="text-sm text-gray-600 mt-1">Programme information is presented as illustrative sample content.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <CheckCircle2 className="w-6 h-6 text-[#1d4ed8] flex-shrink-0" />
                                <div>
                                    <h4 className="font-bold text-[#0f172a]">Human Values</h4>
                                    <p className="text-sm text-gray-600 mt-1">A clear, student-focused path through the admissions process.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sample project overview */}
                    <div className="lg:col-span-4 bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl flex flex-col justify-between min-h-[350px]">
                        <div>
                            <h3 className="text-xl font-bold border-b border-white/10 pb-4 mb-6">
                                AG admissions portal
                            </h3>
                            <ul className="space-y-6">
                                <li className="flex items-center gap-4">
                                    <BookOpen className="text-[#123d72] w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <span className="block text-2xl font-bold">UG pathways</span>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <Building className="text-[#123d72] w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <span className="block text-2xl font-bold">PG pathways</span>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <GraduationCap className="text-[#123d72] w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <span className="block text-2xl font-bold">Research studies</span>
                                    </div>
                                </li>
                                <li className="flex items-center gap-4">
                                    <Users className="text-[#123d72] w-6 h-6 flex-shrink-0" />
                                    <div>
                                        <span className="block text-2xl font-bold">Student support</span>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sample institution profile */}
                <div className="border-t border-gray-200 pt-16 grid lg:grid-cols-12 gap-12 items-center">
                    <div className="lg:col-span-5 relative">
                        <div className="overflow-hidden rounded-2xl shadow-2xl relative">
                            <img
                                src="/ag-campus.svg"
                                alt="Illustration representing the AG AI Admissions student portal"
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-semibold tracking-wider">
                                SAMPLE CAMPUS ILLUSTRATION
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-7">
                        <h3 className="text-2xl font-bold text-[#0f172a] mb-6">
                            A sample institution profile
                        </h3>
                        <p className="text-gray-700 text-lg leading-relaxed mb-8">
                            AG AI Admissions is a demonstration system, not an institution. Programme, fee, and scholarship details shown in this project are illustrative and should be confirmed before real-world use.
                        </p>

                        {/* Stats badges */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                            <div className="border-l-4 border-[#1d4ed8] pl-4">
                                <span className="block text-sm text-gray-500">Institution</span>
                                <span className="text-xl font-bold text-[#0f172a]">Fictional</span>
                                <span className="block text-xs text-gray-600">Sample project profile</span>
                            </div>
                            <div className="border-l-4 border-[#1d4ed8] pl-4">
                                <span className="block text-sm text-gray-500">Affiliation</span>
                                <span className="text-xl font-bold text-[#0f172a]">Not claimed</span>
                                <span className="block text-xs text-gray-600">No affiliation asserted</span>
                            </div>
                            <div className="border-l-4 border-[#1d4ed8] pl-4">
                                <span className="block text-sm text-gray-500">Status</span>
                                <span className="text-xl font-bold text-[#0f172a]">Illustrative</span>
                                <span className="block text-xs text-gray-600">Details are examples</span>
                            </div>
                            <div className="border-l-4 border-[#123d72] pl-4">
                                <span className="block text-sm text-gray-500">Accreditation</span>
                                <span className="text-xl font-bold text-[#0f172a]">No rating</span>
                                <span className="block text-xs text-gray-600">No accreditation claimed</span>
                            </div>
                            <div className="border-l-4 border-[#123d72] pl-4">
                                <span className="block text-sm text-gray-500">NBA Status</span>
                                <span className="text-xl font-bold text-[#0f172a]">Sample</span>
                                <span className="block text-xs text-gray-600">Programme examples only</span>
                            </div>
                            <div className="border-l-4 border-[#123d72] pl-4">
                                <span className="block text-sm text-gray-500">Atal Ranking</span>
                                <span className="text-xl font-bold text-[#0f172a]">Demo</span>
                                <span className="block text-xs text-gray-600">Admissions portal prototype</span>
                            </div>
                        </div>

                        <p className="text-gray-700 italic text-lg border-t border-gray-150 pt-6">
                            "A thoughtful admissions experience can help every student take a confident next step."
                        </p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f172a] text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} AG AI Admissions. All rights reserved.
                    </p>
                    <p className="mt-2 text-xs text-gray-500">AI-enabled student admission management.</p>
                </div>
            </footer>
        </div>
    )
}

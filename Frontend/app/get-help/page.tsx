"use client"

import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpCircle, Mail, MessageSquare, Phone, ShieldQuestion, UserCheck } from "lucide-react"
import Link from "next/link"

export default function GetHelpPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <Header />

            <main className="max-w-4xl mx-auto px-4 py-12 md:py-16">
                {/* Page Title */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-[#0f172a] tracking-tight">
                        AG ADMISSIONS SUPPORT
                    </h1>
                    <p className="text-gray-500 text-lg mt-3">
                        Need help with a programme, application, or portal issue? Choose an option below.
                    </p>
                    <div className="w-20 h-1 bg-[#1d4ed8] mx-auto mt-4"></div>
                </div>

                {/* Support Grid Options */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* AI Admissions Agent */}
                    <Card className="border border-gray-150 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                        <CardHeader className="bg-[#1d4ed8]/5 pb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#1d4ed8]/10 flex items-center justify-center text-[#1d4ed8] mb-4">
                                <MessageSquare className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-[#0f172a]">
                                Chat with Nemo
                            </CardTitle>
                            <CardDescription className="text-gray-500 mt-1">
                                Ask about programmes, eligibility, scholarships, and application steps. Chat answers require the Gemini service to be configured.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Link href="/?chat=true">
                                <Button className="w-full bg-[#1d4ed8] hover:bg-[#1e40af] text-white py-6 rounded-xl font-bold text-base">
                                    START CHAT NOW
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Inquiry Application Form */}
                    <Card className="border border-gray-150 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white">
                        <CardHeader className="bg-[#123d72]/5 pb-6">
                            <div className="w-12 h-12 rounded-xl bg-[#123d72]/10 flex items-center justify-center text-[#123d72] mb-4">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <CardTitle className="text-xl font-bold text-[#0f172a]">
                                Start Inquiry Form
                            </CardTitle>
                            <CardDescription className="text-gray-500 mt-1">
                                Share your contact details and programme interest with the admissions inquiry form.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <Link href="/?apply=true">
                                <Button className="w-full bg-[#123d72] hover:bg-[#1d4ed8] text-white py-6 rounded-xl font-bold text-base">
                                    APPLY / REGISTER NOW
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Info Details Card */}
                <Card className="border border-gray-150 bg-white shadow-lg overflow-hidden rounded-2xl mb-16">
                    <div className="bg-[#0f172a] py-6 px-8 text-white flex items-center gap-3">
                        <ShieldQuestion className="w-6 h-6 text-[#123d72]" />
                        <h3 className="text-xl font-bold">Sample Admissions Contacts</h3>
                    </div>
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#1d4ed8] flex-shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-[#0f172a] text-sm uppercase tracking-wider">Admissions email</h5>
                                        <p className="text-gray-700 font-semibold mt-1">admissions@example.com</p>
                                        <p className="text-gray-500 text-xs mt-0.5">Replace this reserved sample address before deployment.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 items-start">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-[#1d4ed8] flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-[#0f172a] text-sm uppercase tracking-wider">Portal support</h5>
                                        <p className="text-gray-700 font-semibold mt-1">support@example.com</p>
                                        <p className="text-gray-500 text-xs mt-0.5">This is a fictional contact address for the demo.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-8">
                                <h4 className="font-bold text-[#0f172a] text-md">Before using this sample</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">
                                    Configure your admissions contact details and verify published programme or scholarship rules before deploying this portal.
                                </p>
                                <div className="flex gap-2 items-center text-sm text-[#1d4ed8] font-semibold">
                                    <Mail className="w-4 h-4" />
                                    <span>Update contact details before deployment</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Footer */}
            <footer className="bg-[#0f172a] text-white py-12">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} AG AI Admissions. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}

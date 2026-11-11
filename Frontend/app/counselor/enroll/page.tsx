"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    GraduationCap,
    ArrowLeft,
    ArrowRight,
    Check,
    AlertCircle,
    ShieldAlert,
    CheckCircle2,
    RefreshCw,
    Play
} from "lucide-react"
import Link from "next/link"
import { config } from "@/lib/config"
import { COURSES } from "@/lib/courses"

interface FlowFormData {
    fullName: string
    email: string
    phone: string
    expectedStartDate: string
    choiceOption1: string
    discountPercentage: string
}

interface EnrollmentSubmissionResult {
    id: string
    fullName: string
    courseName: string
    courseFee: number
    discountPercentage: number
    finalPayableAmount: number
    approvalStatus: string
    enrollmentStatus: string
    aiPriorityScore: number
    riskLevel: string
}

const initialFlowData: FlowFormData = {
    fullName: "",
    email: "",
    phone: "",
    expectedStartDate: "",
    choiceOption1: "",
    discountPercentage: "0",
}

export default function CounselorEnrollWizard() {
    const [currentScreen, setCurrentScreen] = useState(1)
    const [formData, setFormData] = useState<FlowFormData>(initialFlowData)
    const [errors, setErrors] = useState<Partial<Record<keyof FlowFormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [responseRecord, setResponseRecord] = useState<EnrollmentSubmissionResult | null>(null)
    const [submissionError, setSubmissionError] = useState("")

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name as keyof FlowFormData]) {
            setErrors(prev => ({ ...prev, [name]: "" }))
        }
    }

    const validateScreen = (screen: number): boolean => {
        const newErrors: Partial<Record<keyof FlowFormData, string>> = {}

        if (screen === 1) {
            if (!formData.fullName.trim()) newErrors.fullName = "Student Name is required"
            if (!formData.email.trim()) {
                newErrors.email = "Email address is required"
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Please input a valid email address"
            }
            if (!formData.phone.trim()) newErrors.phone = "Phone number is required"

            if (!formData.expectedStartDate) {
                newErrors.expectedStartDate = "Expected Start Date is required"
            } else {
                const selectedDate = new Date(formData.expectedStartDate)
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                if (selectedDate < today) {
                    newErrors.expectedStartDate = "Expected Start Date cannot be in the past"
                }
            }
        }

        if (screen === 2) {
            if (!formData.choiceOption1) newErrors.choiceOption1 = "Assigned Course selection is required"
            const discountVal = parseFloat(formData.discountPercentage)
            if (isNaN(discountVal) || discountVal < 0) {
                newErrors.discountPercentage = "Discount Percentage must be a valid number"
            } else if (discountVal > 50) {
                newErrors.discountPercentage = "Sample discount cannot be greater than 50%"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateScreen(currentScreen)) {
            setCurrentScreen(prev => prev + 1)
        }
    }

    const handleBack = () => {
        setCurrentScreen(prev => prev - 1)
    }

    const handleFinish = async () => {
        if (!validateScreen(2)) return
        setIsSubmitting(true)
        setSubmissionError("")
        try {
            const token = sessionStorage.getItem("counselor_auth") || ""
            const res = await fetch(`${config.formSubmissionApi}api/enrollments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ ...formData, applicationSource: "counselor_enrollment" })
            })

            if (!res.ok) {
                throw new Error(`Enrollment submission failed (${res.status})`)
            }

            const data: EnrollmentSubmissionResult = await res.json()
            setResponseRecord(data)
            setCurrentScreen(3)
        } catch (err) {
            console.error("Enrollment submission failed:", err)
            setSubmissionError(err instanceof Error ? err.message : "Enrollment submission failed. Please try again.")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleReset = () => {
        setFormData(initialFlowData)
        setResponseRecord(null)
        setErrors({})
        setSubmissionError("")
        setCurrentScreen(1)
    }

    // Calculations for preview
    const selectedCourseItem = COURSES.find(c => c.id === formData.choiceOption1)
    const courseFeeVal = selectedCourseItem ? selectedCourseItem.fee : 0
    const discountVal = parseFloat(formData.discountPercentage) || 0
    const finalFeeVal = Math.max(0, courseFeeVal * (1 - (discountVal / 100)))

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />

            {/* Counselor enrollment workflow */}
            <div className="bg-[#f3f3f3] border-b border-gray-300 py-3 px-6 shadow-xs select-none">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                        <span className="bg-[#1d4ed8] text-white px-2 py-0.5 rounded text-[10px] font-bold">AG ADMISSIONS</span>
                        <span>Applicant Enrollment</span>
                    </div>
                    <Link href="/counselor/dashboard" className="text-xs text-[#0070d2] hover:underline font-bold flex items-center gap-1">
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
                    </Link>
                </div>
            </div>

            {/* Wizard Container */}
            <main className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col items-center">
                {/* Step progress tracker */}
                <div className="w-full max-w-2xl mb-8 flex justify-between items-center text-xs font-semibold text-gray-500 relative select-none">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>

                    <div className={`flex flex-col items-center gap-1`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold transition-all ${currentScreen > 1
                            ? "bg-blue-500 border-green-500 text-white"
                            : currentScreen === 1
                                ? "bg-[#0070d2] border-[#0070d2] text-white ring-4 ring-[#0070d2]/20"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}>
                            {currentScreen > 1 ? <Check className="w-4 h-4" /> : "1"}
                        </div>
                        <span className={currentScreen === 1 ? "text-gray-800 font-bold" : ""}>Candidate Info</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold transition-all ${currentScreen > 2
                            ? "bg-blue-500 border-green-500 text-white"
                            : currentScreen === 2
                                ? "bg-[#0070d2] border-[#0070d2] text-white ring-4 ring-[#0070d2]/20"
                                : "bg-white border-gray-300 text-gray-400"
                            }`}>
                            {currentScreen > 2 ? <Check className="w-4 h-4" /> : "2"}
                        </div>
                        <span className={currentScreen === 2 ? "text-gray-800 font-bold" : ""}>Fees & Discounts</span>
                    </div>

                    <div className={`flex flex-col items-center gap-1`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold transition-all ${currentScreen === 3
                            ? "bg-blue-500 border-green-500 text-white ring-4 ring-green-500/20"
                            : "bg-white border-gray-300 text-gray-400"
                            }`}>
                            "3"
                        </div>
                        <span className={currentScreen === 3 ? "text-gray-800 font-bold" : ""}>Flow Outcome</span>
                    </div>
                </div>

                <Card className="w-full max-w-2xl border border-gray-350 shadow-md bg-white rounded-lg overflow-hidden">
                    <CardHeader className="bg-gray-50 border-b border-gray-200 py-4 px-6">
                        <CardTitle className="text-base text-gray-800 font-bold flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-[#0070d2]" />
                            {currentScreen === 1 && "Step 1: Applicant Details"}
                            {currentScreen === 2 && "Step 2: Course and Sample Scholarship"}
                            {currentScreen === 3 && "Step 3: Submission Status"}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                            Sample counselor workflow for recording an applicant and course preference.
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6">
                        {submissionError && (
                            <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {submissionError}
                            </p>
                        )}
                        {/* SCREEN 1: DETAILS */}
                        {currentScreen === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Applicant Full Name *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className={`w-full px-3 py-2 border rounded text-sm outline-none transition-all ${errors.fullName ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                            }`}
                                    />
                                    {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Email ID *</label>
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="john.doe@example.com"
                                            className={`w-full px-3 py-2 border rounded text-sm outline-none transition-all ${errors.email ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                                }`}
                                        />
                                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Phone Number *</label>
                                        <input
                                            type="text"
                                            name="phone"
                                            value={formData.phone}
                                            onChange={handleChange}
                                            placeholder="+91 XXXXX XXXXX"
                                            className={`w-full px-3 py-2 border rounded text-sm outline-none transition-all ${errors.phone ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                                }`}
                                        />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Expected Admission Start Date *</label>
                                    <input
                                        type="date"
                                        name="expectedStartDate"
                                        value={formData.expectedStartDate}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded text-sm outline-none transition-all ${errors.expectedStartDate ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                            }`}
                                    />
                                    {errors.expectedStartDate && <p className="text-red-500 text-xs mt-1">{errors.expectedStartDate}</p>}
                                    <p className="text-[10px] text-gray-400 mt-1">Opportunity Stage Validation: Must not select a date in the past.</p>
                                </div>
                            </div>
                        )}

                        {/* SCREEN 2: FEE CALCULATOR */}
                        {currentScreen === 2 && (
                            <div className="space-y-5">
                                <div>
                                    <span className="text-gray-500 text-xs font-semibold uppercase">Candidate</span>
                                    <h4 className="font-bold text-gray-900 border-b pb-1.5">{formData.fullName} ({formData.email})</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Assign Course (Course__c) *</label>
                                        <select
                                            name="choiceOption1"
                                            value={formData.choiceOption1}
                                            onChange={handleChange}
                                            className={`w-full px-3 py-2 border bg-white rounded text-sm outline-none transition-all ${errors.choiceOption1 ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                                }`}
                                        >
                                            <option value="">-- Choose Course --</option>
                                            {COURSES.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        {errors.choiceOption1 && <p className="text-red-500 text-xs mt-1">{errors.choiceOption1}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">Discount percentage (%)</label>
                                        <input
                                            type="number"
                                            name="discountPercentage"
                                            value={formData.discountPercentage}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            className={`w-full px-3 py-2 border rounded text-sm outline-none transition-all ${errors.discountPercentage ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#0070d2] focus:ring-1 focus:ring-[#0070d2]"
                                                }`}
                                        />
                                        {errors.discountPercentage && <p className="text-red-500 text-xs mt-1">{errors.discountPercentage}</p>}
                                    </div>
                                </div>

                                {formData.choiceOption1 && (
                                    <div className="bg-gray-50 border p-4 rounded-md space-y-2 mt-4 text-xs font-semibold text-gray-700">
                                        <div className="flex justify-between">
                                            <span>Original Course Tuition Fee:</span>
                                            <span className="font-bold text-gray-900">₹{courseFeeVal.toLocaleString('en-IN')}</span>
                                        </div>
                                        <div className="flex justify-between border-b pb-2">
                                            <span>Applied discount:</span>
                                            <span className="font-bold text-[#123d72]">{discountVal}%</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-1">
                                            <span className="text-[#0070d2] font-bold">Formula Payable Fee:</span>
                                            <span className="font-black text-[#0070d2] text-base">₹{finalFeeVal.toLocaleString('en-IN')}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-[11px] leading-relaxed rounded">
                                    <strong>Flow Validation Rules:</strong>                                     Sample workflow rule: discounts greater than 30% require counselor review. The maximum sample discount is 50%.
                                </div>
                            </div>
                        )}

                        {/* SCREEN 3: OUTPUT/RESULT */}
                        {currentScreen === 3 && responseRecord && (
                            <div className="text-center py-6 space-y-6">
                                <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-blue-50 border-2 border-green-300 text-green-600">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>

                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Enrollment Record Created</h3>
                                    <p className="text-xs text-gray-500 mt-1">The applicant record was submitted to the configured admissions backend.</p>
                                </div>

                                <div className="border border-gray-250 bg-gray-50 max-w-sm mx-auto p-5 rounded-md text-left text-xs space-y-3 font-semibold text-gray-800">
                                    <div className="flex justify-between border-b pb-2">
                                        <span className="text-gray-500">Enrollment ID</span>
                                        <span className="font-mono text-[#123d72] font-bold">{responseRecord.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Student Candidate</span>
                                        <span>{responseRecord.fullName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Assigned Course</span>
                                        <span className="truncate max-w-[150px]">{responseRecord.courseName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Discount Added</span>
                                        <span>{responseRecord.discountPercentage}%</span>
                                    </div>
                                    <div className="flex justify-between border-t pt-2 text-sm text-[#0070d2]">
                                        <span>Final Payable Fee</span>
                                        <span className="font-black text-lg">₹{responseRecord.finalPayableAmount.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                {/* Flow routing notifications */}
                                {responseRecord.discountPercentage > 30 ? (
                                    <div className="max-w-sm mx-auto bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg text-left text-[11px] text-amber-800 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
                                            <span>Manual Review Required</span>
                                        </div>
                                        <p className="leading-relaxed">The sample discount ({responseRecord.discountPercentage}%) exceeds the 30% threshold. A counselor should review this record in the dashboard.</p>
                                    </div>
                                ) : (
                                    <div className="max-w-sm mx-auto bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-left text-[11px] text-blue-800 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <Check className="w-4 h-4 shrink-0 bg-green-600 text-white rounded-full p-0.5" />
                                            <span>Sample Approval Status: {responseRecord.approvalStatus}</span>
                                        </div>
                                        <p className="leading-relaxed">This status is generated by the sample counselor workflow; it does not represent an official admission decision or notification.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="bg-gray-50 border-t border-gray-200 py-3 px-6 flex justify-between">
                        {currentScreen === 1 && (
                            <>
                                <Link href="/counselor/dashboard">
                                    <Button variant="outline" className="border-gray-300 text-gray-700 text-xs">CANCEL</Button>
                                </Link>
                                <Button onClick={handleNext} className="bg-[#0070d2] hover:bg-[#005cb2] font-bold text-white text-xs">
                                    NEXT <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                                </Button>
                            </>
                        )}
                        {currentScreen === 2 && (
                            <>
                                <Button onClick={handleBack} variant="outline" className="border-gray-300 text-gray-700 text-xs">
                                    BACK
                                </Button>
                                <Button
                                    onClick={handleFinish}
                                    disabled={isSubmitting}
                                    className="bg-green-600 hover:bg-green-700 font-bold text-white text-xs"
                                >
                                    {isSubmitting ? "Submitting Opportunity..." : "FINISH FLOW & SYNC"}
                                </Button>
                            </>
                        )}
                        {currentScreen === 3 && (
                            <div className="flex w-full justify-between items-center gap-3">
                                <Button
                                    onClick={handleReset}
                                    variant="outline"
                                    className="flex-1 border-[#0070d2] text-[#0070d2] hover:bg-blue-50 font-bold text-xs"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> RESET SCREEN FLOW
                                </Button>
                                <Link href="/counselor/dashboard" className="flex-1">
                                    <Button className="w-full bg-[#0070d2] hover:bg-[#005cb2] text-white font-bold text-xs">
                                        RETURN TO DASHBOARD
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
}

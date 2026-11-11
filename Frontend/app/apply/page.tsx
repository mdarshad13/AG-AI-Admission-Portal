"use client"

import { useRef, useState } from "react"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { User, GraduationCap, Award, Loader2, CheckCircle2, ChevronRight, ChevronLeft, Check } from "lucide-react"
import Link from "next/link"
import { config } from "@/lib/config"
import { COURSES } from "@/lib/courses"

interface ApplicationFormData {
    // Step 1: Personal Info
    fullName: string
    dob: string
    gender: string
    nationality: string
    category: string
    email: string
    phone: string
    parentName: string
    parentPhone: string
    address: string

    // Step 2: Academic Info
    qualifyingExam: string
    entranceExam: string
    rollNumber: string
    rankScore: string
    tenthMarks: string
    twelfthMarks: string

    // Step 3: Branch Selection
    choiceActive: string
    choiceOption1: string
    choiceOption2: string
    dataAuthorization: boolean
    expectedStartDate: string
    scholarshipCategory: string
}

const initialFormData: ApplicationFormData = {
    fullName: "",
    dob: "",
    gender: "",
    nationality: "Indian",
    category: "",
    email: "",
    phone: "",
    parentName: "",
    parentPhone: "",
    address: "",
    qualifyingExam: "10+2 / Intermediate",
    entranceExam: "EAPCET",
    rollNumber: "",
    rankScore: "",
    tenthMarks: "",
    twelfthMarks: "",
    choiceActive: "btech",
    choiceOption1: "",
    choiceOption2: "",
    dataAuthorization: false,
    expectedStartDate: "",
    scholarshipCategory: "none",
}

const BTECH_BRANCHES = COURSES

const getCalculatedDiscount = (category: string, rankScore: string, exam: string): number => {
    const cleanRank = rankScore ? rankScore.replace(/[\s,]/g, "") : "";
    const rank = parseInt(cleanRank) || 50000;
    if (category === "sports") return 20;
    if (category === "ews") return 30;
    if (category === "topper") return 50;
    if (category === "merit") {
        if (exam === "APECET") {
            if (rank <= 200) return 50;
            if (rank <= 500) return 30;
            if (rank <= 1000) return 15;
            return 5;
        } else {
            if (rank <= 5000) return 50;
            if (rank <= 15000) return 30;
            if (rank <= 30000) return 15;
            return 5;
        }
    }
    return 0;
};

export default function ApplyPage() {
    const [step, setStep] = useState(1)
    const [formData, setFormData] = useState<ApplicationFormData>(initialFormData)
    const [errors, setErrors] = useState<Partial<Record<keyof ApplicationFormData, string>>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [submissionError, setSubmissionError] = useState<string | null>(null)
    const [registrationId, setRegistrationId] = useState("")
    const [documents, setDocuments] = useState<File[]>([])
    const submissionLock = useRef(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target
        const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value
        setFormData((prev) => ({ ...prev, [name]: val }))
        if (errors[name as keyof ApplicationFormData]) {
            setErrors((prev) => ({ ...prev, [name]: "" }))
        }
    }

    const validateStep = (currentStep: number): boolean => {
        const newErrors: Partial<Record<keyof ApplicationFormData, string>> = {}

        if (currentStep === 1) {
            if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required"
            if (!formData.dob) newErrors.dob = "Date of Birth is required"
            if (!formData.gender) newErrors.gender = "Gender is required"
            if (!formData.category) newErrors.category = "Category is required"
            if (!formData.email.trim()) {
                newErrors.email = "Email is required"
            } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
                newErrors.email = "Invalid email format"
            }
            if (!formData.phone.trim()) {
                newErrors.phone = "Phone number is required"
            } else if (!/^\+?[0-9]{10,12}$/.test(formData.phone.replace(/[\s-]/g, ""))) {
                newErrors.phone = "Please enter a valid 10-12 digit mobile number"
            }
            if (!formData.parentName.trim()) newErrors.parentName = "Parent's/Guardian's Name is required"
            if (!formData.parentPhone.trim()) newErrors.parentPhone = "Parent's Contact number is required"
            if (!formData.address.trim()) newErrors.address = "Address is required"
        }

        if (currentStep === 2) {
            if (!formData.rollNumber.trim()) newErrors.rollNumber = "Roll Number is required"
            if (!formData.rankScore.trim()) {
                newErrors.rankScore = "Entrance Exam Rank/Score is required"
            } else {
                const rank = Number(formData.rankScore.replace(/[,\s]/g, ""))
                if (!Number.isInteger(rank) || rank < 1) {
                    newErrors.rankScore = "Enter a valid positive entrance exam rank"
                }
            }
            if (!formData.tenthMarks.trim()) newErrors.tenthMarks = "10th Grade Marks/GPA scale is required"
            if (!formData.twelfthMarks.trim()) newErrors.twelfthMarks = "12th Grade / Intermediate Marks/GPA is required"
        }

        if (currentStep === 3) {
            if (!formData.choiceOption1) newErrors.choiceOption1 = "Primary branch preference is required"
            if (!formData.choiceOption2) newErrors.choiceOption2 = "Secondary branch preference is required"
            if (formData.choiceOption1 === formData.choiceOption2 && formData.choiceOption1) {
                newErrors.choiceOption2 = "Secondary choice cannot be identical to primary choice"
            }
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
            if (!formData.scholarshipCategory) {
                newErrors.scholarshipCategory = "Scholarship Quota selection is required"
            } else if (formData.scholarshipCategory === "merit") {
                const selectedCourse = COURSES.find(c => c.id === formData.choiceOption1)
                if (selectedCourse) {
                    const exam = formData.entranceExam
                    const cleanRank = formData.rankScore ? formData.rankScore.replace(/[\s,]/g, "") : ""
                    const rank = parseInt(cleanRank) || 0

                    if (exam === "EAPCET") {
                        if (rank > selectedCourse.cutoffEapcet) {
                            newErrors.scholarshipCategory = `Your AP EAPCET Rank (${rank}) exceeds the Merit Quota cutoff for ${selectedCourse.code} (Cutoff: ${selectedCourse.cutoffEapcet}). Please select another course or apply under General/No Scholarship.`
                        }
                    } else if (exam === "APECET") {
                        if (rank > selectedCourse.cutoffEcet) {
                            newErrors.scholarshipCategory = `Your AP ECET Rank (${rank}) exceeds the Lateral Entry merit cutoff for ${selectedCourse.code} (Cutoff: ${selectedCourse.cutoffEcet}). Please select another course or apply under General/No Scholarship.`
                        }
                    } else {
                        newErrors.scholarshipCategory = `State Merit Quota is only applicable for AP EAPCET and AP ECET candidates. For JEE/Management Quota, select General/No Scholarship.`
                    }
                }
            }
            if (!formData.dataAuthorization) {
                newErrors.dataAuthorization = "You must authorize the data submission request"
            }
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(step)) {
            setStep((prev) => prev + 1)
            window.scrollTo(0, 0)
        }
    }

    const handlePrev = () => {
        setStep((prev) => prev - 1)
        window.scrollTo(0, 0)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (submissionLock.current || !validateStep(3)) return

        submissionLock.current = true
        setIsSubmitting(true)
        setSubmissionError(null)
        try {
            const calculatedDiscount = getCalculatedDiscount(formData.scholarshipCategory, formData.rankScore, formData.entranceExam)
            const encodedDocuments = await Promise.all(documents.map(async (file) => ({
                name: file.name,
                type: file.type,
                data: await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve(String(reader.result).split(",")[1] || "")
                    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
                    reader.readAsDataURL(file)
                }),
            })))
            const response = await fetch(`${config.formSubmissionApi}api/enrollments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    email: formData.email,
                    phone: formData.phone,
                    dateOfBirth: formData.dob,
                    gender: formData.gender,
                    nationality: formData.nationality,
                    parentName: formData.parentName,
                    parentPhone: formData.parentPhone,
                    address: formData.address,
                    tenthMarks: formData.tenthMarks,
                    twelfthMarks: formData.twelfthMarks,
                    documents: encodedDocuments,
                    expectedStartDate: formData.expectedStartDate,
                    entranceExam: formData.entranceExam,
                    rollNumber: formData.rollNumber,
                    rankScore: formData.rankScore.replace(/[,\s]/g, ""),
                    choiceOption1: formData.choiceOption1,
                    choiceOption2: formData.choiceOption2,
                    category: formData.category,
                    qualifyingExam: formData.qualifyingExam,
                    scholarshipCategory: formData.scholarshipCategory,
                    dataAuthorization: formData.dataAuthorization,
                    applicationSource: "public_application",
                    discountPercentage: calculatedDiscount.toString(),
                }),
            })

            if (!response.ok) {
                const errorBody = await response.json().catch(() => null)
                throw new Error(errorBody?.error || `Application submission failed (HTTP ${response.status}).`)
            }

            const data = await response.json()
            if (typeof data.id !== "string" || !data.id) {
                throw new Error("The server did not return an application reference. Please try again.")
            }
            setRegistrationId(data.id)
            setIsSuccess(true)
        } catch (err) {
            console.error("Application submission failed:", err)
            setSubmissionError(err instanceof Error ? err.message : "Application submission failed. Please try again.")
        } finally {
            submissionLock.current = false
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <Header />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12">
                {/* Title Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-[#0f172a] tracking-tight uppercase">
                        Admission Registration Form
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm md:text-base font-medium">
                        AG AI Admissions • Student application
                    </p>
                    <div className="w-16 h-1 bg-[#1d4ed8] mx-auto mt-4 rounded-full"></div>
                </div>

                {/* Wizard Multi-Step Progress Tracker Bar */}
                {!isSuccess && (
                    <div className="mb-10 max-w-xl mx-auto flex items-center justify-between relative px-2">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gray-250 -translate-y-1/2 z-0"></div>
                        <div
                            className="absolute top-1/2 left-0 h-0.5 bg-[#1d4ed8] -translate-y-1/2 transition-all duration-300 z-0"
                            style={{ width: `${((step - 1) / 2) * 100}%` }}
                        ></div>

                        {/* Step 1 Circle */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= 1 ? "bg-[#1d4ed8] text-white ring-4 ring-blue-100" : "bg-white border-2 border-gray-300 text-gray-400"
                                    }`}
                            >
                                {step > 1 ? <Check className="w-5 h-5" /> : <User className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs mt-2 font-semibold ${step >= 1 ? "text-[#1d4ed8]" : "text-gray-400"}`}>
                                Personal Info
                            </span>
                        </div>

                        {/* Step 2 Circle */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= 2
                                    ? "bg-[#1d4ed8] text-white ring-4 ring-blue-100"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                    }`}
                            >
                                {step > 2 ? <Check className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs mt-2 font-semibold ${step >= 2 ? "text-[#1d4ed8]" : "text-gray-400"}`}>
                                Academics
                            </span>
                        </div>

                        {/* Step 3 Circle */}
                        <div className="relative z-10 flex flex-col items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step === 3
                                    ? "bg-[#123d72] text-white ring-4 ring-blue-100"
                                    : "bg-white border-2 border-gray-300 text-gray-400"
                                    }`}
                            >
                                <Award className="w-5 h-5" />
                            </div>
                            <span className={`text-xs mt-2 font-semibold ${step === 3 ? "text-[#123d72]" : "text-gray-400"}`}>
                                Preference
                            </span>
                        </div>
                    </div>
                )}

                {isSuccess ? (
                    /* SUCCESS SCREEN CARD */
                    <Card className="border-t-8 border-[#1d4ed8] shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 bg-white">
                        <CardContent className="pt-10 pb-8 text-center px-6">
                            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-[#1d4ed8]">
                                <CheckCircle2 className="w-14 h-14" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">
                                Application Submitted Successfully!
                            </h2>
                            <p className="text-gray-500 mt-2 max-w-md mx-auto text-sm md:text-base">
                                Your application has been saved. Keep your application reference for your records.
                            </p>
                            <p className="mt-3 inline-flex rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                                Status: Pending counselor review
                            </p>

                            {/* Mock Application Ticket Display Box */}
                            <div className="my-8 bg-[#0f172a]/5 p-6 rounded-2xl border border-gray-250 max-w-md mx-auto text-left">
                                <div className="grid grid-cols-2 gap-y-4 text-sm">
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">Applicant Name</span>
                                        <span className="font-bold text-gray-900 text-base">{formData.fullName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">Registration ID</span>
                                        <span className="font-mono font-bold text-[#123d72] text-base">{registrationId}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">First Choice Branch</span>
                                        <span className="font-bold text-gray-900">
                                            {BTECH_BRANCHES.find((b) => b.id === formData.choiceOption1)?.code || "CSE"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 block text-xs uppercase tracking-wider font-semibold">Entrance Exam Rank</span>
                                        <span className="font-bold text-gray-900">{formData.entranceExam} Rank {formData.rankScore}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Steps Guidance Alerts */}
                            <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 p-4 rounded-xl text-left text-sm text-blue-800 mb-8 space-y-2">
                                <p className="font-bold">Next Steps for Verification:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                    <li>This sample portal does not send automatic email or WhatsApp follow-ups.</li>
                                    <li>Please keep original certificates of 10th and Intermediate marks ready.</li>
                                    <li>Classroom orientation schedules will be dispatched post-seat assignment.</li>
                                </ul>
                            </div>

                            <div className="flex justify-center gap-4">
                                <Link href="/">
                                    <Button className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold px-6 py-2">
                                        RETURN TO HOME
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    /* FORM MULTI-STEP CARD */
                    <Card className="shadow-lg border-gray-200 bg-white">
                        <form onSubmit={handleSubmit}>
                            <CardHeader className="border-b border-gray-100 bg-gray-50/50 py-4 px-6">
                                <CardTitle className="text-lg md:text-xl font-bold text-gray-900">
                                    {step === 1 && "Personal & Contact Information"}
                                    {step === 2 && "Academic Records / Examination Credentials"}
                                    {step === 3 && "Course / Specialization Selection"}
                                </CardTitle>
                                <CardDescription className="text-xs md:text-sm">
                                    {step === 1 && "Enter details exactly as they appear on your identification cards."}
                                    {step === 2 && "Provided entrance exams rank/scores are cross-referenced during verification."}
                                    {step === 3 && "Review specialization combinations and give consent to submit."}
                                </CardDescription>
                            </CardHeader>

                            <CardContent className="p-6 md:p-8">
                                {submissionError && (
                                    <p className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                                        {submissionError}
                                    </p>
                                )}
                                {/* STEP 1 FIELDS */}
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Full Name (as per Certificates) <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="fullName"
                                                    value={formData.fullName}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.fullName ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. John Doe"
                                                />
                                                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Date of Birth <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="dob"
                                                    value={formData.dob}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.dob ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                />
                                                {errors.dob && <p className="text-red-500 text-xs mt-1">{errors.dob}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Gender <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="gender"
                                                    value={formData.gender}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none bg-white transition-all ${errors.gender ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                >
                                                    <option value="">Select Gender</option>
                                                    <option value="Male">Male</option>
                                                    <option value="Female">Female</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                                {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none bg-white transition-all ${errors.category ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                >
                                                    <option value="">Select Category</option>
                                                    <option value="OC">OC (Open Competition)</option>
                                                    <option value="BC-A">BC-A</option>
                                                    <option value="BC-B">BC-B</option>
                                                    <option value="BC-D">BC-D</option>
                                                    <option value="BC-E">BC-E</option>
                                                    <option value="SC">SC</option>
                                                    <option value="ST">ST</option>
                                                    <option value="EWS">EWS</option>
                                                </select>
                                                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Email Address <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.email ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. email@domain.com"
                                                />
                                                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Mobile Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.phone ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 9876543210"
                                                />
                                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Parent's/Guardian's Name <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="parentName"
                                                    value={formData.parentName}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.parentName ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. Robert Doe"
                                                />
                                                {errors.parentName && <p className="text-red-500 text-xs mt-1">{errors.parentName}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Parent's Mobile Number <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="parentPhone"
                                                    value={formData.parentPhone}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.parentPhone ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 9876543211"
                                                />
                                                {errors.parentPhone && <p className="text-red-500 text-xs mt-1">{errors.parentPhone}</p>}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                Permanent Address <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                name="address"
                                                value={formData.address}
                                                onChange={handleChange}
                                                rows={3}
                                                className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.address ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                    }`}
                                                placeholder="House No, Street name, City, State, ZIP code"
                                            />
                                            {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2 FIELDS */}
                                {step === 2 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Qualifying Examination <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="qualifyingExam"
                                                    value={formData.qualifyingExam}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all"
                                                >
                                                    <option value="10+2 / Intermediate">10+2 / Intermediate</option>
                                                    <option value="CBSE Grade 12">CBSE Grade 12</option>
                                                    <option value="ICSE Grade 12">ICSE Grade 12</option>
                                                    <option value="Diploma (Polytechnic)">Diploma (Polytechnic) - Lateral Entry</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Entrance Exam Type <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="entranceExam"
                                                    value={formData.entranceExam}
                                                    onChange={handleChange}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm outline-none bg-white focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all"
                                                >
                                                    <option value="EAPCET">AP EAPCET</option>
                                                    <option value="APECET">AP ECET (Lateral Entry)</option>
                                                    <option value="JEE Main">JEE Main</option>
                                                    <option value="Management Quota">Management Quota (No Rank)</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Entrance Exam Roll / Hall-ticket No. <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="rollNumber"
                                                    value={formData.rollNumber}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.rollNumber ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 261890372"
                                                />
                                                {errors.rollNumber && <p className="text-red-500 text-xs mt-1">{errors.rollNumber}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Entrance Rank / Percentile Score <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="rankScore"
                                                    value={formData.rankScore}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.rankScore ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 15423"
                                                />
                                                {errors.rankScore && <p className="text-red-500 text-xs mt-1">{errors.rankScore}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    10th Grade Marks/GPA Score <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="tenthMarks"
                                                    value={formData.tenthMarks}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.tenthMarks ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 9.8 GPA or 95%"
                                                />
                                                {errors.tenthMarks && <p className="text-red-500 text-xs mt-1">{errors.tenthMarks}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    12th Grade / Intermediate Marks/GPA <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    name="twelfthMarks"
                                                    value={formData.twelfthMarks}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.twelfthMarks ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                    placeholder="e.g. 962 / 1000 or 95%"
                                                />
                                                {errors.twelfthMarks && <p className="text-red-500 text-xs mt-1">{errors.twelfthMarks}</p>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3 FIELDS */}
                                {step === 3 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Primary Course Choice <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="choiceOption1"
                                                    value={formData.choiceOption1}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none bg-white transition-all ${errors.choiceOption1 ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                >
                                                    <option value="">Select First Choice</option>
                                                    {BTECH_BRANCHES.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.choiceOption1 && <p className="text-red-500 text-xs mt-1">{errors.choiceOption1}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Secondary Course Choice <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="choiceOption2"
                                                    value={formData.choiceOption2}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none bg-white transition-all ${errors.choiceOption2 ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                >
                                                    <option value="">Select Second Choice</option>
                                                    {BTECH_BRANCHES.map((b) => (
                                                        <option key={b.id} value={b.id}>
                                                            {b.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.choiceOption2 && <p className="text-red-500 text-xs mt-1">{errors.choiceOption2}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Expected Start Date <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="date"
                                                    name="expectedStartDate"
                                                    value={formData.expectedStartDate}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none transition-all ${errors.expectedStartDate ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                />
                                                {errors.expectedStartDate && <p className="text-red-500 text-xs mt-1">{errors.expectedStartDate}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-xs md:text-sm font-semibold text-gray-700 mb-1.5">
                                                    Scholarship Quota / Category <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    name="scholarshipCategory"
                                                    value={formData.scholarshipCategory}
                                                    onChange={handleChange}
                                                    className={`w-full px-3 py-2 border rounded-md text-sm outline-none bg-white transition-all ${errors.scholarshipCategory ? "border-red-500 focus:ring-1 focus:ring-red-500" : "border-gray-300 focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8]"
                                                        }`}
                                                >
                                                    <option value="none">General / No Scholarship (0%)</option>
                                                    <option value="merit">Merit Quota (Automatic based on Entrance Rank)</option>
                                                    <option value="sports">Sports Quota (20% Waiver)</option>
                                                    <option value="ews">EWS - Economically Weaker Section (30% Waiver)</option>
                                                    <option value="topper">Board Topper - 12th Grade 95%+ (50% Waiver)</option>
                                                </select>
                                                {errors.scholarshipCategory && <p className="text-red-500 text-xs mt-1">{errors.scholarshipCategory}</p>}
                                            </div>
                                        </div>

                                        {formData.choiceOption1 && (() => {
                                            const selectedCourse = COURSES.find((b) => b.id === formData.choiceOption1)
                                            const courseFee = selectedCourse ? selectedCourse.fee : 0
                                            const discountPercent = getCalculatedDiscount(formData.scholarshipCategory, formData.rankScore, formData.entranceExam)
                                            const finalPayableAmount = Math.max(0, courseFee * (1 - (discountPercent / 100)))

                                            return (
                                                <div className="bg-[#1d4ed8]/10 p-5 rounded-xl border border-[#1d4ed8]/30 text-sm grid grid-cols-3 gap-4 animate-in fade-in duration-200">
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase font-medium">Standard Tuition Fee</span>
                                                        <span className="font-bold text-gray-900 text-lg">₹{courseFee.toLocaleString('en-IN')}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-xs uppercase font-medium">Applied Discount (%)</span>
                                                        <span className="font-bold text-[#123d72] text-lg">{discountPercent}%</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500 block text-[#1d4ed8] text-xs uppercase font-semibold">Final Payable Fee</span>
                                                        <span className="font-extrabold text-[#1d4ed8] text-lg">₹{finalPayableAmount.toLocaleString('en-IN')}</span>
                                                    </div>
                                                </div>
                                            )
                                        })()}

                                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-slate-600 md:text-sm">
                                                            <label htmlFor="application-documents" className="mb-2 block font-semibold text-slate-800">Supporting documents (optional)</label>
                                                            <input
                                                                id="application-documents"
                                                                type="file"
                                                                accept="application/pdf,image/jpeg,image/png"
                                                                multiple
                                                                onChange={(event) => {
                                                                    const selected = Array.from(event.target.files || [])
                                                                    const valid = selected.length <= 3 && selected.every((file) =>
                                                                        ["application/pdf", "image/jpeg", "image/png"].includes(file.type) && file.size <= 2 * 1024 * 1024
                                                                    )
                                                                    if (!valid) {
                                                                        setSubmissionError("Choose up to 3 PDF/JPG/PNG files, each no larger than 2 MB.")
                                                                        event.target.value = ""
                                                                        setDocuments([])
                                                                        return
                                                                    }
                                                                    setSubmissionError(null)
                                                                    setDocuments(selected)
                                                                }}
                                                                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-100 file:px-4 file:py-2 file:font-semibold file:text-blue-900 hover:file:bg-blue-200"
                                                            />
                                                            <p className="mt-2 text-xs text-slate-500">PDF, JPEG, or PNG only. Maximum 3 files, 2 MB each. Files are stored privately by the local backend.</p>
                                                            {documents.length > 0 && <p className="mt-1 text-xs font-medium text-slate-700">{documents.map((file) => file.name).join(", ")}</p>}
                                                        </div>

                                                        <div className="bg-[#0f172a]/5 p-4 rounded-xl text-gray-600 text-xs md:text-sm leading-relaxed border border-gray-200">
                                            <p className="font-semibold text-gray-800 mb-1">Declaration & Authorization:</p>
                                                            I confirm that the information provided is accurate and authorize AG AI Admissions to process this application. Contact and messaging features depend on configured backend integrations.
                                        </div>

                                        <div className="flex items-start gap-2.5">
                                            <input
                                                type="checkbox"
                                                id="dataAuthorization"
                                                name="dataAuthorization"
                                                checked={formData.dataAuthorization}
                                                onChange={handleChange}
                                                className="mt-1 accent-[#1d4ed8]"
                                            />
                                            <label htmlFor="dataAuthorization" className="text-xs md:text-sm text-gray-600 select-none">
                                                I confirm and authorize my academic data submission. <span className="text-red-500">*</span>
                                            </label>
                                        </div>
                                        {errors.dataAuthorization && <p className="text-red-500 text-xs">{errors.dataAuthorization}</p>}
                                    </div>
                                )}
                            </CardContent>

                            <CardFooter className="border-t border-gray-100 bg-gray-50/50 py-4 px-6 flex justify-between">
                                {step > 1 ? (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handlePrev}
                                        disabled={isSubmitting}
                                        className="border-[#1d4ed8] text-[#1d4ed8] hover:bg-[#1d4ed8] hover:text-white"
                                    >
                                        <ChevronLeft className="w-4 h-4 mr-2" /> BACK
                                    </Button>
                                ) : (
                                    <div></div>
                                )}

                                {step < 3 ? (
                                    <Button
                                        type="button"
                                        onClick={handleNext}
                                        className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white"
                                    >
                                        NEXT <ChevronRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-[#123d72] hover:bg-[#1d4ed8] text-white font-bold"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> SUBMITTING
                                            </>
                                        ) : (
                                            "SUBMIT APPLICATION"
                                        )}
                                    </Button>
                                )}
                            </CardFooter>
                        </form>
                    </Card>
                )}
            </main>
        </div>
    )
}

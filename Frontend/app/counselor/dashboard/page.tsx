"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    AlertTriangle,
    Sparkles,
    ChevronRight,
    ArrowLeft,
    Plus,
    RotateCw,
    TrendingUp,
    LogOut,
    Search,
    Download
} from "lucide-react"
import Link from "next/link"
import { config } from "@/lib/config"

interface EnrollmentItem {
    id: string
    fullName: string
    email: string
    phone: string
    expectedStartDate: string
    choiceOption1: string
    courseName: string
    courseCategory: string
    courseFee: number
    discountPercentage: number
    finalPayableAmount: number
    enrollmentStatus: string
    approvalStatus: string
    aiPriorityScore: number
    riskLevel: string
    createdDate: string
    applicantDetails?: {
        dateOfBirth?: string | null
        gender?: string | null
        nationality?: string | null
        parentName?: string | null
        parentPhone?: string | null
        address?: string | null
        tenthMarks?: string | null
        twelfthMarks?: string | null
        documents?: Array<{ name: string; type: string; size: number; storageName: string }>
    }
}

interface CounselorInsightResponse {
    id: string
    studentApplicationSummary: string
    admissionRiskAnalysis: string
}

export default function CounselorDashboard() {
    const [enrollments, setEnrollments] = useState<EnrollmentItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isDemoData, setIsDemoData] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentItem | null>(null)
    const [aiInsights, setAiInsights] = useState<CounselorInsightResponse | null>(null)
    const [loadingInsights, setLoadingInsights] = useState(false)
    const [isActionInProgress, setIsActionInProgress] = useState(false)

    const handleDownloadDocument = async (documentRecord: { name: string; storageName: string }) => {
        if (!selectedEnrollment) return
        try {
            const token = sessionStorage.getItem("counselor_auth") || ""
            const response = await fetch(`${config.formSubmissionApi}api/enrollments/${selectedEnrollment.id}/documents/${encodeURIComponent(documentRecord.storageName)}`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (!response.ok) throw new Error("Document download failed. Check your session and try again.")
            const objectUrl = URL.createObjectURL(await response.blob())
            const link = document.createElement("a")
            link.href = objectUrl
            link.download = documentRecord.name
            link.click()
            URL.revokeObjectURL(objectUrl)
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Could not download the document.")
        }
    }

    // Search and Filter states
    const [searchQuery, setSearchQuery] = useState("")
    const [branchFilter, setBranchFilter] = useState("all")
    const [statusFilter, setStatusFilter] = useState("all")

    const handleLogout = () => {
        sessionStorage.removeItem("counselor_auth")
        window.location.href = "/counselor/login"
    }

    const filteredEnrollments = enrollments.filter(enr => {
        const matchesQuery = enr.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            enr.email.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesBranch = branchFilter === "all" || enr.choiceOption1.toLowerCase() === branchFilter.toLowerCase()

        const matchesStatus = statusFilter === "all" || enr.approvalStatus.toLowerCase() === statusFilter.toLowerCase()

        return matchesQuery && matchesBranch && matchesStatus
    })

    // Clearly labeled sample records make the counselor workflow explorable without applicant data.
    const seedMockData: EnrollmentItem[] = [
        {
            id: "ENR-SEED101",
            fullName: "Jeffry S. Kumar",
            email: "jeffry.s@example.com",
            phone: "+91 98452 11029",
            expectedStartDate: new Date(Date.now() + 604800000 * 2).toISOString().split("T")[0],
            choiceOption1: "cse-aiml",
            courseName: "CSE (Artificial Intelligence & Machine Learning)",
            courseCategory: "Technical",
            courseFee: 125000,
            discountPercentage: 35,
            finalPayableAmount: 81250,
            enrollmentStatus: "Submitted for Approval",
            approvalStatus: "Pending",
            aiPriorityScore: 87,
            riskLevel: "High",
            createdDate: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: "ENR-SEED102",
            fullName: "Rohit Verma",
            email: "rohitv@example.com",
            phone: "+91 70291 00392",
            expectedStartDate: new Date(Date.now() + 604800000).toISOString().split("T")[0],
            choiceOption1: "ece",
            courseName: "Electronics & Communication Engineering (ECE)",
            courseCategory: "Technical",
            courseFee: 105000,
            discountPercentage: 10,
            finalPayableAmount: 94500,
            enrollmentStatus: "Approved",
            approvalStatus: "Approved",
            aiPriorityScore: 55,
            riskLevel: "Low",
            createdDate: new Date(Date.now() - 172800000).toISOString()
        },
        {
            id: "ENR-SEED103",
            fullName: "Swapna Reddy",
            email: "swapna.r@example.com",
            phone: "+91 88992 00192",
            expectedStartDate: new Date(Date.now() + 604800000 * 3).toISOString().split("T")[0],
            choiceOption1: "cse",
            courseName: "Computer Science & Engineering (CSE)",
            courseCategory: "Technical",
            courseFee: 125000,
            discountPercentage: 0,
            finalPayableAmount: 125000,
            enrollmentStatus: "Approved",
            approvalStatus: "Approved",
            aiPriorityScore: 91,
            riskLevel: "Low",
            createdDate: new Date(Date.now() - 345600000).toISOString()
        },
        {
            id: "ENR-SEED104",
            fullName: "Ananya Sen",
            email: "ananya.sen@example.com",
            phone: "+91 97728 11985",
            expectedStartDate: new Date(Date.now()).toISOString().split("T")[0],
            choiceOption1: "mech",
            courseName: "Mechanical Engineering (ME)",
            courseCategory: "Technical",
            courseFee: 95000,
            discountPercentage: 45,
            finalPayableAmount: 52250,
            enrollmentStatus: "Rejected",
            approvalStatus: "Rejected",
            aiPriorityScore: 42,
            riskLevel: "High",
            createdDate: new Date(Date.now() - 518400000).toISOString()
        }
    ]

    const fetchEnrollments = async () => {
        setLoading(true)
        setLoadError(null)
        try {
            const token = sessionStorage.getItem("counselor_auth") || ""
            const res = await fetch(`${config.formSubmissionApi}api/enrollments`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            if (!res.ok) {
                throw new Error(`Could not load admissions records (HTTP ${res.status}).`)
            }
            const data = await res.json()
            if (!Array.isArray(data)) {
                throw new Error("The admissions API returned an invalid response.")
            }
            if (data.length > 0) {
                setEnrollments(data)
                setIsDemoData(false)
            } else {
                setEnrollments(seedMockData)
                setIsDemoData(true)
            }
        } catch (e) {
            console.error("Failed to load admissions records:", e)
            setEnrollments([])
            setIsDemoData(false)
            setLoadError(e instanceof Error ? e.message : "Could not load admissions records.")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEnrollments()
    }, [])

    const handleSelectRow = async (enrollment: EnrollmentItem) => {
        setSelectedEnrollment(enrollment)
        setLoadingInsights(true)
        setAiInsights(null)
        try {
            // Check if mock seed data insights are requested - handle locally as safe fallback
            if (enrollment.id.startsWith("ENR-SEED")) {
                await new Promise((resolve) => setTimeout(resolve, 800))
                const studentName = enrollment.fullName
                const courseName = enrollment.courseName
                const courseFee = enrollment.courseFee
                const discount = enrollment.discountPercentage
                const finalPayable = enrollment.finalPayableAmount
                const status = enrollment.enrollmentStatus
                const reviewScore = enrollment.aiPriorityScore
                const riskLevel = enrollment.riskLevel

                setAiInsights({
                    id: enrollment.id,
                    studentApplicationSummary: `Sample Student Application Summary:
* Applicant Name: ${studentName}
* Choice Course: ${courseName} (Standard fee: ₹${courseFee.toLocaleString('en-IN')})
* Financial Structure: Applied discount of ${discount}% resulting in a Final Payable Amount of ₹${finalPayable.toLocaleString('en-IN')}.
* Admission Status: The application is currently flagged as "${status}".
* Demonstration review score: ${reviewScore}/100 (sample value, not an AI decision).
* Review flag: ${discount > 30 ? "High sample discount; review manually." : "No high-discount sample flag."}`,

                    admissionRiskAnalysis: `Sample Counselor Review:
1. This demonstration does not calculate an admission probability.
2. Discount review: ${discount > 30 ? "Manual review recommended for this sample discount." : "No high-discount sample flag."}.
3. Overall Enrollment Health: ${riskLevel} Risk.
4. This rule-based sample is not an AI assessment or official admission decision. Verify all applicant details and published policies before taking action.`
                })
            } else {
                const token = sessionStorage.getItem("counselor_auth") || ""
                const res = await fetch(`${config.formSubmissionApi}api/enrollments/ai-insights?id=${enrollment.id}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                })
                if (res.ok) {
                    const data = await res.json()
                    setAiInsights(data)
                }
            }
        } catch (err) {
            console.error("Failed fetching counselor review summary:", err)
        } finally {
            setLoadingInsights(false)
        }
    }

    const handleAction = async (action: "approve" | "reject") => {
        if (!selectedEnrollment) return
        setIsActionInProgress(true)
        try {
            // Seed check
            if (selectedEnrollment.id.startsWith("ENR-SEED")) {
                await new Promise((resolve) => setTimeout(resolve, 600))
                const updatedList = enrollments.map(e => {
                    if (e.id === selectedEnrollment.id) {
                        return {
                            ...e,
                            approvalStatus: action === "approve" ? "Approved" : "Rejected",
                            enrollmentStatus: action === "approve" ? "Approved" : "Rejected"
                        }
                    }
                    return e
                })
                setEnrollments(updatedList)
                setSelectedEnrollment({
                    ...selectedEnrollment,
                    approvalStatus: action === "approve" ? "Approved" : "Rejected",
                    enrollmentStatus: action === "approve" ? "Approved" : "Rejected"
                })
            } else {
                const token = sessionStorage.getItem("counselor_auth") || ""
                const res = await fetch(`${config.formSubmissionApi}api/enrollments/action`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ id: selectedEnrollment.id, action })
                })
                const data = await res.json().catch(() => null)
                if (!res.ok) throw new Error(data?.error || `Could not update application (HTTP ${res.status}).`)
                const updatedList = enrollments.map(e => e.id === data.id ? data : e)
                setEnrollments(updatedList)
                setSelectedEnrollment(data)
            }
        } catch (e) {
            console.error("Action error:", e)
            setLoadError(e instanceof Error ? e.message : "Could not update the application.")
        } finally {
            setIsActionInProgress(false)
        }
    }

    // Counters
    const totalCount = enrollments.length
    const pendingCount = enrollments.filter(e => e.approvalStatus === "Pending").length
    const approvedCount = enrollments.filter(e => e.approvalStatus === "Approved").length
    const rejectedCount = enrollments.filter(e => e.approvalStatus === "Rejected").length

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
            <Header />

            {/* Dashboard Header Bar */}
            <div className="bg-[#0f172a] text-white py-8 px-4 md:px-8 border-b-4 border-[#1d4ed8]">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-xs md:text-sm text-[#1d4ed8] font-bold tracking-wider uppercase mb-1">
                            <Sparkles className="w-4 h-4 animate-pulse" /> AG AI Admissions
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black tracking-tight">
                            Counselor Admissions Drawer
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            onClick={fetchEnrollments}
                            variant="outline"
                            className="bg-transparent border-gray-700 text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                            <RotateCw className="w-4 h-4 mr-2" /> REFRESH
                        </Button>
                        <Link href="/counselor/enroll">
                            <Button className="bg-[#123d72] hover:bg-[#1d4ed8] text-white font-bold">
                                <Plus className="w-4 h-4 mr-2" /> NEW ENROLLMENT SCREEN FLOW
                            </Button>
                        </Link>
                        <Button
                            onClick={handleLogout}
                            className="bg-red-650 hover:bg-red-755 text-white font-bold border border-red-500"
                        >
                            <LogOut className="w-4 h-4 mr-2" /> SIGN OUT
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Workspace */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-8">
                {loadError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700" role="alert">
                        {loadError} Check the backend connection and counselor environment settings, then refresh.
                    </div>
                )}
                {isDemoData && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                        Demo records are shown because the admissions store is empty. These sample records are not real applications.
                    </div>
                )}
                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="shadow-sm border-l-4 border-l-gray-400 bg-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Total Applications</p>
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-1">{totalCount}</h3>
                            </div>
                            <div className="bg-gray-100 p-2.5 rounded-full text-gray-500">
                                <Users className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-[#123d72] bg-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Approval Queue</p>
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-1">{pendingCount}</h3>
                            </div>
                            <div className="bg-[#123d72]/10 p-2.5 rounded-full text-[#123d72]">
                                <Clock className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-l-4 border-l-[#1d4ed8] bg-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Seat Assignments</p>
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-1">{approvedCount}</h3>
                            </div>
                            <div className="bg-[#1d4ed8]/10 p-2.5 rounded-full text-[#1d4ed8]">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>

                            <Card className="shadow-sm border-l-4 border-l-red-500 bg-white">
                        <CardContent className="p-5 flex items-center justify-between">
                            <div>
                                <p className="text-gray-500 text-xs md:text-sm font-semibold uppercase tracking-wide">Rejected Applications</p>
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 mt-1">{rejectedCount}</h3>
                            </div>
                            <div className="bg-red-50 p-2.5 rounded-full text-red-500">
                                <XCircle className="w-6 h-6" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Queue & Sidebar Drawer Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Enrollment Table Queue */}
                    <div className="lg:col-span-8 space-y-4">
                        <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-xs space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-800 text-base">Admission Records Queue</span>
                                <span className="text-xs text-gray-500">Click a record to view a rule-based sample review</span>
                            </div>

                            {/* Search and Filters */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-gray-100">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search name/email..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all bg-gray-50/50"
                                    />
                                </div>
                                <div>
                                    <select
                                        value={branchFilter}
                                        onChange={(e) => setBranchFilter(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all bg-white text-gray-700"
                                    >
                                        <option value="all">All Courses</option>
                                        <option value="cse">CSE (General)</option>
                                        <option value="cse-aiml">CSE (AI & ML)</option>
                                        <option value="ece">ECE</option>
                                        <option value="mech">Mechanical</option>
                                    </select>
                                </div>
                                <div>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-xs outline-none focus:border-[#1d4ed8] focus:ring-1 focus:ring-[#1d4ed8] transition-all bg-white text-gray-700"
                                    >
                                        <option value="all">All status</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white p-12 text-center border rounded-xl flex flex-col items-center gap-3">
                                <RotateCw className="w-8 h-8 text-[#1d4ed8] animate-spin" />
                                <span className="text-gray-500 text-sm">Loading sample applications from the admissions backend...</span>
                            </div>
                        ) : enrollments.length === 0 ? (
                            <div className="bg-white p-12 text-center border rounded-xl">
                                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <h4 className="font-bold text-gray-700">No Applications Found</h4>
                                <p className="text-gray-400 text-xs mt-1">Submit applications from the Apply wizard to populate.</p>
                            </div>
                        ) : (
                            <div className="bg-white border rounded-xl shadow-sm overflow-hidden overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wider font-semibold">
                                            <th className="px-5 py-3">Applicant Status</th>
                                            <th className="px-5 py-3">Student Name</th>
                                            <th className="px-5 py-3">First Option</th>
                                            <th className="px-5 py-3 select-none">Discount Fee</th>
                                            <th className="px-5 py-3">Sample Review Score</th>
                                            <th className="px-5 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y text-sm">
                                        {filteredEnrollments.map((enr) => {
                                            const isSelected = selectedEnrollment?.id === enr.id
                                            return (
                                                <tr
                                                    key={enr.id}
                                                    onClick={() => handleSelectRow(enr)}
                                                    className={`hover:bg-gray-50/80 cursor-pointer transition-colors ${isSelected ? "bg-[#1d4ed8]/5 hover:bg-[#1d4ed8]/10" : ""}`}
                                                >
                                                    <td className="px-5 py-4">
                                                        <div className="flex flex-col">
                                                            <span className="font-mono text-[10px] text-gray-400 font-semibold">{enr.id}</span>
                                                            <span className={`inline-flex items-center gap-1 w-max px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${enr.approvalStatus === "Approved"
                                                                ? "bg-blue-50 text-green-700 border border-blue-200"
                                                                : enr.approvalStatus === "Rejected"
                                                                    ? "bg-red-50 text-red-700 border border-red-200"
                                                                    : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                                                                }`}>
                                                                {enr.approvalStatus === "Approved" && <CheckCircle2 className="w-2.5 h-2.5" />}
                                                                {enr.approvalStatus === "Rejected" && <XCircle className="w-2.5 h-2.5" />}
                                                                {enr.approvalStatus === "Pending" && <Clock className="w-2.5 h-2.5 animate-pulse" />}
                                                                {enr.approvalStatus}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-bold text-gray-900">{enr.fullName}</div>
                                                        <div className="text-gray-400 text-xs font-medium">{enr.email}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-semibold text-gray-800 uppercase text-xs">{enr.choiceOption1}</div>
                                                        <div className="text-gray-400 text-[11px] truncate max-w-[150px]">{enr.courseName}</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="font-black text-gray-900">₹{enr.finalPayableAmount.toLocaleString('en-IN')}</div>
                                                        <div className="text-gray-400 text-[11px] font-medium">Fee: ₹{enr.courseFee.toLocaleString('en-IN')} ({enr.discountPercentage}% off)</div>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${enr.aiPriorityScore >= 80
                                                                ? "bg-red-50 border-red-200 text-red-600 font-extrabold"
                                                                : "bg-blue-50 border-blue-200 text-blue-600"
                                                                }`}>
                                                                {enr.aiPriorityScore}
                                                            </div>
                                                            {enr.aiPriorityScore >= 80 && (
                                                                <span className="bg-red-500 text-white font-extrabold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-xs animate-pulse">
                                                                    ALERT RUN
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${isSelected ? "transform translate-x-1 text-[#1d4ed8]" : ""}`} />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Sample counselor review panel */}
                    <div className="lg:col-span-4">
                        {selectedEnrollment ? (
                            <Card className="shadow-md border-t-8 border-t-[#1d4ed8] bg-white rounded-xl overflow-hidden animate-in fade-in slide-in-from-right-5 duration-200">
                                <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4 px-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider">{selectedEnrollment.id}</span>
                                            <CardTitle className="text-lg font-black text-gray-900 mt-0.5">{selectedEnrollment.fullName}</CardTitle>
                                        </div>
                                        <button
                                            onClick={() => setSelectedEnrollment(null)}
                                            className="text-gray-400 hover:text-gray-600 text-xs font-semibold uppercase tracking-wider"
                                        >
                                            CLOSE
                                        </button>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 space-y-6">
                                    {/* Enrollment summary */}
                                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-xl text-xs border border-gray-200/50">
                                        <div>
                                            <span className="text-gray-400 block uppercase font-medium">Expected Date</span>
                                            <span className="font-bold text-gray-800">{new Date(selectedEnrollment.expectedStartDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 block uppercase font-medium">Risk Status</span>
                                            <span className={`font-bold inline-flex items-center gap-1 ${selectedEnrollment.riskLevel === "High" ? "text-red-600" : selectedEnrollment.riskLevel === "Medium" ? "text-yellow-600" : "text-green-600"
                                                }`}>
                                                <TrendingUp className="w-3.5 h-3.5" /> {selectedEnrollment.riskLevel} Risk
                                            </span>
                                        </div>
                                    </div>

                                    {selectedEnrollment.applicantDetails && (
                                        <div className="space-y-3 rounded-xl border border-slate-200 p-4 text-xs text-slate-700">
                                            <h3 className="font-bold text-slate-900">Applicant details</h3>
                                            <p><strong>Date of birth:</strong> {selectedEnrollment.applicantDetails.dateOfBirth || "Not provided"}</p>
                                            <p><strong>Guardian:</strong> {selectedEnrollment.applicantDetails.parentName || "Not provided"} {selectedEnrollment.applicantDetails.parentPhone ? `· ${selectedEnrollment.applicantDetails.parentPhone}` : ""}</p>
                                            <p><strong>Address:</strong> {selectedEnrollment.applicantDetails.address || "Not provided"}</p>
                                            <p><strong>Academic results:</strong> Grade 10 {selectedEnrollment.applicantDetails.tenthMarks || "—"} · Grade 12 {selectedEnrollment.applicantDetails.twelfthMarks || "—"}</p>
                                            {!!selectedEnrollment.applicantDetails.documents?.length && (
                                                <div className="space-y-2 border-t border-slate-100 pt-3">
                                                    <p className="font-semibold">Supporting documents</p>
                                                    {selectedEnrollment.applicantDetails.documents.map((documentRecord) => (
                                                        <button key={documentRecord.storageName} type="button" onClick={() => handleDownloadDocument(documentRecord)} className="flex items-center gap-2 text-blue-800 hover:underline">
                                                            <Download className="h-4 w-4" /> {documentRecord.name} ({Math.ceil(documentRecord.size / 1024)} KB)
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Workflow Buttons if Pending */}
                                    {selectedEnrollment.approvalStatus === "Pending" && (
                                        <div className="border border-[#123d72]/30 bg-[#123d72]/5 p-4 rounded-xl space-y-3">
                                            <div className="flex gap-2 text-xs text-[#123d72] font-bold">
                                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                                <span>Manager Approval Override Required (Discount Percentage &gt; 30%)</span>
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <Button
                                                    disabled={isActionInProgress}
                                                    onClick={() => handleAction("approve")}
                                                    className="flex-1 bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-bold text-xs"
                                                >
                                                    {isActionInProgress ? "Processing..." : "APPROVE DISCOUNTS"}
                                                </Button>
                                                <Button
                                                    disabled={isActionInProgress}
                                                    onClick={() => handleAction("reject")}
                                                    variant="outline"
                                                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50 font-bold text-xs"
                                                >
                                                    {isActionInProgress ? "Processing..." : "REJECT APPLICATION"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {/* Rule-based review summary */}
                                    <div className="border-t pt-5">
                                        <div className="flex items-center gap-2 text-xs font-black text-[#1d4ed8] tracking-wider uppercase mb-3">
                                            <Sparkles className="w-4 h-4 animate-spin text-[#123d72]" /> Rule-Based Sample Review
                                        </div>

                                        {loadingInsights ? (
                                            <div className="py-8 text-center flex flex-col items-center gap-2">
                                                <RotateCw className="w-6 h-6 text-[#1d4ed8] animate-spin" />
                                                <span className="text-gray-400 text-xs">Loading sample review notes...</span>
                                            </div>
                                        ) : aiInsights ? (
                                            <div className="space-y-5 text-xs text-gray-700 leading-relaxed font-mono bg-[#0f172a]/5 p-4 rounded-xl border border-gray-200">
                                                <div>
                                                    <div className="font-bold text-[#123d72] uppercase text-[10px] mb-1.5 flex items-center gap-1.5 border-b pb-0.5">
                                                        <span>Student Application Summary</span>
                                                    </div>
                                                    <div className="whitespace-pre-wrap font-medium">{aiInsights.studentApplicationSummary}</div>
                                                </div>
                                                <div className="border-t pt-4">
                                                    <div className="font-bold text-[#1d4ed8] uppercase text-[10px] mb-1.5 flex items-center gap-1.5 border-b pb-0.5">
                                                        <span>Rule-Based Risk Review</span>
                                                    </div>
                                                    <div className="whitespace-pre-wrap font-medium">{aiInsights.admissionRiskAnalysis}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4 text-xs text-gray-400 italic">
                                                Could not retrieve the counselor review summary. Check the backend connection.
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl p-8 text-center text-gray-400">
                                <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-60 text-[#1d4ed8]" />
                                <h4 className="font-bold text-gray-650 text-sm">Sample review notes</h4>
                                <p className="text-xs mt-1 max-w-[200px] mx-auto">Select an enrollment to view its rule-based sample review notes.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}

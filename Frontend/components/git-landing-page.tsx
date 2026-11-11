"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, BookOpen, GraduationCap, Award, ShieldCheck, ChevronDown } from "lucide-react"
import { useState, useEffect } from "react"
import { Header } from "./header"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface AGLandingPageProps {
  onInquireNow: () => void
}

const programs = [
  {
    title: "U.G. Programmes",
    description: "Explore sample undergraduate engineering and technology programmes.",
    bgClass: "bg-[#1d4ed8]",
    icon: BookOpen,
    link: "/programmes/ug",
  },
  {
    title: "P.G. Programmes",
    description: "Explore sample postgraduate programmes and areas of specialization.",
    bgClass: "bg-[#123d72]",
    icon: GraduationCap,
    link: "/programmes/pg",
  },
  {
    title: "Ph.D. Programmes",
    description: "Explore sample research areas and doctoral study pathways.",
    bgClass: "bg-[#2563eb]",
    icon: Award,
    link: "/programmes/phd",
  },
  {
    title: "Scholarship Policies",
    description: "Review illustrative scholarship and financial-support examples.",
    bgClass: "bg-gray-800",
    icon: ShieldCheck,
    link: "/scholarships",
  },
]

let hasDismissedBanner = false;

export function AGLandingPage({ onInquireNow }: AGLandingPageProps) {
  const router = useRouter()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [selectedDegree, setSelectedDegree] = useState("")
  const [selectedArea, setSelectedArea] = useState("")
  const [selectedLocation, setSelectedLocation] = useState("")
  const [showBanner, setShowBanner] = useState(!hasDismissedBanner)

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 2)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 2) % 2)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const handleFindYourProgram = () => {
    if (selectedDegree === "undergraduate") {
      router.push("/programmes/ug")
    } else if (selectedDegree === "graduate") {
      router.push("/programmes/pg")
    } else if (selectedDegree === "phd") {
      router.push("/programmes/phd")
    } else {
      onInquireNow()
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Top Announcement Banner */}
      {showBanner && (
        <div className="bg-[#0f172a] text-white py-3 px-4 relative">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <p className="text-sm text-center flex-1">
              Welcome to AG AI Admissions — explore academic pathways and start your application.
            </p>
            <button
              onClick={() => {
                hasDismissedBanner = true;
                setShowBanner(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Header/Navigation */}
      <Header onInquireNow={onInquireNow} />

      {/* Hero & Info Cards Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Hero Carousel (Left Side) */}
          <div className="lg:col-span-3 relative bg-gray-900 rounded-2xl overflow-hidden shadow-lg h-[350px] md:h-[450px]">
            {/* EAPCET Ribbons/Tag */}
            <div className="absolute top-4 left-0 z-20 bg-[#1d4ed8] text-white text-xs font-bold px-3 py-1.5 uppercase rounded-r-md shadow-md border-y border-r border-[#1e40af]">
              AG AI ADMISSIONS
            </div>

            <div className="relative h-full">
              {/* Slide 1 */}
              <div
                className={`absolute inset-0 transition-opacity duration-505 flex flex-col justify-center ${currentSlide === 0 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                style={{
                  backgroundImage: "linear-gradient(rgba(8, 28, 58, 0.62), rgba(8, 28, 58, 0.62)), url('/ag-campus.svg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="px-8 md:px-12 text-white max-w-2xl">
                  <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                    YOUR NEXT CHAPTER<br />
                    STARTS WITH AG
                  </h1>
                  <p className="text-sm md:text-base text-gray-250 mb-5 leading-relaxed">
                    Explore technology-focused programmes, review the application steps, and discover a learning community designed around your goals.
                  </p>
                  <Link href="/apply">
                    <Button className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-5 py-2 text-xs md:px-6 md:py-3 md:text-sm rounded-md font-semibold">
                      START APPLICATION →
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Slide 2 */}
              <div
                className={`absolute inset-0 transition-opacity duration-505 flex flex-col justify-center ${currentSlide === 1 ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                style={{
                  backgroundImage: "linear-gradient(rgba(8, 28, 58, 0.62), rgba(8, 28, 58, 0.62)), url('/ag-campus.svg')",
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="px-8 md:px-12 text-white max-w-2xl">
                  <h1 className="text-2xl md:text-4xl font-extrabold mb-3 leading-tight tracking-tight">
                    LEARN BY BUILDING<br />
                    WHAT COMES NEXT
                  </h1>
                  <p className="text-sm md:text-base text-gray-250 mb-5 leading-relaxed">
                    Find undergraduate, postgraduate, and doctoral pathways in engineering and technology.
                  </p>
                  <Button className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-5 py-2 text-xs md:px-6 md:py-3 md:text-sm rounded-md font-semibold" onClick={onInquireNow}>
                    LEARN MORE →
                  </Button>
                </div>
              </div>
            </div>


          </div>

          {/* Sidebar Stats Cards (Right Side) */}
          <div className="lg:col-span-1 flex flex-col justify-between gap-4 h-[350px] md:h-[450px]">
            {/* Academics Card */}
            <div className="flex-1 bg-[#1d4ed8] text-white px-5 py-4 rounded-xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg">
              <h3 className="text-base font-bold mb-2 uppercase tracking-wider">Academics</h3>
              <div className="space-y-1 text-xs text-blue-50">
                <Link href="/programmes/ug" className="block hover:text-white transition-colors">
                  <span className="font-extrabold text-[#123d72] bg-white px-1 py-0.5 rounded text-[10px] mr-1.5 align-middle">UG</span>
                  <span className="align-middle hover:underline">UG Programmes</span>
                </Link>
                <Link href="/programmes/pg" className="block hover:text-white transition-colors">
                  <span className="font-extrabold text-[#123d72] bg-white px-1 py-0.5 rounded text-[10px] mr-1.5 align-middle">PG</span>
                  <span className="align-middle hover:underline">PG Programmes</span>
                </Link>
                <div>
                  <span className="font-bold text-sm mr-1">Ph.D.</span> Research pathway
                </div>
              </div>
            </div>

            {/* Placements Card */}
            <div className="flex-1 bg-[#123d72] text-white px-5 py-4 rounded-xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg">
              <h3 className="text-base font-bold mb-2 uppercase tracking-wider">Placements</h3>
              <div className="space-y-1 text-xs text-blue-50">
                <div>
                  <span className="font-bold text-sm mr-1">Career</span> preparation
                </div>
                <div>
                  <span className="font-bold text-sm mr-1">Practical</span> projects
                </div>
                <div>
                  <span className="font-bold text-sm mr-1">Student</span> advising
                </div>
              </div>
            </div>

            {/* Research Card */}
            <div className="flex-1 bg-[#2563eb] text-white px-5 py-4 rounded-xl flex flex-col justify-center transition-all duration-300 hover:shadow-lg">
              <h3 className="text-base font-bold mb-2 uppercase tracking-wider">Research</h3>
              <div className="space-y-1 text-xs text-blue-50">
                <div>
                  <span className="font-bold text-sm mr-1">Faculty</span> mentorship
                </div>
                <div>
                  <span className="font-bold text-sm mr-1">Applied</span> research
                </div>
                <div>
                  <span className="font-bold text-sm mr-1">Emerging</span> technologies
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Program Finder Section */}
      <div className="bg-white border-b border-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e293b] text-center mb-12">
            BUILD YOUR FUTURE IN TECHNOLOGY
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="relative">
              <select
                value={selectedDegree}
                onChange={(e) => setSelectedDegree(e.target.value)}
                className="w-full px-6 py-4 rounded-md text-gray-700 bg-white border-2 border-gray-300 focus:border-[#1d4ed8] focus:outline-none appearance-none pr-10"
              >
                <option value="">Select Degree</option>
                <option value="undergraduate">B.Tech (Undergraduate)</option>
                <option value="graduate">M.Tech (Postgraduate)</option>
                <option value="phd">Doctor of Philosophy (Ph.D)</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
            </div>

            <div className="relative">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="w-full px-6 py-4 rounded-md text-gray-700 bg-white border-2 border-gray-300 focus:border-[#1d4ed8] focus:outline-none appearance-none pr-10"
              >
                <option value="">Area of Study</option>
                <option value="engineering">Engineering</option>
                <option value="it">Computer Applications & IT</option>
                <option value="business">Management / Business</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
            </div>

            <div className="relative">
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-6 py-4 rounded-md text-gray-700 bg-white border-2 border-gray-300 focus:border-[#1d4ed8] focus:outline-none appearance-none pr-10"
              >
                <option value="">Select Location</option>
                <option value="main-campus">Main campus</option>
                <option value="online">Online information</option>
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none w-5 h-5" />
            </div>
          </div>

          <div className="text-center">
            <Button
              className="bg-[#123d72] hover:bg-[#1d4ed8] text-white px-12 py-6 text-lg rounded-md font-bold"
              onClick={handleFindYourProgram}
            >
              FIND YOUR PROGRAM
            </Button>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-[#1e293b] mb-6">
                A MODERN ACADEMIC COMMUNITY
              </h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                AG AI Admissions is a demonstration system for exploring academic pathways, completing an application, and accessing student support. Programme and scholarship information is illustrative and should be confirmed before real-world use.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed mb-8">
                The sample portal brings programme discovery, an accessible application wizard, scholarship guidance, and admissions support together in one responsive experience.
              </p>
              <div className="flex gap-4">
                <Button onClick={onInquireNow} className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-8 py-3 rounded-md">
                  INQUIRE NOW
                </Button>
                <Link href="/about">
                  <Button variant="outline" className="border-[#1d4ed8] text-[#1d4ed8] hover:bg-[#1d4ed8] hover:text-white px-8 py-3 rounded-md">
                    ABOUT US →
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <img
                src="/ag-campus.svg"
                alt="Illustration representing the AG AI Admissions student portal"
                className="rounded-lg shadow-2xl w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Program Categories */}
      <div className="bg-slate-50 py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1e293b] text-center mb-16">
            EXPLORE ACADEMIC PATHWAYS
          </h2>

          <p className="text-gray-600 text-center text-lg mb-16 max-w-4xl mx-auto leading-relaxed">
            Explore sample undergraduate, postgraduate, and doctoral pathways in engineering and technology.
          </p>

          <p className="text-gray-600 text-center text-lg mb-16 max-w-4xl mx-auto leading-relaxed">
            Programme names, admissions details, and fee information in this demo are examples rather than official policy.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {programs.map((program) => {
              const CardContentElement = (
                <Card className="overflow-hidden h-full border border-gray-150 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group bg-white">
                  <div className={`relative h-40 ${program.bgClass} flex flex-col justify-between p-6 transition-all duration-300`}>
                    <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white">
                      <program.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-white leading-tight">{program.title}</h3>
                  </div>
                  <CardContent className="p-6">
                    <p className="text-gray-600 text-sm leading-relaxed">{program.description}</p>
                  </CardContent>
                </Card>
              );

              return program.link ? (
                <Link key={program.title} href={program.link} className="block h-full">
                  {CardContentElement}
                </Link>
              ) : (
                <div key={program.title} className="h-full">
                  {CardContentElement}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1e293b] mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-gray-700 text-lg mb-8">
            Have questions about the sample portal? Visit Get Help for the available demonstration support options.
          </p>
          <Button
            onClick={onInquireNow}
            className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white px-12 py-6 text-xl rounded-md font-bold"
          >
            INQUIRE NOW
          </Button>
        </div>
      </div>

      <footer className="border-t border-blue-100 bg-[#f8fbff] px-4 py-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-[#123d72]">AG AI Admissions</p>
            <p className="mt-1">AI-enabled student admission management.</p>
          </div>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-x-5 gap-y-2">
            <Link href="/about" className="hover:text-[#1d4ed8]">About</Link>
            <Link href="/programmes/ug" className="hover:text-[#1d4ed8]">Programmes</Link>
            <Link href="/scholarships" className="hover:text-[#1d4ed8]">Scholarships</Link>
            <Link href="/get-help" className="hover:text-[#1d4ed8]">Get Help</Link>
            <Link href="/apply" className="hover:text-[#1d4ed8]">Apply</Link>
          </nav>
          <p>All institutional details are illustrative, not official policy.</p>
        </div>
      </footer>
    </div>
  )
}

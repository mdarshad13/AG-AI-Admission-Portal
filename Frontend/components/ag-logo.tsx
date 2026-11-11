import { GraduationCap } from "lucide-react"
import type { CSSProperties } from "react"

export function AGIcon({
  className = "h-12 w-12",
  style,
}: {
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-950 to-blue-700 text-white shadow-sm ${className}`}
      aria-hidden="true"
      style={style}
    >
      <GraduationCap className="h-3/5 w-3/5" strokeWidth={1.8} />
    </span>
  )
}

export function AGLogo() {
  return (
    <span className="flex items-center gap-2 select-none sm:gap-3">
      <AGIcon className="h-9 w-9 rounded-xl sm:h-11 sm:w-11" />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-extrabold tracking-tight text-slate-950 sm:text-lg">
          AG AI Admissions
        </span>
        <span className="text-[10px] font-semibold tracking-wide text-blue-800 sm:text-xs">
          STUDENT ADMISSION SYSTEM
        </span>
      </span>
    </span>
  )
}
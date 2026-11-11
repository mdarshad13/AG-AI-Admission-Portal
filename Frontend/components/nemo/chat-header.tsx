"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AGIcon } from "../ag-logo"

interface ChatHeaderProps {
  onClose?: () => void
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0">
          <AGIcon className="h-9 w-9" />
        </div>
        <div>
          <h1 className="text-[#000000] font-semibold text-lg">Nemo</h1>
          <p className="text-[#64748b] text-sm">AG Admissions Assistant</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="text-[#45556c] hover:bg-[#f1f5f9]" onClick={onClose}>
        <X className="w-5 h-5" />
      </Button>
    </div>
  )
}

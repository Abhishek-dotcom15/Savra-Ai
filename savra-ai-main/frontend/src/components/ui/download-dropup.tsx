"use client"

import * as React from "react"
import { Download, FileText, FileType } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface DownloadDropupProps {
  onDownloadPDF: () => void
  onDownloadDOCX: () => void
  className?: string
  buttonClassName?: string
  variant?: "mobile" | "desktop"
  disabled?: boolean
}

export function DownloadDropup({
  onDownloadPDF,
  onDownloadDOCX,
  className,
  buttonClassName,
  variant = "desktop",
  disabled = false,
}: DownloadDropupProps) {
  const [open, setOpen] = React.useState(false)

  const handlePDFClick = () => {
    onDownloadPDF()
    setOpen(false)
  }

  const handleDOCXClick = () => {
    onDownloadDOCX()
    setOpen(false)
  }

  if (variant === "mobile") {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            className={cn(
              "flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm disabled:opacity-50",
              buttonClassName
            )}
          >
            <Download size={18} /> Download
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="top"
          align="center"
          className="w-40 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
        >
          <DropdownMenuItem
            onClick={handlePDFClick}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-md"
          >
            <FileText size={16} className="text-red-500" />
            <span>PDF</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDOCXClick}
            className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-md"
          >
            <FileType size={16} className="text-blue-500" />
            <span>Word (.docx)</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          className={cn(
            "flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3] disabled:opacity-50",
            buttonClassName
          )}
        >
          <Download size={18} /> Download
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-40 bg-white border border-gray-200 shadow-lg rounded-lg p-1"
      >
        <DropdownMenuItem
          onClick={handlePDFClick}
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-md"
        >
          <FileText size={16} className="text-red-500" />
          <span>PDF</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDOCXClick}
          className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 rounded-md"
        >
          <FileType size={16} className="text-blue-500" />
          <span>Word (.docx)</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

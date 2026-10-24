"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface AdminFilterBarProps {
  className?: string
  onGradeChange?: (value: string) => void
  onSubjectChange?: (value: string) => void
  defaultGrade?: string
  defaultSubject?: string
}

const grades = Array.from({ length: 12 }, (_, i) => i + 1)

const subjects = [
  "All Subjects",
  "Maths",
  "Science",
  "English",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology"
]

export function AdminFilterBar({
  className,
  onGradeChange,
  onSubjectChange,
  defaultGrade = "7",
  defaultSubject = "All Subjects"
}: AdminFilterBarProps) {
  const [grade, setGrade] = useState<string>(defaultGrade)
  const [subject, setSubject] = useState<string>(defaultSubject)
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false)
  const gradeDropdownRef = useRef<HTMLDivElement>(null)

  const handleGradeChange = (value: string) => {
    setGrade(value)
    setIsGradeDropdownOpen(false)
    onGradeChange?.(value)
  }

  const handleSubjectChange = (value: string) => {
    setSubject(value)
    onSubjectChange?.(value)
  }

  const getGradeLabel = (value: string) => {
    if (value === "all") return "All Grades"
    return `Grade ${value}`
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (gradeDropdownRef.current && !gradeDropdownRef.current.contains(event.target as Node)) {
        setIsGradeDropdownOpen(false)
      }
    }

    if (isGradeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isGradeDropdownOpen])

  return (
    <div className={cn("flex items-center gap-4", className)}>
      {/* Grade Dropdown - Left (Purple) */}
      <div className="relative" ref={gradeDropdownRef}>
        <button
          onClick={() => setIsGradeDropdownOpen(!isGradeDropdownOpen)}
          className={cn(
            "px-4 py-2 rounded-md min-w-[140px]",
            "bg-[#9B61FF] text-white font-medium",
            "border-0 focus:ring-0 focus:outline-none",
            "hover:bg-[#8B51EF]",
            "flex items-center justify-between gap-2",
            "transition-colors"
          )}
        >
          <span>{getGradeLabel(grade)}</span>
          <ChevronDown className="w-4 h-4 text-white opacity-100" />
        </button>

        {isGradeDropdownOpen && (
          <div
            className={cn(
              "absolute top-full left-0 mt-1 z-50",
              "bg-white border border-[#9B61FF] rounded-md shadow-lg",
              "min-w-[140px] max-h-[400px] overflow-y-auto"
            )}
          >
            {/* All Grades Option */}
            <button
              onClick={() => handleGradeChange("all")}
              className={cn(
                "w-full px-4 py-2 text-left text-sm font-medium",
                "hover:bg-[#F1E9FF] transition-colors",
                "flex items-center",
                grade === "all" && "bg-[#F1E9FF]"
              )}
            >
              All Grades
            </button>

            {/* Grade Items */}
            {grades.map((gradeNum) => {
              const gradeValue = `${gradeNum}`
              const isSelected = grade === gradeValue

              return (
                <button
                  key={gradeNum}
                  onClick={() => handleGradeChange(gradeValue)}
                  className={cn(
                    "w-full px-4 py-2 text-left text-sm font-medium",
                    "hover:bg-[#F1E9FF] transition-colors",
                    "flex items-center",
                    isSelected && "bg-[#9B61FF] text-white"
                  )}
                >
                  Grade {gradeNum}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Subject Dropdown - Right (White) */}
      <Select value={subject} onValueChange={handleSubjectChange}>
        <SelectTrigger
          className={cn(
            "px-4 py-4 rounded-md min-w-[140px]",
            "bg-white text-[#353535] font-medium",
            "border border-[#C7B1EE] focus:ring-0",
            "hover:border-[#9B61FF]",
            "[&_svg]:text-[#353535]"
          )}
        >
          <SelectValue placeholder="All Subjects" />
        </SelectTrigger>
        <SelectContent
          side="bottom"
          align="start"
          position="popper"
          sideOffset={4}
          className="bg-white min-w-[140px] border border-[#C7B1EE]"
        >
          {subjects.map((subj) => (
            <SelectItem
              key={subj}
              value={subj}
              className="px-4 py-2 cursor-pointer font-medium data-[highlighted]:bg-[#F1E9FF]"
            >
              {subj}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

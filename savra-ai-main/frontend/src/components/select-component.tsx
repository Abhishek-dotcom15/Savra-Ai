"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { ChevronDown, ChevronRight, Search } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface SubjectSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  subjects?: string[]
}

export function SubjectSelect({
  value,
  onValueChange,
  placeholder = "Select subject",
  className,
  subjects
}: SubjectSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  // Only show subjects from API - no fallback to prevent showing wrong data
  const subjectList = subjects && subjects.length > 0 ? subjects : []
  
  // Filter subjects based on search
  const filteredSubjects = useMemo(() => {
    if (!searchQuery.trim()) return subjectList
    const query = searchQuery.toLowerCase()
    return subjectList.filter((subject) => subject.toLowerCase().includes(query))
  }, [subjectList, searchQuery])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery("")
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const handleSelect = (selectedValue: string) => {
    onValueChange?.(selectedValue)
    setIsOpen(false)
    setSearchQuery("")
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-[180px] h-14 p-2 bg-white",
          "text-[#353535] font-medium",
          "border border-gray-300 rounded-lg",
          "hover:border-[#9B61FF] focus:border-[#9B61FF]",
          "flex items-center justify-between gap-2",
          "transition-colors",
          className
        )}
      >
        <span className="truncate">{value || placeholder}</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-gray-500 flex-shrink-0 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-2 z-50",
            "bg-white border-2 border-[#9B61FF] rounded-lg shadow-lg",
            "min-w-[250px] max-w-[350px] max-h-[400px]",
            "flex flex-col"
          )}
        >
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search subjects..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#9B61FF] focus:ring-2 focus:ring-[#9B61FF]/20 text-sm"
                autoFocus
              />
            </div>
          </div>

          {/* Subjects List */}
          <div className="overflow-y-auto max-h-[320px] p-2">
            {filteredSubjects.length > 0 ? (
              filteredSubjects.map((subject) => {
                const isSelected = value === subject
                return (
                  <button
                    key={subject}
                    onClick={() => handleSelect(subject)}
                    className={cn(
                      "w-full px-4 py-3 text-left rounded-lg",
                      "font-medium text-sm transition-colors",
                      "hover:bg-[#F1E9FF]",
                      isSelected && "bg-[#E8E2F0] text-[#9B61FF] font-semibold"
                    )}
                  >
                    {subject}
                  </button>
                )
              })
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No subjects found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ClassData {
  id: string
  name: string
  grade: number
  section: string
}

interface ClassSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  classes?: ClassData[]
}

export function ClassSelect({
  value,
  onValueChange,
  placeholder = "Select Class",
  className,
  classes
}: ClassSelectProps) {
  // Get unique grades from classes (no sections)
  const uniqueGrades = classes && classes.length > 0
    ? Array.from(new Set(classes.map(cls => cls.grade))).sort((a, b) => a - b)
    : []

  // Parse value to extract grade number (e.g., "Class: 8 A" or "Class 8" -> "8")
  const parseValue = (val?: string): string => {
    if (!val) return ""
    // Parse "Class: 8 A" or "Class 8" format
    const match = val.match(/Class:?\s*(\d+)/i)
    if (match) {
      return match[1]
    }
    // If it's just a number, return it
    if (/^\d+$/.test(val)) {
      return val
    }
    return val
  }

  // Format value for display (e.g., "8" -> "Class 8")
  const formatValue = (grade: string): string => {
    if (!grade || grade === "all") return ""
    return `Class ${grade}`
  }

  const internalValue = parseValue(value)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const handleSelection = (grade: string) => {
    const formattedValue = formatValue(grade)
    onValueChange?.(formattedValue)
    setIsDropdownOpen(false)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isDropdownOpen])

  const displayValue = value ? formatValue(internalValue) : placeholder

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={cn(
          "w-[150px] h-10 p-2 bg-[#9B61FF]",
          "text-white font-semibold",
          "border-0 focus:ring-0 focus:outline-none",
          "hover:bg-[#8B51EF]",
          "flex items-center justify-between gap-2",
          "transition-colors rounded-md",
          className
        )}
      >
        <span>{displayValue}</span>
        <ChevronDown className="w-4 h-4 text-white opacity-100 flex-shrink-0" />
      </button>

      {isDropdownOpen && (
        <div
          className={cn(
            "absolute top-full left-0 mt-1 z-50",
            "bg-white border border-[#9B61FF] rounded-md shadow-lg",
            "min-w-[150px] max-h-[400px] overflow-y-auto"
          )}
        >
          {uniqueGrades.map((grade) => {
            const gradeStr = grade.toString()
            const isSelected = internalValue === gradeStr

            return (
              <button
                key={grade}
                onClick={() => handleSelection(gradeStr)}
                className={cn(
                  "w-full px-6 py-3 text-left text-sm font-medium",
                  "hover:bg-[#F1E9FF] transition-colors rounded-xl",
                  isSelected && "bg-[#9B61FF] text-white"
                )}
              >
                Class {grade}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}


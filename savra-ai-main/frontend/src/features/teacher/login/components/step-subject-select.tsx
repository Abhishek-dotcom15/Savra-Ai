"use client"

import { useState, useEffect, useRef } from "react"
import { X } from "lucide-react"
import { useSubjects } from "@/hooks/use-subjects"

interface StepSubjectSelectProps {
  onSelect: (subjects: string[]) => void
  value?: string[]
  onAddSubjectClick?: () => void
}

export function StepSubjectSelect({ onSelect, value = [], onAddSubjectClick }: StepSubjectSelectProps) {
  const [selected, setSelected] = useState<string[]>(value)
  const { data: subjects, isLoading } = useSubjects()
  const prevValueRef = useRef<string>(JSON.stringify(value))

  const raw = subjects || []
  const subjectOptions = raw.filter((s) => s !== "All core Subjects")

  // Sync selected state with value prop when it changes from parent
  useEffect(() => {
    const currentValueStr = JSON.stringify(value ?? [])
    if (prevValueRef.current !== currentValueStr) {
      prevValueRef.current = currentValueStr
      setSelected(value ?? [])
    }
  }, [value])

  // Drop any selected subjects no longer in the list (e.g. removed from Drive)
  useEffect(() => {
    if (subjectOptions.length === 0) return
    const valid = selected.filter((s) => subjectOptions.includes(s))
    if (valid.length < selected.length) {
      setSelected(valid)
      onSelect(valid)
    }
  }, [subjectOptions.join(",")])

  const handleToggle = (subject: string) => {
    const newSelected = selected.includes(subject) ? selected.filter((s) => s !== subject) : [...selected, subject]
    setSelected(newSelected)
    onSelect(newSelected)
  }

  const handleRemove = (subject: string) => {
    const newSelected = selected.filter((s) => s !== subject)
    setSelected(newSelected)
    onSelect(newSelected)
  }

  const handleClearAll = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    const empty: string[] = []
    // Update ref first to prevent sync effect from overwriting
    prevValueRef.current = JSON.stringify(empty)
    setSelected(empty)
    onSelect(empty)
  }

  return (
    <div className="space-y-6">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 justify-center">
          {subjectOptions.map((subject) => (
            <button
              key={subject}
              onClick={() => handleToggle(subject)}
              className={`px-4 py-2 rounded-full border-2 transition-colors font-medium text-sm ${
                selected.includes(subject)
                  ? "bg-[#E8E2F0] border-[#9B61FF] text-[#242220]"
                  : "border-gray-300 text-[#353535] hover:border-gray-400"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      )}

      {selected.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm text-[#353535] font-medium">Selected subjects:</p>
            <button
              type="button"
              onClick={handleClearAll}
              className="text-sm text-[#DF6647] hover:text-[#c4553a] font-medium"
            >
              Remove all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selected.map((subject) => (
              <div
                key={subject}
                className="bg-white border border-gray-200 rounded-full px-3 py-1 flex items-center gap-2"
              >
                <span className="text-sm text-[#242220]">{subject}</span>
                <button onClick={() => handleRemove(subject)} className="text-[#8C8C8C] hover:text-[#242220]">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onAddSubjectClick}
        className="text-[#9B61FF] hover:text-[#7C3AED] text-sm font-medium block mx-auto"
      >
        Add Subject +
      </button>
    </div>
  )
}

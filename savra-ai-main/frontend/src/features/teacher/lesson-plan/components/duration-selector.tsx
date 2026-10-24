"use client"

import { useState, useRef, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DurationSelectProps {
  value: string
  onChange: (value: string) => void
}

export function DurationSelect({ value, onChange }: DurationSelectProps) {
  const [isCustomOpen, setIsCustomOpen] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Check if current value is a custom value (not in standard list)
  const isCustomValue = value && value !== "other" && value !== "custom" && (
    parseInt(value) > 70 || 
    (parseInt(value) > 20 && parseInt(value) <= 70 && !["25", "30", "35", "40", "45", "50", "55", "60", "65", "70"].includes(value)) ||
    (parseInt(value) >= 1 && parseInt(value) <= 20 && !["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"].includes(value))
  )

  useEffect(() => {
    if (isCustomOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isCustomOpen])

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === "custom") {
      setIsCustomOpen(true)
      setCustomValue(value && isCustomValue ? value : "")
    } else {
      setIsCustomOpen(false)
      onChange(selectedValue)
    }
  }

  const handleCustomSubmit = () => {
    const numValue = parseInt(customValue)
    if (numValue >= 1) {
      onChange(numValue.toString())
      setIsCustomOpen(false)
    }
  }

  const handleCustomKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleCustomSubmit()
    } else if (e.key === "Escape") {
      setIsCustomOpen(false)
      setCustomValue("")
    }
  }

  // Generate period options grouped by ranges
  const periodOptions = [
    // Common small values
    ...Array.from({ length: 10 }, (_, i) => i + 1),
    // Common medium values
    15, 20,
    // Extended range for longer lessons
    ...Array.from({ length: 10 }, (_, i) => (i + 1) * 5).filter(v => v > 20 && v <= 70)
  ].sort((a, b) => a - b)

  const displayValue = isCustomValue 
    ? `${value} periods` 
    : value === "other" || value === "custom"
    ? "Custom"
    : value 
    ? `${value} period${parseInt(value) !== 1 ? 's' : ''}`
    : "Select"

  return (
    <div className="relative">
      <Select 
        value={isCustomValue ? "custom" : value} 
        onValueChange={handleSelectChange}
      >
        <SelectTrigger className="w-full lg:w-40 border-[#A56AFF]">
          <SelectValue placeholder="Select duration">
            {displayValue}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          side="bottom" 
          align="start" 
          position="popper" 
          sideOffset={4}
          className="max-h-[400px] overflow-y-auto"
        >
          <SelectGroup>
            <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500">
              Quick Select (1-20 periods)
            </SelectLabel>
            {Array.from({ length: 20 }, (_, i) => i + 1).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} period{num !== 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectGroup>
            <SelectLabel className="px-2 py-1.5 text-xs font-semibold text-gray-500">
              Extended Range (25-70 periods)
            </SelectLabel>
            {Array.from({ length: 10 }, (_, i) => (i + 1) * 5 + 20).filter(v => v <= 70).map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num} periods
              </SelectItem>
            ))}
          </SelectGroup>
          
          <SelectSeparator />
          
          <SelectItem value="custom" className="font-semibold text-[#9B61FF]">
            Custom (71+ periods)
          </SelectItem>
        </SelectContent>
      </Select>

      {/* Custom Input Dialog */}
      {isCustomOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setIsCustomOpen(false)
              setCustomValue("")
            }}
          />
          <div className="absolute top-full left-0 mt-2 z-50 w-full lg:w-80 bg-white border-2 border-[#9B61FF] rounded-lg shadow-lg p-4">
            <div className="flex flex-col gap-3">
              <label className="text-sm font-semibold text-gray-700">
                Enter number of periods (71 or more)
              </label>
              <Input
                ref={inputRef}
                type="number"
                min="71"
                value={customValue}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === "" || (parseInt(val) >= 71)) {
                    setCustomValue(val)
                  }
                }}
                onKeyDown={handleCustomKeyDown}
                placeholder="e.g., 71, 72, 100..."
                className="border-[#9B61FF] focus:border-[#9B61FF] focus:ring-2 focus:ring-[#9B61FF]/20"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setIsCustomOpen(false)
                    setCustomValue("")
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomSubmit}
                  disabled={!customValue || parseInt(customValue) < 71}
                  className={cn(
                    "px-4 py-2 text-sm rounded-lg font-medium transition-colors",
                    customValue && parseInt(customValue) >= 71
                      ? "bg-[#9B61FF] text-white hover:bg-[#8B51EF]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  )}
                >
                  Apply
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Enter 71 or higher. Press Enter to apply or Escape to cancel
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

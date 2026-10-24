"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface AddTypeDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onAddTypes?: (types: string[]) => void
  children?: React.ReactNode
}

export default function AddTypeDialog({ open: controlledOpen, onOpenChange, onAddTypes, children }: AddTypeDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [customType, setCustomType] = useState("")

  // Use controlled open state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen

  const handleAdd = () => {
    if (customType.trim()) {
      // Convert to snake_case for backend (e.g., "True False" -> "true_false")
      const formattedType = customType.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

      if (formattedType && onAddTypes) {
        onAddTypes([customType.trim()]) // Pass original name for display
      }
      setOpen(false)
      setCustomType("")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) {
        setCustomType("")
      }
    }}>
      {children && (
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md max-w-[calc(100%-2rem)]">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">
            Add Question Type
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              Enter question type name
            </label>
            <Input
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., True False, Matching, Sequence..."
              className="border-[#7D5CB0] focus:border-[#9B61FF]"
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Enter any question type name. The AI will understand and generate appropriate questions.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false)
                setCustomType("")
              }}
              className="px-6"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!customType.trim()}
              className={`px-6 ${
                customType.trim()
                  ? "bg-[#DF6647] hover:bg-[#DF6647]/90 text-white"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              Add
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

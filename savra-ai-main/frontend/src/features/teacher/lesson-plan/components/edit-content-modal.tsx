"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

interface EditContentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (content: string) => void
  title: string
  content: string
}

export function EditContentModal({ isOpen, onClose, onSave, title, content }: EditContentModalProps) {
  const [editedContent, setEditedContent] = useState(content)

  // Reset content when modal opens with new content
  useEffect(() => {
    if (isOpen) {
      setEditedContent(content)
    }
  }, [isOpen, content])

  const handleSave = () => {
    onSave(editedContent)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-[#242220]">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-y-auto">
          <RichTextEditor
            content={editedContent}
            onChange={setEditedContent}
            placeholder="Enter content..."
            minHeight="min-h-[300px]"
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="px-6 py-2 bg-[#DF6647] hover:bg-[#DF6647]/90 text-white"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  )
}

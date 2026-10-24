"use client"

import type React from "react"
import { useRef } from "react"

import { Upload, Camera } from "lucide-react"

interface FileUploadSectionProps {
  onFileUpload: (file: File) => void
  uploadedFileName?: string
}

export function FileUploadSection({ onFileUpload, uploadedFileName }: FileUploadSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        alert(`File size exceeds 10MB limit. Please choose a smaller file.`)
        e.target.value = '' // Reset input
        return
      }

      // Validate file type (allow common document types)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp'
      ]

      if (!allowedTypes.includes(file.type)) {
        alert(`File type not supported. Please upload PDF, Word, or image files.`)
        e.target.value = '' // Reset input
        return
      }

      onFileUpload(file)
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoCapture = () => {
    // Handle photo capture logic
    console.log("Take photo")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-row gap-3">
        <input
          ref={fileInputRef}
          type="file"
          id="file-upload"
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp"
        />
        <button
          type="button"
          onClick={handleUploadClick}
          className="bg-[#B595FF] hover:bg-[#A085EF] text-white px-6 py-3 lg:px-8 lg:py-4 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4 lg:w-5 lg:h-5" />
          <span className="text-sm lg:text-base">Upload a File</span>
        </button>
        <button
          onClick={handlePhotoCapture}
          type="button"
          className="bg-[#B595FF] hover:bg-[#A085EF] text-white px-6 py-3 rounded-lg font-semibold cursor-pointer flex items-center justify-center gap-2 lg:hidden transition-colors"
        >
          <Camera className="w-4 h-4" />
          <span className="text-sm">Take Photo</span>
        </button>
      </div>
      {uploadedFileName && (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg max-w-md">
          <Upload className="w-4 h-4 text-green-600" />
          <p className="text-sm text-green-700 font-medium">
            File uploaded: <span className="font-semibold">{uploadedFileName}</span>
          </p>
        </div>
      )}
    </div>
  )
}

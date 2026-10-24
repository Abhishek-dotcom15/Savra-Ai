"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus, X } from "lucide-react"
import AddTypeDialog from "./add-type-dialog"
import { FileUploadSection } from "@/features/teacher/lesson-plan/components/file-upload-section"
import { api } from "@/lib/api"
import { useChapters } from "@/hooks/use-chapters"
import { useTeacherSubjectsData } from "@/hooks/use-subjects"
import { useTeacherClasses } from "@/hooks/use-classes"
import { AssessmentObjectiveSection } from "./assessment-objective-section"

interface Chapter {
  id: string
  name: string
  part?: string
}

interface QuestionType {
  name: string
  displayName?: string // Optional display name for custom types
  numQuestions: string
  marksPerQuestion: string
}

interface Assessment {
  id: string
  title: string
  status: string
}

interface QuestionPaperFormProps {
  selectedClassId: string
  selectedSubjectId: string
  filteredSubjects?: Array<{ id: string; name: string }>
}

export default function QuestionPaperForm({ selectedClassId, selectedSubjectId, filteredSubjects }: QuestionPaperFormProps) {
  const router = useRouter()
  
  // Get subject name and class grade from IDs for chapters fallback
  const { data: subjectsData } = useTeacherSubjectsData()
  const { data: classesData } = useTeacherClasses()
  
  // Try to find subject from multiple sources
  const selectedSubjectObj = subjectsData?.find((s: any) => s.id === selectedSubjectId) || 
                            filteredSubjects?.find((s: any) => s.id === selectedSubjectId)
  const selectedSubject = selectedSubjectObj?.name
  const selectedClass = classesData?.find((c: any) => c.id === selectedClassId)
  
  // Extract class grade with fallback: try API data, then extract from mock ID, then null
  const selectedClassGrade = useMemo(() => {
    if (selectedClass?.grade) return selectedClass.grade
    // Fallback: try to extract from mock class ID format: mock-class-11
    if (selectedClassId?.startsWith('mock-class-')) {
      const match = selectedClassId.match(/mock-class-(\d+)/)
      if (match) return parseInt(match[1], 10)
    }
    return null
  }, [selectedClass, selectedClassId])

  // Extract subject name from ID if not found in API data (for mock subjects)
  const subjectNameForChapters = useMemo(() => {
    if (selectedSubject) return selectedSubject
    if (!selectedSubjectId) return undefined
    // Try to extract from mock ID format: mock-subject-mathematics
    if (selectedSubjectId.startsWith('mock-subject-')) {
      return selectedSubjectId
        .replace('mock-subject-', '')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
    }
    // Try to find in filteredSubjects if provided
    if (filteredSubjects) {
      const found = filteredSubjects.find(s => s.id === selectedSubjectId)
      if (found) return found.name
    }
    return undefined
  }, [selectedSubject, selectedSubjectId, filteredSubjects])

  // Chapters - load based on selected subject AND class
  const { data: chaptersData, isLoading: chaptersLoading } = useChapters(
    selectedSubjectId || undefined,
    subjectNameForChapters,
    selectedClassGrade
  )
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([])

  const [totalMarks, setTotalMarks] = useState<string>("")
  const [difficultyLevel, setDifficultyLevel] = useState<string>("")
  const [selectedBooks, setSelectedBooks] = useState<string[]>(["NCERT Textbook (Default)", "XAM Ideas", "All in ONE"])
  const [objective, setObjective] = useState("")
  const [isAddTypeDialogOpen, setIsAddTypeDialogOpen] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    { name: "mcq", numQuestions: "0", marksPerQuestion: "1" },
    { name: "short_answer", numQuestions: "0", marksPerQuestion: "2" },
    { name: "long_answer", numQuestions: "0", marksPerQuestion: "5" },
    { name: "case_study", numQuestions: "0", marksPerQuestion: "4" },
  ])

  // Reset chapters when subject or class changes
  useEffect(() => {
    setSelectedChapterIds([])
  }, [selectedSubjectId, selectedClassGrade])

  // Check if IDs are real (not mock)
  const hasValidIds = useMemo(() => {
    const isRealClassId = selectedClassId && !selectedClassId.startsWith('mock-')
    const isRealSubjectId = selectedSubjectId && !selectedSubjectId.startsWith('mock-')
    const hasRealChapterIds = selectedChapterIds.length > 0 &&
        selectedChapterIds.every(id => !id.startsWith('mock-'))
    return isRealClassId && isRealSubjectId && hasRealChapterIds
  }, [selectedClassId, selectedSubjectId, selectedChapterIds])

  // Form validation
  const isFormValid = useMemo(() => {
    return hasValidIds &&
           totalMarks !== ""
  }, [hasValidIds, totalMarks])

  const toggleChapter = (chapterId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chapterId) ? prev.filter((c) => c !== chapterId) : [...prev, chapterId]
    )
  }

  const handleGenerate = async () => {
    if (!isFormValid) return

    setIsLoading(true)
    setError(null)

    try {
      // Upload file if present
      let referenceFileUrl: string | undefined
      if (uploadedFile) {
        try {
          const formData = new FormData()
          formData.append("file", uploadedFile)
          const uploadResult = await api.upload<{ success: boolean; data: { url: string } }>("/upload/file", formData)
          if (uploadResult.success && uploadResult.data?.url) {
            referenceFileUrl = uploadResult.data.url
            console.log('File uploaded successfully:', referenceFileUrl)
          } else {
            console.warn('Upload response missing URL:', uploadResult)
          }
        } catch (uploadError) {
          console.error('File upload failed:', uploadError)
          setError('Failed to upload file. Please try again.')
          setIsLoading(false)
          return
        }
      }

      // Get chapter names for title
      const selectedChapterNames = chaptersData
        ?.filter((ch: Chapter) => selectedChapterIds.includes(ch.id))
        .map((ch: Chapter) => ch.name) || []

      // Create assessment with correct field names
      const assessmentData = {
        classId: selectedClassId,
        subjectId: selectedSubjectId,
        chapterIds: selectedChapterIds,
        title: selectedChapterNames.join(", ") || "Assessment",
        totalMarks: parseInt(totalMarks) || 100,
        difficultyLevel: (difficultyLevel || "medium").toLowerCase() as "easy" | "medium" | "hard",
        questionTypes: questionTypes
          .filter(qt => parseInt(qt.numQuestions) > 0)
          .map(qt => ({
            questionType: qt.name,
            numberOfQuestions: parseInt(qt.numQuestions) || 0,
            marksPerQuestion: parseInt(qt.marksPerQuestion) || 1
          })),
        referenceBooks: selectedBooks,
        objective,
        referenceFileUrl,
      }

      const response = await api.post<{ success: boolean; data: Assessment }>("/assessments", assessmentData)
      const assessment = response.data

      // Generate questions
      await api.post(`/assessments/${assessment.id}/generate`, {})

      // Navigate to generated assessment page
      router.push(`/assessments/create/question-paper?id=${assessment.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate assessment")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (file: File) => {
    setUploadedFile(file)
  }

  const handleQuestionTypeChange = (index: number, field: "numQuestions" | "marksPerQuestion", value: string) => {
    const updated = [...questionTypes]
    updated[index][field] = value
    setQuestionTypes(updated)
  }

  const handleAddQuestionTypes = (newTypes: string[]) => {
    const typesToAdd = newTypes.map((typeName) => {
      // Convert to snake_case for backend and storage
      const name = typeName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
      return {
        name,
        displayName: typeName, // Keep original name for display
        numQuestions: "0",
        marksPerQuestion: "2" // Default 2 marks per question
      }
    })

    setQuestionTypes([...questionTypes, ...typesToAdd])
  }

  const handleRemoveQuestionType = (index: number) => {
    setQuestionTypes(prev => prev.filter((_, i) => i !== index))
  }

  const books = ["NCERT Textbook (Default)", "XAM Ideas", "All in ONE", "Oswal Question Bank"]

  const toggleBook = (book: string) => {
    if (selectedBooks.includes(book)) {
      setSelectedBooks(selectedBooks.filter((b) => b !== book))
    } else {
      setSelectedBooks([...selectedBooks, book])
    }
  }

  // Display names for question types
  const questionTypeDisplayNames: Record<string, string> = {
    mcq: "MCQ",
    short_answer: "Short Answers",
    long_answer: "Long Answers",
    case_study: "Case Study",
    diagram_based: "Diagram-Based",
    fill_in_blanks: "Fill in Blanks",
    numerical: "Numerical",
    assertion_reasoning: "Assertion-Reasoning",
    map_questions: "Map Questions"
  }

  return (
    <div className="flex flex-col">
      {/* Content Area */}
      <div className="pb-4">
        {/* Chapters Section */}
        <div className="mb-6 lg:mb-12">
          <div className="flex flex-row flex-wrap items-start justify-between gap-4 lg:gap-6">
            <div className="flex flex-col gap-4">
              <h2 className="text-base font-bold text-[#000000]">Select Chapters</h2>
              {!selectedSubjectId ? (
                <p className="text-gray-500 text-sm">Please select a subject to see chapters</p>
              ) : !selectedClassId ? (
                <p className="text-gray-500 text-sm">Please select a class to see chapters</p>
              ) : !subjectNameForChapters && !selectedClassGrade ? (
                <p className="text-gray-500 text-sm">Loading chapters...</p>
              ) : chaptersLoading && !chaptersData ? (
                <div className="w-6 h-6 border-2 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
              ) : chaptersData && chaptersData.length > 0 ? (
                <div
                  key={`chapters-${selectedClassGrade}-${subjectNameForChapters}`}
                  className="flex flex-col gap-4"
                >
                  {/* Warning if using mock chapters */}
                  {chaptersData.some((ch: Chapter) => ch.id.startsWith('mock-')) && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg text-sm">
                          Chapters not available in database. Please contact admin to add chapters for this subject.
                      </div>
                  )}
                  {(() => {
                    // Group chapters by part if they have parts
                    const chaptersByPart = chaptersData.reduce((acc: Record<string, typeof chaptersData>, chapter: any) => {
                      const part = chapter.part || 'All'
                      if (!acc[part]) acc[part] = []
                      acc[part].push(chapter)
                      return acc
                    }, {})
                    
                    const parts = Object.keys(chaptersByPart)
                    const hasParts = parts.length > 1 || (parts.length === 1 && parts[0] !== 'All')
                    
                    if (hasParts) {
                      // Display with part headers
                      return parts.map((part) => (
                        <div key={part} className="flex flex-col gap-2">
                          <h3 className="text-sm font-semibold text-[#9B61FF]">{part}</h3>
                          <div className="flex flex-wrap gap-2">
                            {chaptersByPart[part].map((chapter: Chapter & { part?: string }) => (
                              <button
                                key={chapter.id}
                                onClick={() => toggleChapter(chapter.id)}
                                className={`px-4 py-2 rounded-full border-2 transition-colors font-medium text-sm ${
                                  selectedChapterIds.includes(chapter.id)
                                    ? "bg-[#E8E2F0] border-[#9B61FF] text-[#242220]"
                                    : "border-gray-300 text-[#353535] hover:border-gray-400"
                                }`}
                              >
                                {chapter.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))
                    } else {
                      // Display without part headers (simple list)
                      return (
                        <div className="flex flex-wrap gap-2">
                          {chaptersData.map((chapter: Chapter) => (
                            <button
                              key={chapter.id}
                              onClick={() => toggleChapter(chapter.id)}
                              className={`px-4 py-2 rounded-full border-2 transition-colors font-medium text-sm ${
                                selectedChapterIds.includes(chapter.id)
                                  ? "bg-[#E8E2F0] border-[#9B61FF] text-[#242220]"
                                  : "border-gray-300 text-[#353535] hover:border-gray-400"
                              }`}
                            >
                              {chapter.name}
                            </button>
                          ))}
                        </div>
                      )
                    }
                  })()}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No chapters found for this subject</p>
              )}
            </div>
          </div>
        </div>

        {/* Assessment Configuration - All in One Compact Line */}
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center">
            {/* Total Marks */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-sm font-semibold text-[#000000]">Total Marks</label>
              <Input
                value={totalMarks}
                onChange={(e) => {
                  const value = e.target.value
                  const numValue = parseInt(value)
                  if (value === "" || value === "-") {
                    setTotalMarks(value)
                  } else if (!isNaN(numValue) && numValue >= 0) {
                    setTotalMarks(value)
                  } else if (numValue < 0) {
                    setTotalMarks("0")
                  }
                }}
                placeholder="Enter marks"
                type="number"
                min="0"
                className="w-full px-3 py-2 border border-[#A56AFF] rounded-lg text-sm"
              />
            </div>

            {/* Difficulty Level */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-sm font-semibold text-[#000000]">Difficulty</label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger className="w-full border-[#A56AFF] py-2 h-auto">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent side="bottom" align="start" position="popper" sideOffset={4}>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Question Types - Compact Horizontal Cards */}
            <div className="flex-1 w-full">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#000000]">Question Types</label>
                <button
                  onClick={() => setIsAddTypeDialogOpen(true)}
                  className="text-[#9B61FF] font-semibold text-xs flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Add type <Plus className="w-3 h-3" strokeWidth={3} />
                </button>
              </div>
              
              {/* Question Types in Single Row */}
              <div className="flex flex-wrap gap-3">
                {questionTypes.map((type, index) => (
                  <div key={type.name} className="relative flex flex-col gap-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200 min-w-[140px]">
                    <button
                      onClick={() => handleRemoveQuestionType(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors"
                      title="Remove question type"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    <p className="text-xs font-semibold text-[#6A6A6A]">{type.displayName || questionTypeDisplayNames[type.name] || type.name}</p>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#6A6A6A] mb-0.5">Qty</label>
                        <Input
                          value={type.numQuestions}
                          onChange={(e) => handleQuestionTypeChange(index, "numQuestions", e.target.value)}
                          placeholder="0"
                          type="number"
                          className="w-full px-2 py-1.5 text-xs border border-[#7D5CB0] rounded-lg"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-[#6A6A6A] mb-0.5">Marks</label>
                        <Input
                          value={type.marksPerQuestion}
                          onChange={(e) => handleQuestionTypeChange(index, "marksPerQuestion", e.target.value)}
                          placeholder="1"
                          type="number"
                          className="w-full px-2 py-1.5 text-xs border border-[#7D5CB0] rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reference Books Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#000000]">Reference Books</h2>
          </div>

          <div className="flex gap-3 flex-wrap">
            {books.map((book) => (
              <Button
                key={book}
                onClick={() => toggleBook(book)}
                variant={selectedBooks.includes(book) ? "default" : "outline"}
                className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
                  selectedBooks.includes(book)
                    ? "border border-[#4612CF87] text-black bg-[#E9DBFF] hover:bg-[#E9DBFF]"
                    : "bg-white border border-[#4612CF87] text-black hover:bg-[#F5F0FA]"
                }`}
              >
                {book}
              </Button>
            ))}
          </div>
        </div>

        {/* Question Paper Objective Section */}
        <div className="mb-6">
          <AssessmentObjectiveSection
            objective={objective}
            onObjectiveChange={setObjective}
            selectedClass={selectedClass ? `Class ${selectedClass.grade}` : undefined}
            selectedSubject={subjectNameForChapters}
            selectedChapters={chaptersData?.filter((ch: Chapter) => selectedChapterIds.includes(ch.id)).map((ch: Chapter) => ch.name) || []}
          />
        </div>

        {/* Upload Reference Material & Generate Button Section */}
        <div className="mb-6">
          <h3 className="text-base font-bold text-black mb-4">Upload Reference Material</h3>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <FileUploadSection onFileUpload={handleFileUpload} uploadedFileName={uploadedFile?.name} />
            <div className="flex flex-col gap-2">
              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={!isFormValid || isLoading}
                className={`w-full lg:w-auto px-6 py-4 rounded-xl font-semibold text-white transition-all ${
                  isFormValid && !isLoading
                    ? "bg-[#DF6647] hover:bg-[#FF5A35] shadow-lg hover:shadow-xl cursor-pointer"
                    : "bg-[#B5B5B5] opacity-60 cursor-not-allowed"
                }`}
              >
                {isLoading ? "Generating..." : "Generate Assessment"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AddTypeDialog
        open={isAddTypeDialogOpen}
        onOpenChange={setIsAddTypeDialogOpen}
        onAddTypes={handleAddQuestionTypes}
      />
    </div>
  )
}

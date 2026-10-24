"use client"

import { Suspense, useState, useCallback, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Edit, Share2, Download, Printer, Check, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CompactTextEditor } from "@/components/ui/compact-text-editor"
import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import { downloadAssessmentPDF, downloadAssessmentWithAnswerKeyPDF, generateAssessmentPDF, generateAssessmentWithAnswerKeyPDF } from "@/lib/pdf-generator"
import { downloadAssessmentDOCX, downloadAssessmentWithAnswerKeyDOCX } from "@/lib/docx-generator"
import { DownloadDropup } from "@/components/ui/download-dropup"

interface Question {
  number: number
  text: string
  options?: string[]
  type?: string
  marks?: number
  answer?: string
}

interface AnswerKeyItem {
  questionNumber: number
  answer: string
  explanation?: string
}

interface AnswerKey {
  answers: AnswerKeyItem[]
}

// Helper function to strip markdown formatting from text
const stripMarkdown = (text: string): string => {
  if (!text) return ""
  return text
    // Remove bold (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // Remove headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bullet points (* or -)
    .replace(/^\s*[\*\-]\s+/gm, '• ')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface Section {
  name?: string
  title?: string
  type?: string
  instructions?: string
  questions: Question[]
}

interface QuestionPaper {
  title?: string
  instructions?: string[]
  sections?: Section[]
  questions?: Question[]
}

interface Assessment {
  id: string
  title: string
  subject?: { id: string; name: string }
  class?: { id: string; name: string; grade: number; section: string }
  chapters?: Array<{ id: string; name: string }>
  totalMarks?: number
  difficultyLevel?: string
  questionPaper?: QuestionPaper | null
  status?: string
}

interface QuestionPaperContentProps {
  onEditClick?: (isEdit: boolean) => void
  isEditMode?: boolean
}

function QuestionPaperContentInner({ onEditClick, isEditMode = false }: QuestionPaperContentProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentId = searchParams.get("id")
  const { user } = useAuth()

  // State for share action
  const [linkCopied, setLinkCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSavingStatus, setIsSavingStatus] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [editedQuestionPaper, setEditedQuestionPaper] = useState<QuestionPaper | null>(null)

  // State for answer key
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null)
  const [isGeneratingAnswerKey, setIsGeneratingAnswerKey] = useState(false)
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null)

  // Use ref to track if we've initialized to prevent re-initialization
  const hasInitializedRef = useRef(false)

  // Fetch assessment data from API
  const { data: assessment, isLoading, refetch } = useFetch<Assessment>(
    assessmentId ? `/assessments/${assessmentId}` : null
  )

  // Initialize edited question paper when assessment loads (only once)
  useEffect(() => {
    if (assessment?.questionPaper && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setEditedQuestionPaper(JSON.parse(JSON.stringify(assessment.questionPaper)))
    }
  }, [assessment?.questionPaper])

  // Always use edited question paper if available (to preserve edits after exiting edit mode)
  // Only fall back to original if editedQuestionPaper is null
  const displayQuestionPaper = editedQuestionPaper || assessment?.questionPaper

  const handleModifyPrompt = () => {
    router.push(`/assessments/create/modify?id=${assessmentId}`)
  }

  const handleEditToggle = () => {
    if (onEditClick) {
      onEditClick(!isEditMode)
    }
  }

  // Print handler - generates PDF and opens print dialog
  const handlePrint = useCallback(() => {
    if (!assessment) return

    // Generate PDF with or without answer key
    let pdfUrl: string
    if (answerKey) {
      const { url } = generateAssessmentWithAnswerKeyPDF(assessment, answerKey, user?.name || "")
      pdfUrl = url
    } else {
      const { url } = generateAssessmentPDF(assessment, user?.name || "")
      pdfUrl = url
    }

    // Open PDF in new window and trigger print
    const printWindow = window.open(pdfUrl, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }, [assessment, answerKey, user?.name])

  // Download handler - generates and downloads PDF
  const handleDownload = useCallback(() => {
    if (assessment) {
      downloadAssessmentPDF(assessment, user?.name || "")
    }
  }, [assessment, user?.name])

  // Download DOCX handler - generates and downloads DOCX
  const handleDownloadDOCX = useCallback(async () => {
    if (assessment) {
      await downloadAssessmentDOCX(assessment, user?.name || "")
    }
  }, [assessment, user?.name])

  // Share handler - shares PDF file when supported
  const handleShare = useCallback(async () => {
    if (!assessment) return

    // Generate PDF
    let pdfBlob: Blob
    let filename: string
    if (answerKey) {
      const result = generateAssessmentWithAnswerKeyPDF(assessment, answerKey, user?.name || "")
      const response = await fetch(result.url)
      pdfBlob = await response.blob()
      filename = result.filename
      URL.revokeObjectURL(result.url)
    } else {
      const result = generateAssessmentPDF(assessment, user?.name || "")
      const response = await fetch(result.url)
      pdfBlob = await response.blob()
      filename = result.filename
      URL.revokeObjectURL(result.url)
    }

    // Create File object for sharing
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

    // Check if file sharing is supported
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: assessment?.title || "Question Paper",
          text: `Question Paper: ${assessment?.title || "Question Paper"}`,
          files: [pdfFile]
        })
        return
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("File share failed:", err)
        }
      }
    }

    // Fallback: Try sharing URL
    const shareUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: assessment?.title || "Question Paper",
          text: `Check out this question paper: ${assessment?.title || "Question Paper"}`,
          url: shareUrl,
        })
        return
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err)
        }
      }
    }

    // Final fallback: Copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy link:", err)
      alert(`Copy this link: ${shareUrl}`)
    }
  }, [assessment, answerKey, user?.name])

  // Fallback questions for preview/demo mode
  const FALLBACK_QUESTIONS: Question[] = [
    { number: 1, text: "Which of the following represents the largest fraction?", options: ["3/7", "5/7", "4/9", "2/3"] },
    { number: 2, text: "A fraction equivalent to 6/8 is:", options: ["3/4", "2/3", "4/5", "5/6"] },
    { number: 3, text: "What is the sum of 1/4 + 1/2?", options: ["2/6", "3/4", "1/3", "3/6"] },
    { number: 4, text: "Which fraction is the smallest?", options: ["1/2", "1/3", "1/4", "1/5"] },
    { number: 5, text: "Convert 0.5 to a fraction:", options: ["1/4", "1/2", "1/3", "2/3"] },
    { number: 6, text: "What is 3/4 of 16?", options: ["10", "12", "14", "15"] },
    { number: 7, text: "Which of the following is a proper fraction?", options: ["5/4", "4/3", "3/4", "6/5"] },
    { number: 8, text: "Find the value of 2/3 - 1/6:", options: ["1/3", "1/2", "2/3", "3/4"] },
    { number: 9, text: "What is the reciprocal of 3/5?", options: ["5/3", "3/5", "5/2", "2/5"] },
    { number: 10, text: "Which fraction is greater than 1/2?", options: ["2/5", "3/7", "4/9", "5/8"] },
  ]

  // Extract questions from questionPaper - handle both flat and sectioned formats
  const questionPaper = displayQuestionPaper || assessment?.questionPaper
  const questions = questionPaper?.questions ||
    questionPaper?.sections?.flatMap(s => s.questions) ||
    FALLBACK_QUESTIONS

  const handleQuestionTextChange = (sectionIdx: number | null, questionIdx: number, newText: string) => {
    if (!editedQuestionPaper) return
    
    setEditedQuestionPaper(prev => {
      if (!prev) return null
      const updated = JSON.parse(JSON.stringify(prev))
      
      if (sectionIdx !== null && updated.sections) {
        updated.sections[sectionIdx].questions[questionIdx].text = newText
      } else if (updated.questions) {
        updated.questions[questionIdx].text = newText
      }
      return updated
    })
  }

  const handleOptionChange = (sectionIdx: number | null, questionIdx: number, optionIdx: number, newOption: string) => {
    if (!editedQuestionPaper) return
    
    setEditedQuestionPaper(prev => {
      if (!prev) return null
      const updated = JSON.parse(JSON.stringify(prev))
      
      if (sectionIdx !== null && updated.sections) {
        updated.sections[sectionIdx].questions[questionIdx].options![optionIdx] = newOption
      } else if (updated.questions) {
        updated.questions[questionIdx].options![optionIdx] = newOption
      }
      return updated
    })
  }

  const handleSaveQuestions = async () => {
    if (!assessmentId || !editedQuestionPaper) return

    setIsSaving(true)
    setSaveError(null)

    try {
      await api.put(`/assessments/${assessmentId}`, {
        questionPaper: editedQuestionPaper
      })
      // Reset edited state and ref so it will be re-initialized from fresh API data
      setEditedQuestionPaper(null)
      hasInitializedRef.current = false
      // Wait for refetch to complete - this will update assessment.questionPaper
      await refetch()
      // Exit edit mode after saving
      if (onEditClick) {
        onEditClick(false)
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save questions")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveQuestionPaper = async () => {
    if (!assessmentId) return

    setIsSavingStatus(true)
    setSaveError(null)

    try {
      // Save any edited content first if there are changes
      if (editedQuestionPaper) {
        await api.put(`/assessments/${assessmentId}`, {
          questionPaper: editedQuestionPaper
        })
      }
      // Update status to saved
      await api.patch(`/assessments/${assessmentId}/status`, {
        status: "saved"
      })
      await refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save question paper")
    } finally {
      setIsSavingStatus(false)
    }
  }

  const handleGenerateAnswerKey = async () => {
    if (!assessmentId) return

    setIsGeneratingAnswerKey(true)
    setAnswerKeyError(null)

    try {
      const response = await api.post<{ data: { answerKey: AnswerKey } }>(`/assessments/${assessmentId}/answer-key`)
      setAnswerKey(response.data.answerKey)
    } catch (err) {
      setAnswerKeyError(err instanceof Error ? err.message : "Failed to generate answer key")
    } finally {
      setIsGeneratingAnswerKey(false)
    }
  }

  // Download with answer key
  const handleDownloadWithAnswerKey = useCallback(() => {
    if (assessment && answerKey) {
      downloadAssessmentWithAnswerKeyPDF(assessment, answerKey, user?.name || "")
    } else if (assessment) {
      downloadAssessmentPDF(assessment, user?.name || "")
    }
  }, [assessment, answerKey, user?.name])

  // Download DOCX with answer key
  const handleDownloadWithAnswerKeyDOCX = useCallback(async () => {
    if (assessment && answerKey) {
      await downloadAssessmentWithAnswerKeyDOCX(assessment, answerKey, user?.name || "")
    } else if (assessment) {
      await downloadAssessmentDOCX(assessment, user?.name || "")
    }
  }, [assessment, answerKey, user?.name])

  const subject = assessment?.subject?.name || "Mathematics"
  const grade = assessment?.class ? `${assessment.class.grade}` : "VII"
  const chapter = assessment?.chapters?.map(c => c.name).join(", ") || "Fractions"
  const totalMarks = assessment?.totalMarks || 100
  const duration = 60 // Default duration since it's not in assessment schema
  const instructions = questionPaper?.instructions || [
    "All questions are compulsory.",
    "The question paper is designed to test understanding and application of concepts.",
    "Show necessary steps for full marks.",
    "Use of calculator is not permitted.",
  ]

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Mobile: Title below header */}
      <div className="lg:hidden mb-4">
        <h2 className="text-base font-medium text-[#242220]">7's Generated Question Paper</h2>
      </div>

      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden min-h-0">
        {/* Desktop Header */}
        {!isEditMode ? (
          <div className="hidden lg:flex bg-[#E9E9E9] p-6 rounded-t-2xl items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold">SAVRA - Question Paper</h1>
            </div>
            <button 
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#E2DFF0] rounded-lg hover:opacity-80"
            >
              Edit <Edit size={16} />
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex bg-[#E9E9E9] px-12 py-6 rounded-t-2xl items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">SAVRA - Question Paper</h1>
            </div>
            <button
              onClick={handleEditToggle}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-[#E2DFF0] rounded-lg hover:opacity-80"
            >
              Edit <Edit size={16} />
            </button>
          </div>
        )}

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 border border-gray-200 rounded-b-2xl min-h-0">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <p className="font-bold text-lg">Subject: {subject}</p>
            <p>Class: {grade}</p>
            <p>Chapter: {chapter}</p>
            <p>Time: {Math.floor(duration / 60)} Hour{duration >= 120 ? 's' : ''}{duration % 60 > 0 ? ` ${duration % 60} mins` : ''}</p>
          </div>
          <div>
            <p className="font-bold text-lg">Maximum Marks: {totalMarks}</p>
          </div>
        </div>

        {/* General Instructions Section */}
        <div className="mb-6">
          <p className="font-bold mb-2">General Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            {instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>

        {/* Questions - Render by sections if available */}
        <div className="mb-4">
          {questionPaper?.sections && questionPaper.sections.length > 0 ? (
            // Render sections from API - filter out empty sections
            questionPaper.sections
              .filter(section => section.questions && section.questions.length > 0)
              .map((section, sectionIdx) => (
              <div key={sectionIdx} className="mb-6">
                <p className="font-bold text-lg mb-4">
                  {section.title || section.name || `Section ${String.fromCharCode(65 + sectionIdx)}`}
                </p>
                {section.instructions && (
                  <p className="text-sm text-gray-600 mb-3 italic">{section.instructions}</p>
                )}
                <div className="space-y-6">
                  {section.questions.map((question, idx) => (
                    <div key={question.number || idx} className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="font-semibold">Question {question.number || idx + 1}:</span>
                        {question.marks && <span className="text-gray-500 font-normal">({question.marks} marks)</span>}
                      </div>
                      {isEditMode ? (
                        <CompactTextEditor
                          content={question.text}
                          onChange={(html) => handleQuestionTextChange(sectionIdx, idx, html)}
                          placeholder="Enter question text..."
                          className="bg-white"
                        />
                      ) : (
                        <p className="font-semibold" dangerouslySetInnerHTML={{ __html: question.text }} />
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="ml-4 space-y-1">
                          {question.options.map((option, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span>{String.fromCharCode(97 + index)})</span>
                              {isEditMode ? (
                                <CompactTextEditor
                                  content={option}
                                  onChange={(html) => handleOptionChange(sectionIdx, idx, index, html)}
                                  placeholder="Enter option text..."
                                  className="flex-1 bg-white"
                                />
                              ) : (
                                <p dangerouslySetInnerHTML={{ __html: option }} />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // Render flat questions without section header
            <div className="space-y-6">
              {questions.map((question, idx) => (
                <div key={question.number || idx} className="space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">Question {question.number || idx + 1}:</span>
                    {question.marks && <span className="text-gray-500 font-normal">({question.marks} marks)</span>}
                  </div>
                  {isEditMode ? (
                    <CompactTextEditor
                      content={question.text}
                      onChange={(html) => handleQuestionTextChange(null, idx, html)}
                      placeholder="Enter question text..."
                      className="bg-white"
                    />
                  ) : (
                    <p className="font-semibold" dangerouslySetInnerHTML={{ __html: question.text }} />
                  )}
                  {question.options && question.options.length > 0 && (
                    <div className="ml-4 space-y-1">
                      {question.options.map((option, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span>{String.fromCharCode(97 + index)})</span>
                          {isEditMode ? (
                            <CompactTextEditor
                              content={option}
                              onChange={(html) => handleOptionChange(null, idx, index, html)}
                              placeholder="Enter option text..."
                              className="flex-1 bg-white"
                            />
                          ) : (
                            <p dangerouslySetInnerHTML={{ __html: option }} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Answer Key Section */}
        {answerKey && answerKey.answers && answerKey.answers.length > 0 && (
          <div className="mt-8 pt-6 border-t-2 border-dashed border-gray-300">
            <h2 className="text-xl font-bold mb-4 text-center">ANSWER KEY</h2>
            <div className="space-y-4">
              {answerKey.answers.map((item, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-[#DF6647]">Q{item.questionNumber}:</span>
                    <div className="flex-1">
                      <p className="font-medium">{stripMarkdown(item.answer)}</p>
                      {item.explanation && (
                        <p className="text-sm text-gray-600 mt-1 italic">
                          {stripMarkdown(item.explanation)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 border-t border-gray-200">
          {/* Mobile: Stack buttons */}
          <div className="lg:hidden flex flex-col gap-4 px-4 py-4">
            {/* First Row: Print, Share, Download */}
            <div className="flex justify-start items-center gap-3 flex-wrap">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                <Printer size={18} /> Print
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
                {linkCopied ? "Copied!" : "Share"}
              </button>
              <DownloadDropup
                onDownloadPDF={handleDownloadWithAnswerKey}
                onDownloadDOCX={handleDownloadWithAnswerKeyDOCX}
                variant="mobile"
              />
            </div>
            {/* Second Row: Save (if edit mode), Modify Prompt, Save */}
            <div className="flex flex-wrap gap-3">
              {isEditMode && (
                <Button
                  onClick={handleSaveQuestions}
                  disabled={isSaving}
                  className="flex-1 bg-[#DF6647] hover:bg-[#DF6647]/90 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              <Button
                onClick={handleModifyPrompt}
                variant="outline"
                className="flex-1 border-2 border-[#DF6647] text-[#DF6647] bg-white rounded-xl font-semibold hover:bg-[#DF6647]/10 transition-colors"
              >
                Modify Prompt
              </Button>
              <Button
                onClick={handleSaveQuestionPaper}
                disabled={isSavingStatus}
                className="flex-1 bg-[#DF6647] hover:bg-[#DF6647]/90 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isSavingStatus ? "Saving..." : "Save"}
              </Button>
            </div>
            {/* Third Row: Generate Answer Key */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateAnswerKey}
                disabled={isGeneratingAnswerKey || !assessment?.questionPaper}
                className="flex-1 flex items-center justify-center gap-2 bg-[#7D5CB0] hover:bg-[#7D5CB0]/90 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isGeneratingAnswerKey ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> {answerKey ? "Regenerate Answer Key" : "Generate Answer Key"}
                  </>
                )}
              </Button>
            </div>
            {saveError && (
              <p className="text-red-500 text-sm text-center">{saveError}</p>
            )}
            {answerKeyError && (
              <p className="text-red-500 text-sm text-center">{answerKeyError}</p>
            )}
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden lg:flex py-6 items-center gap-2 flex-wrap justify-between px-8">
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
                {linkCopied ? "Copied!" : "Share"}
              </button>
              <DownloadDropup
                onDownloadPDF={handleDownloadWithAnswerKey}
                onDownloadDOCX={handleDownloadWithAnswerKeyDOCX}
                variant="desktop"
              />
              <button
                onClick={handlePrint}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
              >
                <Printer size={18} /> Print
              </button>
              <button
                onClick={handleGenerateAnswerKey}
                disabled={isGeneratingAnswerKey || !assessment?.questionPaper}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#7D5CB0] text-white rounded-lg font-medium hover:bg-[#7D5CB0]/90 disabled:opacity-50"
              >
                {isGeneratingAnswerKey ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Generating...
                  </>
                ) : (
                  <>
                    <FileText size={18} /> {answerKey ? "Regenerate" : "Answer Key"}
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center gap-2">
              {isEditMode && (
                <Button
                  onClick={handleSaveQuestions}
                  disabled={isSaving}
                  className="px-6 py-2 text-sm bg-[#DF6647] hover:bg-[#DF6647]/90 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              )}
              <button
                onClick={handleModifyPrompt}
                className="px-6 py-2 text-sm border-2 border-[#DF6647] text-[#DF6647] rounded-lg font-medium hover:bg-[#DF6647] hover:text-white transition-colors"
              >
                Modify Prompt
              </button>
              <Button
                onClick={handleSaveQuestionPaper}
                disabled={isSavingStatus}
                className="px-6 py-2 text-sm bg-[#DF6647] hover:bg-[#DF6647]/90 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSavingStatus ? "Saving..." : "Save Question Paper"}
              </Button>
            </div>
            {saveError && (
              <p className="text-red-500 text-sm text-center w-full">{saveError}</p>
            )}
            {answerKeyError && (
              <p className="text-red-500 text-sm text-center w-full">{answerKeyError}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function QuestionPaperContent(props: QuestionPaperContentProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <QuestionPaperContentInner {...props} />
    </Suspense>
  )
}

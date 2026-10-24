"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Share2, Download, Printer, FileText, AlignLeft, AlignCenter, AlignRight, List, Minus, Plus, Check, Loader2 } from "lucide-react"
import PublishDialog from "./publish-dialog"
import { Button } from "@/components/ui/button"
import { CompactTextEditor } from "@/components/ui/compact-text-editor"
import { api } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { downloadQuizPDF, generateQuizPDF, downloadQuizWithAnswerKeyPDF, generateQuizWithAnswerKeyPDF } from "@/lib/pdf-generator"
import { downloadQuizDOCX, downloadQuizWithAnswerKeyDOCX } from "@/lib/docx-generator"
import { DownloadDropup } from "@/components/ui/download-dropup"
import { Quiz as QuizType } from "@/types/api"

interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  type: "multiple_choice" | "true_false"
}

interface Quiz {
  id: string
  title: string
  numQuestions: number
  level: string
  duration: number
  objective?: string
  status: string
  totalMarks?: number
  questions?: Question[]
  chapters?: string[]
  subject?: { id: string; name: string }
  class?: { id: string; name: string; grade: number; section: string }
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
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[\*\-]\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface GeneratedQuizProps {
  isEditMode?: boolean
  quiz?: Quiz | null
  onSave?: () => void
}

export default function GeneratedQuiz({ isEditMode = false, quiz, onSave }: GeneratedQuizProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizId = searchParams.get("id")
  const { user } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [linkCopied, setLinkCopied] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: string[] }>({})
  const [editedQuestions, setEditedQuestions] = useState<Question[]>([])

  // Answer key state
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null)
  const [isGeneratingAnswerKey, setIsGeneratingAnswerKey] = useState(false)
  const [answerKeyError, setAnswerKeyError] = useState<string | null>(null)

  // Use ref to track if we've initialized to prevent re-initialization
  const hasInitializedRef = useRef(false)

  // Use API questions or fallback to empty array
  const questions = quiz?.questions || []

  // Initialize edited questions when quiz loads (only once)
  useEffect(() => {
    if (quiz?.questions && quiz.questions.length > 0 && !hasInitializedRef.current) {
      hasInitializedRef.current = true
      setEditedQuestions(quiz.questions.map(q => ({
        ...q,
        // Convert plain text to HTML if needed for editor
        text: (() => {
          const text = q.text || ""
          // If it's already HTML (contains tags), use as-is
          if (text.includes('<') && text.includes('>')) {
            return text
          }
          // Otherwise, wrap in paragraph tag
          return text ? `<p>${text}</p>` : ""
        })(),
        // Convert plain text options to HTML if needed
        options: q.options.map(opt => {
          // If option doesn't contain HTML tags, wrap it in a paragraph
          if (!opt.includes('<') || !opt.includes('>')) {
            return opt ? `<p>${opt}</p>` : ""
          }
          return opt
        })
      })))
    }
  }, [quiz?.questions])

  // Always use edited questions if available (to preserve edits after exiting edit mode)
  // Only fall back to original questions if editedQuestions is empty
  const displayQuestions = editedQuestions.length > 0 ? editedQuestions : questions

  const handleQuestionTextChange = (index: number, newText: string) => {
    setEditedQuestions(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], text: newText }
      return updated
    })
  }

  const handleOptionChange = (questionIndex: number, optionIndex: number, newOption: string) => {
    setEditedQuestions(prev => {
      const updated = [...prev]
      updated[questionIndex] = {
        ...updated[questionIndex],
        options: updated[questionIndex].options.map((opt, idx) => 
          idx === optionIndex ? newOption : opt
        )
      }
      return updated
    })
  }

  const handleSaveQuestions = async () => {
    if (!quizId || !isEditMode) return

    setIsSaving(true)
    setSaveError(null)

    try {
      // Update each question via API
      for (const question of editedQuestions) {
        // Extract plain text from HTML for questionText (backend expects plain text)
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = question.text
        const questionTextPlain = tempDiv.textContent || tempDiv.innerText || question.text

        // Extract plain text from HTML for options
        const optionsPlain = question.options.map(opt => {
          const optDiv = document.createElement('div')
          optDiv.innerHTML = opt
          return optDiv.textContent || optDiv.innerText || opt
        })

        // Find the correct answer index
        const correctAnswerPlain = (() => {
          const correctDiv = document.createElement('div')
          correctDiv.innerHTML = question.correctAnswer
          return correctDiv.textContent || correctDiv.innerText || question.correctAnswer
        })()

        await api.put(`/quizzes/${quizId}/questions/${question.id}`, {
          questionText: questionTextPlain,
          options: optionsPlain.map((opt, idx) => ({
            label: String.fromCharCode(65 + idx),
            text: opt,
            isCorrect: opt === correctAnswerPlain
          }))
        })
      }
      // Reset edited state and ref so it will be re-initialized from fresh API data
      setEditedQuestions([])
      hasInitializedRef.current = false
      // Refetch data and wait for it to complete
      await onSave?.()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save questions")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCheckboxChange = (questionIndex: number, option: string) => {
    setSelectedAnswers((prev) => {
      const current = prev[questionIndex] || []
      if (current.includes(option)) {
        return { ...prev, [questionIndex]: current.filter((o) => o !== option) }
      } else {
        return { ...prev, [questionIndex]: [...current, option] }
      }
    })
  }

  const handleModifyPrompt = () => {
    router.push(`/quiz/generated/modify?id=${quizId}`)
  }

  const handleSaveDraft = async () => {
    if (!quizId) return

    setIsSaving(true)
    setSaveError(null)

    try {
      // First save any edited questions if in edit mode
      if (editedQuestions.length > 0) {
        for (const question of editedQuestions) {
          // Extract plain text from HTML
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = question.text
          const questionTextPlain = tempDiv.textContent || tempDiv.innerText || question.text

          const optionsPlain = question.options.map(opt => {
            const optDiv = document.createElement('div')
            optDiv.innerHTML = opt
            return optDiv.textContent || optDiv.innerText || opt
          })

          const correctAnswerPlain = (() => {
            const correctDiv = document.createElement('div')
            correctDiv.innerHTML = question.correctAnswer
            return correctDiv.textContent || correctDiv.innerText || question.correctAnswer
          })()

          await api.put(`/quizzes/${quizId}/questions/${question.id}`, {
            questionText: questionTextPlain,
            options: optionsPlain.map((opt, idx) => ({
              label: String.fromCharCode(65 + idx),
              text: opt,
              isCorrect: opt === correctAnswerPlain
            }))
          })
        }
      }
      // Then save status as draft
      await api.patch(`/quizzes/${quizId}/status`, { status: "draft" })
      // Don't refetch - keep showing current edited data
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save draft")
    } finally {
      setIsSaving(false)
    }
  }

  // Handle generate answer key
  const handleGenerateAnswerKey = async () => {
    if (!quizId) return

    setIsGeneratingAnswerKey(true)
    setAnswerKeyError(null)

    try {
      const response = await api.post<{ data: { answerKey: AnswerKey } }>(`/quizzes/${quizId}/answer-key`)
      setAnswerKey(response.data.answerKey)
    } catch (err) {
      setAnswerKeyError(err instanceof Error ? err.message : "Failed to generate answer key")
    } finally {
      setIsGeneratingAnswerKey(false)
    }
  }

  // Handle print - generates PDF and opens print dialog
  const handlePrint = useCallback(() => {
    if (!quiz) return

    // Convert local Quiz interface to QuizType for PDF generator
    const quizForPdf: QuizType = {
      id: quiz.id,
      teacherId: "",
      classId: "",
      subjectId: "",
      title: quiz.title,
      objective: quiz.objective,
      timeLimit: quiz.duration,
      difficultyLevel: (quiz.level?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
      totalQuestions: quiz.numQuestions || quiz.questions?.length || 0,
      totalMarks: quiz.totalMarks || quiz.numQuestions || quiz.questions?.length || 0,
      status: quiz.status as 'draft' | 'saved' | 'published',
      isOptional: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      class: quiz.class ? {
        id: quiz.class.id,
        name: quiz.class.name,
        grade: quiz.class.grade,
        section: quiz.class.section,
        schoolId: "",
        createdAt: new Date().toISOString()
      } : undefined,
      subject: quiz.subject ? {
        id: quiz.subject.id,
        name: quiz.subject.name,
        code: (quiz.subject as any).code || ""
      } : undefined,
      chapters: quiz.chapters?.map((name, index) => ({
        id: `chapter-${index}`,
        name: typeof name === 'string' ? name : (name as any).name || '',
        subjectId: "",
        orderIndex: index
      })),
      questions: quiz.questions?.map((q, index) => ({
        id: q.id,
        quizId: quiz.id,
        questionText: q.text || (q as any).questionText || "",
        questionType: 'mcq' as const,
        marks: 1,
        orderIndex: index + 1,
        createdAt: new Date().toISOString(),
        options: q.options?.map((opt, optIndex) => ({
          id: `opt-${index}-${optIndex}`,
          questionId: q.id,
          optionLabel: String.fromCharCode(65 + optIndex),
          optionText: typeof opt === 'string' ? opt : (opt as any).optionText || (opt as any).text || "",
          isCorrect: typeof opt === 'string' ? opt === q.correctAnswer : (opt as any).isCorrect || false
        }))
      }))
    }

    const teacherName = user?.name || "Teacher"

    // If answer key is available, print with answer key
    let url: string
    if (answerKey && answerKey.answers && answerKey.answers.length > 0) {
      const result = generateQuizWithAnswerKeyPDF(quizForPdf, answerKey, teacherName)
      url = result.url
    } else {
      const result = generateQuizPDF(quizForPdf, teacherName)
      url = result.url
    }

    // Open PDF in new window and trigger print
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print()
      }
    }
  }, [quiz, user, answerKey])

  // Handle download - generates and downloads PDF directly
  const handleDownload = useCallback(() => {
    if (!quiz) return

    // Convert local Quiz interface to QuizType for PDF generator
    const quizForPdf: QuizType = {
      id: quiz.id,
      teacherId: "",
      classId: "",
      subjectId: "",
      title: quiz.title,
      objective: quiz.objective,
      timeLimit: quiz.duration,
      difficultyLevel: (quiz.level?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
      totalQuestions: quiz.numQuestions || quiz.questions?.length || 0,
      totalMarks: quiz.totalMarks || quiz.numQuestions || quiz.questions?.length || 0,
      status: quiz.status as 'draft' | 'saved' | 'published',
      isOptional: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      class: quiz.class ? {
        id: quiz.class.id,
        name: quiz.class.name,
        grade: quiz.class.grade,
        section: quiz.class.section,
        schoolId: "",
        createdAt: new Date().toISOString()
      } : undefined,
      subject: quiz.subject ? {
        id: quiz.subject.id,
        name: quiz.subject.name,
        code: (quiz.subject as any).code || ""
      } : undefined,
      chapters: quiz.chapters?.map((name, index) => ({
        id: `chapter-${index}`,
        name: typeof name === 'string' ? name : (name as any).name || '',
        subjectId: "",
        orderIndex: index
      })),
      questions: quiz.questions?.map((q, index) => ({
        id: q.id,
        quizId: quiz.id,
        questionText: q.text || (q as any).questionText || "",
        questionType: 'mcq' as const,
        marks: 1,
        orderIndex: index + 1,
        createdAt: new Date().toISOString(),
        options: q.options?.map((opt, optIndex) => ({
          id: `opt-${index}-${optIndex}`,
          questionId: q.id,
          optionLabel: String.fromCharCode(65 + optIndex), // A, B, C, D
          optionText: typeof opt === 'string' ? opt : (opt as any).optionText || (opt as any).text || "",
          isCorrect: typeof opt === 'string' ? opt === q.correctAnswer : (opt as any).isCorrect || false
        }))
      }))
    }

    const teacherName = user?.name || "Teacher"

    // If answer key is available, download with answer key
    if (answerKey && answerKey.answers && answerKey.answers.length > 0) {
      downloadQuizWithAnswerKeyPDF(quizForPdf, answerKey, teacherName)
    } else {
      downloadQuizPDF(quizForPdf, teacherName)
    }
  }, [quiz, user, answerKey])

  // Handle download DOCX - generates and downloads DOCX directly
  const handleDownloadDOCX = useCallback(async () => {
    if (!quiz) return

    // Convert local Quiz interface to QuizType for DOCX generator
    const quizForDocx: QuizType = {
      id: quiz.id,
      teacherId: "",
      classId: "",
      subjectId: "",
      title: quiz.title,
      objective: quiz.objective,
      timeLimit: quiz.duration,
      difficultyLevel: (quiz.level?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
      totalQuestions: quiz.numQuestions || quiz.questions?.length || 0,
      totalMarks: quiz.totalMarks || quiz.numQuestions || quiz.questions?.length || 0,
      status: quiz.status as 'draft' | 'saved' | 'published',
      isOptional: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      class: quiz.class ? {
        id: quiz.class.id,
        name: quiz.class.name,
        grade: quiz.class.grade,
        section: quiz.class.section,
        schoolId: "",
        createdAt: new Date().toISOString()
      } : undefined,
      subject: quiz.subject ? {
        id: quiz.subject.id,
        name: quiz.subject.name,
        code: (quiz.subject as any).code || ""
      } : undefined,
      chapters: quiz.chapters?.map((name, index) => ({
        id: `chapter-${index}`,
        name: typeof name === 'string' ? name : (name as any).name || '',
        subjectId: "",
        orderIndex: index
      })),
      questions: quiz.questions?.map((q, index) => ({
        id: q.id,
        quizId: quiz.id,
        questionText: q.text || (q as any).questionText || "",
        questionType: 'mcq' as const,
        marks: 1,
        orderIndex: index + 1,
        createdAt: new Date().toISOString(),
        options: q.options?.map((opt, optIndex) => ({
          id: `opt-${index}-${optIndex}`,
          questionId: q.id,
          optionLabel: String.fromCharCode(65 + optIndex),
          optionText: typeof opt === 'string' ? opt : (opt as any).optionText || (opt as any).text || "",
          isCorrect: typeof opt === 'string' ? opt === q.correctAnswer : (opt as any).isCorrect || false
        }))
      }))
    }

    const teacherName = user?.name || "Teacher"

    // If answer key is available, download with answer key
    if (answerKey && answerKey.answers && answerKey.answers.length > 0) {
      await downloadQuizWithAnswerKeyDOCX(quizForDocx, answerKey, teacherName)
    } else {
      await downloadQuizDOCX(quizForDocx, teacherName)
    }
  }, [quiz, user, answerKey])

  // Handle share - shares PDF file when supported
  const handleShare = useCallback(async () => {
    if (!quiz) return

    // Convert local Quiz interface to QuizType for PDF generator
    const quizForPdf: QuizType = {
      id: quiz.id,
      teacherId: "",
      classId: "",
      subjectId: "",
      title: quiz.title,
      objective: quiz.objective,
      timeLimit: quiz.duration,
      difficultyLevel: (quiz.level?.toLowerCase() as 'easy' | 'medium' | 'hard') || 'medium',
      totalQuestions: quiz.numQuestions || quiz.questions?.length || 0,
      totalMarks: quiz.totalMarks || quiz.numQuestions || quiz.questions?.length || 0,
      status: quiz.status as 'draft' | 'saved' | 'published',
      isOptional: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      class: quiz.class ? {
        id: quiz.class.id,
        name: quiz.class.name,
        grade: quiz.class.grade,
        section: quiz.class.section,
        schoolId: "",
        createdAt: new Date().toISOString()
      } : undefined,
      subject: quiz.subject ? {
        id: quiz.subject.id,
        name: quiz.subject.name,
        code: (quiz.subject as any).code || ""
      } : undefined,
      chapters: quiz.chapters?.map((name, index) => ({
        id: `chapter-${index}`,
        name: typeof name === 'string' ? name : (name as any).name || '',
        subjectId: "",
        orderIndex: index
      })),
      questions: quiz.questions?.map((q, index) => ({
        id: q.id,
        quizId: quiz.id,
        questionText: q.text || (q as any).questionText || "",
        questionType: 'mcq' as const,
        marks: 1,
        orderIndex: index + 1,
        createdAt: new Date().toISOString(),
        options: q.options?.map((opt, optIndex) => ({
          id: `opt-${index}-${optIndex}`,
          questionId: q.id,
          optionLabel: String.fromCharCode(65 + optIndex),
          optionText: typeof opt === 'string' ? opt : (opt as any).optionText || (opt as any).text || "",
          isCorrect: typeof opt === 'string' ? opt === q.correctAnswer : (opt as any).isCorrect || false
        }))
      }))
    }

    // Generate PDF (with answer key if available)
    const teacherName = user?.name || "Teacher"
    let url: string
    let filename: string
    if (answerKey && answerKey.answers && answerKey.answers.length > 0) {
      const result = generateQuizWithAnswerKeyPDF(quizForPdf, answerKey, teacherName)
      url = result.url
      filename = result.filename
    } else {
      const result = generateQuizPDF(quizForPdf, teacherName)
      url = result.url
      filename = result.filename
    }
    const response = await fetch(url)
    const pdfBlob = await response.blob()
    URL.revokeObjectURL(url)

    // Create File object for sharing
    const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

    // Check if file sharing is supported
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
      try {
        await navigator.share({
          title: quiz?.title || "Quiz",
          text: `Quiz: ${quiz?.title || "Quiz"}`,
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
          title: quiz?.title || "Quiz",
          text: `Check out this quiz: ${quiz?.title || "Quiz"}`,
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
  }, [quiz, user, answerKey])

  // Dynamic quiz info
  const quizTitle = quiz?.title || "Generated Quiz"
  const quizDuration = quiz?.duration ? `${quiz.duration} mins` : "15 mins"
  const subjectName = quiz?.subject?.name || "Mathematics"
  const className = quiz?.class ? `${quiz.class.grade}` : "VII"
  const topics = quiz?.chapters?.join(", ") || "Fractions"
  const totalQuestions = quiz?.numQuestions || questions.length || 10
  const maxMarks = totalQuestions // 1 mark per MCQ question

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile: Plan Name and Duration (Default View) */}
        <div className="flex-shrink-0 lg:hidden bg-[#E9E9E9] px-4 py-3 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#242220]">{quizTitle}</h2>
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-[#242220]">{quizDuration}</span>
          </div>
        </div>

        {/* Desktop Header with Title */}
        <div className="flex-shrink-0 hidden lg:block bg-[#E9E9E9] px-12 py-6 rounded-t-2xl">
          <h1 className="text-xl font-bold">{quizTitle}</h1>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 lg:px-8 py-4 lg:py-6">
            {/* Quiz Parameters Section */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                <p className="font-bold text-base lg:text-lg">Subject: {subjectName}</p>
                <p className="text-sm lg:text-base">Class: {className}</p>
                <p className="text-sm lg:text-base">Topic: {topics}</p>
                <p className="text-sm lg:text-base">Total Questions: {totalQuestions}</p>
                <p className="text-sm lg:text-base">Time: {quizDuration}</p>
              </div>
              <div>
                <p className="font-bold text-base lg:text-lg">Maximum Marks: {maxMarks}</p>
              </div>
            </div>

            {/* Instructions Section */}
            <div className="mb-6">
              <p className="font-bold mb-2 text-sm lg:text-base">Instructions</p>
              <ul className="list-disc list-inside space-y-1 ml-2 text-sm lg:text-base">
                <li>Attempt all questions.</li>
                <li>Each question carries 1 mark.</li>
                <li>Choose the most appropriate answer.</li>
                <li>No negative marking.</li>
              </ul>
            </div>

            {/* Questions Section */}
            <div className="mb-4">
              {questions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No questions generated yet.</p>
                  <p className="text-sm mt-2">Questions will appear here once generated.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {displayQuestions.map((question, index) => (
                    <div key={question.id || index} className="space-y-3">
                      <p className="font-semibold text-sm lg:text-base">
                        Question {index + 1}
                      </p>
                      {isEditMode ? (
                        <CompactTextEditor
                          content={question.text}
                          onChange={(html) => handleQuestionTextChange(index, html)}
                          placeholder="Enter question text..."
                          className="bg-white"
                        />
                      ) : (
                        <p className="text-sm lg:text-base" dangerouslySetInnerHTML={{ __html: question.text }} />
                      )}
                      <div className="ml-4 space-y-2">
                        {question.options.map((option, optIndex) => {
                          const isChecked = selectedAnswers[index]?.includes(option) || false
                          return (
                            <div key={optIndex} className="flex items-start gap-2">
                              {!isEditMode && (
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCheckboxChange(index, option)}
                                  className="w-4 h-4 border-gray-300 rounded text-[#7D5CB0] focus:ring-[#7D5CB0] cursor-pointer mt-1"
                                />
                              )}
                              {isEditMode ? (
                                <div className="flex-1 flex items-center gap-2">
                                  <span className="text-sm font-medium">{String.fromCharCode(97 + optIndex)})</span>
                                  <CompactTextEditor
                                    content={option}
                                    onChange={(html) => handleOptionChange(index, optIndex, html)}
                                    placeholder="Enter option text..."
                                    className="flex-1 bg-white"
                                  />
                                </div>
                              ) : (
                                <span className="text-sm lg:text-base" dangerouslySetInnerHTML={{ __html: option }} />
                              )}
                            </div>
                          )
                        })}
                      </div>
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
        </div>

        {/* Error Message */}
        {saveError && (
          <div className="px-4 lg:px-12 py-2">
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {saveError}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-4 lg:px-12 py-4 lg:py-6 border-t border-gray-200">
          {/* Mobile: Stack buttons */}
          <div className="lg:hidden flex flex-col gap-4">
            {/* First Row: Print, Save draft, Share, Download */}
            <div className="flex justify-start items-center gap-3 flex-wrap">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                <Printer size={18} /> Print
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm disabled:opacity-50"
              >
                <FileText size={18} /> {isSaving ? "Saving..." : "Save draft"}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
                {linkCopied ? "Copied!" : "Share"}
              </button>
              <DownloadDropup
                onDownloadPDF={handleDownload}
                onDownloadDOCX={handleDownloadDOCX}
                variant="mobile"
              />
            </div>
            {/* Second Row: Modify Prompt and Save */}
            <div className="flex gap-3">
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
            </div>
            {/* Third Row: Generate Answer Key */}
            <div className="flex gap-3">
              <Button
                onClick={handleGenerateAnswerKey}
                disabled={isGeneratingAnswerKey || !quiz?.questions?.length}
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
            {answerKeyError && (
              <p className="text-red-500 text-sm text-center">{answerKeyError}</p>
            )}
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden lg:flex items-center gap-2 flex-wrap justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={handleShare}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
              >
                {linkCopied ? <Check size={18} /> : <Share2 size={18} />}
                {linkCopied ? "Copied!" : "Share"}
              </button>
              <DownloadDropup
                onDownloadPDF={handleDownload}
                onDownloadDOCX={handleDownloadDOCX}
                variant="desktop"
              />
              <button
                onClick={handlePrint}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
              >
                <Printer size={18} /> Print
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium disabled:opacity-50 hover:bg-[#D5D2E3]"
              >
                <FileText size={18} /> {isSaving ? "Saving..." : "Draft"}
              </button>
              <button
                onClick={handleGenerateAnswerKey}
                disabled={isGeneratingAnswerKey || !quiz?.questions?.length}
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

            <div className="flex items-center gap-1">
              <button
                onClick={handleModifyPrompt}
                className="px-6 py-2 text-sm border-2 border-[#DF6647] text-[#DF6647] rounded-lg font-medium"
              >
                Modify Prompt
              </button>
              <PublishDialog quizId={quizId} onPublish={onSave}>
                <button className="px-6 py-1 text-sm bg-[#DF6647] text-white rounded-lg font-medium">
                  Publish
                </button>
              </PublishDialog>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

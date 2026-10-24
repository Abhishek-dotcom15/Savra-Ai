"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronDown, ChevronUp, Share2, Printer, Edit2 } from "lucide-react"
import { api } from "@/lib/api"
import { useFetch } from "@/hooks/use-api"
import { useAuth } from "@/contexts/auth-context"
import { Lesson, LessonPeriod } from "@/types/api"
import { generateLessonPlanPDF } from "@/lib/pdf-generator"
import { downloadLessonPlanDOCX } from "@/lib/docx-generator"
import { DownloadDropup } from "@/components/ui/download-dropup"
import { EditContentModal } from "./edit-content-modal"

// Field labels for the period sections
const PERIOD_FIELDS = [
  { key: "concept", label: "Concept/Topic" },
  { key: "learningOutcomes", label: "Learning Outcomes" },
  { key: "teacherLearningProcess", label: "Teacher Learning Process" },
  { key: "assessment", label: "Assessment" },
  { key: "resources", label: "Resources" },
  { key: "centurySkillsValueEducation", label: "21st Century Skills & Value Education" },
  { key: "realLifeApplication", label: "Real Life Application" },
  { key: "reflection", label: "Reflection" },
] as const

type PeriodFieldKey = typeof PERIOD_FIELDS[number]["key"]

interface EditLessonDetailsProps {
  lesson?: Lesson | null
  onSave?: () => void
}

export default function EditLessonDetails({ lesson: propLesson, onSave }: EditLessonDetailsProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const lessonId = searchParams.get("id")
  const { user } = useAuth()
  const teacherName = user?.name || ""

  // Fetch lesson data if lessonId is provided
  const { data: fetchedLesson, isLoading: isLoadingLesson, refetch: refetchLesson } = useFetch<Lesson>(
    lessonId ? `/lessons/${lessonId}` : null
  )
  
  const lesson = propLesson || fetchedLesson
  
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState({
    introduction: true,
    coreExplanation: false,
  })

  // New fields state
  const [startDate, setStartDate] = useState<string | null>(null)
  const [endDate, setEndDate] = useState<string | null>(null)
  const [topic, setTopic] = useState<string>("")
  const [numberOfPeriods, setNumberOfPeriods] = useState<number>(1)
  const [periods, setPeriods] = useState<LessonPeriod[]>([])

  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingPeriodIndex, setEditingPeriodIndex] = useState<number>(0)
  const [editingField, setEditingField] = useState<PeriodFieldKey>("concept")
  const [editingContent, setEditingContent] = useState<string>("")
  const [editingLabel, setEditingLabel] = useState<string>("")

  // Open edit modal for a specific field
  const handleEditField = (periodIndex: number, field: PeriodFieldKey) => {
    // Get content and label immediately before opening modal
    const period = periods[periodIndex]
    const content = period ? (period[field] as string) || "" : ""
    const fieldConfig = PERIOD_FIELDS.find(f => f.key === field)
    const label = fieldConfig?.label || "Edit Content"

    setEditingPeriodIndex(periodIndex)
    setEditingField(field)
    setEditingContent(content)
    setEditingLabel(`Edit ${label} - Period ${period?.periodNo || periodIndex + 1}`)
    setEditModalOpen(true)
  }

  // Helper function to strip HTML tags and get plain text
  const stripHtmlTags = (html: string): string => {
    if (!html) return ""
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return tempDiv.textContent || tempDiv.innerText || ""
  }

  // Save edited content from modal (strip HTML for plain text storage)
  const handleSaveEditedContent = (content: string) => {
    // Strip HTML tags to store plain text
    const plainText = stripHtmlTags(content)
    setPeriods(prev => {
      const updated = [...prev]
      updated[editingPeriodIndex] = {
        ...updated[editingPeriodIndex],
        [editingField]: plainText,
      }
      return updated
    })
  }

  // Initialize state from lesson data
  useEffect(() => {
    if (lesson) {
      setStartDate(lesson.startDate || null)
      setEndDate(lesson.endDate || null)
      setTopic(lesson.topic || "")
      setNumberOfPeriods(lesson.numberOfPeriods || 1)
      const lessonPeriods = lesson.periods || []
      setPeriods(lessonPeriods)
      console.log('Lesson loaded with periods:', {
        count: lessonPeriods.length,
        periods: lessonPeriods.map(p => ({
          periodNo: p.periodNo,
          hasConcept: !!p.concept,
          hasLearningOutcomes: !!p.learningOutcomes,
          hasTeacherProcess: !!p.teacherLearningProcess,
          hasContent: !!(p.concept || p.learningOutcomes || p.teacherLearningProcess || p.assessment || p.resources)
        }))
      })
    }
  }, [lesson])

  // Auto-generate empty periods only for NEW lesson creation (not when editing existing)
  // This effect should NOT run when loading an existing lesson with periods
  useEffect(() => {
    // Skip if we don't have a valid numberOfPeriods
    if (numberOfPeriods <= 0) return

    // Use functional update to get the current state and avoid stale closures
    setPeriods(currentPeriods => {
      // Check if current periods have any content (from loaded lesson)
      const hasContent = currentPeriods.some(p =>
        p.concept || p.learningOutcomes || p.teacherLearningProcess ||
        p.assessment || p.resources || p.centurySkillsValueEducation ||
        p.realLifeApplication || p.reflection
      )

      // If periods already have content, don't modify them at all
      // This prevents overwriting loaded lesson data
      if (hasContent) {
        return currentPeriods
      }

      // Only create new empty periods for fresh lesson creation
      // (when we have no periods or they're all empty)
      if (currentPeriods.length < numberOfPeriods) {
        const newPeriods: LessonPeriod[] = [...currentPeriods]
        for (let i = currentPeriods.length + 1; i <= numberOfPeriods; i++) {
          newPeriods.push({
            id: `temp-${i}`,
            lessonId: lessonId || "",
            periodNo: i,
          })
        }
        return newPeriods
      } else if (numberOfPeriods < currentPeriods.length) {
        return currentPeriods.slice(0, numberOfPeriods)
      }

      return currentPeriods
    })
  }, [numberOfPeriods, lessonId])

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }))
  }

  const handleModifyPrompt = () => {
    router.push(`/lesson-plan/edit/modify?id=${lessonId}`)
  }

  const handleSaveLessonPlan = async () => {
    if (!lessonId) return

    setIsSaving(true)
    setSaveError(null)

    try {
      // Format dates for API
      const startDateISO = startDate ? new Date(startDate).toISOString() : null
      const endDateISO = endDate ? new Date(endDate).toISOString() : null

      // Use local periods state if available, otherwise fall back to lesson.periods
      // This handles the race condition where periods state hasn't been updated yet
      const effectivePeriods = periods.length > 0 ? periods : (lesson?.periods || [])

      // Prepare periods data - ensure we have valid data with content
      const periodsData = effectivePeriods
        .filter(p => {
          // Only include periods that have at least some content
          return p.periodNo && (
            p.concept ||
            p.learningOutcomes ||
            p.teacherLearningProcess ||
            p.assessment ||
            p.resources ||
            p.centurySkillsValueEducation ||
            p.realLifeApplication ||
            p.reflection
          )
        })
        .map(p => ({
          periodNo: p.periodNo,
          concept: p.concept || null,
          learningOutcomes: p.learningOutcomes || null,
          teacherLearningProcess: p.teacherLearningProcess || null,
          assessment: p.assessment || null,
          resources: p.resources || null,
          centurySkillsValueEducation: p.centurySkillsValueEducation || null,
          realLifeApplication: p.realLifeApplication || null,
          reflection: p.reflection || null,
        }))

      console.log('Saving lesson plan with periods:', {
        totalPeriods: effectivePeriods.length,
        periodsWithContent: periodsData.length,
        source: periods.length > 0 ? 'state' : 'lesson',
        periods: periodsData.map(p => ({
          periodNo: p.periodNo,
          hasConcept: !!p.concept,
          hasLearningOutcomes: !!p.learningOutcomes,
          hasTeacherProcess: !!p.teacherLearningProcess,
          hasContent: !!(p.concept || p.learningOutcomes || p.teacherLearningProcess || p.assessment || p.resources)
        }))
      })

      if (periodsData.length === 0) {
        console.error('WARNING: No periods with content to save!')
        setSaveError('No periods with content found. Please ensure your lesson plan has been generated.')
        setIsSaving(false)
        return
      }

      // Update lesson with all fields
      await api.put(`/lessons/${lessonId}`, {
        startDate: startDateISO,
        endDate: endDateISO,
        topic,
        numberOfPeriods,
        periods: periodsData,
      })

      // Update status only if it's not already "saved"
      if (lesson?.status !== "saved") {
        await api.patch(`/lessons/${lessonId}/status`, { status: "saved" })
      }
      
      // Refetch lesson data to sync with server and update local state
      // This ensures periods are properly loaded after save
      if (refetchLesson) {
        try {
          await refetchLesson()
          // The useEffect for lesson will automatically update periods state
          // and regenerate PDF if needed
          console.log('Lesson refetched after save')
        } catch (err) {
          console.warn('Background refetch failed:', err)
        }
      }
      
      onSave?.()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save lesson plan")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = () => {
    if (!lesson) return

    // Use periods state if available, otherwise fallback to lesson.periods
    const effectivePeriods = periods.length > 0 ? periods : (lesson.periods || [])

    // Create lesson object with current state
    const lessonWithPeriods: Lesson = {
      ...lesson,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      topic: topic || undefined,
      numberOfPeriods: numberOfPeriods || undefined,
      periods: effectivePeriods.length > 0 ? effectivePeriods : undefined,
    }

    // Check if lesson has new template format
    if (effectivePeriods.length > 0) {
      const { url, filename } = generateLessonPlanPDF(lessonWithPeriods, user?.name || "")
      // Trigger download
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      // Revoke URL after download
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } else {
      // Fallback to print for old format
      window.print()
    }
  }

  const handleDownloadDOCX = async () => {
    if (!lesson) return

    // Use periods state if available, otherwise fallback to lesson.periods
    const effectivePeriods = periods.length > 0 ? periods : (lesson.periods || [])

    // Create lesson object with current state
    const lessonWithPeriods: Lesson = {
      ...lesson,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      topic: topic || undefined,
      numberOfPeriods: numberOfPeriods || undefined,
      periods: effectivePeriods.length > 0 ? effectivePeriods : undefined,
    }

    await downloadLessonPlanDOCX(lessonWithPeriods, user?.name || "")
  }

  // Parse content into sections if available
  const lessonContent = lesson?.content || ""
  const lessonTitle = lesson?.title || "Generated Lesson Plan"
  const lessonDuration = lesson?.duration ? `${lesson.duration} mins` : "45 mins"

  // Simple markdown to HTML converter
  const formatContent = (content: string): string => {
    if (!content) return ""

    // Escape HTML first to prevent XSS
    let html = content
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")

    // Convert markdown to HTML
    // Headers
    html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>")
    html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>")
    html = html.replace(/^# (.+)$/gm, "<h1>$1</h1>")

    // Bold and italic
    html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>")

    // Lists - unordered
    html = html.replace(/^[-*] (.+)$/gm, "<li>$1</li>")

    // Lists - ordered
    html = html.replace(/^\d+\. (.+)$/gm, "<li>$1</li>")

    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*<\/li>\n?)+/g, (match) => {
      return `<ul class="list-disc list-inside space-y-1 my-2">${match}</ul>`
    })

    // Line breaks - convert double newlines to paragraphs
    html = html
      .split(/\n\n+/)
      .map(para => {
        para = para.trim()
        if (!para) return ""
        // Don't wrap if already wrapped in a tag
        if (para.startsWith("<h") || para.startsWith("<ul") || para.startsWith("<ol")) {
          return para
        }
        return `<p>${para.replace(/\n/g, "<br>")}</p>`
      })
      .join("\n")

    return html
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden">
        {/* Mobile: Plan Name and Duration (Default View) */}
        <div className="flex-shrink-0 lg:hidden bg-[#E9E9E9] px-4 py-3 rounded-t-2xl flex items-center justify-between">
          <h2 className="text-lg font-bold text-[#242220]">{lessonTitle}</h2>
          <div className="flex items-center gap-4">
            <span className="text-base font-medium text-[#242220]">{lessonDuration}</span>
          </div>
        </div>

        {/* Title editor and formatting toolbar removed per requirements */}

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="px-4 lg:px-12 py-4 lg:py-8 space-y-6">
            {/* Lesson Plan Information section removed per requirements */}
            
            {isLoadingLesson ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : periods.length > 0 ? (
              <div>
                {/* Document Header */}
                <div className="text-center mb-6">
                  <h2 className="text-lg lg:text-xl font-bold">{lesson?.subject?.name || "Subject"}</h2>
                  <h3 className="text-base lg:text-lg font-bold mt-1">Lesson Plan</h3>
                  <p className="text-sm lg:text-base font-bold mt-1">Grade {lesson?.class?.grade || ""}</p>
                </div>

                {/* Info Row: Teacher Name | Topic | No. of Periods */}
                <div className="grid grid-cols-3 border border-gray-300 rounded-lg mb-6">
                  <div className="p-3 border-r border-gray-300">
                    <p className="text-xs text-gray-500">Teacher Name</p>
                    <p className="text-sm font-semibold">{teacherName || "N/A"}</p>
                  </div>
                  <div className="p-3 border-r border-gray-300">
                    <p className="text-xs text-gray-500">Topic</p>
                    <p className="text-sm font-semibold">{topic || "-"}</p>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">No. of Periods</p>
                    <p className="text-sm font-semibold">{numberOfPeriods || "-"}</p>
                  </div>
                </div>

                {/* Periods Table - cells are clickable to edit */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-3 py-2 text-left font-semibold whitespace-nowrap">Period No.</th>
                        {PERIOD_FIELDS.map(({ key, label }) => (
                          <th key={key} className="border border-gray-300 px-3 py-2 text-left font-semibold min-w-[120px]">
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map((period, periodIndex) => (
                        <tr key={period.id || period.periodNo} className="align-top">
                          <td className="border border-gray-300 px-3 py-2 font-semibold text-center">
                            {period.periodNo}
                          </td>
                          {PERIOD_FIELDS.map(({ key }) => {
                            const content = (period[key] as string) || ""
                            return (
                              <td
                                key={key}
                                onClick={() => handleEditField(periodIndex, key)}
                                className="border border-gray-300 px-3 py-2 cursor-pointer hover:bg-[#F5F0FF] transition-colors group relative"
                              >
                                {content.trim() ? (
                                  <div className="prose prose-sm max-w-none text-gray-700">
                                    <div dangerouslySetInnerHTML={{ __html: formatContent(content) }} />
                                    <Edit2 className="w-3 h-3 text-[#9B61FF] opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity" />
                                  </div>
                                ) : (
                                  <span className="text-gray-400 italic text-xs">Click to add...</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Legacy Content Section (for backward compatibility) - Only show if no periods */
              lessonContent ? (
                <div className="border border-gray-200 rounded-lg">
                  <button
                    onClick={() => toggleSection("introduction")}
                    className="w-full px-4 lg:px-6 py-3 lg:py-4 flex items-center gap-3 lg:gap-4 bg-gray-100 lg:bg-[#F5F5F5] rounded-lg transition"
                  >
                    <span className="flex-1 text-left font-medium lg:font-semibold text-gray-900">{lessonTitle}</span>
                    <div className="text-purple-500">
                      {expandedSections.introduction ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </button>

                  {expandedSections.introduction && (
                    <div className="px-6 pb-6 border-t border-gray-200">
                      <div
                        className="pt-4 prose prose-sm max-w-none text-gray-700
                          prose-headings:text-gray-900 prose-headings:font-bold
                          prose-h1:text-xl prose-h2:text-lg prose-h3:text-base
                          prose-p:my-2 prose-ul:my-2 prose-ol:my-2
                          prose-li:my-1"
                        dangerouslySetInnerHTML={{ __html: formatContent(lessonContent) }}
                      />
                    </div>
                  )}
                </div>
              ) : null
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex-shrink-0 px-4 lg:px-12 py-4 lg:py-6 border-t border-gray-200">
          {/* Error Message */}
          {saveError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {saveError}
            </div>
          )}

          {/* Mobile: Stack buttons */}
          <div className="lg:hidden flex flex-col gap-4">
            {/* First Row: Print, Share, Download */}
            <div className="flex justify-start items-center gap-3 flex-wrap">
              <button
                onClick={() => {
                  const effectivePeriods = periods.length > 0 ? periods : (lesson?.periods || [])
                  if (!lesson || effectivePeriods.length === 0) return
                  const lessonWithPeriods: Lesson = {
                    ...lesson,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    topic: topic || undefined,
                    numberOfPeriods: numberOfPeriods || undefined,
                    periods: effectivePeriods,
                  }
                  const { url } = generateLessonPlanPDF(lessonWithPeriods, user?.name || "")
                  const printWindow = window.open(url, '_blank')
                  if (printWindow) {
                    printWindow.onload = () => {
                      printWindow.print()
                    }
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                <Printer size={18} /> Print
              </button>
              <DownloadDropup
                onDownloadPDF={handleDownload}
                onDownloadDOCX={handleDownloadDOCX}
                variant="mobile"
              />
              <button
                onClick={async () => {
                  const effectivePeriods = periods.length > 0 ? periods : (lesson?.periods || [])
                  if (!lesson || effectivePeriods.length === 0) return
                  const lessonWithPeriods: Lesson = {
                    ...lesson,
                    startDate: startDate || undefined,
                    endDate: endDate || undefined,
                    topic: topic || undefined,
                    numberOfPeriods: numberOfPeriods || undefined,
                    periods: effectivePeriods,
                  }
                  // Generate PDF
                  const { url, filename } = generateLessonPlanPDF(lessonWithPeriods, user?.name || "")
                  const response = await fetch(url)
                  const pdfBlob = await response.blob()
                  URL.revokeObjectURL(url)

                  // Create File object for sharing
                  const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

                  // Check if file sharing is supported
                  if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                    try {
                      await navigator.share({
                        title: lesson?.title || "Lesson Plan",
                        text: `Lesson Plan: ${lesson?.title || "Lesson Plan"}`,
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
                        title: lesson?.title || "Lesson Plan",
                        text: `Check out this lesson plan: ${lesson?.title || "Lesson Plan"}`,
                        url: shareUrl,
                      })
                      return
                    } catch (err) {
                      if ((err as Error).name !== "AbortError") {
                        console.error("Share failed:", err)
                      }
                    }
                  }

                  // Final fallback: Copy link
                  try {
                    await navigator.clipboard.writeText(shareUrl)
                    alert("Link copied to clipboard!")
                  } catch (err) {
                    alert(`Copy this link: ${shareUrl}`)
                  }
                }}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-[#B595FF] hover:bg-[#A085EF] text-white rounded-xl font-semibold text-sm"
              >
                <Share2 size={18} /> Share
              </button>
            </div>
            {/* Second Row: Modify Prompt and Save */}
            <div className="flex gap-3">
              <button
                onClick={handleModifyPrompt}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-[#DF6647] text-[#DF6647] bg-white rounded-xl font-semibold hover:bg-[#DF6647]/10 transition-colors"
              >
                Modify Prompt
              </button>
              <button
                onClick={handleSaveLessonPlan}
                disabled={isSaving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#DF6647] hover:bg-[#DF6647]/90 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Lesson Plan"}
              </button>
            </div>
          </div>

          {/* Desktop: Original layout */}
          <div className="hidden lg:flex items-center gap-3 flex-wrap">
            <button
              onClick={async () => {
                const effectivePeriods = periods.length > 0 ? periods : (lesson?.periods || [])
                if (!lesson || effectivePeriods.length === 0) return
                const lessonWithPeriods: Lesson = {
                  ...lesson,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  topic: topic || undefined,
                  numberOfPeriods: numberOfPeriods || undefined,
                  periods: effectivePeriods,
                }
                // Generate PDF
                const { url, filename } = generateLessonPlanPDF(lessonWithPeriods, user?.name || "")
                const response = await fetch(url)
                const pdfBlob = await response.blob()
                URL.revokeObjectURL(url)

                // Create File object for sharing
                const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' })

                // Check if file sharing is supported
                if (navigator.share && navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
                  try {
                    await navigator.share({
                      title: lesson?.title || "Lesson Plan",
                      text: `Lesson Plan: ${lesson?.title || "Lesson Plan"}`,
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
                      title: lesson?.title || "Lesson Plan",
                      text: `Check out this lesson plan: ${lesson?.title || "Lesson Plan"}`,
                      url: shareUrl,
                    })
                    return
                  } catch (err) {
                    if ((err as Error).name !== "AbortError") {
                      console.error("Share failed:", err)
                    }
                  }
                }

                // Final fallback: Copy link
                try {
                  await navigator.clipboard.writeText(shareUrl)
                  alert("Link copied to clipboard!")
                } catch (err) {
                  alert(`Copy this link: ${shareUrl}`)
                }
              }}
              className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
            >
              <Share2 size={18} /> Share
            </button>
            <DownloadDropup
              onDownloadPDF={handleDownload}
              onDownloadDOCX={handleDownloadDOCX}
              variant="desktop"
            />
            <button
              onClick={() => {
                const effectivePeriods = periods.length > 0 ? periods : (lesson?.periods || [])
                if (!lesson || effectivePeriods.length === 0) return
                const lessonWithPeriods: Lesson = {
                  ...lesson,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                  topic: topic || undefined,
                  numberOfPeriods: numberOfPeriods || undefined,
                  periods: effectivePeriods,
                }
                const { url } = generateLessonPlanPDF(lessonWithPeriods, user?.name || "")
                const printWindow = window.open(url, '_blank')
                if (printWindow) {
                  printWindow.onload = () => {
                    printWindow.print()
                  }
                }
              }}
              className="flex text-sm items-center gap-2 px-4 py-2 bg-[#E2DFF0] text-gray-700 rounded-lg font-medium hover:bg-[#D5D2E3]"
            >
              <Printer size={18} /> Print
            </button>

            <div className="ml-auto flex items-center gap-3">
              <button
                onClick={handleModifyPrompt}
                className="px-6 py-2 text-sm border-2 border-[#DF6647] text-[#DF6647] rounded-lg font-medium hover:bg-[#DF6647] hover:text-white transition-colors"
              >
                Modify Prompt
              </button>
              <button
                onClick={handleSaveLessonPlan}
                disabled={isSaving}
                className="px-6 py-2 text-sm bg-[#DF6647] text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Lesson Plan"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Content Modal */}
      <EditContentModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEditedContent}
        title={editingLabel}
        content={editingContent}
      />
    </div>
  )
}

"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { QuizObjectiveSection } from "@/features/teacher/quiz/components/objective-section"
import { FileUploadSection } from "@/features/teacher/lesson-plan/components/file-upload-section"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { useChapters } from "@/hooks/use-chapters"
import { useTeacherSubjectsData } from "@/hooks/use-subjects"
import { useTeacherClasses } from "@/hooks/use-classes"

interface Chapter {
    id: string
    name: string
    part?: string
}

interface Quiz {
    id: string
    title: string
    status: string
}

interface QuizContentProps {
    selectedClassId: string
    selectedSubjectId: string
    filteredSubjects?: Array<{ id: string; name: string }>
}

export default function QuizContent({ selectedClassId, selectedSubjectId, filteredSubjects }: QuizContentProps) {
    const router = useRouter()
    
    // Get subject name and class grade from IDs for chapters fallback
    const { data: subjectsData } = useTeacherSubjectsData()
    const { data: classesData } = useTeacherClasses()
    
    // Try to find subject from multiple sources
    const selectedSubjectObj = subjectsData?.find((s: any) => s.id === selectedSubjectId) || 
                              filteredSubjects?.find((s: any) => s.id === selectedSubjectId)
    const selectedSubject = selectedSubjectObj?.name
    const selectedClass = classesData?.find((c: any) => c.id === selectedClassId)
    
    // Extract class grade with fallback
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

    const [totalQuestions, setTotalQuestions] = useState<string>("")
    const [difficultyLevel, setDifficultyLevel] = useState<string>("")
    const [timeLimit, setTimeLimit] = useState<string>("20")
    const [objective, setObjective] = useState<string>("")
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
               totalQuestions !== ""
    }, [hasValidIds, totalQuestions])

    const toggleChapter = (chapterId: string) => {
        setSelectedChapterIds((prev) =>
            prev.includes(chapterId) ? prev.filter((c) => c !== chapterId) : [...prev, chapterId]
        )
    }

    const handleFileUpload = (file: File) => {
        setUploadedFile(file)
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

            const questionsCount = parseInt(totalQuestions) || 10

            // Create quiz with correct field names
            const quizData = {
                classId: selectedClassId,
                subjectId: selectedSubjectId,
                chapterIds: selectedChapterIds,
                title: selectedChapterNames.join(", ") || "Quiz",
                totalQuestions: questionsCount,
                totalMarks: questionsCount, // 1 mark per question by default
                difficultyLevel: (difficultyLevel || "medium").toLowerCase() as "easy" | "medium" | "hard",
                timeLimit: parseInt(timeLimit) || 20,
                objective,
                referenceFileUrl,
            }

            const response = await api.post<{ success: boolean; data: Quiz }>("/quizzes", quizData)
            const quiz = response.data

            // Generate questions
            await api.post(`/quizzes/${quiz.id}/generate`, {})

            // Navigate to generated quiz page with ID
            router.push(`/quiz/generated?id=${quiz.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to generate quiz")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex flex-col">
            {/* Content Area */}
            <div className="pb-4">
                {/* Chapters Section */}
                <div className="mb-6 lg:mb-8">
                    <h2 className="text-base font-bold text-[#000000] mb-4">Select Chapters</h2>
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

                {/* Quiz Options */}
                <div className="flex flex-row flex-wrap gap-6 mb-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-base font-semibold text-[#000000]">Number of Questions</label>
                        <Select value={totalQuestions} onValueChange={setTotalQuestions}>
                            <SelectTrigger className="w-[150px] border-[#A56AFF]">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent side="bottom" align="start" position="popper" sideOffset={4}>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="15">15</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="25">25</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-base font-semibold text-[#000000]">Difficulty Level</label>
                        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                            <SelectTrigger className="w-[150px] border-[#A56AFF]">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent side="bottom" align="start" position="popper" sideOffset={4}>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-base font-semibold text-[#000000]">Time Limit (mins)</label>
                        <Select value={timeLimit} onValueChange={setTimeLimit}>
                            <SelectTrigger className="w-[150px] border-[#A56AFF]">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent side="bottom" align="start" position="popper" sideOffset={4}>
                                <SelectItem value="10">10 mins</SelectItem>
                                <SelectItem value="15">15 mins</SelectItem>
                                <SelectItem value="20">20 mins</SelectItem>
                                <SelectItem value="30">30 mins</SelectItem>
                                <SelectItem value="45">45 mins</SelectItem>
                                <SelectItem value="60">60 mins</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Objective Section */}
                <div className="mb-6">
                    <QuizObjectiveSection 
                        objective={objective} 
                        onObjectiveChange={setObjective}
                        selectedClass={selectedClass ? `Class ${selectedClass.grade}` : undefined}
                        selectedSubject={selectedSubject}
                        selectedChapters={chaptersData?.filter((ch: Chapter) => selectedChapterIds.includes(ch.id)).map((ch: Chapter) => ch.name) || []}
                    />
                </div>

                {/* Upload Reference Material Section */}
                <div className="mb-6">
                    <h3 className="text-base font-bold text-black mb-4">Upload Reference Material</h3>
                    <FileUploadSection onFileUpload={handleFileUpload} uploadedFileName={uploadedFile?.name} />
                </div>
            </div>

            {/* Bottom Section */}
            <div className="pt-4 lg:pt-6 mt-4">
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}
                {/* Generate Button */}
                <div className="flex justify-center lg:justify-end gap-2">
                    <Button className="border border-[#DF6647] text-[#DF6647] bg-white px-6 py-4 lg:py-6 rounded-xl hover:bg-[#DF6647]/10 font-semibold">
                        View Drafts
                    </Button>
                    <Button
                        onClick={handleGenerate}
                        disabled={!isFormValid || isLoading}
                        className={`px-6 py-4 lg:py-6 rounded-xl font-semibold text-white transition-all ${
                            isFormValid && !isLoading
                                ? "bg-[#DF6647] hover:bg-[#FF5A35] shadow-lg hover:shadow-xl cursor-pointer"
                                : "bg-[#B5B5B5] opacity-60 cursor-not-allowed"
                        }`}
                    >
                        {isLoading ? "Generating..." : "Generate Quiz"}
                    </Button>
                </div>
            </div>
        </div>
    )
}

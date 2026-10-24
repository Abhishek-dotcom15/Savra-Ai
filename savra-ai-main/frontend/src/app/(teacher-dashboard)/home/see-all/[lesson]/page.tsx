"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function LessonPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.lesson as string

    useEffect(() => {
        if (!id) return

        // Parse the ID to determine the type
        // IDs are in format: quiz-{uuid}, lesson-{uuid}, or assessment-{uuid}
        if (id.startsWith("quiz-")) {
            const quizId = id.replace("quiz-", "")
            router.replace(`/quiz/generated?id=${quizId}`)
        } else if (id.startsWith("lesson-")) {
            const lessonId = id.replace("lesson-", "")
            router.replace(`/lesson-plan/edit?id=${lessonId}`)
        } else if (id.startsWith("assessment-")) {
            const assessmentId = id.replace("assessment-", "")
            router.replace(`/assessments/create/question-paper?id=${assessmentId}`)
        } else {
            // Fallback: if ID doesn't match expected format, try to determine type
            // or show error
            console.error("Unknown ID format:", id)
            router.replace("/home/see-all")
        }
    }, [id, router])

    // Show loading while redirecting
    return (
        <div className="flex flex-col h-full p-4 lg:p-8">
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        </div>
    )
}

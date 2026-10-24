"use client"

import { useState, useMemo, useEffect } from "react"
import { CreatePaperHeader } from "@/features/teacher/assessments/components/create-paper-header"
import QuestionPaperForm from "@/features/teacher/assessments/components/question-paper-form"
import { useTeacherClasses } from "@/hooks/use-classes"
import { useTeacherSubjectsData } from "@/hooks/use-subjects"

export default function CreatePaperPage() {
    const { data: classes, isLoading: classesLoading } = useTeacherClasses()
    const { data: subjects, isLoading: subjectsLoading } = useTeacherSubjectsData()

    const [selectedClassId, setSelectedClassId] = useState<string>("")
    const [selectedSubjectId, setSelectedSubjectId] = useState<string>("")

    // Deduplicate classes by grade (no sections) - only show one class per grade
    const filteredClasses = useMemo(() => {
        if (classes && classes.length > 0) {
            const seenGrades = new Set<number>()
            return classes.filter((cls: { grade: number }) => {
                if (seenGrades.has(cls.grade)) return false
                seenGrades.add(cls.grade)
                return true
            })
        }
        return []
    }, [classes])

    // Initialize class selection when data loads
    useEffect(() => {
        if (filteredClasses && filteredClasses.length > 0 && !selectedClassId) {
            setSelectedClassId(filteredClasses[0].id)
        }
    }, [filteredClasses, selectedClassId])

    // Initialize subject selection when data loads
    useEffect(() => {
        if (subjects && subjects.length > 0 && !selectedSubjectId) {
            setSelectedSubjectId(subjects[0].id)
        }
    }, [subjects, selectedSubjectId])

    // Show loading state until initial selections are ready
    const isInitializing = (classesLoading || subjectsLoading) ||
        (filteredClasses.length > 0 && !selectedClassId) ||
        (subjects && subjects.length > 0 && !selectedSubjectId)

    if (isInitializing) {
        return (
            <div className="flex flex-col p-4 lg:p-8">
                <div className="flex items-center justify-center h-64">
                    <div className="w-10 h-10 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col p-4 lg:p-8">
            <CreatePaperHeader
                className="mb-4"
                classes={filteredClasses}
                subjects={subjects || []}
                selectedClassId={selectedClassId}
                selectedSubjectId={selectedSubjectId}
                onClassChange={setSelectedClassId}
                onSubjectChange={setSelectedSubjectId}
            />
            <QuestionPaperForm
                selectedClassId={selectedClassId}
                selectedSubjectId={selectedSubjectId}
                filteredSubjects={subjects || []}
            />
        </div>
    )
}
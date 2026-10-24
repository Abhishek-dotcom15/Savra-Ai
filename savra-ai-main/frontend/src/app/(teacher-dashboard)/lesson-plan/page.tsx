"use client"

import { useState, useEffect, useMemo } from "react"
import CreateLesson from "@/features/teacher/lesson-plan/components/create-plan"
import { LessonPlanHeader } from "@/features/teacher/lesson-plan/components/lesson-plan-header"
import { useTeacherSubjects } from "@/hooks/use-subjects"
import { useTeacherClasses } from "@/hooks/use-classes"

export default function LessonPlanPage() {
    const { data: subjects, isLoading: subjectsLoading } = useTeacherSubjects()
    const { data: classes, isLoading: classesLoading } = useTeacherClasses()

    const [subject, setSubject] = useState<string>("")
    const [classValue, setClassValue] = useState<string>("")

    // Deduplicate classes by grade (no sections) - only show one class per grade
    const filteredClasses = useMemo(() => {
        if (classes && classes.length > 0) {
            // Deduplicate: keep only first class for each grade
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
        if (filteredClasses && filteredClasses.length > 0 && !classValue) {
            const firstClass = filteredClasses[0]
            setClassValue(`Class ${firstClass.grade}`)
        }
    }, [filteredClasses, classValue])

    // Initialize subject selection when subjects are available
    useEffect(() => {
        if (subjects && subjects.length > 0 && !subject) {
            setSubject(subjects[0])
        }
    }, [subjects, subject])

    // Show loading state until initial selections are ready
    const isInitializing = (classesLoading || subjectsLoading) ||
        (filteredClasses.length > 0 && !classValue) ||
        (subjects && subjects.length > 0 && !subject)

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
            <LessonPlanHeader
                className="mb-4"
                subject={subject}
                classValue={classValue}
                onSubjectChange={setSubject}
                onClassChange={setClassValue}
                subjects={subjects ?? undefined}
                classes={filteredClasses ?? undefined}
            />
            <CreateLesson
                selectedSubject={subject}
                selectedClass={classValue}
            />
        </div>
    )
}
"use client"

import SearchBar from "@/components/search-bar"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { SubjectSelect, ClassSelect } from "@/components/select-component"

interface Class {
    id: string
    name: string
    grade: number
    section: string
}

interface Subject {
    id: string
    name: string
}

interface CreatePaperHeaderProps {
    className?: string
    classes?: Class[] | null
    subjects?: Subject[] | null
    selectedClassId: string
    selectedSubjectId: string
    onClassChange: (classId: string) => void
    onSubjectChange: (subjectId: string) => void
}

export function CreatePaperHeader({
    className,
    classes,
    subjects,
    selectedClassId,
    selectedSubjectId,
    onClassChange,
    onSubjectChange
}: CreatePaperHeaderProps) {
    return (
        <div className={`flex flex-col lg:flex-row lg:justify-between lg:items-center border-b border-gray-200 pb-4 lg:pb-6 gap-4 ${className || ""}`}>
            {/* Mobile Header */}
            <div className="lg:hidden flex items-center justify-between w-full">
                <div className="flex items-center">
                    <Link href="/assessments">
                        <ChevronLeft className="w-6 h-6 text-black cursor-pointer" />
                    </Link>
                    <h1 className="text-xl font-bold text-[#242220] ml-3">Question Paper</h1>
                </div>
                <div className="flex items-center gap-2">
                    <SubjectSelect
                        value={subjects?.find((s) => s.id === selectedSubjectId)?.name || ""}
                        onValueChange={(subjectName) => {
                            const subject = subjects?.find((s) => s.name === subjectName)
                            if (subject) onSubjectChange(subject.id)
                        }}
                        placeholder="Subject"
                        subjects={subjects?.map((s) => s.name) || undefined}
                        className="w-[120px] h-10 text-sm border-[#9B61FF] bg-white text-[#9B61FF] font-medium"
                    />
                    <ClassSelect
                        value={classes?.find((c) => c.id === selectedClassId) ? `Class ${classes.find((c) => c.id === selectedClassId)?.grade}` : ""}
                        onValueChange={(classValue) => {
                            const match = classValue.match(/Class:?\s*(\d+)/i)
                            if (match) {
                                const grade = parseInt(match[1])
                                const classObj = classes?.find((c) => c.grade === grade)
                                if (classObj) onClassChange(classObj.id)
                            }
                        }}
                        placeholder="Class"
                        classes={classes || undefined}
                        className="w-[90px] h-10 text-sm bg-[#9B61FF] text-white font-medium"
                    />
                </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden lg:flex items-center gap-4">
                <Link href="/assessments">
                    <ChevronLeft className="w-12 h-12 text-black rounded-full p-4 bg-[#F5F5F5] cursor-pointer hover:bg-[#E5E5E5] transition-colors" />
                </Link>
                <h1 className="text-3xl font-bold text-[#242220]">Create Question Paper</h1>
            </div>
            <div className="hidden lg:flex items-center gap-4">
                <SearchBar />
                <SubjectSelect
                    value={subjects?.find((s) => s.id === selectedSubjectId)?.name || ""}
                    onValueChange={(subjectName) => {
                        const subject = subjects?.find((s) => s.name === subjectName)
                        if (subject) onSubjectChange(subject.id)
                    }}
                    placeholder="Select subject"
                    subjects={subjects?.map((s) => s.name) || undefined}
                />
                <ClassSelect
                    value={classes?.find((c) => c.id === selectedClassId) ? `Class ${classes.find((c) => c.id === selectedClassId)?.grade}` : ""}
                    onValueChange={(classValue) => {
                        const match = classValue.match(/Class:?\s*(\d+)/i)
                        if (match) {
                            const grade = parseInt(match[1])
                            const classObj = classes?.find((c) => c.grade === grade)
                            if (classObj) onClassChange(classObj.id)
                        }
                    }}
                    placeholder="Select class"
                    classes={classes || undefined}
                />
            </div>
        </div>
    )
}
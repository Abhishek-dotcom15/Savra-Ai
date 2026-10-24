"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import HomeHeader from "@/features/teacher/home/components/home-header";
import { QuickActions } from "@/features/teacher/home/components/quick-actions";
import { RecentLoginQuickActions } from "@/features/teacher/home/components/recent-login-quick-actions";
import { RecentActivity } from "@/features/teacher/home/components/recent-activity";
import { CreateFirstLesson } from "@/features/teacher/home/components/create-first-lesson";
import AccountSetup from "@/features/teacher/login/components/account-setup";
import { useFetch } from "@/hooks/use-api";

interface RecentLesson {
  id: string
  title: string
  status: string
  createdAt: string
  subject?: { id: string; name: string }
  class?: { id: string; name: string; grade: number; section: string }
}

interface RecentQuiz {
  id: string
  title: string
  status: string
  createdAt: string
  subject?: { id: string; name: string }
  class?: { id: string; name: string; grade: number; section: string }
}

interface RecentData {
  recentLessons: RecentLesson[]
  recentQuizzes: RecentQuiz[]
  recentAttempts: Array<{
    id: string
    score: number
    totalMarks: number
    status: string
    submittedAt: string
    studentName?: string
    quizTitle?: string
  }>
}

function HomePageContent() {
  const searchParams = useSearchParams()
  const [showSetup, setShowSetup] = useState(false)
  const { data, isLoading } = useFetch<RecentData>("/teacher/dashboard/recent")

  useEffect(() => {
    const setup = searchParams.get("setup")
    setShowSetup(setup === "true")
  }, [searchParams])

  if (showSetup) {
    return <AccountSetup />
  }

  // Check if activities are empty (only when data is loaded)
  const hasActivities = !isLoading && data && (
    (data.recentLessons && data.recentLessons.length > 0) ||
    (data.recentQuizzes && data.recentQuizzes.length > 0)
  )

  return (
    <div className="flex flex-col max-w-full p-4 lg:p-8">
      <div className="flex-shrink-0">
        <HomeHeader />
      </div>
      <div className="flex-shrink-0">
        {isLoading ? (
          // Show QuickActions while loading
          <QuickActions />
        ) : hasActivities ? (
          <QuickActions />
        ) : (
          <RecentLoginQuickActions />
        )}
      </div>
      <div className="flex-1 min-h-0">
        {isLoading ? (
          // Show RecentActivity with loading state while fetching
          <RecentActivity />
        ) : hasActivities ? (
          <RecentActivity />
        ) : (
          <CreateFirstLesson />
        )}
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col max-w-full p-4 lg:p-8">
        <div className="flex-shrink-0">
          <HomeHeader />
        </div>
        <div className="flex-shrink-0">
          <QuickActions />
        </div>
        <div className="flex-1 min-h-0">
          <RecentActivity />
        </div>
      </div>
    }>
      <HomePageContent />
    </Suspense>
  )
}
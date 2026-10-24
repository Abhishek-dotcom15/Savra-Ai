"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { StudentSidebar } from "@/components/student-sidebar"
import { StudentBottomNav } from "@/components/student-bottom-nav"
import { useAuth } from "@/contexts/auth-context"

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [hasRedirected, setHasRedirected] = useState(false)

  useEffect(() => {
    // Prevent multiple rapid redirects
    if (hasRedirected) return
    
    // Don't redirect if already on login page
    if (pathname?.startsWith("/student/login")) return
    
    if (!isLoading && !isAuthenticated) {
      setHasRedirected(true)
      // Add small delay to prevent rapid switching
      const timer = setTimeout(() => {
        router.push("/student/login")
      }, 150)
      return () => clearTimeout(timer)
    }
    if (!isLoading && user && user.role !== "student") {
      setHasRedirected(true)
      // Add small delay to prevent rapid switching
      const timer = setTimeout(() => {
        router.push("/student/login")
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isAuthenticated, user, router, hasRedirected, pathname])

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F9F9F9]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#DF6647] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || (user && user.role !== "student")) {
    return null
  }

  return <>{children}</>
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isQuizDetailPage = pathname?.startsWith("/quizzes/") && pathname !== "/quizzes"

  return (
    <AuthGuard>
      <main className="h-screen flex flex-row w-screen overflow-x-hidden">
        <StudentSidebar />
        <div className={`flex-1 lg:ml-64 p-3 lg:p-6 max-w-full overflow-x-hidden flex flex-col h-full ${isQuizDetailPage ? "pb-0 lg:pb-6" : "pb-20 lg:pb-6"}`}>
          {children}
        </div>
        {!isQuizDetailPage && <StudentBottomNav />}
      </main>
    </AuthGuard>
  )
}

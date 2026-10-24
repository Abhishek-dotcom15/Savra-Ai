import { useMemo } from "react"
import { useFetch } from "./use-api"
import { getChaptersForClassAndSubject, getChaptersForSubject } from "@/lib/chapters-config"

interface Chapter {
  id: string
  name: string
  subject?: string
  part?: string
}

export function useChapters(
  subjectId?: string,
  subjectName?: string,
  classNumber?: number | null
) {
  // Build endpoint with subject and grade filters
  const endpoint = useMemo(() => {
    const params = new URLSearchParams()
    if (subjectId) params.append('subject', subjectId)
    if (classNumber) params.append('grade', classNumber.toString())
    const queryString = params.toString()
    return queryString ? `/chapters?${queryString}` : '/chapters'
  }, [subjectId, classNumber])

  const { data, isLoading, error } = useFetch<Chapter[]>(endpoint)

  // Memoize class-specific chapters as fallback
  const mockChapters = useMemo(() => {
    if (!subjectName) return []

    if (classNumber) {
      return getChaptersForClassAndSubject(classNumber, subjectName)
    } else {
      return getChaptersForSubject(subjectName)
    }
  }, [subjectName, classNumber])

  // Prioritize API data, only fall back to mock if API fails or returns empty
  const finalData = useMemo(() => {
    // If API returned data, use it
    if (data && data.length > 0) {
      return data
    }

    // If API failed or returned empty, use mock chapters as fallback
    if ((error || !data || data.length === 0) && mockChapters.length > 0) {
      return mockChapters
    }

    // Return empty if nothing available
    return data || []
  }, [data, error, mockChapters])

  return {
    data: finalData,
    isLoading,
    error: error && mockChapters.length === 0 ? error : null
  }
}

// Returns just chapter names as strings for simpler components
export function useChapterNames(
  subjectId?: string,
  subjectName?: string,
  classNumber?: number | null
) {
  const { data, isLoading, error } = useChapters(subjectId, subjectName, classNumber)
  return {
    data: data?.map(chapter => chapter.name) || null,
    isLoading,
    error
  }
}

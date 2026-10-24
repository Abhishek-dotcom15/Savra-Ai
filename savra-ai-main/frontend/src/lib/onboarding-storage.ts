// Utility functions to store and retrieve onboarding data from localStorage
import { CLASS_SUBJECTS } from './subjects-config'

export interface OnboardingData {
  role: string
  school: string
  subjects: string[]
  classes: string[]
  name: string
  completedAt: string
}

export const saveOnboardingData = (data: OnboardingData): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('teacherOnboarding', JSON.stringify(data))
  }
}

export const getOnboardingData = (): OnboardingData | null => {
  if (typeof window !== 'undefined') {
    const data = localStorage.getItem('teacherOnboarding')
    if (data) {
      try {
        return JSON.parse(data) as OnboardingData
      } catch {
        return null
      }
    }
  }
  return null
}

export const getSelectedSubjects = (): string[] => {
  const data = getOnboardingData()
  return data?.subjects || []
}

export const getSelectedClasses = (): string[] => {
  const data = getOnboardingData()
  return data?.classes || []
}

export const clearOnboardingData = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('teacherOnboarding')
  }
}

// Get subjects based on selected classes from onboarding
// Returns all unique subjects that are available for the selected classes
export const getSubjectsForOnboardingClasses = (): string[] => {
  const data = getOnboardingData()
  if (!data?.classes || data.classes.length === 0) {
    return []
  }
  
  // Extract class numbers from "Class 6", "Class 7", etc.
  const classNumbers = data.classes
    .map((cls: string) => {
      const match = cls.match(/Class\s+(\d+)/i)
      return match ? parseInt(match[1], 10) : null
    })
    .filter((num: number | null): num is number => num !== null && num >= 6 && num <= 12)

  // Get all unique subjects for these classes
  const subjectSet = new Set<string>()
  classNumbers.forEach((classNum: number) => {
    const classData = CLASS_SUBJECTS.find((c) => c.class === classNum)
    if (classData) {
      classData.subjects.forEach((subject: string) => subjectSet.add(subject))
    }
  })

  return Array.from(subjectSet).sort()
}

// Get class numbers (6-12) from onboarding classes
// Returns array of class numbers like [10, 11, 12]
export const getOnboardingClassNumbers = (): number[] => {
  const data = getOnboardingData()
  if (!data?.classes || data.classes.length === 0) {
    return []
  }
  
  return data.classes
    .map((cls: string) => {
      const match = cls.match(/Class\s+(\d+)/i)
      return match ? parseInt(match[1], 10) : null
    })
    .filter((num: number | null): num is number => num !== null && num >= 6 && num <= 12)
}

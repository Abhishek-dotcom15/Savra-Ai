"use client"

import { useState } from "react"
import Image from "next/image"
import { useAI } from "@/hooks/use-ai"
import { Loader2, Sparkles } from "lucide-react"

interface ObjectiveSectionProps {
  objective: string
  onObjectiveChange: (value: string) => void
  selectedClass?: string
  selectedSubject?: string
  selectedChapters?: string[]
}

export function ObjectiveSection({ 
  objective, 
  onObjectiveChange, 
  selectedClass, 
  selectedSubject, 
  selectedChapters = [] 
}: ObjectiveSectionProps) {
  const { sendQuery, isLoading, error } = useAI()
  const [isEnhancing, setIsEnhancing] = useState(false)

  const handleEnhancePrompt = async () => {
    setIsEnhancing(true)
    
    try {
      let enhancedText = ""
      
      // Build context information
      const contextParts: string[] = []
      if (selectedClass) contextParts.push(`Class: ${selectedClass}`)
      if (selectedSubject) contextParts.push(`Subject: ${selectedSubject}`)
      if (selectedChapters.length > 0) {
        contextParts.push(`Chapters: ${selectedChapters.slice(0, 5).join(", ")}${selectedChapters.length > 5 ? ` and ${selectedChapters.length - 5} more` : ""}`)
      }
      const context = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : ""
      
      if (!objective.trim()) {
        // If no objective, generate context-aware suggestion
        let defaultPrompt = `Create a comprehensive lesson objective for ${selectedSubject || "this subject"} for ${selectedClass || "the selected class"}.`
        
        if (selectedChapters.length > 0) {
          defaultPrompt += ` Focus on the following chapters: ${selectedChapters.slice(0, 3).join(", ")}.`
        }
        
        defaultPrompt += ` Include clear learning goals, engaging teaching methods appropriate for the grade level, hands-on activities, real-world examples, and assessment strategies. Make it age-appropriate and aligned with curriculum standards.`
        
        const result = await sendQuery(defaultPrompt)
        
        if (result?.response) {
          enhancedText = result.response
        } else {
          // Context-aware mock fallback
          const gradeLevel = selectedClass ? selectedClass.replace("Class ", "") : ""
          const subjectContext = selectedSubject ? ` for ${selectedSubject}` : ""
          const chapterContext = selectedChapters.length > 0 ? ` focusing on ${selectedChapters[0]}${selectedChapters.length > 1 ? ` and related topics` : ""}` : ""
          
          enhancedText = `Create an engaging lesson${subjectContext}${chapterContext} that helps ${gradeLevel ? `Class ${gradeLevel} ` : ""}students understand key concepts through:

• Interactive activities and hands-on learning experiences
• Real-world examples and practical applications
• Visual aids and multimedia resources
• Collaborative group work and peer discussions
• Formative assessments to gauge understanding
• Opportunities for critical thinking and problem-solving

Learning Objectives: Students will be able to explain core concepts, apply knowledge in practical scenarios, and demonstrate understanding through various assessment methods.`
        }
      } else {
        // Analyze what user has typed and enhance accordingly
        const userText = objective.trim().toLowerCase()
        let enhancementStrategy = ""
        
        // Detect what the user is focusing on
        if (userText.includes("activity") || userText.includes("activities") || userText.includes("hands-on")) {
          enhancementStrategy = "The user wants activity-based learning. Expand with specific activity suggestions, group work ideas, and interactive exercises."
        } else if (userText.includes("example") || userText.includes("examples") || userText.includes("real-world")) {
          enhancementStrategy = "The user wants real-world examples. Add concrete examples, case studies, and practical applications relevant to the subject."
        } else if (userText.includes("test") || userText.includes("assessment") || userText.includes("quiz")) {
          enhancementStrategy = "The user wants assessment-focused teaching. Include formative and summative assessment strategies, rubrics, and evaluation methods."
        } else if (userText.includes("understand") || userText.includes("learn") || userText.includes("concept")) {
          enhancementStrategy = "The user wants conceptual understanding. Add explanations of teaching methods that promote deep understanding, visualization techniques, and scaffolding approaches."
        } else if (userText.length < 20) {
          enhancementStrategy = "The user has written a brief objective. Expand it comprehensively with teaching methods, activities, assessments, and learning outcomes."
        } else {
          enhancementStrategy = "The user has a detailed objective. Enhance it by making it more specific, adding concrete teaching strategies, and including measurable learning outcomes."
        }
        
        // Build context-aware enhancement prompt
        const enhancePrompt = `You are an expert teacher creating a lesson plan. Enhance and improve the following lesson objective to make it more detailed, engaging, and effective.

${enhancementStrategy}

Current Objective:
${objective}${context}

Requirements:
1. Keep the core intent and style of what the user wrote
2. Make it more specific and actionable
3. Add appropriate teaching methods for ${selectedClass || "the grade level"}
4. Include activities relevant to ${selectedSubject || "the subject"}
5. Add assessment strategies
6. Make it age-appropriate and curriculum-aligned
7. If chapters are mentioned, incorporate them naturally

Provide only the enhanced objective text, without any additional explanations or meta-commentary.`
        
        const result = await sendQuery(enhancePrompt)
        
        if (result?.response) {
          enhancedText = result.response
        } else {
          // Smart mock enhancement based on user's text
          const words = objective.trim().split(" ")
          const isShort = words.length < 15
          
          if (isShort) {
            // Expand short text significantly
            const subjectHint = selectedSubject ? ` for ${selectedSubject}` : ""
            const classHint = selectedClass ? ` (${selectedClass})` : ""
            enhancedText = `${objective}

Teaching Approach${classHint}:
• Use interactive teaching methods appropriate for the grade level
• Incorporate hands-on activities and experiments where applicable
• Include visual aids, diagrams, and multimedia resources
• Facilitate group discussions and collaborative learning
• Connect concepts to real-world applications${subjectHint}

Learning Activities:
• Warm-up activity to activate prior knowledge
• Main content delivery through varied methods (lecture, demonstration, interactive session)
• Practice exercises and problem-solving tasks
• Group work and peer learning opportunities
• Reflection and summary activities

Assessment:
• Formative assessments throughout the lesson (quick checks, exit tickets)
• Summative assessment to evaluate understanding
• Self-assessment and peer feedback opportunities`
          } else {
            // Enhance longer text by adding structure and specifics
            enhancedText = `${objective}

Additional Teaching Strategies:
• Differentiated instruction to cater to various learning styles
• Use of technology and digital tools to enhance engagement
• Real-world connections and practical applications
• Formative assessment checkpoints throughout the lesson
• Opportunities for student inquiry and exploration

Expected Learning Outcomes:
Students will be able to demonstrate understanding through explanation, application, and analysis of the concepts covered.`
          }
        }
      }
      
      if (enhancedText) {
        onObjectiveChange(enhancedText)
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err)
      // Even on error, provide a context-aware enhancement
      if (objective.trim()) {
        const subjectHint = selectedSubject ? ` for ${selectedSubject}` : ""
        onObjectiveChange(`${objective}

[AI Enhancement${subjectHint}]: Include interactive activities, real-world examples, and formative assessments. Use age-appropriate teaching methods and ensure alignment with curriculum standards.`)
      }
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="mb-2">
      <div className="bg-[#EFE9F8] rounded-t-lg px-6 py-4 flex items-center justify-between border border-[#F6F6F9]">
        <h3 className="text-base font-bold text-[#000000]">Lesson Objective</h3>
        <button 
          onClick={handleEnhancePrompt}
          disabled={isEnhancing || isLoading}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnhancing || isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-[#9B61FF]" />
              <span className="text-sm font-medium text-[#9B61FF]">Enhancing...</span>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">Enhance prompt</span>
              <Image src="/images/magic-wand.svg" alt="magic wand" width={24} height={24} />
            </>
          )}
        </button>
      </div>
      <textarea
        value={objective}
        onChange={(e) => onObjectiveChange(e.target.value)}
        placeholder="Share how you'd like this lesson to be taught (e.g., through activities, examples, or skills-based learning)"
        className="w-full px-6 py-2 border-t-0 text-sm rounded-b-lg border border-[#DCDCDC]"
        rows={6}
      />
      {error && (
        <p className="text-xs text-red-500 mt-2 px-6">
          Failed to enhance prompt. Please try again.
        </p>
      )}
    </div>
  )
}

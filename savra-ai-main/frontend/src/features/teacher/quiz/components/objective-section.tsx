"use client"

import { useState } from "react"
import Image from "next/image"
import { useAI } from "@/hooks/use-ai"
import { Loader2 } from "lucide-react"

interface QuizObjectiveSectionProps {
  objective: string
  onObjectiveChange: (value: string) => void
  placeholder?: string
  title?: string
  selectedClass?: string
  selectedSubject?: string
  selectedChapters?: string[]
}

export function QuizObjectiveSection({ 
  objective, 
  onObjectiveChange, 
  placeholder, 
  title,
  selectedClass,
  selectedSubject,
  selectedChapters = []
}: QuizObjectiveSectionProps) {
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
        // Generate context-aware quiz objective
        let defaultPrompt = `Create a comprehensive quiz objective for ${selectedSubject || "this subject"} for ${selectedClass || "the selected class"}.`
        
        if (selectedChapters.length > 0) {
          defaultPrompt += ` Focus on testing understanding of: ${selectedChapters.slice(0, 3).join(", ")}.`
        }
        
        defaultPrompt += ` Include question types (MCQ, short answer, long answer, case study), difficulty levels appropriate for the grade, and clear learning outcomes to assess.`
        
        const result = await sendQuery(defaultPrompt)
        
        if (result?.response) {
          enhancedText = result.response
        } else {
          // Context-aware mock fallback
          const gradeLevel = selectedClass ? selectedClass.replace("Class ", "") : ""
          const subjectContext = selectedSubject ? ` for ${selectedSubject}` : ""
          const chapterContext = selectedChapters.length > 0 ? ` covering ${selectedChapters[0]}${selectedChapters.length > 1 ? ` and related topics` : ""}` : ""
          
          enhancedText = `Create a comprehensive quiz${subjectContext}${chapterContext} that assesses ${gradeLevel ? `Class ${gradeLevel} ` : ""}students' understanding through:

Question Types:
• Multiple Choice Questions (MCQ) - 40% of total
• Short Answer Questions - 30% of total
• Long Answer/Application Questions - 20% of total
• Case Study/Problem-Solving Questions - 10% of total

Difficulty Levels:
• Basic Understanding (30%) - Recall and recognition
• Application (40%) - Applying concepts to new situations
• Higher-Order Thinking (30%) - Analysis, evaluation, and synthesis

Learning Outcomes to Assess:
• Conceptual understanding of key topics
• Ability to apply knowledge in different contexts
• Critical thinking and problem-solving skills
• Analytical and evaluative capabilities`
        }
      } else {
        // Analyze what user has typed
        const userText = objective.trim().toLowerCase()
        let enhancementStrategy = ""
        
        if (userText.includes("mcq") || userText.includes("multiple choice")) {
          enhancementStrategy = "User wants MCQ-focused quiz. Expand with specific MCQ strategies, distractors, and other question types."
        } else if (userText.includes("difficult") || userText.includes("level") || userText.includes("easy")) {
          enhancementStrategy = "User is thinking about difficulty. Add comprehensive difficulty distribution and question level specifications."
        } else if (userText.includes("test") || userText.includes("assess") || userText.includes("evaluate")) {
          enhancementStrategy = "User wants assessment-focused quiz. Include detailed assessment criteria, rubrics, and evaluation methods."
        } else if (userText.length < 20) {
          enhancementStrategy = "User has a brief objective. Expand comprehensively with question types, difficulty levels, and assessment criteria."
        } else {
          enhancementStrategy = "User has a detailed objective. Enhance by making it more specific about question distribution, difficulty levels, and measurable outcomes."
        }
        
        const enhancePrompt = `You are an expert teacher creating a quiz. Enhance and improve the following quiz objective to make it more detailed, clear, and effective.

${enhancementStrategy}

Current Objective:
${objective}${context}

Requirements:
1. Keep the core intent of what the user wrote
2. Specify question types and their distribution
3. Include difficulty levels appropriate for ${selectedClass || "the grade level"}
4. Make it relevant to ${selectedSubject || "the subject"}
5. Add clear learning outcomes to assess
6. Include assessment criteria and rubrics if applicable
7. If chapters are mentioned, incorporate them naturally

Provide only the enhanced objective text, without any additional explanations or meta-commentary.`
        
        const result = await sendQuery(enhancePrompt)
        
        if (result?.response) {
          enhancedText = result.response
        } else {
          // Smart mock enhancement
          const words = objective.trim().split(" ")
          const isShort = words.length < 15
          
          if (isShort) {
            const subjectHint = selectedSubject ? ` for ${selectedSubject}` : ""
            enhancedText = `${objective}

Quiz Structure${subjectHint}:
• Question Types: Mix of MCQ (40%), Short Answer (30%), Long Answer (20%), and Case Study (10%)
• Difficulty Distribution: Basic (30%), Application (40%), Higher-Order Thinking (30%)
• Topics Covered: ${selectedChapters.length > 0 ? selectedChapters.slice(0, 3).join(", ") : "Key concepts from the curriculum"}

Assessment Focus:
• Test conceptual understanding and recall
• Assess application of knowledge in new contexts
• Evaluate critical thinking and problem-solving abilities
• Measure analytical and evaluative skills`
          } else {
            enhancedText = `${objective}

Additional Specifications:
• Include a balanced mix of question types to assess different cognitive levels
• Ensure questions are age-appropriate and aligned with curriculum standards
• Provide clear marking schemes and rubrics for subjective questions
• Include questions that test both theoretical knowledge and practical application`
          }
        }
      }
      
      if (enhancedText) {
        onObjectiveChange(enhancedText)
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err)
      if (objective.trim()) {
        const subjectHint = selectedSubject ? ` for ${selectedSubject}` : ""
        onObjectiveChange(`${objective}

[AI Enhancement${subjectHint}]: Include varied question types (MCQ, short answer, case study) at different difficulty levels. Ensure questions test understanding, application, and critical thinking skills.`)
      }
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="mb-2">
      <div className="bg-[#EFE9F8] rounded-t-lg px-6 py-4 flex items-center justify-between border border-[#F6F6F9]">
        <h3 className="text-base font-bold text-[#000000]">{title || "Quiz Objective"}</h3>
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
        placeholder={placeholder || "Tell Savra what you'd like this quiz to test — for example, basic understanding, application, or deeper thinking."}
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

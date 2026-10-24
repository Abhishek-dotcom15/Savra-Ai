"use client"

import { useState } from "react"
import { useAI } from "@/hooks/use-ai"
import { Loader2, Sparkles } from "lucide-react"

interface AssessmentObjectiveSectionProps {
  objective: string
  onObjectiveChange: (value: string) => void
  selectedClass?: string
  selectedSubject?: string
  selectedChapters?: string[]
}

export function AssessmentObjectiveSection({ 
  objective, 
  onObjectiveChange,
  selectedClass,
  selectedSubject,
  selectedChapters = []
}: AssessmentObjectiveSectionProps) {
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
        // Generate context-aware assessment objective
        let defaultPrompt = `Create a comprehensive question paper objective for ${selectedSubject || "this subject"} for ${selectedClass || "the selected class"}.`
        
        if (selectedChapters.length > 0) {
          defaultPrompt += ` Focus on: ${selectedChapters.slice(0, 3).join(", ")}.`
        }
        
        defaultPrompt += ` Include question types (MCQ, short answer, long answer, case study), marks distribution, difficulty levels appropriate for the grade, and alignment with CBSE exam pattern if applicable.`
        
        const result = await sendQuery(defaultPrompt)
        
        if (result?.response) {
          enhancedText = result.response
        } else {
          // Context-aware mock fallback
          const gradeLevel = selectedClass ? selectedClass.replace("Class ", "") : ""
          const subjectContext = selectedSubject ? ` for ${selectedSubject}` : ""
          const chapterContext = selectedChapters.length > 0 ? ` covering ${selectedChapters[0]}${selectedChapters.length > 1 ? ` and related topics` : ""}` : ""
          
          enhancedText = `Create a comprehensive question paper${subjectContext}${chapterContext} for ${gradeLevel ? `Class ${gradeLevel} ` : ""}students following CBSE exam pattern:

Question Types and Marks Distribution:
• Multiple Choice Questions (MCQ) - 1 mark each (20-30% of total marks)
• Short Answer Questions - 2-3 marks each (30-40% of total marks)
• Long Answer Questions - 5 marks each (20-30% of total marks)
• Case Study/Application Questions - 4-5 marks each (10-20% of total marks)

Difficulty Levels:
• Easy (30%) - Direct recall and basic understanding
• Medium (50%) - Application and analysis
• Difficult (20%) - Higher-order thinking skills (HOTS)

Focus Areas:
• Conceptual understanding and knowledge recall
• Application of concepts in different contexts
• Critical thinking and problem-solving
• Analysis and evaluation skills
• Real-world application and case studies`
        }
      } else {
        // Analyze what user has typed
        const userText = objective.trim().toLowerCase()
        let enhancementStrategy = ""
        
        if (userText.includes("cbse") || userText.includes("exam pattern")) {
          enhancementStrategy = "User wants CBSE-aligned paper. Expand with CBSE-specific question patterns, marking schemes, and exam format."
        } else if (userText.includes("hots") || userText.includes("higher order")) {
          enhancementStrategy = "User wants HOTS questions. Focus on higher-order thinking, analysis, and evaluation questions."
        } else if (userText.includes("case study") || userText.includes("case-based")) {
          enhancementStrategy = "User wants case study questions. Expand with case study formats, real-world scenarios, and application-based questions."
        } else if (userText.length < 20) {
          enhancementStrategy = "User has a brief objective. Expand comprehensively with question types, marks distribution, difficulty levels, and CBSE alignment."
        } else {
          enhancementStrategy = "User has a detailed objective. Enhance by making it more specific about question distribution, marking schemes, and assessment criteria."
        }
        
        const enhancePrompt = `You are an expert teacher creating a question paper. Enhance and improve the following question paper objective to make it more detailed, clear, and effective.

${enhancementStrategy}

Current Objective:
${objective}${context}

Requirements:
1. Keep the core intent of what the user wrote
2. Specify question types and marks distribution
3. Include difficulty levels appropriate for ${selectedClass || "the grade level"}
4. Make it relevant to ${selectedSubject || "the subject"}
5. Align with CBSE exam pattern if mentioned
6. Add clear assessment criteria and marking schemes
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

Question Paper Structure${subjectHint}:
• Question Types: MCQ (1 mark), Short Answer (2-3 marks), Long Answer (5 marks), Case Study (4-5 marks)
• Marks Distribution: Balanced across all question types
• Difficulty: Easy (30%), Medium (50%), Difficult/HOTS (20%)
• Topics: ${selectedChapters.length > 0 ? selectedChapters.slice(0, 3).join(", ") : "Key concepts from curriculum"}

Assessment Criteria:
• Test knowledge recall and understanding
• Assess application of concepts
• Evaluate higher-order thinking skills
• Include real-world scenarios and case studies
• Follow CBSE exam pattern and marking scheme`
          } else {
            enhancedText = `${objective}

Additional Specifications:
• Ensure balanced distribution of marks across question types
• Include a mix of direct questions and application-based questions
• Follow CBSE marking scheme and question paper format
• Include HOTS questions for comprehensive assessment
• Provide clear instructions and marking rubrics`
          }
        }
      }
      
      if (enhancedText) {
        // Truncate to 500 characters max
        onObjectiveChange(enhancedText.slice(0, 500))
      }
    } catch (err) {
      console.error("Failed to enhance prompt:", err)
      if (objective.trim()) {
        const subjectHint = selectedSubject ? ` for ${selectedSubject}` : ""
        onObjectiveChange(`${objective}

[AI Enhancement${subjectHint}]: Include varied question types with appropriate marks distribution. Follow CBSE exam pattern with balanced difficulty levels (Easy, Medium, HOTS). Ensure comprehensive coverage of topics.`)
      }
    } finally {
      setIsEnhancing(false)
    }
  }

  return (
    <div className="mb-2">
      <div className="bg-[#EFE9F8] rounded-t-lg px-6 py-4 flex items-center justify-between border border-[#F6F6F9]">
        <h3 className="text-base font-bold text-[#000000]">Question Paper Objective</h3>
        <button
          onClick={handleEnhancePrompt}
          disabled={isEnhancing || isLoading}
          className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#9B61FF] rounded-lg text-[#9B61FF] hover:bg-[#F5F0FA] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isEnhancing || isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">Enhancing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Enhance prompt</span>
            </>
          )}
        </button>
      </div>
      <textarea
        value={objective}
        onChange={(e) => {
          const value = e.target.value
          if (value.length <= 500) {
            onObjectiveChange(value)
          }
        }}
        maxLength={500}
        placeholder="Share how you'd like this question paper to be created — for example, topics to focus on, HOTS or case-based questions, or follow a CBSE exam pattern."
        className="w-full px-6 py-4 border-t-0 text-sm rounded-b-lg border border-[#DCDCDC]"
        rows={6}
      />
      <div className="flex justify-between items-center px-6 py-1">
        <div>
          {error && (
            <p className="text-xs text-red-500">
              Failed to enhance prompt. Please try again.
            </p>
          )}
        </div>
        <p className={`text-xs ${objective.length >= 450 ? 'text-orange-500' : 'text-gray-400'}`}>
          {objective.length}/500
        </p>
      </div>
    </div>
  )
}

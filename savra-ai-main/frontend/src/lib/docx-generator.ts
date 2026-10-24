import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  TabStopType,
  TabStopPosition,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  VerticalAlign,
  PageOrientation,
  TableLayoutType,
} from "docx"
import { saveAs } from "file-saver"
import { Quiz, Lesson } from "@/types/api"

// Assessment/Question Paper types
interface AssessmentQuestion {
  number: number
  text: string
  options?: string[]
  type?: string
  marks?: number
}

interface AssessmentSection {
  name?: string
  title?: string
  instructions?: string
  questions: AssessmentQuestion[]
}

interface AssessmentQuestionPaper {
  title?: string
  instructions?: string[]
  sections?: AssessmentSection[]
  questions?: AssessmentQuestion[]
}

interface Assessment {
  id: string
  title: string
  subject?: { id: string; name: string }
  class?: { id: string; name: string; grade: number; section: string }
  chapters?: Array<{ id: string; name: string }>
  totalMarks?: number
  difficultyLevel?: string
  questionPaper?: AssessmentQuestionPaper | null
}

interface AnswerKeyItem {
  questionNumber: number
  answer: string
  explanation?: string
}

interface AnswerKey {
  answers: AnswerKeyItem[]
}

// Helper to strip HTML tags from text
const stripHtml = (html: string): string => {
  if (!html) return ""
  return html.replace(/<[^>]*>/g, "").trim()
}

// Helper function to strip markdown formatting from text
const stripMarkdown = (text: string): string => {
  if (!text) return ""
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[\*\-]\s+/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`(.+?)`/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// Generate Quiz DOCX - matching UI format
export async function generateQuizDOCX(
  quiz: Quiz,
  teacherName: string
): Promise<{ blob: Blob; filename: string }> {
  const children: Paragraph[] = []

  const subjectName = quiz.subject?.name || "Subject"
  const className = quiz.class ? `${quiz.class.grade}` : ""
  const topics = quiz.chapters?.map(c => c.name).join(", ") || ""
  const totalQuestions = quiz.totalQuestions || quiz.questions?.length || 0
  const maxMarks = quiz.totalMarks || totalQuestions
  const duration = quiz.timeLimit ? `${quiz.timeLimit} mins` : "N/A"

  // Subject and Maximum Marks on same line (using tabs for alignment)
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Subject: ", bold: true }),
        new TextRun({ text: subjectName, bold: true }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `Maximum Marks: ${maxMarks}`, bold: true }),
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        },
      ],
      spacing: { after: 100 },
    })
  )

  // Class
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Class: " }),
        new TextRun({ text: className }),
      ],
      spacing: { after: 100 },
    })
  )

  // Topic
  if (topics) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Topic: " }),
          new TextRun({ text: topics }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  // Total Questions
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Total Questions: " }),
        new TextRun({ text: String(totalQuestions) }),
      ],
      spacing: { after: 100 },
    })
  )

  // Time
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Time: " }),
        new TextRun({ text: duration }),
      ],
      spacing: { after: 300 },
    })
  )

  // Instructions
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Instructions", bold: true }),
      ],
      spacing: { after: 100 },
    })
  )

  const instructions = [
    "Attempt all questions.",
    "Each question carries 1 mark.",
    "Choose the most appropriate answer.",
    "No negative marking.",
  ]

  for (const instruction of instructions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `•  ${instruction}` }),
        ],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 60 },
      })
    )
  }

  // Add spacing before questions
  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
    })
  )

  // Questions
  if (quiz.questions && quiz.questions.length > 0) {
    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      const questionText = stripHtml(question.questionText || "")

      // Question header
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${i + 1}`, bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )

      // Question text
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: questionText }),
          ],
          spacing: { after: 100 },
        })
      )

      // Options
      if (question.options && question.options.length > 0) {
        const optionLabels = ["A", "B", "C", "D", "E", "F"]
        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          const optionText = stripHtml(option.optionText || "")
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `(${optionLabels[j]}) ${optionText}` }),
              ],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 60 },
            })
          )
        }
      }
    }
  } else {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: "No questions available." })],
      })
    )
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const grade = quiz.class?.grade || ""
  const filename = `Quiz-${subjectName}-Grade${grade}.docx`

  return { blob, filename }
}

// Download Quiz DOCX directly
export async function downloadQuizDOCX(quiz: Quiz, teacherName: string): Promise<void> {
  const { blob, filename } = await generateQuizDOCX(quiz, teacherName)
  saveAs(blob, filename)
}

// Quiz Answer Key types for DOCX
interface QuizAnswerKeyItem {
  questionNumber: number
  answer: string
  explanation?: string
}

interface QuizAnswerKey {
  answers: QuizAnswerKeyItem[]
}

// Generate Quiz DOCX with Answer Key
export async function generateQuizWithAnswerKeyDOCX(
  quiz: Quiz,
  answerKey: QuizAnswerKey,
  teacherName: string
): Promise<{ blob: Blob; filename: string }> {
  const children: Paragraph[] = []

  const subjectName = quiz.subject?.name || "Subject"
  const className = quiz.class ? `${quiz.class.grade}` : ""
  const topics = quiz.chapters?.map(c => c.name).join(", ") || ""
  const totalQuestions = quiz.totalQuestions || quiz.questions?.length || 0
  const maxMarks = quiz.totalMarks || totalQuestions
  const duration = quiz.timeLimit ? `${quiz.timeLimit} mins` : "N/A"

  // Subject and Maximum Marks on same line
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Subject: ", bold: true }),
        new TextRun({ text: subjectName, bold: true }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `Maximum Marks: ${maxMarks}`, bold: true }),
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        },
      ],
      spacing: { after: 100 },
    })
  )

  // Class
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Class: " }),
        new TextRun({ text: className }),
      ],
      spacing: { after: 100 },
    })
  )

  // Topic
  if (topics) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Topic: " }),
          new TextRun({ text: topics }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  // Total Questions
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Total Questions: " }),
        new TextRun({ text: String(totalQuestions) }),
      ],
      spacing: { after: 100 },
    })
  )

  // Time
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Time: " }),
        new TextRun({ text: duration }),
      ],
      spacing: { after: 300 },
    })
  )

  // Instructions
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Instructions", bold: true }),
      ],
      spacing: { after: 100 },
    })
  )

  const instructions = [
    "Attempt all questions.",
    "Each question carries 1 mark.",
    "Choose the most appropriate answer.",
    "No negative marking.",
  ]

  for (const instruction of instructions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `•  ${instruction}` }),
        ],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 60 },
      })
    )
  }

  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
    })
  )

  // Questions
  if (quiz.questions && quiz.questions.length > 0) {
    for (let i = 0; i < quiz.questions.length; i++) {
      const question = quiz.questions[i]
      const questionText = stripHtml(question.questionText || "")

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${i + 1}`, bold: true }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: questionText }),
          ],
          spacing: { after: 100 },
        })
      )

      if (question.options && question.options.length > 0) {
        const optionLabels = ["A", "B", "C", "D", "E", "F"]
        for (let j = 0; j < question.options.length; j++) {
          const option = question.options[j]
          const optionText = stripHtml(option.optionText || "")
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: `(${optionLabels[j]}) ${optionText}` }),
              ],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 60 },
            })
          )
        }
      }
    }
  }

  // Page break for Answer Key
  children.push(
    new Paragraph({
      children: [],
      pageBreakBefore: true,
    })
  )

  // Answer Key Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ANSWER KEY",
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  )

  // Answer Key Content
  if (answerKey && answerKey.answers && answerKey.answers.length > 0) {
    for (const item of answerKey.answers) {
      const cleanAnswer = stripMarkdown(item.answer)
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Q${item.questionNumber}: `, bold: true, color: "DF6647" }),
            new TextRun({ text: cleanAnswer }),
          ],
          spacing: { before: 100, after: 50 },
        })
      )

      if (item.explanation) {
        const cleanExplanation = stripMarkdown(item.explanation)
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `Explanation: ${cleanExplanation}`,
                italics: true,
                color: "666666",
              }),
            ],
            indent: { left: convertInchesToTwip(0.25) },
            spacing: { after: 100 },
          })
        )
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const grade = quiz.class?.grade || ""
  const filename = `Quiz-${subjectName}-Grade${grade}-WithAnswerKey.docx`

  return { blob, filename }
}

// Download Quiz DOCX with Answer Key
export async function downloadQuizWithAnswerKeyDOCX(
  quiz: Quiz,
  answerKey: QuizAnswerKey,
  teacherName: string
): Promise<void> {
  const { blob, filename } = await generateQuizWithAnswerKeyDOCX(quiz, answerKey, teacherName)
  saveAs(blob, filename)
}

// Generate Assessment/Question Paper DOCX - matching UI format
export async function generateAssessmentDOCX(
  assessment: Assessment,
  teacherName: string
): Promise<{ blob: Blob; filename: string }> {
  const children: Paragraph[] = []

  const subject = assessment.subject?.name || "Subject"
  const grade = assessment.class ? `${assessment.class.grade}` : ""
  const chapter = assessment.chapters?.map((c) => c.name).join(", ") || ""
  const totalMarks = assessment.totalMarks || 100

  // Subject and Maximum Marks on same line
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Subject: ", bold: true }),
        new TextRun({ text: subject, bold: true }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `Maximum Marks: ${totalMarks}`, bold: true }),
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        },
      ],
      spacing: { after: 100 },
    })
  )

  // Class
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Class: " }),
        new TextRun({ text: grade }),
      ],
      spacing: { after: 100 },
    })
  )

  // Chapter
  if (chapter) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Chapter: " }),
          new TextRun({ text: chapter }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  // Time
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Time: " }),
        new TextRun({ text: "1 Hour" }),
      ],
      spacing: { after: 300 },
    })
  )

  // Instructions
  const questionPaper = assessment.questionPaper
  const instructions = questionPaper?.instructions || [
    "All questions are compulsory.",
    "Show necessary steps for full marks.",
  ]

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "General Instructions", bold: true }),
      ],
      spacing: { after: 100 },
    })
  )

  for (const instruction of instructions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `•  ${instruction}` }),
        ],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 60 },
      })
    )
  }

  // Add spacing before questions
  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
    })
  )

  // Questions
  const questions = questionPaper?.questions || questionPaper?.sections?.flatMap((s) => s.questions) || []

  if (questionPaper?.sections && questionPaper.sections.length > 0) {
    for (const section of questionPaper.sections) {
      // Section title
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title || section.name || "Section",
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      )

      if (section.instructions) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: section.instructions, italics: true })],
            spacing: { after: 100 },
          })
        )
      }

      for (const question of section.questions) {
        const questionText = stripHtml(question.text || "")

        // Question header
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Question ${question.number || 1}`, bold: true }),
              question.marks
                ? new TextRun({ text: ` [${question.marks} marks]`, italics: true })
                : new TextRun({ text: "" }),
            ],
            spacing: { before: 200, after: 100 },
          })
        )

        // Question text
        children.push(
          new Paragraph({
            children: [new TextRun({ text: questionText })],
            spacing: { after: 100 },
          })
        )

        // Options
        if (question.options && question.options.length > 0) {
          const optionLabels = ["A", "B", "C", "D", "E", "F"]
          for (let j = 0; j < question.options.length; j++) {
            const optionText = stripHtml(question.options[j])
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `(${optionLabels[j]}) ${optionText}` })],
                indent: { left: convertInchesToTwip(0.25) },
                spacing: { after: 60 },
              })
            )
          }
        }
      }
    }
  } else {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const questionText = stripHtml(question.text || "")

      // Question header
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${question.number || i + 1}`, bold: true }),
            question.marks
              ? new TextRun({ text: ` [${question.marks} marks]`, italics: true })
              : new TextRun({ text: "" }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )

      // Question text
      children.push(
        new Paragraph({
          children: [new TextRun({ text: questionText })],
          spacing: { after: 100 },
        })
      )

      // Options
      if (question.options && question.options.length > 0) {
        const optionLabels = ["A", "B", "C", "D", "E", "F"]
        for (let j = 0; j < question.options.length; j++) {
          const optionText = stripHtml(question.options[j])
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `(${optionLabels[j]}) ${optionText}` })],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 60 },
            })
          )
        }
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const subjectName = assessment.subject?.name || "QuestionPaper"
  const gradeNum = assessment.class?.grade || ""
  const filename = `QuestionPaper-${subjectName}-Grade${gradeNum}.docx`

  return { blob, filename }
}

// Download Assessment DOCX directly
export async function downloadAssessmentDOCX(assessment: Assessment, teacherName: string): Promise<void> {
  const { blob, filename } = await generateAssessmentDOCX(assessment, teacherName)
  saveAs(blob, filename)
}

// Generate Assessment with Answer Key DOCX
export async function generateAssessmentWithAnswerKeyDOCX(
  assessment: Assessment,
  answerKey: AnswerKey,
  teacherName: string
): Promise<{ blob: Blob; filename: string }> {
  const children: Paragraph[] = []

  const subject = assessment.subject?.name || "Subject"
  const grade = assessment.class ? `${assessment.class.grade}` : ""
  const chapter = assessment.chapters?.map((c) => c.name).join(", ") || ""
  const totalMarks = assessment.totalMarks || 100

  // Subject and Maximum Marks on same line
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Subject: ", bold: true }),
        new TextRun({ text: subject, bold: true }),
        new TextRun({ text: "\t" }),
        new TextRun({ text: `Maximum Marks: ${totalMarks}`, bold: true }),
      ],
      tabStops: [
        {
          type: TabStopType.RIGHT,
          position: TabStopPosition.MAX,
        },
      ],
      spacing: { after: 100 },
    })
  )

  // Class
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Class: " }),
        new TextRun({ text: grade }),
      ],
      spacing: { after: 100 },
    })
  )

  // Chapter
  if (chapter) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Chapter: " }),
          new TextRun({ text: chapter }),
        ],
        spacing: { after: 100 },
      })
    )
  }

  // Time
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "Time: " }),
        new TextRun({ text: "1 Hour" }),
      ],
      spacing: { after: 300 },
    })
  )

  // Instructions
  const questionPaper = assessment.questionPaper
  const instructions = questionPaper?.instructions || [
    "All questions are compulsory.",
    "Show necessary steps for full marks.",
  ]

  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: "General Instructions", bold: true }),
      ],
      spacing: { after: 100 },
    })
  )

  for (const instruction of instructions) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `•  ${instruction}` }),
        ],
        indent: { left: convertInchesToTwip(0.25) },
        spacing: { after: 60 },
      })
    )
  }

  // Add spacing before questions
  children.push(
    new Paragraph({
      children: [],
      spacing: { after: 200 },
    })
  )

  // Questions
  const questions = questionPaper?.questions || questionPaper?.sections?.flatMap((s) => s.questions) || []

  if (questionPaper?.sections && questionPaper.sections.length > 0) {
    for (const section of questionPaper.sections) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: section.title || section.name || "Section",
              bold: true,
              size: 26,
            }),
          ],
          spacing: { before: 300, after: 100 },
        })
      )

      if (section.instructions) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: section.instructions, italics: true })],
            spacing: { after: 100 },
          })
        )
      }

      for (const question of section.questions) {
        const questionText = stripHtml(question.text || "")

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `Question ${question.number || 1}`, bold: true }),
              question.marks
                ? new TextRun({ text: ` [${question.marks} marks]`, italics: true })
                : new TextRun({ text: "" }),
            ],
            spacing: { before: 200, after: 100 },
          })
        )

        children.push(
          new Paragraph({
            children: [new TextRun({ text: questionText })],
            spacing: { after: 100 },
          })
        )

        if (question.options && question.options.length > 0) {
          const optionLabels = ["A", "B", "C", "D", "E", "F"]
          for (let j = 0; j < question.options.length; j++) {
            const optionText = stripHtml(question.options[j])
            children.push(
              new Paragraph({
                children: [new TextRun({ text: `(${optionLabels[j]}) ${optionText}` })],
                indent: { left: convertInchesToTwip(0.25) },
                spacing: { after: 60 },
              })
            )
          }
        }
      }
    }
  } else {
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i]
      const questionText = stripHtml(question.text || "")

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `Question ${question.number || i + 1}`, bold: true }),
            question.marks
              ? new TextRun({ text: ` [${question.marks} marks]`, italics: true })
              : new TextRun({ text: "" }),
          ],
          spacing: { before: 200, after: 100 },
        })
      )

      children.push(
        new Paragraph({
          children: [new TextRun({ text: questionText })],
          spacing: { after: 100 },
        })
      )

      if (question.options && question.options.length > 0) {
        const optionLabels = ["A", "B", "C", "D", "E", "F"]
        for (let j = 0; j < question.options.length; j++) {
          const optionText = stripHtml(question.options[j])
          children.push(
            new Paragraph({
              children: [new TextRun({ text: `(${optionLabels[j]}) ${optionText}` })],
              indent: { left: convertInchesToTwip(0.25) },
              spacing: { after: 60 },
            })
          )
        }
      }
    }
  }

  // Page break for Answer Key
  children.push(
    new Paragraph({
      children: [],
      pageBreakBefore: true,
    })
  )

  // Answer Key Header
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: "ANSWER KEY",
          bold: true,
          size: 32,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  )

  // Answer Key content
  for (const answer of answerKey.answers) {
    const cleanAnswer = stripMarkdown(answer.answer)
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Q${answer.questionNumber}: `, bold: true }),
          new TextRun({ text: cleanAnswer }),
        ],
        spacing: { before: 100, after: 50 },
      })
    )

    if (answer.explanation) {
      const cleanExplanation = stripMarkdown(answer.explanation)
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Explanation: ${cleanExplanation}`,
              italics: true,
            }),
          ],
          indent: { left: convertInchesToTwip(0.25) },
          spacing: { after: 100 },
        })
      )
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const subjectName = assessment.subject?.name || "QuestionPaper"
  const gradeNum = assessment.class?.grade || ""
  const filename = `QuestionPaper-${subjectName}-Grade${gradeNum}-WithAnswerKey.docx`

  return { blob, filename }
}

// Download Assessment with Answer Key DOCX
export async function downloadAssessmentWithAnswerKeyDOCX(
  assessment: Assessment,
  answerKey: AnswerKey,
  teacherName: string
): Promise<void> {
  const { blob, filename } = await generateAssessmentWithAnswerKeyDOCX(assessment, answerKey, teacherName)
  saveAs(blob, filename)
}

// Generate Lesson Plan DOCX
export async function generateLessonPlanDOCX(
  lesson: Lesson,
  teacherName: string
): Promise<{ blob: Blob; filename: string }> {
  const children: Paragraph[] = []

  const subjectName = lesson.subject?.name || "Subject"
  const grade = lesson.class?.grade || ""
  const topic = lesson.topic || "-"
  const numberOfPeriods = lesson.numberOfPeriods || "-"

  // Header - Centered
  children.push(
    new Paragraph({
      children: [new TextRun({ text: subjectName, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  )

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Lesson Plan", bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    })
  )

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Grade ${grade}`, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  )

  // Info row - Teacher Name, Topic, Periods
  const infoBorders = {
    top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
  }

  // Info table column widths in twips (~4653 each for 3 equal columns in landscape)
  const infoColWidths = [4653, 4652, 4653]

  const infoTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: infoColWidths,
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Teacher Name: ", size: 20 }),
                  new TextRun({ text: teacherName || "N/A", bold: true, size: 20 }),
                ],
              }),
            ],
            width: { size: infoColWidths[0], type: WidthType.DXA },
            borders: infoBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "Topic: ", size: 20 }),
                  new TextRun({ text: topic, bold: true, size: 20 }),
                ],
              }),
            ],
            width: { size: infoColWidths[1], type: WidthType.DXA },
            borders: infoBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
          new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({ text: "No of periods: ", size: 20 }),
                  new TextRun({ text: String(numberOfPeriods), bold: true, size: 20 }),
                ],
              }),
            ],
            width: { size: infoColWidths[2], type: WidthType.DXA },
            borders: infoBorders,
            verticalAlign: VerticalAlign.CENTER,
          }),
        ],
      }),
    ],
  })

  // Spacing after info table
  children.push(new Paragraph({ children: [], spacing: { after: 300 } }))

  // Period Table
  if (lesson.periods && lesson.periods.length > 0) {
    const tableBorders = {
      top: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "000000" },
    }

    // Column widths in twips (landscape A4 usable width ~13958 twips)
    const colWidths = [800, 1500, 1800, 2200, 1600, 1400, 1600, 1600, 1458]
    const colHeaders = [
      "Period No",
      "Concept",
      "Learning Outcomes",
      "Teacher-Learning Process",
      "Assessment",
      "Resources",
      "21st Century Skills",
      "Real Life Application",
      "Reflection",
    ]

    // Header row with explicit widths
    const headerCells = colHeaders.map(
      (text, i) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, size: 16 })],
              alignment: AlignmentType.CENTER,
            }),
          ],
          width: { size: colWidths[i], type: WidthType.DXA },
          borders: tableBorders,
          shading: { fill: "F5F5F5" },
          verticalAlign: VerticalAlign.CENTER,
        })
    )

    const headerRow = new TableRow({ children: headerCells })

    // Data rows with explicit widths
    const dataRows = lesson.periods.map((period) => {
      const cellValues = [
        String(period.periodNo),
        period.concept || "",
        period.learningOutcomes || "",
        period.teacherLearningProcess || "",
        period.assessment || "",
        period.resources || "",
        period.centurySkillsValueEducation || "",
        period.realLifeApplication || "",
        period.reflection || "",
      ]

      return new TableRow({
        children: cellValues.map(
          (text, i) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text, size: 16 })],
                  alignment: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT,
                }),
              ],
              width: { size: colWidths[i], type: WidthType.DXA },
              borders: tableBorders,
              verticalAlign: VerticalAlign.TOP,
            })
        ),
      })
    })

    const periodTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      layout: TableLayoutType.FIXED,
      columnWidths: colWidths,
      rows: [headerRow, ...dataRows],
    })

    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              size: {
                orientation: PageOrientation.LANDSCAPE,
              },
            },
          },
          children: [infoTable, ...children, periodTable],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    const filename = `LessonPlan-${subjectName}-Grade${grade}.docx`

    return { blob, filename }
  }

  // No periods - just basic info
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: PageOrientation.LANDSCAPE,
            },
          },
        },
        children: [infoTable, ...children],
      },
    ],
  })

  const blob = await Packer.toBlob(doc)
  const filename = `LessonPlan-${subjectName}-Grade${grade}.docx`

  return { blob, filename }
}

// Download Lesson Plan DOCX directly
export async function downloadLessonPlanDOCX(lesson: Lesson, teacherName: string): Promise<void> {
  const { blob, filename } = await generateLessonPlanDOCX(lesson, teacherName)
  saveAs(blob, filename)
}

import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import * as fs from 'fs/promises';
import * as path from 'path';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Default model
const DEFAULT_MODEL = process.env.AI_MODEL || 'gemini-2.5-flash';

// Get model instance
export function getModel(modelName: string = DEFAULT_MODEL) {
  return genAI.getGenerativeModel({ model: modelName });
}

// Fetch a reference file from URL and convert to a Gemini Part
async function fetchReferenceFilePart(url: string): Promise<Part | null> {
  try {
    console.log(`[Gemini] Fetching reference file from URL: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`[Gemini] Failed to fetch reference file: HTTP ${response.status}`);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Skip files larger than 20MB
    if (buffer.length > 20 * 1024 * 1024) {
      console.warn(`[Gemini] Reference file too large (${(buffer.length / 1024 / 1024).toFixed(2)}MB), skipping`);
      return null;
    }

    console.log(`[Gemini] Reference file loaded: contentType=${contentType}, size=${(buffer.length / 1024).toFixed(2)}KB`);
    return {
      inlineData: {
        mimeType: contentType,
        data: buffer.toString('base64'),
      },
    } as Part;
  } catch (error) {
    console.warn(`[Gemini] Error fetching reference file:`, error);
    return null;
  }
}

// System prompts based on user role for Ask Savra AI
const SYSTEM_PROMPTS = {
  student: `You are Savra AI, a friendly and helpful educational tutor for Indian school students (grades 6-12).

Your responsibilities:
- Explain concepts clearly in simple language
- Break down complex topics step by step
- Provide examples and analogies
- Encourage curiosity and learning
- Help with homework without giving direct answers
- Support CBSE/ICSE curriculum topics

Guidelines:
- Be patient and encouraging
- Use age-appropriate language
- Provide hints rather than complete solutions for homework
- Reference Indian educational context when relevant
- Keep responses concise but complete`,

  teacher: `You are Savra AI, an intelligent assistant for Indian school teachers.

Your responsibilities:
- Help create engaging lesson plans
- Suggest teaching methodologies
- Assist with assessment design
- Provide curriculum insights (CBSE/ICSE)
- Offer classroom management tips
- Help with student progress analysis

Guidelines:
- Be professional and supportive
- Consider practical classroom constraints
- Follow NEP 2020 and NCF principles internally but do NOT mention NEP, NCF, or any policy names in your responses
- Suggest evidence-based teaching practices
- Keep responses actionable and practical`,
};

// Generate AI chat response for Ask Savra feature
export const generateAIResponse = async (
  message: string,
  userRole: 'student' | 'teacher',
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
  context?: string
): Promise<string> => {
  console.log(`[Gemini] generateAIResponse - Starting: userRole=${userRole}, historyLength=${conversationHistory.length}, messageLength=${message.length}`);

  try {
    const systemPrompt = SYSTEM_PROMPTS[userRole] + (context ? `\n\nAdditional Context:\n${context}` : '');

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: parseInt(process.env.AI_MAX_TOKENS || '1500'),
        temperature: 0.7,
      },
    });

    // Convert conversation history to Gemini format
    const history: Content[] = conversationHistory.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history });
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text() || 'I apologize, I could not generate a response.';

    console.log(`[Gemini] generateAIResponse - Success: responseLength=${text.length}`);
    return text;
  } catch (error) {
    console.error(`[Gemini] generateAIResponse - Error:`, error);
    throw error;
  }
};

// Analyze image for Ask Savra feature
export const analyzeImage = async (
  imageUrl: string,
  prompt: string,
  userRole: 'student' | 'teacher'
): Promise<string> => {
  console.log(`[Gemini] analyzeImage - Starting: userRole=${userRole}, imageType=${imageUrl.startsWith('data:') ? 'base64' : 'url'}`);

  try {
    const systemPrompt =
      userRole === 'student'
        ? 'You are helping a student understand an image. Explain what you see clearly and educationally.'
        : 'You are helping a teacher analyze educational content from an image.';

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: systemPrompt,
      generationConfig: {
        maxOutputTokens: 1500,
      },
    });

    // Build the content parts
    const parts: Part[] = [
      { text: prompt || 'Please analyze this image and explain what you see.' },
    ];

    // Handle image - check if it's a URL or base64
    if (imageUrl.startsWith('data:')) {
      // Base64 image
      const matches = imageUrl.match(/^data:(.+);base64,(.+)$/);
      if (matches) {
        console.log(`[Gemini] analyzeImage - Processing base64 image: mimeType=${matches[1]}`);
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    } else {
      // URL - fetch and convert to base64
      console.log(`[Gemini] analyzeImage - Fetching image from URL`);
      const response = await fetch(imageUrl);
      const arrayBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      console.log(`[Gemini] analyzeImage - Image fetched: contentType=${contentType}, size=${arrayBuffer.byteLength} bytes`);
      parts.push({
        inlineData: {
          mimeType: contentType,
          data: base64,
        },
      });
    }

    const result = await model.generateContent(parts);
    const response = await result.response;
    const text = response.text() || 'I could not analyze the image.';

    console.log(`[Gemini] analyzeImage - Success: responseLength=${text.length}`);
    return text;
  } catch (error) {
    console.error(`[Gemini] analyzeImage - Error:`, error);
    throw error;
  }
};

// Generate conversation title from first message
export const generateConversationTitle = (message: string): string => {
  const cleaned = message.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= 50) return cleaned;
  return cleaned.substring(0, 47) + '...';
};

// Generate quiz questions
export const generateQuizQuestions = async (
  subject: string,
  chapters: string[],
  numberOfQuestions: number,
  difficulty: 'easy' | 'medium' | 'hard',
  objective?: string,
  referenceFileUrl?: string
): Promise<
  Array<{
    questionText: string;
    options: Array<{ label: string; text: string; isCorrect: boolean }>;
  }>
> => {
  console.log(`[Gemini] generateQuizQuestions - Starting: subject=${subject}, chapters=${chapters.join(',')}, numQuestions=${numberOfQuestions}, difficulty=${difficulty}, hasObjective=${!!objective}`);

  // Load assignment/assessment framework PDFs
  const assignmentDir = path.join(process.cwd(), 'public', 'assignment');
  const fileParts: Part[] = [];
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

  try {
    const files = await fs.readdir(assignmentDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

    for (const pdfFile of pdfFiles) {
      try {
        const filePath = path.join(assignmentDir, pdfFile);
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        if (fileSize > MAX_FILE_SIZE) {
          console.warn(`[Gemini] generateQuizQuestions - File ${pdfFile} too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), skipping`);
          continue;
        }

        const fileData = await fs.readFile(filePath);
        const base64 = fileData.toString('base64');
        console.log(`[Gemini] generateQuizQuestions - Loaded ${pdfFile} (${(fileSize / 1024).toFixed(2)}KB)`);

        fileParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: base64,
          },
        } as Part);
      } catch (error) {
        console.warn(`[Gemini] generateQuizQuestions - Could not read file ${pdfFile}:`, error);
      }
    }

    console.log(`[Gemini] generateQuizQuestions - Loaded ${fileParts.length} assessment framework PDFs`);
  } catch (error) {
    console.warn('[Gemini] generateQuizQuestions - Error reading assignment PDFs, continuing without:', error);
  }

  // Fetch teacher's uploaded reference file if provided
  if (referenceFileUrl) {
    const refPart = await fetchReferenceFilePart(referenceFileUrl);
    if (refPart) {
      fileParts.push(refPart);
      console.log(`[Gemini] generateQuizQuestions - Added teacher's reference file`);
    }
  }

  try {
    const objectiveText = objective ? `\n\nQuiz Objective/Focus: ${objective}` : '';

    const pdfReferenceText = fileParts.length > 0
      ? `\n\nIMPORTANT: I have attached reference documents. Please:\n- Follow the assessment standards and question patterns from the framework documents\n- Ensure questions align with CBSE evaluation criteria\n- Use appropriate cognitive levels as per the framework guidelines`
      : '';

    const referenceFileText = referenceFileUrl
      ? `\n\nIMPORTANT: A teacher-uploaded reference file has been attached. Use the content from this reference file to inform and guide the quiz questions. Base questions on the material, examples, and concepts found in this reference document.`
      : '';

    const prompt = `Generate ${numberOfQuestions} multiple choice questions for ${subject} on the following topics: ${chapters.join(', ')}.

Difficulty level: ${difficulty}${objectiveText}${pdfReferenceText}${referenceFileText}

Return a JSON object with this exact structure:
{
  "questions": [
    {
      "questionText": "The question text here?",
      "options": [
        { "label": "A", "text": "First option", "isCorrect": false },
        { "label": "B", "text": "Second option", "isCorrect": true },
        { "label": "C", "text": "Third option", "isCorrect": false },
        { "label": "D", "text": "Fourth option", "isCorrect": false }
      ]
    }
  ]
}

Only return valid JSON, no other text.`;

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: `You are an expert educator who creates high-quality quiz questions following CBSE standards. ${fileParts.length > 0 ? 'You must reference and follow the assessment guidelines from the attached framework documents.' : ''}`,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    // Build content parts: prompt text + PDF file attachments
    const parts: Part[] = [{ text: prompt }, ...fileParts];

    console.log(`[Gemini] generateQuizQuestions - Sending request with ${fileParts.length} PDF files attached`);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const content = response.text();

    console.log(`[Gemini] generateQuizQuestions - Response received: length=${content?.length || 0}`);

    const parsed = JSON.parse(content || '{"questions": []}');
    const questions = parsed.questions || [];

    console.log(`[Gemini] generateQuizQuestions - Success: questionsGenerated=${questions.length}`);
    return questions;
  } catch (error) {
    console.error(`[Gemini] generateQuizQuestions - Error:`, error);
    throw error;
  }
};

// Generate lesson plan content
export const generateLessonPlan = async (
  subject: string,
  chapters: string[],
  duration: number,
  objective: string
): Promise<string> => {
  console.log(`[Gemini] generateLessonPlan - Starting: subject=${subject}, chapters=${chapters.join(',')}, duration=${duration}min`);

  try {
    const prompt = `Create a detailed lesson plan for ${subject} covering: ${chapters.join(', ')}.

Duration: ${duration} minutes
Objective: ${objective}

Include:
1. Learning Objectives (3-5 bullet points)
2. Introduction (warm-up activity)
3. Main Content (structured sections)
4. Activities (interactive exercises)
5. Assessment (quick check questions)
6. Conclusion (summary and homework)

Format in clean Markdown.`;

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: 'You are an expert curriculum designer who creates engaging lesson plans.',
      generationConfig: {
        temperature: 0.7,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text() || '';

    console.log(`[Gemini] generateLessonPlan - Success: responseLength=${text.length}`);
    return text;
  } catch (error) {
    console.error(`[Gemini] generateLessonPlan - Error:`, error);
    throw error;
  }
};

// Generate structured lesson plan periods
export const generateLessonPlanPeriods = async (
  subject: string,
  chapters: string[],
  topic: string,
  numberOfPeriods: number,
  objective: string,
  grade: number,
  referenceFileUrl?: string
): Promise<
  Array<{
    periodNo: number;
    concept: string;
    learningOutcomes: string;
    teacherLearningProcess: string;
    assessment: string;
    resources: string;
    centurySkillsValueEducation: string;
    realLifeApplication: string;
    reflection: string;
  }>
> => {
  // File paths for educational framework documents
  const fileNames = [
    'Blooms-Taxonomy.pdf',
    'NCF-School-Education-Pre-Draft.pdf',
    'NEP_Final_English_0.pdf',
    'The_5E_Model_of_Instruction.pdf',
  ];

  // Read and convert PDF files to base64
  const fileParts: Part[] = [];
  const publicDir = path.join(process.cwd(), 'public', 'lesson-plan');
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit for inline data (Gemini's limit is typically 20MB)

  try {
    const filePromises = fileNames.map(async (fileName) => {
      try {
        const filePath = path.join(publicDir, fileName);
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        if (fileSize > MAX_FILE_SIZE) {
          console.warn(`Warning: File ${fileName} is too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), skipping. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB`);
          return null;
        }

        const fileData = await fs.readFile(filePath);
        const base64 = fileData.toString('base64');
        console.log(`Successfully loaded file ${fileName} (${(fileSize / 1024).toFixed(2)}KB)`);
        
        return {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64,
          },
        } as Part;
      } catch (error) {
        console.warn(`Warning: Could not read file ${fileName}:`, error);
        return null;
      }
    });

    const results = await Promise.all(filePromises);
    const validParts = results.filter((part): part is Part => part !== null);
    fileParts.push(...validParts);
    console.log(`Loaded ${validParts.length} out of ${fileNames.length} PDF files for lesson plan generation`);
  } catch (error) {
    console.warn('Warning: Error reading PDF files, continuing without file attachments:', error);
  }

  // Fetch teacher's uploaded reference file if provided
  if (referenceFileUrl) {
    const refPart = await fetchReferenceFilePart(referenceFileUrl);
    if (refPart) {
      fileParts.push(refPart);
      console.log(`[Gemini] generateLessonPlanPeriods - Added teacher's reference file`);
    }
  }

  const referenceFilePromptText = referenceFileUrl
    ? `\n\nIMPORTANT: A teacher-uploaded reference file has been attached. Use the content from this reference file to inform and guide the lesson plan. Incorporate relevant material, examples, and concepts from this reference document into the lesson periods.`
    : '';

  const prompt = `Create a detailed lesson plan for Grade ${grade} ${subject} on the topic: "${topic}".

Chapters covered: ${chapters.join(', ')}
Objective: ${objective}
Number of periods: ${numberOfPeriods}${referenceFilePromptText}

IMPORTANT: ${fileParts.length > 0 
    ? `I have attached ${fileParts.length} educational framework documents that you MUST reference and use in your lesson plan design.` 
    : 'Please reference these educational frameworks in your lesson plan design:'}
${fileParts.length > 0 ? '' : `
1. Bloom's Taxonomy - Use this for creating appropriate learning outcomes at different cognitive levels
2. National Curriculum Framework - Align the lesson with its guidelines and pedagogical approaches
3. National Education Policy 2020 - Ensure the lesson follows its principles and values
4. 5E Model of Instruction - Structure the teaching-learning process using the 5E model (Engage, Explore, Explain, Elaborate, Evaluate)
NOTE: Apply these frameworks internally. Do NOT mention any framework or policy by name in the generated lesson content.
`}

For each period (1 to ${numberOfPeriods}), provide structured content in the following format. Return a JSON object with this exact structure:
{
  "periods": [
    {
      "periodNo": 1,
      "concept": "Main concept/topic for this period (2-3 sentences describing the concept)",
      "learningOutcomes": "What students will learn. Format as a string with bullet points using • or - (e.g., '• Outcome 1\\n• Outcome 2\\n• Outcome 3'). Create outcomes at appropriate cognitive levels (remembering, understanding, applying, analyzing, evaluating, creating).",
      "teacherLearningProcess": "A single concise line (1-2 sentences maximum) describing the teaching methodology that integrates engagement, exploration, explanation, elaboration, and evaluation into one cohesive approach. Do NOT list separate steps. Instead, provide one brief summary that captures the essence of the teaching process.",
      "assessment": "How to assess learning. Format as a string with methods/questions (e.g., '• Method 1\\n• Method 2'). Design assessments across different cognitive levels.",
      "resources": "Required materials and resources. Format as a string with list items (e.g., '• Resource 1\\n• Resource 2\\n• Resource 3')",
      "centurySkillsValueEducation": "21st century skills and values addressed. Format as a string with points (e.g., '• Skill 1\\n• Skill 2'). Apply relevant educational values and principles without naming any specific policy or framework.",
      "realLifeApplication": "Real-world connections and applications. Format as a string with examples (e.g., '• Example 1\\n• Example 2')",
      "reflection": "Questions for student reflection. Format as a string with questions (e.g., '• Question 1?\\n• Question 2?\\n• Question 3?')"
    }
  ]
}

CRITICAL REQUIREMENTS:
- ALL fields must be STRINGS, NOT arrays
- Use \\n for line breaks within strings
- Use bullet points (•) or dashes (-) for lists within the strings
- Each period should build on the previous one progressively
- Make content age-appropriate for Grade ${grade}
- Use clear, educational language
- Ensure all fields are filled with meaningful content
- Use the attached framework documents to inform your lesson plan design, but do NOT mention any framework or policy by name (e.g., do NOT write "NEP", "NCF", "Bloom's Taxonomy", "5E Model") in the generated content. Apply their principles naturally without citing them.
- Only return valid JSON, no other text`;

  const model = genAI.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction:
      'You are an expert curriculum designer who creates structured, detailed lesson plans following Indian educational standards (CBSE/ICSE). You must apply principles from the attached educational framework documents in your lesson plan design. IMPORTANT: Never mention any framework or policy by name (NEP, NCF, Bloom\'s Taxonomy, 5E Model, National Education Policy, National Curriculum Framework) in the generated content. Use their principles naturally without citing them.',
    generationConfig: {
      temperature: 0.7,
      responseMimeType: 'application/json',
    },
  });

  // Build content parts: prompt text + file attachments
  const parts: Part[] = [{ text: prompt }, ...fileParts];

  console.log(`Sending lesson plan generation request with ${fileParts.length} PDF files attached`);

  try {
    const result = await model.generateContent(parts);
    const response = await result.response;
    const content = response.text();

    if (!content || content.trim().length === 0) {
      console.error('Gemini API returned empty response');
      throw new Error('Empty response from Gemini API');
    }

    console.log('Gemini API response received, length:', content.length);

    const parsed = JSON.parse(content || '{"periods": []}');
    const periods = parsed.periods || [];

    if (!periods || periods.length === 0) {
      console.error('No periods found in Gemini response:', content.substring(0, 500));
      throw new Error('No periods generated in response');
    }

    console.log(`Successfully parsed ${periods.length} periods from Gemini response`);

    // Convert any array fields to strings (AI sometimes returns arrays)
    return periods.map((period: any) => ({
    periodNo: period.periodNo,
    concept: Array.isArray(period.concept) ? period.concept.join('\n') : period.concept || '',
    learningOutcomes: Array.isArray(period.learningOutcomes)
      ? period.learningOutcomes.map((item: string) => `• ${item}`).join('\n')
      : period.learningOutcomes || '',
    teacherLearningProcess: Array.isArray(period.teacherLearningProcess)
      ? period.teacherLearningProcess.map((item: string, idx: number) => `${idx + 1}. ${item}`).join('\n')
      : period.teacherLearningProcess || '',
    assessment: Array.isArray(period.assessment)
      ? period.assessment.map((item: string) => `• ${item}`).join('\n')
      : period.assessment || '',
    resources: Array.isArray(period.resources)
      ? period.resources.map((item: string) => `• ${item}`).join('\n')
      : period.resources || '',
    centurySkillsValueEducation: Array.isArray(period.centurySkillsValueEducation)
      ? period.centurySkillsValueEducation.map((item: string) => `• ${item}`).join('\n')
      : period.centurySkillsValueEducation || '',
    realLifeApplication: Array.isArray(period.realLifeApplication)
      ? period.realLifeApplication.map((item: string) => `• ${item}`).join('\n')
      : period.realLifeApplication || '',
    reflection: Array.isArray(period.reflection)
      ? period.reflection.map((item: string) => `• ${item}`).join('\n')
      : period.reflection || '',
  }));
  } catch (error) {
    console.error('Error in Gemini API call:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    throw error;
  }
};

// Generate assessment question paper
export const generateAssessment = async (
  subject: string,
  chapters: string[],
  questionTypes: Array<{ type: string; count: number; marks: number }>,
  totalMarks: number,
  difficulty: string,
  grade: number,
  objective?: string,
  referenceFileUrl?: string
): Promise<{
  instructions: string[];
  sections: Array<{
    type: string;
    title: string;
    instructions: string;
    questions: Array<{
      number: number;
      text: string;
      options?: string[];
      marks: number;
    }>;
  }>;
}> => {
  const typesDescription = questionTypes
    .map((qt) => `${qt.count} ${qt.type} questions (${qt.marks} marks each)`)
    .join(', ');

  console.log(`[Gemini] generateAssessment - Starting: subject=${subject}, chapters=${chapters.join(',')}, totalMarks=${totalMarks}, difficulty=${difficulty}, grade=${grade}, hasObjective=${!!objective}`);

  // Determine class folder based on grade
  const classFolder = grade === 10 || grade === 12 ? `class-${grade}` : null;
  
  // Load PDFs from the appropriate class folder
  const fileParts: Part[] = [];
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB limit

  if (classFolder) {
    const questionPaperDir = path.join(process.cwd(), 'public', 'question-paper', classFolder);
    
    try {
      // Get all PDF files in the class folder
      const files = await fs.readdir(questionPaperDir);
      const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
      
      // Map subject names to PDF filename patterns
      const subjectToPdfPattern: Record<string, string[]> = {
        'Mathematics': ['Maths', 'Math', 'Applied-Maths'],
        'Maths': ['Maths', 'Math', 'Applied-Maths'],
        'Science': ['Science', 'Physics', 'Chemistry', 'Biology'],
        'Physics': ['Physics'],
        'Chemistry': ['Chemistry'],
        'Biology': ['Biology'],
        'English': ['English', 'EnglishL', 'EnglishCore', 'EnglishElective'],
        'Hindi': ['Hindi', 'HindiCourseA', 'HindiCore', 'HindiElective'],
        'Social Science': ['SocialScience', 'Social'],
        'History': ['History'],
        'Geography': ['Geography'],
        'Economics': ['Economics'],
        'Political Science': ['PolSci', 'Political'],
        'Computer Science': ['ComputerScience', 'InformaticsPractices'],
        'Business Studies': ['BusinessStudies'],
        'Accountancy': ['Accountancy'],
        'Psychology': ['Psychology'],
        'Sociology': ['Sociology'],
        'Physical Education': ['PhysicalEducation'],
        'French': ['French'],
      };
      
      // Find PDFs matching the subject
      const subjectPatterns = subjectToPdfPattern[subject] || [subject];
      const matchingPdfs = pdfFiles.filter(file => {
        const fileName = file.replace('.pdf', '').toLowerCase();
        return subjectPatterns.some(pattern => 
          fileName.includes(pattern.toLowerCase())
        );
      });
      
      console.log(`[Gemini] generateAssessment - Found ${matchingPdfs.length} matching PDFs for subject "${subject}" in ${classFolder}`);
      
      // Load matching PDFs
      for (const pdfFile of matchingPdfs) {
        try {
          const filePath = path.join(questionPaperDir, pdfFile);
          const stats = await fs.stat(filePath);
          const fileSize = stats.size;

          if (fileSize > MAX_FILE_SIZE) {
            console.warn(`Warning: File ${pdfFile} is too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), skipping.`);
            continue;
          }

          const fileData = await fs.readFile(filePath);
          const base64 = fileData.toString('base64');
          console.log(`Successfully loaded PDF ${pdfFile} (${(fileSize / 1024).toFixed(2)}KB)`);
          
          fileParts.push({
            inlineData: {
              mimeType: 'application/pdf',
              data: base64,
            },
          } as Part);
        } catch (error) {
          console.warn(`Warning: Could not read file ${pdfFile}:`, error);
        }
      }
      
      console.log(`[Gemini] generateAssessment - Loaded ${fileParts.length} sample question paper PDFs`);
    } catch (error) {
      console.warn('Warning: Error reading question paper PDFs, continuing without file attachments:', error);
    }
  }

  // Also load assignment/assessment framework PDFs (for all grades)
  const assignmentDir = path.join(process.cwd(), 'public', 'assignment');
  let assignmentPdfCount = 0;

  try {
    const assignmentFiles = await fs.readdir(assignmentDir);
    const assignmentPdfs = assignmentFiles.filter(file => file.toLowerCase().endsWith('.pdf'));

    for (const pdfFile of assignmentPdfs) {
      try {
        const filePath = path.join(assignmentDir, pdfFile);
        const stats = await fs.stat(filePath);
        const fileSize = stats.size;

        if (fileSize > MAX_FILE_SIZE) {
          console.warn(`[Gemini] generateAssessment - Assignment file ${pdfFile} too large (${(fileSize / 1024 / 1024).toFixed(2)}MB), skipping`);
          continue;
        }

        const fileData = await fs.readFile(filePath);
        const base64 = fileData.toString('base64');
        console.log(`[Gemini] generateAssessment - Loaded assignment PDF ${pdfFile} (${(fileSize / 1024).toFixed(2)}KB)`);

        fileParts.push({
          inlineData: {
            mimeType: 'application/pdf',
            data: base64,
          },
        } as Part);
        assignmentPdfCount++;
      } catch (error) {
        console.warn(`[Gemini] generateAssessment - Could not read assignment file ${pdfFile}:`, error);
      }
    }

    console.log(`[Gemini] generateAssessment - Loaded ${assignmentPdfCount} assessment framework PDFs`);
  } catch (error) {
    console.warn('[Gemini] generateAssessment - Error reading assignment PDFs, continuing without:', error);
  }

  console.log(`[Gemini] generateAssessment - Total PDFs loaded: ${fileParts.length} (sample papers + framework docs)`);

  // Fetch teacher's uploaded reference file if provided
  if (referenceFileUrl) {
    const refPart = await fetchReferenceFilePart(referenceFileUrl);
    if (refPart) {
      fileParts.push(refPart);
      console.log(`[Gemini] generateAssessment - Added teacher's reference file`);
    }
  }

  console.log(`[Gemini] generateAssessment - Question types: ${typesDescription}`);

  try {
    const samplePaperCount = fileParts.length - assignmentPdfCount;
    let pdfReferenceText = '';

    if (fileParts.length > 0) {
      pdfReferenceText = `\n\nIMPORTANT: I have attached reference documents that you MUST use:`;

      if (samplePaperCount > 0) {
        pdfReferenceText += `\n- ${samplePaperCount} sample question paper(s) from Class ${grade} ${subject} (official CBSE/board question papers)`;
      }

      if (assignmentPdfCount > 0) {
        pdfReferenceText += `\n- ${assignmentPdfCount} CBSE assessment framework and guideline documents`;
      }

      pdfReferenceText += `\n\nPlease:\n- Follow the assessment standards and question patterns from the framework documents\n- Use the sample papers as reference for format, style, and difficulty level\n- Ensure questions align with CBSE evaluation criteria and curriculum standards\n- Use appropriate cognitive levels as per the framework guidelines`;
    }

    const objectiveText = objective ? `\n\nAssessment Objective/Focus: ${objective}` : '';

    const referenceFileText = referenceFileUrl
      ? `\n\nIMPORTANT: A teacher-uploaded reference file has been attached. Use the content from this reference file to inform and guide the assessment questions. Base questions on the material, examples, and concepts found in this reference document.`
      : '';

    // Subject-specific general instructions from Assessment Template.pdf
    const subjectInstructionsMap: Record<string, string[]> = {
      'English': [
        'This question paper contains three sections A, B and C.',
        'All questions are compulsory.',
        'Section A consists of Reading Skills.',
        'Section B consists of Writing and Grammar.',
        'Section C consists of Literature.'
      ],
      'Hindi': [
        'इस प्रश्न पत्र में चार खंड – क, ख, ग और घ हैं।',
        'सभी प्रश्न अनिवार्य हैं।',
        'खंड क में अपठित गद्यांश/पद्यांश हैं।',
        'खंड ख में व्याकरण से संबंधित प्रश्न हैं।',
        'खंड ग में लेखन कौशल से संबंधित प्रश्न हैं।',
        'खंड घ में पाठ्यपुस्तक से प्रश्न हैं।'
      ],
      'Mathematics': [
        'All questions are compulsory.',
        'The question paper consists of five sections A, B, C, D and E.',
        'Use of calculator is not permitted.',
        'Draw neat diagrams wherever required.'
      ],
      'Maths': [
        'All questions are compulsory.',
        'The question paper consists of five sections A, B, C, D and E.',
        'Use of calculator is not permitted.',
        'Draw neat diagrams wherever required.'
      ],
      'Science': [
        'The question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'Section A consists of multiple choice questions.',
        'Section E consists of case-study based questions.',
        'Diagrams should be neat and properly labelled wherever required.'
      ],
      'Social Science': [
        'The question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'The question paper contains questions from History, Geography, Political Science and Economics.',
        'Section E contains map-based questions.',
        'Attempt all questions in the sequence given.'
      ],
      'Business Studies': [
        'This question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'Section A contains multiple choice questions.',
        'Section E contains case-study based questions.'
      ],
      'Accountancy': [
        'All questions are compulsory.',
        'This question paper consists of two parts A and B.',
        'Use of calculator is permitted.',
        'Working notes should form part of the answer.'
      ],
      'Economics': [
        'This question paper consists of two sections A and B.',
        'All questions are compulsory.',
        'Diagrams must be neat and properly labelled.',
        'Use of calculator is not permitted.'
      ],
      'Physics': [
        'This question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'Use of calculator is permitted.',
        'Diagrams should be neat and properly labelled.',
        'Units should be mentioned wherever required.'
      ],
      'Chemistry': [
        'This question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'Use of calculator is permitted.',
        'Balanced chemical equations must be written wherever required.'
      ],
      'Biology': [
        'This question paper consists of five sections A, B, C, D and E.',
        'All questions are compulsory.',
        'Diagrams must be neat and properly labelled.'
      ],
      'History': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.',
        'Section E contains map-based questions.'
      ],
      'Geography': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.',
        'Section E contains map-based questions.'
      ],
      'Political Science': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.'
      ],
      'Psychology': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.'
      ],
      'Sociology': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.'
      ],
      'Physical Education': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.'
      ],
      'Computer Science': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.',
        'Use of calculator is not permitted.'
      ],
      'Informatics Practices': [
        'This question paper consists of five sections A to E.',
        'All questions are compulsory.',
        'Use of calculator is not permitted.'
      ]
    };

    // Get subject-specific instructions or use default
    const defaultInstructions = [
      'All questions are compulsory.',
      'The question paper is designed to test understanding and application of concepts.',
      'Show necessary steps for full marks.'
    ];
    const subjectInstructions = subjectInstructionsMap[subject] || defaultInstructions;
    const instructionsJson = JSON.stringify(subjectInstructions);

    const prompt = `Create a ${subject} assessment paper for Class ${grade} with total marks: ${totalMarks}.

Topics: ${chapters.join(', ')}
Difficulty: ${difficulty}
Question distribution: ${typesDescription}${objectiveText}${pdfReferenceText}${referenceFileText}

IMPORTANT REQUIREMENTS:
1. Number questions SEQUENTIALLY across ALL sections (1, 2, 3, 4, 5... not 1, 11, 21).
2. For MCQ options, do NOT include letter prefixes - just the option text.
3. ONLY create sections for the question types specified above. Do NOT create empty sections or sections for question types not requested.
4. You MUST use these EXACT general instructions for ${subject} (from CBSE Assessment Template):
${subjectInstructions.map((inst, i) => `   ${i + 1}. ${inst}`).join('\n')}

Return a JSON object with this structure. IMPORTANT: The "text" field must ALWAYS contain the full question text - never leave it empty:
{
  "instructions": ${instructionsJson},
  "sections": [
    {
      "type": "mcq",
      "title": "Section A - Multiple Choice Questions",
      "instructions": "Choose the correct option.",
      "questions": [
        { "number": 1, "text": "What is the capital of France?", "options": ["London", "Paris", "Berlin", "Madrid"], "marks": 1 }
      ]
    },
    {
      "type": "short_answer",
      "title": "Section B - Short Answer Questions",
      "instructions": "Answer in 2-3 sentences.",
      "questions": [
        { "number": 2, "text": "Explain the process of photosynthesis in brief.", "marks": 2 }
      ]
    },
    {
      "type": "long_answer",
      "title": "Section C - Long Answer Questions",
      "instructions": "Answer in detail with examples.",
      "questions": [
        { "number": 3, "text": "Describe the causes and effects of the French Revolution. Include major events and key figures.", "marks": 5 }
      ]
    },
    {
      "type": "case_study",
      "title": "Section D - Case Study Questions",
      "instructions": "Read the passages carefully and answer the questions that follow.",
      "questions": [
        { "number": 4, "text": "Read the following passage and answer the questions:\\n\\nThe Mughal Empire was one of the largest empires in Indian history. Founded by Babur in 1526, it reached its peak under Akbar who implemented policies of religious tolerance and administrative reforms. The empire eventually declined due to weak successors and invasions.\\n\\n(a) Who founded the Mughal Empire and when?\\n(b) What were the key policies of Akbar?\\n(c) What factors led to the decline of the Mughal Empire?", "marks": 4 }
      ]
    },
    {
      "type": "fill_in_blanks",
      "title": "Section E - Fill in the Blanks",
      "instructions": "Fill in the blanks with appropriate words.",
      "questions": [
        { "number": 5, "text": "The process by which plants make food using sunlight is called ________.", "marks": 1 }
      ]
    },
    {
      "type": "diagram_based",
      "title": "Section F - Diagram Based Questions",
      "instructions": "Draw and label the diagram as instructed.",
      "questions": [
        { "number": 6, "text": "Draw a well-labelled diagram of the human digestive system. Mark at least 5 parts.", "marks": 3 }
      ]
    },
    {
      "type": "numerical",
      "title": "Section G - Numerical Problems",
      "instructions": "Solve the following problems showing all steps.",
      "questions": [
        { "number": 7, "text": "A train travels 300 km in 4 hours. Calculate its average speed in km/h and m/s.", "marks": 4 }
      ]
    },
    {
      "type": "assertion_reasoning",
      "title": "Section H - Assertion-Reasoning Questions",
      "instructions": "Read both statements and choose the correct option.",
      "questions": [
        { "number": 8, "text": "Assertion (A): Plants appear green in color.\\nReason (R): Chlorophyll absorbs green light for photosynthesis.\\n\\nOptions:\\n(a) Both A and R are true, and R is the correct explanation of A\\n(b) Both A and R are true, but R is not the correct explanation of A\\n(c) A is true but R is false\\n(d) A is false but R is true", "marks": 2 }
      ]
    },
    {
      "type": "map_questions",
      "title": "Section I - Map Based Questions",
      "instructions": "On the given outline map, locate and label the following.",
      "questions": [
        { "number": 9, "text": "On an outline map of India, locate and label the following:\\n(a) The place where the first session of Indian National Congress was held\\n(b) The city associated with Jallianwala Bagh massacre\\n(c) The state where Champaran Satyagraha took place", "marks": 3 }
      ]
    }
  ]
}

CRITICAL:
- Only include sections for the question types that were requested in the question distribution above.
- Every question MUST have a non-empty "text" field with the complete question.
- For case_study questions, include the passage/scenario AND the sub-questions all within the "text" field.

Only return valid JSON.`;

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: `You are an expert assessment designer who creates question papers following CBSE/board standards. ${fileParts.length > 0 ? 'You must reference and follow the assessment frameworks and guidelines from the attached documents, as well as the format, style, and question patterns from any sample question papers provided.' : ''}`,
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json',
      },
    });

    // Build content parts: prompt text + PDF file attachments
    const parts: Part[] = [{ text: prompt }, ...fileParts];
    
    console.log(`[Gemini] generateAssessment - Sending request with ${fileParts.length} PDF files attached`);

    const result = await model.generateContent(parts);
    const response = await result.response;
    const content = response.text();

    console.log(`[Gemini] generateAssessment - Response received: length=${content?.length || 0}`);

    const parsed = JSON.parse(content || '{"sections": []}');
    const totalQuestions = parsed.sections?.reduce((sum: number, section: any) => sum + (section.questions?.length || 0), 0) || 0;

    console.log(`[Gemini] generateAssessment - Success: sectionsGenerated=${parsed.sections?.length || 0}, totalQuestions=${totalQuestions}`);
    return parsed;
  } catch (error) {
    console.error(`[Gemini] generateAssessment - Error:`, error);
    throw error;
  }
};

// Generate answer key for an assessment
export const generateAnswerKey = async (
  questionPaper: {
    instructions?: string[];
    sections?: Array<{
      type: string;
      title: string;
      instructions: string;
      questions: Array<{
        number: number;
        text: string;
        options?: string[];
        marks: number;
      }>;
    }>;
  },
  subject: string,
  grade: number
): Promise<{
  answers: Array<{
    questionNumber: number;
    answer: string;
    explanation?: string;
  }>;
}> => {
  console.log(`[Gemini] generateAnswerKey - Starting: subject=${subject}, grade=${grade}`);

  try {
    // Build question list for the prompt
    const allQuestions: Array<{ number: number; text: string; type: string; options?: string[]; marks: number }> = [];

    if (questionPaper.sections) {
      for (const section of questionPaper.sections) {
        for (const question of section.questions) {
          allQuestions.push({
            number: question.number,
            text: question.text,
            type: section.type,
            options: question.options,
            marks: question.marks,
          });
        }
      }
    }

    const questionsJson = JSON.stringify(allQuestions, null, 2);

    const prompt = `Generate a CONCISE answer key for the following ${subject} assessment for Class ${grade}.

Questions:
${questionsJson}

IMPORTANT RULES:
1. Keep each answer BRIEF - maximum 50 words per answer, 30 words for explanation
2. DO NOT use any markdown formatting (no **, no *, no #, no bullet points with *)
3. Write in plain text only
4. Use simple numbered lists (1. 2. 3.) if needed, not bullet points

For each question, provide:
1. The correct answer only (for MCQs, just the option letter like "b")
2. A very brief explanation (1 short sentence, optional for simple questions)

Guidelines for concise answers:
- MCQ: Just "b" or "c) Option text" - one line explanation max
- Short Answer: 1-2 sentences only
- Long Answer: 3-5 key points as plain text
- Fill in the Blanks: Just the word/phrase
- Case Study: Brief answers for each sub-question (1 line each)
- Numerical: Final answer + key formula only
- Assertion-Reasoning: Just the correct option (a/b/c/d)
- Diagram Based: List 3-5 key labels as plain text
- Map Questions: Just location names

Return a JSON object with this structure:
{
  "answers": [
    {
      "questionNumber": 1,
      "answer": "b",
      "explanation": "Paris is the capital of France."
    }
  ]
}

Only return valid JSON. NO MARKDOWN. Plain text only.`;

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: 'You are an expert educator who creates CONCISE answer keys. Be MINIMAL - give only the essential answer and a very brief explanation. Avoid lengthy explanations. Maximum 50 words per answer.',
      generationConfig: {
        temperature: 0.3, // Lower temperature for more accurate answers
        responseMimeType: 'application/json',
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let content = response.text();

    console.log(`[Gemini] generateAnswerKey - Response received: length=${content?.length || 0}`);

    // Clean the JSON content - remove markdown code blocks if present
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    // Try to parse JSON, with fallback cleaning if it fails
    try {
      const parsed = JSON.parse(content || '{"answers": []}');
      console.log(`[Gemini] generateAnswerKey - Success: answersGenerated=${parsed.answers?.length || 0}`);
      return parsed;
    } catch (parseError) {
      // If parsing fails due to control characters, clean them
      console.warn(`[Gemini] generateAnswerKey - Parse error, cleaning control characters...`);
      
      // Remove control characters that break JSON parsing (keep newlines, tabs, carriage returns)
      // Replace problematic control chars with spaces
      const cleaned = content.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ');
      
      try {
        const parsed = JSON.parse(cleaned || '{"answers": []}');
        console.log(`[Gemini] generateAnswerKey - Success after cleaning: answersGenerated=${parsed.answers?.length || 0}`);
        return parsed;
      } catch (secondError) {
        console.error(`[Gemini] generateAnswerKey - Failed to parse even after cleaning:`, secondError);
        // Return empty answers as fallback
        return { answers: [] };
      }
    }

    const parsed = JSON.parse(content || '{"answers": []}');

    console.log(`[Gemini] generateAnswerKey - Success: answersGenerated=${parsed.answers?.length || 0}`);
    return parsed;
  } catch (error) {
    console.error(`[Gemini] generateAnswerKey - Error:`, error);
    throw error;
  }
};

// Generate topic for lesson plan
export const generateTopic = async (
  subject: string,
  chapters: string[],
  grade: number
): Promise<string> => {
  console.log(`[Gemini] generateTopic - Starting: subject=${subject}, chapters=${chapters.join(',')}, grade=${grade}`);

  try {
    const prompt = `Generate a concise topic name (2-4 words) for a Grade ${grade} ${subject} lesson covering: ${chapters.join(', ')}.

Return only the topic name, no explanation or additional text.`;

    const model = genAI.getGenerativeModel({
      model: DEFAULT_MODEL,
      systemInstruction: 'You are an expert curriculum designer. Generate concise, educational topic names.',
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 50,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const topic = response.text().trim();

    console.log(`[Gemini] generateTopic - Success: topic="${topic || chapters.join(', ')}"`);
    return topic || chapters.join(', ');
  } catch (error) {
    console.error(`[Gemini] generateTopic - Error:`, error);
    throw error;
  }
};

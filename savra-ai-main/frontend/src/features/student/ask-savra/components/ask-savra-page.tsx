"use client"

// Web Speech API type declarations
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number
  readonly results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
  start(): void
  stop(): void
  abort(): void
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

import { Search, Upload, Camera, Loader2, Send, Paperclip, X, User, Bot, ChevronLeft, Mic, Sparkles, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useAI } from "@/hooks/use-ai"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import ReactMarkdown from "react-markdown"
import { saveConversation, generateConversationTitle, getConversation, type ChatConversation, type ChatMessage } from "@/lib/chat-storage"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  fileUrl?: string
}

export default function AskSavraPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { sendQuery, uploadFile, isLoading, error, clearError } = useAI()
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Get first name from user
  const firstName = user?.name?.split(" ")[0] || "Student"

  // Check for query parameter from search bar or conversation ID
  useEffect(() => {
    const queryParam = searchParams.get('query')
    const conversationParam = searchParams.get('conversation')

    if (messages.length === 0) {
      // Load conversation from storage if conversation ID is provided
      if (conversationParam) {
        const conversation = getConversation(conversationParam)
        if (conversation) {
          setConversationId(conversation.id)
          setMessages(conversation.messages)
          return
        }
      }

      // Handle new query from search bar
      if (queryParam) {
        const sendInitialQuery = async () => {
          clearError()

          const userMsgId = Date.now().toString()
          setMessages([
            {
              id: userMsgId,
              role: "user" as const,
              content: queryParam,
            },
          ])

          // Don't send conversationId on first message - let backend create it
          const result = await sendQuery(queryParam)
          if (result) {
            // Use the conversationId from backend response
            const backendConvId = result.conversationId
            setConversationId(backendConvId)

            const finalMessages = [
              {
                id: userMsgId,
                role: "user" as const,
                content: queryParam,
              },
              {
                id: (Date.now() + 1).toString(),
                role: "assistant" as const,
                content: result.response,
              },
            ]
            setMessages(finalMessages)

            // Save conversation to localStorage using backend's conversationId
            const conversation: ChatConversation = {
              id: backendConvId,
              title: generateConversationTitle(queryParam),
              messages: finalMessages as ChatMessage[],
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }

            saveConversation(conversation)
          }
        }
        sendInitialQuery()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || (window as any).SpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setMessage(transcript)
        setIsListening(false)
      }

      recognition.onerror = () => {
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
      }

      recognitionRef.current = recognition
    }
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSend = async (messageToSend?: string) => {
    const messageText = messageToSend || message.trim()
    if (!messageText || isLoading) return

    const userMessage = messageText.trim()
    setMessage("")
    clearError()

    // Add user message to chat
    const userMsgId = Date.now().toString()
    const newMessages = [
      ...messages,
      {
        id: userMsgId,
        role: "user" as const,
        content: userMessage,
        fileUrl: uploadedFileUrl || undefined,
      },
    ]
    setMessages(newMessages)

    // Clear uploaded file after sending
    setUploadedFileUrl(null)
    setUploadedFileName(null)

    // Send to API - only include conversationId if we already have one from backend
    const result = await sendQuery(userMessage, conversationId || undefined, uploadedFileUrl || undefined)

    if (result) {
      // Use the conversationId from backend (either existing or newly created)
      const backendConvId = result.conversationId
      if (!conversationId) {
        setConversationId(backendConvId)
      }

      const finalMessages = [
        ...newMessages,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant" as const,
          content: result.response,
        },
      ]
      setMessages(finalMessages)

      // Get existing conversation to preserve title and createdAt
      const existingConv = getConversation(backendConvId)
      const title = existingConv?.title || (messages.length === 0 ? generateConversationTitle(userMessage) : existingConv?.title || 'Chat')

      // Save conversation to localStorage
      const conversation: ChatConversation = {
        id: backendConvId,
        title,
        messages: finalMessages as ChatMessage[],
        createdAt: existingConv?.createdAt || Date.now(),
        updatedAt: Date.now(),
      }

      saveConversation(conversation)
    }
  }

  const handleMicClick = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const handleUpload = async () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const fileUrl = await uploadFile(file)
    setIsUploading(false)

    if (fileUrl) {
      setUploadedFileUrl(fileUrl)
      setUploadedFileName(file.name)
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleTakePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })

      // Create video element
      const video = document.createElement("video")
      video.srcObject = stream
      video.play()

      // Wait for video to be ready
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve
      })

      // Create canvas and capture frame
      const canvas = document.createElement("canvas")
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext("2d")
      ctx?.drawImage(video, 0, 0)

      // Stop the stream
      stream.getTracks().forEach((track) => track.stop())

      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], "photo.jpg", { type: "image/jpeg" })
          setIsUploading(true)
          const fileUrl = await uploadFile(file)
          setIsUploading(false)

          if (fileUrl) {
            setUploadedFileUrl(fileUrl)
            setUploadedFileName("Captured Photo")
          }
        }
      }, "image/jpeg")
    } catch {
      alert("Camera access denied or not available")
    }
  }

  const removeUploadedFile = () => {
    setUploadedFileUrl(null)
    setUploadedFileName(null)
  }

  const startNewConversation = () => {
    setConversationId(null)
    setMessages([])
    setUploadedFileUrl(null)
    setUploadedFileName(null)
    clearError()
    router.push('/ask-savra')
    // Clear query param if present
    if (searchParams.get('query')) {
      router.replace('/ask-savra')
    }
  }

  // Show chat interface if we have messages
  const hasMessages = messages.length > 0
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? "Morning" : currentHour < 18 ? "Afternoon" : "Evening"

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-4 lg:px-6 py-3">
            <div className="flex items-center gap-3 lg:hidden">
              <Link
                href="/student-home"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="w-24 h-6 relative">
                <Image
                  src="/images/savra-logo-45456f.png"
                  alt="SAVRA"
                  fill
                  className="object-contain"
                />
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-4">
              <Link
                href="/student-home"
                className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <button
                onClick={startNewConversation}
                className="flex items-center gap-2 px-4 py-2 text-white bg-gradient-to-r from-[#9B61FF] to-[#7C3AED] hover:from-[#8B51EF] hover:to-[#6C2AED] rounded-lg transition-all shadow-sm hover:shadow-md font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>New chat</span>
              </button>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {!hasMessages ? (
            <div className="flex flex-col items-center justify-center h-full px-4 py-12">
              {/* Student-Focused Empty State */}
              <div className="text-center max-w-2xl w-full mx-auto">
                {/* Sparkle Icon */}
                <div className="text-6xl mb-8">✨</div>

                {/* Savra AI Branding - Prominent */}
                <div className="mb-8 flex flex-col items-center">
                  <div className="w-40 h-14 relative mb-3">
                    <Image
                      src="/images/savra-logo-45456f.png"
                      alt="Savra AI"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <p className="text-sm text-gray-500 font-medium">Your Learning Tutor</p>
                </div>

                {/* Greeting */}
                <div className="mb-8">
                  <h1 className="text-5xl font-semibold text-gray-900 mb-4">
                    {greeting}, {firstName}
                  </h1>
                  <p className="text-xl text-gray-600 mb-8">What do you want to learn today?</p>
                </div>

                {/* Quick Action Buttons - Student Focused */}
                <div className="space-y-3 max-w-lg mx-auto">
                  <button
                    onClick={() => handleSend("Explain a concept to me")}
                    className="w-full px-6 py-4 text-left bg-white border-2 border-gray-200 hover:border-[#9B61FF] hover:bg-[#9B61FF]/5 rounded-xl transition-all text-gray-800 font-medium"
                  >
                    Explain a concept to me
                  </button>
                  <button
                    onClick={() => handleSend("Help me with my homework")}
                    className="w-full px-6 py-4 text-left bg-white border-2 border-gray-200 hover:border-[#9B61FF] hover:bg-[#9B61FF]/5 rounded-xl transition-all text-gray-800 font-medium"
                  >
                    Help me with my homework
                  </button>
                  <button
                    onClick={() => handleSend("Give me practice questions")}
                    className="w-full px-6 py-4 text-left bg-white border-2 border-gray-200 hover:border-[#9B61FF] hover:bg-[#9B61FF]/5 rounded-xl transition-all text-gray-800 font-medium"
                  >
                    Give me practice questions
                  </button>
                  <button
                    onClick={() => handleSend("Break down a complex topic step by step")}
                    className="w-full px-6 py-4 text-left bg-white border-2 border-gray-200 hover:border-[#9B61FF] hover:bg-[#9B61FF]/5 rounded-xl transition-all text-gray-800 font-medium"
                  >
                    Break down a complex topic
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-4 lg:px-8 py-8">
              <div className="space-y-8">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-4 ${
                      msg.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                          msg.role === "user"
                            ? "bg-[#DF6647]"
                            : "bg-gradient-to-br from-[#9B61FF] to-[#7C3AED]"
                        }`}
                      >
                        {msg.role === "user" ? (
                          <User className="w-5 h-5 text-white" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Message Content */}
                    <div className={`flex-1 ${msg.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block max-w-[85%] text-left ${
                          msg.role === "user"
                            ? "bg-gradient-to-br from-[#DF6647]/10 to-[#DF6647]/5 text-gray-900 rounded-2xl px-5 py-3.5 border border-[#DF6647]/20"
                            : "text-gray-800"
                        }`}
                      >
                        {msg.fileUrl && (
                          <div className="mb-2 text-xs text-gray-500 flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            Attached file
                          </div>
                        )}
                        {msg.role === "user" ? (
                          <div className="whitespace-pre-wrap leading-relaxed">
                            {msg.content}
                          </div>
                        ) : (
                          <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:my-3 prose-ul:my-2 prose-ol:my-2 prose-li:my-0.5 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-pre:bg-gray-900 prose-pre:text-gray-100">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#9B61FF] to-[#7C3AED] flex items-center justify-center shadow-sm">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-gray-500">
                        <div className="w-2 h-2 bg-[#9B61FF] rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-[#9B61FF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 bg-[#9B61FF] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 text-sm text-center border-t border-red-100">
            {error}
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-4">
            <div className="relative">
              <div
                className="relative flex items-center rounded-2xl border-2 transition-all"
                style={{
                  background: "linear-gradient(90deg, #CFF4F6 0%, #EDD8FF 50%, #FFF4E6 100%)",
                  borderColor: message.trim() ? '#9B61FF' : '#E5E7EB'
                }}
              >
                <div className="absolute inset-[2px] bg-white rounded-2xl" />
                <div className="relative flex items-center w-full z-10 px-4 py-4">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="flex-shrink-0 mr-2"
                    title="Upload file"
                  >
                    {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </Button>

                  <input
                    type="text"
                    placeholder="How can I help you today?"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400 text-base px-3"
                    disabled={isLoading}
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleMicClick}
                      className={`p-2 rounded-lg transition-colors ${
                        isListening
                          ? 'text-red-500 bg-red-50'
                          : 'text-gray-500 hover:bg-gray-100'
                      }`}
                      title="Voice input"
                    >
                      <Mic className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleSend()}
                      disabled={!message.trim() || isLoading}
                      className="p-2 bg-[#DF6647] text-white rounded-lg hover:bg-[#DF6647]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title="Send message"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

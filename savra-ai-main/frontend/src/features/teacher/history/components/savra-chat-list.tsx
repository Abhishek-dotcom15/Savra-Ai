"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Trash2, Loader2 } from "lucide-react"
import { useConversations } from "@/hooks/use-ai"

interface ConversationListItem {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  _count: {
    messages: number
  }
}

export function SavraChatList() {
  const router = useRouter()
  const { getConversations, deleteConversation: deleteConversationAPI, isLoading, error } = useConversations()
  const [conversations, setConversations] = useState<ConversationListItem[]>([])

  useEffect(() => {
    const loadConversations = async () => {
      const result = await getConversations(1, 50)
      if (result) {
        setConversations(result.conversations)
      }
    }

    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this conversation?')) {
      const success = await deleteConversationAPI(conversationId)
      if (success) {
        // Reload conversations after deletion
        const result = await getConversations(1, 50)
        if (result) {
          setConversations(result.conversations)
        }
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()

    if (isToday) {
      return date.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      })
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined
    })
  }

  if (isLoading) {
    return (
      <div className="px-4 lg:px-6 py-16 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#9B61FF]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6 py-16 text-center text-red-500">
        Failed to load conversations. Please try again.
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="px-4 lg:px-6 py-16 text-center text-gray-500">
        No Savra AI conversations yet. Start chatting to see your history here.
      </div>
    )
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => (
        <div
          key={conversation.id}
          className="px-4 lg:px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group"
          onClick={() => router.push(`/ask-savra-page?conversation=${conversation.id}`)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <MessageSquare className="w-4 h-4 text-[#9B61FF] flex-shrink-0" />
                <h3 className="font-medium text-gray-900 truncate">{conversation.title}</h3>
              </div>
              <p className="text-sm text-gray-500 line-clamp-1">
                {conversation._count.messages} message{conversation._count.messages !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-gray-400 mt-1">{formatDate(conversation.updatedAt)}</p>
            </div>
            <button
              onClick={(e) => handleDelete(conversation.id, e)}
              className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { cn } from "@/lib/utils"

interface CompactTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
  className?: string
  readOnly?: boolean
}

export function CompactTextEditor({
  content,
  onChange,
  placeholder = "Enter text...",
  className,
  readOnly = false,
}: CompactTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: content || "",
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "focus:outline-none px-2 py-1 text-xs min-h-[60px]",
          "[&_p]:my-0.5 [&_ul]:my-0.5 [&_ol]:my-0.5 [&_li]:my-0",
          "[&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:ml-3",
          "[&_ol]:list-decimal [&_ol]:ml-3",
          className
        ),
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className={cn("w-full border border-gray-200 rounded focus-within:ring-1 focus-within:ring-[#9B61FF] focus-within:border-[#9B61FF]", className)}>
      <EditorContent editor={editor} />
    </div>
  )
}

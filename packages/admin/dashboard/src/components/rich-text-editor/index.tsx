import { useEditor, EditorContent } from "@tiptap/react"
import { useState } from "react"
import StarterKit from "@tiptap/starter-kit"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TextStyle from "@tiptap/extension-text-style"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import Underline from "@tiptap/extension-underline"
import "./styles.css"
import { MenuBar } from "./menu-bar"
import { FontSize } from "./font-size"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

const LinkWithId = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("id"),
        renderHTML: (attributes: { id?: string | null }) =>
          attributes.id ? { id: attributes.id } : {},
      },
    }
  },
})

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const [isPreview, setIsPreview] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      Bold,
      Italic,
      Underline,
      TextStyle,
      FontSize,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      LinkWithId.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: { rel: "noopener noreferrer nofollow" },
      }),
      BulletList,
      OrderedList,
      Table.configure({
        resizable: true,
        lastColumnResizable: true,
        allowTableNodeSelection: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "prose max-w-none text-[13px]",
      },
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="bg-ui-bg-field hover:bg-ui-bg-field-hover shadow-borders-base placeholder-ui-fg-muted text-ui-fg-base rounded-md border">
      <MenuBar
        editor={editor}
        isPreview={isPreview}
        onTogglePreview={() => setIsPreview((p) => !p)}
      />
      {isPreview ? (
        <div
          className="product-description-content prose prose-sm p-3 min-h-[200px]"
          dangerouslySetInnerHTML={{ __html: editor.getHTML() }}
        />
      ) : (
        <EditorContent editor={editor} />
      )}
    </div>
  )
}

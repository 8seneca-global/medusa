import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Bold from "@tiptap/extension-bold"
import Italic from "@tiptap/extension-italic"
import BulletList from "@tiptap/extension-bullet-list"
import OrderedList from "@tiptap/extension-ordered-list"
import Table from "@tiptap/extension-table"
import TableRow from "@tiptap/extension-table-row"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import "./styles.css"
import { MenuBar } from "./menu-bar"

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
}

export const RichTextEditor = ({ value, onChange }: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        orderedList: false,
      }),
      Bold,
      Italic,
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
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}

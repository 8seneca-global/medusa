import { Button, Tooltip } from "@medusajs/ui"
import "./styles.css"
import { Editor } from "@tiptap/react"

type Props = {
  editor: Editor
}

export const MenuBar = ({ editor }: Props) => {
  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run()
  }

  const isTableActive = editor.isActive("table")

  return (
    <div className="mb-1 flex flex-wrap items-center gap-2 border-b p-2">
      <Tooltip content="Bold">
        <Button
          variant="secondary"
          size="small"
          className={`p-1 ${editor.isActive("bold") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <p>Bold</p>
        </Button>
      </Tooltip>
      <Tooltip content="Italic">
        <Button
          variant="secondary"
          size="small"
          className={`p-1 ${editor.isActive("italic") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <p>Italic</p>
        </Button>
      </Tooltip>
      <div className="h-5 w-[1.5px] bg-gray-200" />
      {/* <Tooltip content="Heading 2">
    <Button
      variant="secondary"
      size="small"
      className={`p-1 ${
        editor.isActive("heading", { level: 2 }) ? "" : "opacity-50"
      }`}
      onClick={() =>
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      }
    >
      <PencilSquare />
    </Button>
  </Tooltip>
  <Tooltip content="Heading 3">
    <Button
      variant="secondary"
      size="small"
      className={`p-1 ${
        editor.isActive("heading", { level: 3 }) ? "" : "opacity-50"
      }`}
      onClick={() =>
        editor.chain().focus().toggleHeading({ level: 3 }).run()
      }
    >
      <PencilSquare />
    </Button>
  </Tooltip> */}
      {/* <div className="h-5 w-[1.5px] bg-gray-200" /> */}
      <Tooltip content="Bullet List">
        <Button
          variant="secondary"
          size="small"
          className={`p-1 ${editor.isActive("bulletList") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <p>Bullet List</p>
        </Button>
      </Tooltip>
      <Tooltip content="Ordered List">
        <Button
          variant="secondary"
          size="small"
          className={`p-1 ${
            editor.isActive("orderedList") ? "" : "opacity-50"
          }`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <p>Ordered List</p>
        </Button>
      </Tooltip>
      <div className="h-5 w-[1.5px] bg-gray-200" />

      {!isTableActive ? (
        <Tooltip content="Insert Table">
          <Button
            variant="secondary"
            size="small"
            className="p-1"
            onClick={insertTable}
          >
            <p>Insert Table</p>
          </Button>
        </Tooltip>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <Tooltip content="Add Column Before">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                <p>Col Before</p>
              </Button>
            </Tooltip>
            <Tooltip content="Add Column After">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <p>Col After</p>
              </Button>
            </Tooltip>
            <Tooltip content="Delete Column">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <p>Del Col</p>
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <Tooltip content="Add Row Before">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                <p>Row Before</p>
              </Button>
            </Tooltip>
            <Tooltip content="Add Row After">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <p>Row After</p>
              </Button>
            </Tooltip>
            <Tooltip content="Delete Row">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <p>Del Row</p>
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <Tooltip content="Merge Cells">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!editor.can().mergeCells()}
              >
                <p>Merge Cells</p>
              </Button>
            </Tooltip>
            <Tooltip content="Split Cell">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!editor.can().splitCell()}
              >
                <p>Split Cell</p>
              </Button>
            </Tooltip>
            <Tooltip content="Toggle Header Cell">
              <Button
                variant="secondary"
                size="small"
                className="p-1"
                onClick={() => editor.chain().focus().toggleHeaderCell().run()}
              >
                <p>Toggle Header</p>
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <Tooltip content="Delete Table">
            <Button
              variant="secondary"
              size="small"
              className="p-1"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <p>Delete Table</p>
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

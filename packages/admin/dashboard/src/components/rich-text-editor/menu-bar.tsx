import { Button, Tooltip } from "@8medusa/ui"
import "./styles.css"
import { Editor } from "@tiptap/react"
import {
  ArrowLongDown,
  ArrowLongLeft,
  ArrowLongRight,
  ArrowLongUp,
  CaretMaximizeDiagonal,
  CaretMinimizeDiagonal,
  CircleHalfSolid,
  ListBullet,
  SquaresPlus,
  Trash,
} from "@8medusa/icons"

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
          type="button"
          className={`p-1 ${editor.isActive("bold") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <p className="text-xs font-bold">B</p>
        </Button>
      </Tooltip>
      <Tooltip content="Italic">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={`p-1 ${editor.isActive("italic") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <p className="font-serif text-xs italic">I</p>
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
          type="button"
          className={`p-1 ${editor.isActive("bulletList") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListBullet />
        </Button>
      </Tooltip>
      <Tooltip content="Ordered List">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={`p-1 ${
            editor.isActive("orderedList") ? "" : "opacity-50"
          }`}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <p className="text-xs">1 2 3</p>
        </Button>
      </Tooltip>
      <div className="h-5 w-[1.5px] bg-gray-200" />

      {!isTableActive ? (
        <Tooltip content="Insert Table">
          <Button
            variant="secondary"
            size="small"
            type="button"
            className="p-1"
            onClick={insertTable}
          >
            <SquaresPlus />
          </Button>
        </Tooltip>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="text-ui-fg-muted text-sm">Cols:</div>
            <Tooltip content="Add Column Before">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
              >
                <ArrowLongLeft />
              </Button>
            </Tooltip>
            <Tooltip content="Add Column After">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
              >
                <ArrowLongRight />
              </Button>
            </Tooltip>
            <Tooltip content="Delete Column">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <Trash />
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <div className="text-ui-fg-muted text-sm">Rows:</div>
            <Tooltip content="Add Row Before">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().addRowBefore().run()}
              >
                <ArrowLongUp />
              </Button>
            </Tooltip>
            <Tooltip content="Add Row After">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().addRowAfter().run()}
              >
                <ArrowLongDown />
              </Button>
            </Tooltip>
            <Tooltip content="Delete Row">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <Trash />
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <div className="flex items-center gap-2">
            <Tooltip content="Merge Cells">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!editor.can().mergeCells()}
              >
                <CaretMinimizeDiagonal />
              </Button>
            </Tooltip>
            <Tooltip content="Split Cell">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!editor.can().splitCell()}
              >
                <CaretMaximizeDiagonal />
              </Button>
            </Tooltip>
            <Tooltip content="Toggle Header Cell">
              <Button
                variant="secondary"
                size="small"
                type="button"
                className="p-1"
                onClick={() => editor.chain().focus().toggleHeaderCell().run()}
              >
                <CircleHalfSolid />
              </Button>
            </Tooltip>
          </div>
          <div className="h-5 w-[1.5px] bg-gray-200" />
          <Tooltip content="Delete Table">
            <Button
              variant="secondary"
              size="small"
              type="button"
              className="p-1"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash />
            </Button>
          </Tooltip>
        </div>
      )}
    </div>
  )
}

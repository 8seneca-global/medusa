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
  Eye,
  EyeSlash,
  Link as LinkIcon,
  ListBullet,
  Minus,
  SquaresPlus,
  Trash,
} from "@8medusa/icons"
import { FONT_SIZE_PT_OPTIONS } from "./font-size"

type Props = {
  editor: Editor
  isPreview?: boolean
  onTogglePreview?: () => void
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 64) || "anchor"

const buildUniqueAnchorId = (editor: Editor, base: string) => {
  const html = editor.getHTML()
  if (!html.includes(`id="${base}"`)) return base
  let i = 2
  while (html.includes(`id="${base}-${i}"`)) i++
  return `${base}-${i}`
}

const promptForLink = (editor: Editor) => {
  const prev = (editor.getAttributes("link").href as string | undefined) ?? ""
  const url = window.prompt("Enter URL or #anchor", prev)
  if (url === null) return
  if (url === "") {
    editor.chain().focus().unsetLink().run()
    return
  }
  const target = url.startsWith("#") ? undefined : "_blank"
  editor.chain().focus().extendMarkRange("link").setLink({ href: url, target }).run()
}

const insertAnchor = (editor: Editor) => {
  const { from, to } = editor.state.selection
  if (from === to) {
    window.alert("Select text to use as the anchor target.")
    return
  }
  const selectedText = editor.state.doc.textBetween(from, to, " ")
  const baseId = slugify(selectedText)
  const id = buildUniqueAnchorId(editor, baseId)
  editor
    .chain()
    .focus()
    .setLink({ href: `#${id}` })
    .extendMarkRange("link")
    .updateAttributes("link", { href: `#${id}`, id, target: null })
    .run()
}

export const MenuBar = ({ editor, isPreview = false, onTogglePreview }: Props) => {
  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
  }

  const isTableActive = editor.isActive("table")

  if (isPreview) {
    return (
      <div className="flex gap-2 p-2 border-b items-center justify-end">
        <Tooltip content="Exit preview">
          <Button variant="secondary" size="small" type="button" onClick={onTogglePreview}>
            <EyeSlash />
          </Button>
        </Tooltip>
      </div>
    )
  }

  return (
    <div className="mb-1 flex flex-wrap items-center gap-2 border-b p-2">
      <Tooltip content="Paragraph (11pt)">
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={() => editor.chain().focus().setParagraph().unsetFontSize().run()}
          className={editor.isActive("paragraph") ? "" : "opacity-50"}
        >
          <p className="text-xs">P</p>
        </Button>
      </Tooltip>
      <Tooltip content="Heading 1 (22.5pt)">
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "" : "opacity-50"}
        >
          <p className="text-xs font-bold">H1</p>
        </Button>
      </Tooltip>
      <Tooltip content="Heading 2 (17.55pt)">
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "" : "opacity-50"}
        >
          <p className="text-xs font-bold">H2</p>
        </Button>
      </Tooltip>
      <Tooltip content="Heading 3 (12.45pt)">
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor.isActive("heading", { level: 3 }) ? "" : "opacity-50"}
        >
          <p className="text-xs font-bold">H3</p>
        </Button>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      <Tooltip content="Font size">
        <select
          className="text-xs border rounded px-1 py-0.5 bg-ui-bg-field"
          value={(editor.getAttributes("textStyle").fontSize as string | undefined) ?? ""}
          onChange={(e) => {
            const v = e.target.value
            if (!v) editor.chain().focus().unsetFontSize().run()
            else editor.chain().focus().setFontSize(v).run()
          }}
        >
          <option value="">Default</option>
          {FONT_SIZE_PT_OPTIONS.map((pt) => (
            <option key={pt} value={`${pt}pt`}>
              {pt}pt
            </option>
          ))}
        </select>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      <Tooltip content="Bold">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={`px-2 py-1 ${editor.isActive("bold") ? "" : "opacity-50"}`}
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
          className={`px-2 py-1 ${editor.isActive("italic") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <p className="font-serif text-xs italic">I</p>
        </Button>
      </Tooltip>
      <Tooltip content="Underline">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={`px-2 py-1 ${editor.isActive("underline") ? "" : "opacity-50"}`}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <p className="text-xs underline">U</p>
        </Button>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      <Tooltip content="Align left">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive({ textAlign: "left" }) ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <p className="text-xs">⯇</p>
        </Button>
      </Tooltip>
      <Tooltip content="Align center">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive({ textAlign: "center" }) ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <p className="text-xs">≡</p>
        </Button>
      </Tooltip>
      <Tooltip content="Align right">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive({ textAlign: "right" }) ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <p className="text-xs">⯈</p>
        </Button>
      </Tooltip>
      <Tooltip content="Justify">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive({ textAlign: "justify" }) ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        >
          <p className="text-xs">☰</p>
        </Button>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      <Tooltip content="Bullet List">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive("bulletList") ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <ListBullet accentHeight={20} />
        </Button>
      </Tooltip>
      <Tooltip content="Ordered List">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive("orderedList") ? "" : "opacity-50"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <p className="text-xs">1 2 3</p>
        </Button>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      <Tooltip content="Horizontal rule">
        <Button
          variant="secondary"
          size="small"
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus />
        </Button>
      </Tooltip>
      <Tooltip content="Insert / edit link (URL or #anchor)">
        <Button
          variant="secondary"
          size="small"
          type="button"
          className={editor.isActive("link") ? "" : "opacity-50"}
          onClick={() => promptForLink(editor)}
        >
          <LinkIcon />
        </Button>
      </Tooltip>
      <Tooltip content="Make selection an anchor target">
        <Button variant="secondary" size="small" type="button" onClick={() => insertAnchor(editor)}>
          <p className="text-xs">#</p>
        </Button>
      </Tooltip>

      <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />

      {!isTableActive ? (
        <Tooltip content="Insert Table">
          <Button variant="secondary" size="small" type="button" onClick={insertTable}>
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
                onClick={() => editor.chain().focus().deleteColumn().run()}
              >
                <Trash />
              </Button>
            </Tooltip>
          </div>
          <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />
          <div className="flex items-center gap-2">
            <div className="text-ui-fg-muted text-sm">Rows:</div>
            <Tooltip content="Add Row Before">
              <Button
                variant="secondary"
                size="small"
                type="button"
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
                onClick={() => editor.chain().focus().deleteRow().run()}
              >
                <Trash />
              </Button>
            </Tooltip>
          </div>
          <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />
          <div className="flex items-center gap-2">
            <Tooltip content="Merge Cells">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => editor.chain().focus().mergeCells().run()}
                disabled={!editor.can().mergeCells()}
              >
                <CaretMaximizeDiagonal />
              </Button>
            </Tooltip>
            <Tooltip content="Split Cell">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => editor.chain().focus().splitCell().run()}
                disabled={!editor.can().splitCell()}
              >
                <CaretMinimizeDiagonal />
              </Button>
            </Tooltip>
            <Tooltip content="Toggle Header Cell">
              <Button
                variant="secondary"
                size="small"
                type="button"
                onClick={() => editor.chain().focus().toggleHeaderCell().run()}
              >
                <CircleHalfSolid />
              </Button>
            </Tooltip>
          </div>
          <div className="border-r-1 bg-ui-tag-neutral-bg-hover h-5 w-[1px]" />
          <Tooltip content="Delete Table">
            <Button
              variant="secondary"
              size="small"
              type="button"
              onClick={() => editor.chain().focus().deleteTable().run()}
            >
              <Trash />
            </Button>
          </Tooltip>
        </div>
      )}

      <div className="ml-auto" />
      <Tooltip content="Preview">
        <Button variant="secondary" size="small" type="button" onClick={onTogglePreview}>
          <Eye />
        </Button>
      </Tooltip>
    </div>
  )
}

import { ChatBubble } from "@8medusa/icons"
import { Tooltip } from "@8medusa/ui"
import { HttpTypes } from "@8medusa/types"
import { useTranslation } from "react-i18next"

export const OrderNoteCell = ({ order }: { order: HttpTypes.AdminOrder }) => {
  const note = (order.metadata?.order_note as string | undefined) ?? ""
  if (!note) {
    return <span className="text-ui-fg-muted"> </span>
  }
  return (
    <div className="flex h-full w-full items-center">
      <Tooltip content={note}>
        <ChatBubble className="text-ui-fg-muted" />
      </Tooltip>
    </div>
  )
}

export const OrderNoteHeader = () => {
  const { t } = useTranslation()
  return (
    <div className="flex h-full w-full items-center">
      <span className="truncate">{t("fields.note")}</span>
    </div>
  )
}

import { model } from "@8medusa/framework/utils"
import Refund from "./refund"

const RefundReason = model.define("RefundReason", {
  id: model.id({ prefix: "refr" }).primaryKey(),
  label: model.text().searchable(),
  description: model.text().nullable(),
  metadata: model.json().nullable(),
  refunds: model.hasMany(() => Refund, {
    mappedBy: "refund_reason",
  }),
})

export default RefundReason

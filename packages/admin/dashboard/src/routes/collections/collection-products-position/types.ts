import { HttpTypes } from "@medusajs/types"

export type ProductTreeItem = HttpTypes.AdminProduct & {
  id: string
  title: string
  collection_position: number
}

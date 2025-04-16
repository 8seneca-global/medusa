import { Spinner } from "@medusajs/icons"
import { ProductTree } from "../../../product-tree"
import { ProductTreeItem } from "../../../types"
import { RouteFocusModal } from "../../../../../../components/modals"

interface ProductTreeContainerProps {
  snapshot: ProductTreeItem[]
  handlePositionChange: (
    value: {
      id: string
      index: number
    },
    arr: ProductTreeItem[]
  ) => Promise<void>
  loading: boolean
}

export const ProductTreeContainer = ({
  snapshot,
  handlePositionChange,
  loading,
}: ProductTreeContainerProps) => {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RouteFocusModal.Header>
        <div className="flex items-center justify-end">
          {loading && <Spinner className="animate-spin" />}
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="bg-ui-bg-subtle flex flex-1 flex-col overflow-y-auto">
        <ProductTree
          renderValue={(item) => item.title}
          value={snapshot}
          onChange={handlePositionChange}
        />
      </RouteFocusModal.Body>
    </div>
  )
}

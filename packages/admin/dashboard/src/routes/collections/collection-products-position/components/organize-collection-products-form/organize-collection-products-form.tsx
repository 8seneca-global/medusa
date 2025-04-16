import { useParams } from "react-router-dom"
import { ProductTreeContainer } from "./components/product-tree-container"
import { useProductPosition } from "./hooks/use-product-position"

export const OrganizeCollectionProductsForm = () => {
  const { id } = useParams()
  const {
    snapshot,
    isPending,
    isError,
    fetchError,
    isMutating,
    handlePositionChange,
  } = useProductPosition(id!)

  const loading = isPending || isMutating

  if (isError) {
    throw fetchError
  }

  return (
    <ProductTreeContainer
      snapshot={snapshot}
      handlePositionChange={handlePositionChange}
      loading={loading}
    />
  )
}

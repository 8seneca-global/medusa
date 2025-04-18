import { Heading } from "@medusajs/ui"
import { useParams } from "react-router-dom"
import { RouteDrawer } from "../../../components/modals"
import { useCollectionAddition } from "../../../hooks/api/collections"
import { EditCollectionAdditionInfoForm } from "./components/edit-collection-addition-info-form"

export const CollectionEditAdditionInfo = () => {
  const { id } = useParams()
  const { collection, isLoading, isError, error } = useCollectionAddition(id!)

  if (isError) {
    throw error
  }

  console.log(collection)

  return (
    <RouteDrawer>
      <RouteDrawer.Header>
        <Heading>Edit Additional Information</Heading>
      </RouteDrawer.Header>
      {!isLoading && collection && (
        <EditCollectionAdditionInfoForm
          id={id!}
          collection_addition={(collection as any)?.collection_addition}
        />
      )}
    </RouteDrawer>
  )
}

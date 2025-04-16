import { batchLinkProductsToCollectionWorkflow } from "@medusajs/core-flows"
import { HttpTypes } from "@medusajs/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { refetchCollection } from "../../helpers"
import { IProductModuleService } from "@medusajs/types"
import { Modules } from "@medusajs/framework/utils"

// Define the new request type to handle both formats
type CollectionProductLinkRequest = {
  add?: (string | { id: string; collection_position: number })[]
  remove?: string[]
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CollectionProductLinkRequest>,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const id = req.params.id
  const { add = [], remove = [] } = req.validatedBody

  // Get the product service
  const productService: IProductModuleService = req.scope.resolve(
    Modules.PRODUCT
  )

  // Transform the add array to match the workflow input format
  const getProductId = (
    item: string | { id: string; collection_position: number }
  ): string => {
    return typeof item === "string" ? item : item.id
  }
  const addIds = add.map(getProductId)

  // First run the workflow to add/remove products
  const workflow = batchLinkProductsToCollectionWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add: addIds,
      remove,
    },
  })

  // Handle the add operations
  if (add.length > 0) {
    // Get current products in collection to check existing ones
    const [existingProducts] = await productService.listAndCountProducts(
      { collection_id: id },
      { order: { collection_position: "DESC" } }
    )
    console.log(123123, existingProducts)

    // Process each product in the add array
    await Promise.all(
      add.map(async (item) => {
        if (typeof item === "string") {
          // For string format (product IDs only)
          const existingProduct = existingProducts.find((p) => p.id === item)
          if (!existingProduct) {
            // If new to collection, set position to 0
            await productService.updateProducts({ id: item }, {
              collection_position: 0,
            } as any)
          }
          // If product exists, keep its current position
        } else {
          // For object format with specified position
          await productService.updateProducts({ id: item.id }, {
            collection_position: item.collection_position,
          } as any)
        }
      })
    )
  }

  // Handle remove operations
  if (remove.length > 0) {
    // Set collection_position to 0 for removed products
    await Promise.all(
      remove.map(async (productId) => {
        await productService.updateProducts({ id: productId }, {
          collection_position: 0,
        } as any)
      })
    )
  }

  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    collection,
  })
}

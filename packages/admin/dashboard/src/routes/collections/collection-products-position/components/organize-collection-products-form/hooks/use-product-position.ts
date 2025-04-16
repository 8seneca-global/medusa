import { useMutation } from "@tanstack/react-query"
import { UniqueIdentifier } from "@dnd-kit/core"
import { FetchError } from "@medusajs/js-sdk"
import { toast } from "@medusajs/ui"
import { useState, useEffect } from "react"
import { useProducts } from "../../../../../../hooks/api/products"
import { sdk } from "../../../../../../lib/client"
import { queryClient } from "../../../../../../lib/query-client"
import { ProductTreeItem } from "../../../types"

const QUERY = {
  fields: "id,title,collection_id,collection_position,thumbnail",
  collection_id: "null",
  limit: 9999,
  order: "collection_position",
}

export const useProductPosition = (collectionId: string) => {
  const {
    products,
    isPending,
    isError,
    error: fetchError,
  } = useProducts({
    ...QUERY,
    collection_id: [collectionId],
  })

  // Initialize snapshot with products when they load
  const [snapshot, setSnapshot] = useState<ProductTreeItem[]>([])

  // Update snapshot when products change
  useEffect(() => {
    if (products) {
      setSnapshot(products)
    }
  }, [products])

  const { isPending: isMutating } = useMutation({
    mutationFn: async ({
      value,
    }: {
      value: {
        id: string
        collection_position: number
      }
      arr: ProductTreeItem[]
    }) => {
      // Use the collection products endpoint with the correct format
      await sdk.admin.productCollection.updateProducts(collectionId, {
        add: [{ id: value.id, collection_position: value.collection_position }],
        remove: [],
      } as any)
    },
    onMutate: async (update) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["products", QUERY],
      })

      // Snapshot the previous value
      const previousValue = queryClient.getQueryData(["products", QUERY]) as
        | { products: ProductTreeItem[] }
        | undefined

      const nextValue = {
        ...(previousValue || {}),
        products: update.arr,
      }

      // Optimistically update to the new value
      queryClient.setQueryData(["products", QUERY], nextValue)

      return {
        previousValue,
      }
    },
    onError: (error: FetchError, _newValue, context) => {
      // Roll back to the previous value
      queryClient.setQueryData(["products", QUERY], context?.previousValue)

      toast.error(error.message)
    },
    onSettled: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      })
    },
  })

  const handlePositionChange = async (
    value: {
      id: UniqueIdentifier
      index: number
    },
    arr: ProductTreeItem[]
  ) => {
    // Update all products in the array to match their new positions (starting from 1)
    const updatedProducts = arr.map((product, index) => ({
      ...product,
      collection_position: index + 1, // Start from 1 instead of 0
    }))

    // Optimistically update the UI immediately with the snapshot
    setSnapshot(updatedProducts)

    try {
      // Call the API once with all products
      await sdk.admin.productCollection.updateProducts(collectionId, {
        add: updatedProducts.map((product) => ({
          id: product.id,
          collection_position: product.collection_position,
        })),
        remove: [],
      } as any)

      // On success, invalidate all product queries to refresh data
      await queryClient.invalidateQueries({
        queryKey: ["products"],
      })
    } catch (error) {
      // If there's an error, revert the snapshot to the original data
      if (products) {
        setSnapshot(products)
      }
      toast.error("Failed to update product positions")
    }
  }

  return {
    products,
    snapshot,
    isPending,
    isError,
    fetchError,
    isMutating,
    handlePositionChange,
  }
}

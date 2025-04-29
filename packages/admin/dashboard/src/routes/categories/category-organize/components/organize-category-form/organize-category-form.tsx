import { useMutation } from "@tanstack/react-query"
import { useParams } from "react-router-dom"
import { UniqueIdentifier } from "@dnd-kit/core"
import { Spinner } from "@8medusa/icons"
import { FetchError } from "@8medusa/js-sdk"
import { toast } from "@8medusa/ui"
import { useState } from "react"
import { RouteFocusModal } from "../../../../../components/modals"
import { useGetProductCategoriesAdditionById } from "../../../../../hooks/api/categories"
import { sdk } from "../../../../../lib/client"
import { queryClient } from "../../../../../lib/query-client"
import { CategoryTree } from "../../../common/components/category-tree"
import { CategoryTreeItem } from "../../../common/types"

// const QUERY = {
//   fields:
//     "id,name,parent_category_id,rank,*category_children,*category_addition",
//   parent_category_id: "null",
//   include_descendants_tree: true,
//   limit: 9999,
// }

export const OrganizeCategoryForm = () => {
  const { id } = useParams()
  const {
    product_categories,
    isPending,
    isError,
    error: fetchError,
  } = useGetProductCategoriesAdditionById(id || "")

  const [snapshot, setSnapshot] = useState<CategoryTreeItem[]>([])

  const { mutateAsync, isPending: isMutating } = useMutation({
    mutationFn: async ({
      value,
    }: {
      value: {
        id: string
        parent_category_id: string | null
        rank: number | null
      }
      arr: CategoryTreeItem[]
    }) => {
      await sdk.admin.productCategory.update(value.id, {
        rank: value.rank ?? 0,
        parent_category_id: value.parent_category_id,
      })
    },
    onMutate: async (update) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [`categories-addition-by-id-${id}`],
      })

      // Snapshot the previous value
      const previousValue = queryClient.getQueryData([
        `categories-addition-by-id-${id}`,
      ])

      // Optimistically update to the new value
      queryClient.setQueryData([`categories-addition-by-id-${id}`], {
        ...(previousValue as Record<string, any>),
        product_categories: update.arr,
      })

      return { previousValue }
    },
    onError: (error: FetchError, _newValue, context) => {
      // Roll back to the previous value
      queryClient.setQueryData(
        [`categories-addition-by-id-${id}`],
        context?.previousValue
      )

      toast.error(error.message)
    },
    onSuccess: () => {
      // Refetch the data after successful update
      queryClient.invalidateQueries({
        queryKey: [`categories-addition-by-id-${id}`],
      })
    },
  })

  const handleRankChange = async (
    value: {
      id: UniqueIdentifier
      parentId: UniqueIdentifier | null
      index: number
    },
    arr: CategoryTreeItem[]
  ) => {
    const val = {
      id: value.id as string,
      parent_category_id: value.parentId as string | null,
      rank: value.index,
    }

    setSnapshot(arr)
    await mutateAsync({ value: val, arr })
  }

  const loading = isPending || isMutating

  if (isError) {
    throw fetchError
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <RouteFocusModal.Header>
        <div className="flex items-center justify-end">
          {loading && <Spinner className="animate-spin" />}
        </div>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="bg-ui-bg-subtle flex flex-1 flex-col overflow-y-auto">
        <CategoryTree
          renderValue={(item) => item.name}
          value={loading ? snapshot : product_categories || []}
          onChange={handleRankChange}
        />
      </RouteFocusModal.Body>
    </div>
  )
}

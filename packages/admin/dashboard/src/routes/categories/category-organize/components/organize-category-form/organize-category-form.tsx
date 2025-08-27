import { Spinner } from "@8medusa/icons"
import { Button, Container, FocusModal, toast } from "@8medusa/ui"
import { UniqueIdentifier } from "@dnd-kit/core"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { FetchError } from "../../../../../../../../core/js-sdk/dist/esm/client"
import { RouteFocusModal } from "../../../../../components/modals"
import {
  useGetProductGroupsByType,
  useUpdateProductGroupsRanking,
} from "../../../../../hooks/api/categories"
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

enum ProductGroupTabEnum {
  COLLECTION = "collection",
  CATEGORY = "category",
}

export const OrganizeCategoryForm = () => {
  const { t } = useTranslation()
  const [selectedTab, setSelectedTab] = useState<ProductGroupTabEnum>(
    ProductGroupTabEnum.CATEGORY
  )
  const {
    product_categories,
    isPending,
    isError,
    error: fetchError,
  } = useGetProductGroupsByType(selectedTab)

  const [snapshot, setSnapshot] = useState<CategoryTreeItem[]>([])

  const { mutateAsync, isPending: isMutating } = useUpdateProductGroupsRanking({
    onMutate: async () => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [`categories-groups-by-type-${selectedTab}`],
      })

      // Snapshot the previous value
      const previousValue = queryClient.getQueryData([
        `categories-groups-by-type-${selectedTab}`,
      ])

      // Optimistically update to the new value
      queryClient.setQueryData([`categories-groups-by-type-${selectedTab}`], {
        ...(previousValue as Record<string, any>),
        product_categories: snapshot,
      })

      return { previousValue }
    },
    onError: (error: FetchError, _newValue, context) => {
      queryClient.setQueryData(
        [`categories-groups-by-type-${selectedTab}`],
        (context as { previousValue: CategoryTreeItem[] })?.previousValue
      )
      toast.error(error.message)
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
    setSnapshot(arr)
    await mutateAsync({
      type: selectedTab,
      group_id: value.id as string,
      rank: value.index,
    })
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
        <FocusModal.Title></FocusModal.Title>
      </RouteFocusModal.Header>
      <RouteFocusModal.Body className="bg-ui-bg-subtle flex flex-1 flex-col overflow-y-auto">
        <Container className="flex items-center gap-2 !rounded-none border-b">
          <Button
            variant="secondary"
            size="small"
            className={`${
              selectedTab === ProductGroupTabEnum.COLLECTION
                ? ""
                : "bg-ui-bg-subtle text-ui-fg-subtle"
            }`}
            onClick={() => setSelectedTab(ProductGroupTabEnum.COLLECTION)}
          >
            {t("categories.ranking.collections")}
          </Button>
          <Button
            variant="secondary"
            size="small"
            className={`${
              selectedTab === ProductGroupTabEnum.CATEGORY
                ? ""
                : "bg-ui-bg-subtle text-ui-fg-subtle"
            }`}
            onClick={() => setSelectedTab(ProductGroupTabEnum.CATEGORY)}
          >
            {t("categories.ranking.categories")}
          </Button>
        </Container>
        <CategoryTree
          renderValue={(item) => item.name}
          value={loading ? snapshot : product_categories || []}
          onChange={handleRankChange}
        />
      </RouteFocusModal.Body>
    </div>
  )
}

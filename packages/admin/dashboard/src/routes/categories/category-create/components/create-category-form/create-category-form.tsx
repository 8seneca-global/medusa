import { zodResolver } from "@hookform/resolvers/zod"
import { Button, ProgressStatus, ProgressTabs, toast } from "@8medusa/ui"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { useState } from "react"
import {
  RouteFocusModal,
  useRouteModal,
} from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { useCreateProductCategory } from "../../../../../hooks/api/categories"
import { transformNullableFormData } from "../../../../../lib/form-helpers"
import { CreateCategoryDetails } from "./create-category-details"
import { CreateCategoryNesting } from "./create-category-nesting"
import { CreateCategoryDetailsSchema, CreateCategorySchema } from "./schema"
import { CreateCategoryPayload } from "../../../../../types/category"
import { CollectionConditionForm } from "./collection-condition-form"
import {
  CollectionConditionSchema,
  CollectionConditionSchemaType,
} from "./collection-condition-schema"

type CreateCategoryFormProps = {
  parentCategoryId: string | null
}

enum Tab {
  DETAILS = "details",
  ORGANIZE = "organize",
  COLLECTION_CONDITION = "collection_condition",
}

export const CreateCategoryForm = ({
  parentCategoryId,
}: CreateCategoryFormProps) => {
  const { t } = useTranslation()
  const { handleSuccess } = useRouteModal()

  const [activeTab, setActiveTab] = useState<Tab>(Tab.DETAILS)
  const [validDetails, setValidDetails] = useState(false)
  const [shouldFreeze, setShouldFreeze] = useState(false)

  const form = useForm<CreateCategorySchema>({
    defaultValues: {
      name: "",
      description: "",
      handle: "",
      status: "active",
      visibility: "public",
      type: "category",
      rank: parentCategoryId ? 0 : null,
      parent_category_id: parentCategoryId,
    },
    resolver: zodResolver(CreateCategorySchema),
  })

  const collectionConditionForm = useForm<CollectionConditionSchemaType>({
    defaultValues: {
      conditions: [],
    },
    resolver: zodResolver(CollectionConditionSchema),
  })

  const type = form.watch("type")
  const isCollection = type === "collection"

  const handleTabChange = (tab: Tab) => {
    if (tab === Tab.ORGANIZE || tab === Tab.COLLECTION_CONDITION) {
      const { name, handle, description, status, visibility, type } =
        form.getValues()

      const result = CreateCategoryDetailsSchema.safeParse({
        name,
        handle,
        description,
        status,
        visibility,
        type,
      })

      if (!result.success) {
        result.error.errors.forEach((error) => {
          form.setError(error.path.join(".") as keyof CreateCategorySchema, {
            type: "manual",
            message: error.message,
          })
        })

        return
      }

      form.clearErrors()
      setValidDetails(true)
    }

    setActiveTab(tab)
  }

  const { mutateAsync, isPending } = useCreateProductCategory()

  const handleSubmit = form.handleSubmit((data) => {
    const {
      visibility,
      status,
      parent_category_id,
      rank,
      name,
      type,
      ...rest
    } = data
    const parsedData = transformNullableFormData(rest, false)

    setShouldFreeze(true)

    const collectionConditions = isCollection
      ? collectionConditionForm.getValues().conditions
      : undefined

    mutateAsync(
      {
        name: name,
        ...parsedData,
        parent_category_id: parent_category_id ?? undefined,
        rank: rank ?? undefined,
        is_active: status === "active",
        is_internal: visibility === "internal",
        additional_data: {
          type: type,
          conditions: collectionConditions,
        },
      } as CreateCategoryPayload,
      {
        onSuccess: ({ product_category }) => {
          toast.success(
            t("categories.create.successToast", {
              name: product_category.name,
            })
          )

          handleSuccess(`/categories/${product_category.id}`)
        },
        onError: (error) => {
          toast.error(error.message)
          setShouldFreeze(false)
        },
      }
    )
  })

  const nestingStatus: ProgressStatus =
    form.getFieldState("parent_category_id")?.isDirty ||
    form.getFieldState("rank")?.isDirty ||
    activeTab === Tab.ORGANIZE
      ? "in-progress"
      : "not-started"

  const detailsStatus: ProgressStatus = validDetails
    ? "completed"
    : "in-progress"

  const collectionConditionStatus: ProgressStatus = isCollection
    ? activeTab === Tab.COLLECTION_CONDITION
      ? "in-progress"
      : "not-started"
    : "not-started"

  return (
    <RouteFocusModal.Form form={form}>
      <KeyboundForm
        onSubmit={handleSubmit}
        className="flex size-full flex-col overflow-hidden"
      >
        <ProgressTabs
          value={activeTab}
          onValueChange={(tab) => handleTabChange(tab as Tab)}
          className="flex size-full flex-col"
        >
          <RouteFocusModal.Header>
            <div className="flex w-full items-center justify-between">
              <div className="-my-2 w-full max-w-[400px] border-l">
                <ProgressTabs.List className="grid w-full grid-cols-3">
                  <ProgressTabs.Trigger
                    value={Tab.DETAILS}
                    status={detailsStatus}
                    className="w-full min-w-0 overflow-hidden"
                  >
                    <span className="truncate">
                      {t("categories.create.tabs.details")}
                    </span>
                  </ProgressTabs.Trigger>
                  <ProgressTabs.Trigger
                    value={Tab.ORGANIZE}
                    status={nestingStatus}
                    className="w-full min-w-0 overflow-hidden"
                  >
                    <span className="truncate">
                      {t("categories.create.tabs.organize")}
                    </span>
                  </ProgressTabs.Trigger>
                  {isCollection && (
                    <ProgressTabs.Trigger
                      value={Tab.COLLECTION_CONDITION}
                      status={collectionConditionStatus}
                      className="w-full min-w-0 overflow-hidden"
                    >
                      <span className="truncate">
                        {t("collection_condition.title")}
                      </span>
                    </ProgressTabs.Trigger>
                  )}
                </ProgressTabs.List>
              </div>
            </div>
          </RouteFocusModal.Header>
          <RouteFocusModal.Body className="flex size-full flex-col overflow-auto">
            <ProgressTabs.Content value={Tab.DETAILS}>
              <CreateCategoryDetails form={form} />
            </ProgressTabs.Content>
            <ProgressTabs.Content
              value={Tab.ORGANIZE}
              className="bg-ui-bg-subtle flex-1"
            >
              <CreateCategoryNesting form={form} shouldFreeze={shouldFreeze} />
            </ProgressTabs.Content>
            {isCollection && (
              <ProgressTabs.Content
                value={Tab.COLLECTION_CONDITION}
                className="bg-ui-bg-subtle flex-1"
              >
                <div className="p-16">
                  <CollectionConditionForm form={collectionConditionForm} />
                </div>
              </ProgressTabs.Content>
            )}
          </RouteFocusModal.Body>
          <RouteFocusModal.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <RouteFocusModal.Close asChild>
                <Button size="small" variant="secondary">
                  {t("actions.cancel")}
                </Button>
              </RouteFocusModal.Close>
              {activeTab === Tab.ORGANIZE ? (
                isCollection ? (
                  <Button
                    key="continue-btn"
                    size="small"
                    variant="primary"
                    type="button"
                    onClick={() => handleTabChange(Tab.COLLECTION_CONDITION)}
                  >
                    {t("actions.continue")}
                  </Button>
                ) : (
                  <Button
                    key="submit-btn"
                    size="small"
                    variant="primary"
                    type="submit"
                    isLoading={isPending}
                  >
                    {t("actions.save")}
                  </Button>
                )
              ) : activeTab === Tab.COLLECTION_CONDITION ? (
                <Button
                  key="submit-btn"
                  size="small"
                  variant="primary"
                  type="submit"
                  isLoading={isPending}
                >
                  {t("actions.save")}
                </Button>
              ) : (
                <Button
                  key="continue-btn"
                  size="small"
                  variant="primary"
                  type="button"
                  onClick={() => handleTabChange(Tab.ORGANIZE)}
                >
                  {t("actions.continue")}
                </Button>
              )}
            </div>
          </RouteFocusModal.Footer>
        </ProgressTabs>
      </KeyboundForm>
    </RouteFocusModal.Form>
  )
}

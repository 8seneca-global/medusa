import { Container, Heading, Text } from "@medusajs/ui"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { PencilSquare } from "@medusajs/icons"
import { useTranslation } from "react-i18next"
import { useParams } from "react-router-dom"
type CollectionAdditionalInfoSectionProps = {
  collection_addition?: {
    description?: string
    is_active?: boolean
  }
}

export const CollectionAdditionalInfoSection = ({
  collection_addition,
}: CollectionAdditionalInfoSectionProps) => {
  const { id } = useParams()
  const { t } = useTranslation()

  console.log(collection_addition)
  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Additional Information</Heading>
        <ActionMenu
          groups={[
            {
              actions: [
                {
                  icon: <PencilSquare />,
                  label: t("actions.edit"),
                  to: `/collections/${id}/edit-addition-info`,
                  disabled: !id,
                },
              ],
            },
          ]}
        />
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Description
        </Text>
        <Text size="small">
          {collection_addition?.description ?? "No description"}
        </Text>
      </div>
      <div className="text-ui-fg-subtle grid grid-cols-2 items-center px-6 py-4">
        <Text size="small" leading="compact" weight="plus">
          Active status
        </Text>
        <Text size="small">
          {collection_addition?.is_active ? "Active" : "Inactive"}
        </Text>
      </div>
    </Container>
  )
}

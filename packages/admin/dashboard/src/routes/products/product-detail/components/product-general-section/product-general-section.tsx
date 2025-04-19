import { StatusBadge, usePrompt, Container, Heading } from "@8medusa/ui"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import * as zod from "zod"
import { ActionMenu } from "../../../../../components/common/action-menu"
import { SectionRow } from "../../../../../components/common/section"
import { useDeleteProduct } from "../../../../../hooks/api/products"
import { useExtension } from "../../../../../providers/extension-provider"
import { useExtendableForm } from "../../../../../dashboard-app/forms/hooks"
import { useState } from "react"
import { PencilSquare, Trash } from "@8medusa/icons"
import { EditProductForm } from "../../../product-edit/edit-product-form"
import { AdminExtendedProduct } from "../../../../../types/extended-product.types"

const productStatusColor = (status: string) => {
  switch (status) {
    case "draft":
      return "grey"
    case "proposed":
      return "orange"
    case "published":
      return "green"
    case "rejected":
      return "red"
    default:
      return "grey"
  }
}

const EditProductSchema = zod.object({
  status: zod.enum(["draft", "published", "proposed", "rejected"]),
  title: zod.string().min(1),
  subtitle: zod.string().optional(),
  handle: zod.string().min(1),
  material: zod.string().optional(),
  description: zod.string().optional(),
  long_description: zod.string().optional(),
  discountable: zod.boolean(),
})

type ProductGeneralSectionProps = {
  product: AdminExtendedProduct
}

export const ProductGeneralSection = ({
  product,
}: ProductGeneralSectionProps) => {
  const { t } = useTranslation()
  const prompt = usePrompt()
  const navigate = useNavigate()
  const { getDisplays, getFormConfigs } = useExtension()
  const [isEditing, setIsEditing] = useState(false)

  const displays = getDisplays("product", "general")
  const configs = getFormConfigs("product", "edit")

  const form = useExtendableForm({
    defaultValues: {
      status: product.status,
      title: product.title,
      material: product.material ?? "",
      subtitle: product.subtitle ?? "",
      handle: product.handle ?? "",
      description: product.description ?? "",
      long_description: product.product_addition?.long_description ?? "",
      discountable: product.discountable,
    },
    schema: EditProductSchema,
    configs: configs,
    data: product,
  })

  const { mutateAsync: deleteProduct } = useDeleteProduct(product.id)

  const handleDelete = async () => {
    const res = await prompt({
      title: t("general.areYouSure"),
      description: t("products.deleteWarning", {
        title: product.title,
      }),
      confirmText: t("actions.delete"),
      cancelText: t("actions.cancel"),
    })

    if (!res) {
      return
    }

    await deleteProduct(undefined, {
      onSuccess: () => {
        navigate("..")
      },
    })
  }

  const toggleEdit = () => {
    setIsEditing(!isEditing)
    if (!isEditing) {
      form.reset({
        status: product.status,
        title: product.title,
        material: product.material ?? "",
        subtitle: product.subtitle ?? "",
        handle: product.handle ?? "",
        description: product.description ?? "",
        long_description: product.product_addition?.long_description ?? "",
        discountable: product.discountable,
      })
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>{product.title}</Heading>
        <div className="flex items-center gap-x-4">
          <StatusBadge color={productStatusColor(product.status)}>
            {t(`products.productStatus.${product.status}`)}
          </StatusBadge>
          <ActionMenu
            groups={[
              {
                actions: [
                  {
                    label: isEditing ? t("actions.cancel") : t("actions.edit"),
                    onClick: toggleEdit,
                    icon: <PencilSquare />,
                  },
                ],
              },
              {
                actions: [
                  {
                    label: t("actions.delete"),
                    onClick: handleDelete,
                    icon: <Trash />,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>
      {isEditing ? (
        <EditProductForm
          product={product}
          setIsEditing={setIsEditing}
          toggleEdit={toggleEdit}
          form={form}
        />
      ) : (
        <>
          <SectionRow
            title={t("fields.description")}
            value={product.description}
          />
          <SectionRow
            title={t("fields.long_description", "Long Description")}
            value={
              product.product_addition?.long_description && (
                <div
                  dangerouslySetInnerHTML={{
                    __html: product.product_addition?.long_description,
                  }}
                  className="prose dark:prose-invert"
                />
              )
            }
          />
          <SectionRow title={t("fields.subtitle")} value={product.subtitle} />
          <SectionRow title={t("fields.handle")} value={`/${product.handle}`} />
          <SectionRow title={t("fields.material")} value={product.material} />
          <SectionRow
            title={t("fields.discountable")}
            value={product.discountable ? t("fields.true") : t("fields.false")}
          />
          {displays.map((Component, index) => {
            return <Component key={product.id} data={product} />
          })}
        </>
      )}
    </Container>
  )
}

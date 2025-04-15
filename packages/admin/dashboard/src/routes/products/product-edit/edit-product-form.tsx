import { HttpTypes } from "@8medusa/types"
import { Button, Input, Select, Text, Textarea, toast } from "@8medusa/ui"
import { useTranslation } from "react-i18next"
import * as zod from "zod"
import { SwitchBox } from "../../../components/common/switch-box"
import { Form } from "../../../components/common/form"
import { KeyboundForm } from "../../../components/utilities/keybound-form"
import { FormExtensionZone } from "../../../dashboard-app"
import { useUpdateProduct } from "../../../hooks/api/products"
import { transformNullableFormData } from "../../../lib/form-helpers"
import { useExtension } from "../../../providers/extension-provider"
import { UseFormReturn } from "react-hook-form"
import { RichTextEditor } from "../../../components/rich-text-editor"
import { AdminExtendedProduct } from "../../../types/extended-product.types"

type EditProductFormProps = {
  product: AdminExtendedProduct
  setIsEditing: (isEditing: boolean) => void
  toggleEdit: () => void
  form: UseFormReturn<zod.z.infer<typeof EditProductSchema>>
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

export const EditProductForm = ({
  product,
  setIsEditing,
  toggleEdit,
  form,
}: EditProductFormProps) => {
  const { t } = useTranslation()
  const { getFormFields } = useExtension()

  const fields = getFormFields("product", "edit")

  const { mutateAsync: updateProduct, isPending } = useUpdateProduct(product.id)

  const handleSubmit = form.handleSubmit(async (data) => {
    const { title, discountable, handle, status, ...optional } = data

    const nullableData = transformNullableFormData(optional)
    const dataWithoutLongDescription = {
      ...nullableData,
      long_description: undefined,
      additional_data: {
        product_addition_id: product.product_addition?.id,
        long_description: nullableData.long_description,
      },
    }

    await updateProduct(
      {
        title,
        discountable,
        handle,
        status: status as HttpTypes.AdminProductStatus,
        ...dataWithoutLongDescription,
      },
      {
        onSuccess: ({ product }) => {
          toast.success(
            t("products.edit.successToast", { title: product.title })
          )
          setIsEditing(false)
        },
        onError: (e) => {
          toast.error(e.message)
        },
      }
    )
  })

  return (
    <div className="flex flex-1 flex-col gap-y-6 p-6">
      <Form {...form}>
        <KeyboundForm onSubmit={handleSubmit} className="flex flex-col gap-y-6">
          <div className="flex flex-col gap-y-6">
            <Form.Field
              control={form.control}
              name="status"
              render={({ field: { onChange, ref, ...field } }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.status")}</Form.Label>
                    <Form.Control>
                      <Select {...field} onValueChange={onChange}>
                        <Select.Trigger ref={ref}>
                          <Select.Value />
                        </Select.Trigger>
                        <Select.Content>
                          {(
                            [
                              "draft",
                              "published",
                              "proposed",
                              "rejected",
                            ] as const
                          ).map((status) => {
                            return (
                              <Select.Item key={status} value={status}>
                                {t(`products.productStatus.${status}`)}
                              </Select.Item>
                            )
                          })}
                        </Select.Content>
                      </Select>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="title"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.title")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="subtitle"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.subtitle")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="handle"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.handle")}</Form.Label>
                    <Form.Control>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 z-10 flex w-8 items-center justify-center border-r">
                          <Text
                            className="text-ui-fg-muted"
                            size="small"
                            leading="compact"
                            weight="plus"
                          >
                            /
                          </Text>
                        </div>
                        <Input {...field} className="pl-10" />
                      </div>
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="material"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.material")}</Form.Label>
                    <Form.Control>
                      <Input {...field} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{t("fields.description")}</Form.Label>
                    <Form.Control>
                      <Textarea {...field} rows={5} />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="long_description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label optional>{"Long Description"}</Form.Label>
                    <Form.Control>
                      <RichTextEditor
                        value={field.value ?? ""}
                        onChange={field.onChange}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <SwitchBox
              control={form.control}
              name="discountable"
              label={t("fields.discountable")}
              description={t("products.discountableHint")}
            />
            <FormExtensionZone fields={fields} form={form} />
          </div>
          <div className="flex items-center justify-end gap-x-2">
            <Button size="small" variant="secondary" onClick={toggleEdit}>
              {t("actions.cancel")}
            </Button>
            <Button size="small" type="submit" isLoading={isPending}>
              {t("actions.save")}
            </Button>
          </div>
        </KeyboundForm>
      </Form>
    </div>
  )
}

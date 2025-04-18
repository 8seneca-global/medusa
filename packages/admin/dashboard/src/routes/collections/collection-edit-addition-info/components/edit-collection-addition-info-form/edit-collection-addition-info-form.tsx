import { Button, Switch } from "@medusajs/ui"
import { useTranslation } from "react-i18next"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form } from "../../../../../components/common/form"
import { RouteDrawer } from "../../../../../components/modals"
import { KeyboundForm } from "../../../../../components/utilities/keybound-form"
import { RichTextEditor } from "../../../../../components/rich-text-editor"

const editCollectionAdditionInfoSchema = z.object({
  description: z.string().optional(),
  is_active: z.boolean().optional(),
})

type EditCollectionAdditionInfoFormData = z.infer<
  typeof editCollectionAdditionInfoSchema
>

type EditCollectionAdditionInfoFormProps = {
  id: string
  collection_addition: {
    description?: string
    is_active?: boolean
  }
}

export const EditCollectionAdditionInfoForm = ({
  collection_addition,
  id,
}: EditCollectionAdditionInfoFormProps) => {
  const { t } = useTranslation()

  const form = useForm<EditCollectionAdditionInfoFormData>({
    resolver: zodResolver(editCollectionAdditionInfoSchema),
    defaultValues: {
      description: collection_addition?.description || "",
      is_active: collection_addition?.is_active ?? false,
    },
  })

  const onSubmit = form.handleSubmit(async (data) => {
    console.log(data, id)
  })

  return (
    <RouteDrawer.Form form={form}>
      <KeyboundForm onSubmit={onSubmit} className="flex flex-1 flex-col">
        <RouteDrawer.Body>
          <div className="flex flex-col gap-y-4">
            <Form.Field
              control={form.control}
              name="description"
              render={({ field }) => {
                return (
                  <Form.Item>
                    <Form.Label>{t("fields.description")}</Form.Label>
                    <Form.Control>
                      <RichTextEditor
                        value={field.value || ""}
                        onChange={field.onChange}
                      />
                    </Form.Control>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
            <Form.Field
              control={form.control}
              name="is_active"
              render={({ field: { value, onChange, ...field } }) => {
                return (
                  <Form.Item>
                    <div className="flex items-center justify-between">
                      <Form.Label>Active</Form.Label>
                      <Form.Control>
                        <Switch
                          checked={value}
                          onCheckedChange={onChange}
                          {...field}
                        />
                      </Form.Control>
                    </div>
                    <Form.ErrorMessage />
                  </Form.Item>
                )
              }}
            />
          </div>
        </RouteDrawer.Body>
        <RouteDrawer.Footer>
          <div className="flex items-center gap-x-2">
            <RouteDrawer.Close asChild>
              <Button size="small" variant="secondary">
                {t("actions.cancel")}
              </Button>
            </RouteDrawer.Close>
            <Button size="small" type="submit">
              {t("actions.save")}
            </Button>
          </div>
        </RouteDrawer.Footer>
      </KeyboundForm>
    </RouteDrawer.Form>
  )
}

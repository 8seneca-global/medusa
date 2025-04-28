import { XMarkMini } from "@8medusa/icons"
import { Button, Heading, IconButton, Input, Select, Text } from "@8medusa/ui"
import { Fragment, useEffect, useState } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { CollectionConditionSchemaType } from "./collection-condition-schema"
import { Form } from "../../../../../components/common/form"
import { useProductTags } from "../../../../../hooks/api"

type CollectionConditionFormProps = {
  form: UseFormReturn<CollectionConditionSchemaType>
}

export const CollectionConditionForm = ({
  form,
}: CollectionConditionFormProps) => {
  const { t } = useTranslation()
  const [productTags, setProductTags] = useState<
    { value: string; label: string }[]
  >([])

  const { product_tags } = useProductTags()

  useEffect(() => {
    if (product_tags) {
      setProductTags(
        product_tags.map((tag: any) => ({
          value: tag.value,
          label: tag.value,
        }))
      )
    }
  }, [product_tags])

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "conditions",
  })

  const attributes = [
    {
      id: "product.tags",
      value: "product.tags",
      label: t("collection_condition.product_tags"),
      field_type: "select",
      operators: [
        { label: t('collection_condition.equals'), value: "eq" },
        { label: t('collection_condition.contains'), value: "contains" },
      ],
    },
    {
      id: "product.price",
      value: "product.price",
      label: t("collection_condition.product_price"),
      field_type: "number",
      operators: [
        { label:t('collection_condition.equals'), value: "eq" },
        { label: t('collection_condition.greater_than'), value: "gt" },
        { label: t('collection_condition.less_than'), value: "lt" },
        { label: t('collection_condition.less_than_eq'), value: "lte" },
        { label: t('collection_condition.greater_than_eq'), value: "gte" },
      ],
    },
  ]

  return (
    <div className="flex flex-col">
      <Heading level="h2" className="mb-2">
        {t("collection_condition.title")}
      </Heading>

      <Text className="text-ui-fg-subtle txt-small mb-6">
        {t("collection_condition.description")}
      </Text>

      {fields.map((fieldRule: any, index) => {
        const identifier = fieldRule.id

        return (
          <Fragment key={`${fieldRule.id}.${index}.${fieldRule.attribute}`}>
            <div className="bg-ui-bg-subtle border-ui-border-base flex flex-row gap-2 rounded-xl border px-2 py-2">
              <div className="grow">
                <Form.Field
                  name={`conditions.${index}.attribute`}
                  render={({ field }) => {
                    const { onChange, ref, ...fieldProps } = field

                    const existingAttributes =
                      fields?.map((field: any) => field.attribute) || []
                    const attributeOptions =
                      attributes?.filter((attr) => {
                        if (attr.value === fieldRule.attribute) {
                          return true
                        }
                        if (attr.value === "product.price") {
                          return true
                        }
                        return !existingAttributes.includes(attr.value)
                      }) || []

                    return (
                      <Form.Item className="mb-2">
                        <Form.Control>
                          <Select
                            {...fieldProps}
                            onValueChange={(value) => {
                              onChange(value)
                              form.setValue(
                                `conditions.${index}.attribute`,
                                value
                              )
                              form.setValue(`conditions.${index}.operator`, "")
                              form.setValue(`conditions.${index}.values`, [])
                            }}
                          >
                            <Select.Trigger ref={ref} className="bg-ui-bg-base">
                              <Select.Value
                                placeholder={t(
                                  "promotions.form.selectAttribute"
                                )}
                              />
                            </Select.Trigger>

                            <Select.Content>
                              {attributeOptions?.map((c, i) => (
                                <Select.Item
                                  key={`${identifier}-attribute-option-${i}`}
                                  value={c.value}
                                >
                                  <span className="text-ui-fg-subtle">
                                    {c.label}
                                  </span>
                                </Select.Item>
                              ))}
                            </Select.Content>
                          </Select>
                        </Form.Control>
                        <Form.ErrorMessage />
                      </Form.Item>
                    )
                  }}
                />

                <div className="flex gap-2">
                  <Form.Field
                    name={`conditions.${index}.operator`}
                    render={({ field }) => {
                      const { onChange, ref, ...fieldProps } = field

                      const currentAttribute = form.watch(
                        `conditions.${index}.attribute`
                      )
                      const currentAttributeOption = attributes?.find(
                        (attr) => attr.value === currentAttribute
                      )

                      const options =
                        currentAttributeOption?.operators?.map((o, idx) => ({
                          label: o.label,
                          value: o.value,
                          key: `${identifier}-operator-option-${idx}`,
                        })) || []

                      return (
                        <Form.Item className="basis-1/2">
                          <Form.Control>
                            <Select
                              {...fieldProps}
                              disabled={!currentAttribute}
                              onValueChange={(value) => {
                                onChange(value)
                                form.setValue(
                                  `conditions.${index}.operator`,
                                  value
                                )
                              }}
                            >
                              <Select.Trigger
                                ref={ref}
                                className="bg-ui-bg-base"
                              >
                                <Select.Value placeholder="Select Operator" />
                              </Select.Trigger>

                              <Select.Content>
                                {options?.map((c) => (
                                  <Select.Item key={c.key} value={c.value}>
                                    <span className="text-ui-fg-subtle">
                                      {c.label}
                                    </span>
                                  </Select.Item>
                                ))}
                              </Select.Content>
                            </Select>
                          </Form.Control>
                          <Form.ErrorMessage />
                        </Form.Item>
                      )
                    }}
                  />

                  <Form.Field
                    name={`conditions.${index}.values`}
                    render={({ field }) => {
                      const { onChange, ref, ...fieldProps } = field
                      const currentAttribute = form.watch(
                        `conditions.${index}.attribute`
                      )
                      const currentAttributeOption = attributes?.find(
                        (attr) => attr.value === currentAttribute
                      )

                      if (currentAttribute === "product.tags") {
                        return (
                          <Form.Item className="basis-1/2">
                            <Form.Control>
                              <Select
                                {...fieldProps}
                                disabled={!currentAttribute}
                                onValueChange={(value) => {
                                  onChange(value)
                                  form.setValue(
                                    `conditions.${index}.values`,
                                    value
                                  )
                                }}
                              >
                                <Select.Trigger
                                  ref={ref}
                                  className="bg-ui-bg-base"
                                >
                                  <Select.Value placeholder={t('collection_condition.select_tag')} />
                                </Select.Trigger>

                                <Select.Content>
                                  {productTags?.length === 0 ? (
                                    <Select.Item
                                      value="null"
                                      disabled
                                      className="cursor-default active:bg-transparent"
                                    >
                                      <span className="text-ui-fg-subtle">
                                        {`There's no tag existed, please try again`}
                                      </span>
                                    </Select.Item>
                                  ) : (
                                    <>
                                      {productTags?.map((tag) => (
                                        <Select.Item
                                          key={tag.value}
                                          value={tag.value}
                                        >
                                          <span className="text-ui-fg-subtle">
                                            {tag.label}
                                          </span>
                                        </Select.Item>
                                      ))}
                                    </>
                                  )}
                                </Select.Content>
                              </Select>
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )
                      }

                      if (currentAttributeOption?.field_type === "number") {
                        return (
                          <Form.Item className="basis-1/2">
                            <Form.Control>
                              <Input
                                {...fieldProps}
                                type="number"
                                step="0.01"
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value)
                                  onChange(value)
                                  form.setValue(
                                    `conditions.${index}.values`,
                                    value
                                  )
                                }}
                                disabled={!currentAttribute}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )
                      } else {
                        return (
                          <Form.Item className="basis-1/2">
                            <Form.Control>
                              <Input
                                {...fieldProps}
                                ref={ref}
                                onChange={(e) => {
                                  const value = e.target.value
                                  onChange(value)
                                  form.setValue(
                                    `conditions.${index}.values`,
                                    value
                                  )
                                }}
                                disabled={!currentAttribute}
                              />
                            </Form.Control>
                            <Form.ErrorMessage />
                          </Form.Item>
                        )
                      }
                    }}
                  />
                </div>
              </div>

              <div className="size-7 flex-none self-center">
                <IconButton
                  size="small"
                  variant="transparent"
                  className="text-ui-fg-muted"
                  type="button"
                  onClick={() => remove(index)}
                >
                  <XMarkMini />
                </IconButton>
              </div>
            </div>

            {index < fields.length - 1 && (
              <div className="relative px-6 py-3">
                <div className="border-ui-border-strong absolute bottom-0 left-[40px] top-0 z-[-1] w-px bg-[linear-gradient(var(--border-strong)_33%,rgba(255,255,255,0)_0%)] bg-[length:1px_3px] bg-repeat-y"></div>

                <Text size="small" className="text-ui-fg-subtle">
                  {t("promotions.form.and")}
                </Text>
              </div>
            )}
          </Fragment>
        )
      })}

      <div className={fields.length ? "mt-6" : ""}>
        <Button
          type="button"
          variant="secondary"
          className="inline-block"
          onClick={() => {
            append({
              attribute: "",
              operator: "",
              values: [],
            })
          }}
        >
          {t("collection_condition.add")}
        </Button>

        {!!fields.length && (
          <Button
            type="button"
            variant="transparent"
            className="text-ui-fg-muted hover:text-ui-fg-subtle ml-2 inline-block"
            onClick={() => remove()}
          >
            {t('collection_condition.clear_all')}
          </Button>
        )}
      </div>
    </div>
  )
}

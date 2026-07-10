import { useTranslation } from "react-i18next"
import { Filter } from "../../../components/table/data-table"

export const usePromotionTableFilters = () => {
  const { t } = useTranslation()

  const statusFilter: Filter = {
    key: "status",
    label: t("promotions.form.status.label"),
    type: "select",
    multiple: true,
    options: [
      { label: t("promotions.form.status.active.title"), value: "active" },
      { label: t("promotions.form.status.inactive.title"), value: "inactive" },
      { label: t("promotions.form.status.draft.title"), value: "draft" },
    ],
  }

  let filters: Filter[] = [
    statusFilter,
    { label: t("fields.createdAt"), key: "created_at", type: "date" },
    { label: t("fields.updatedAt"), key: "updated_at", type: "date" },
  ]

  return filters
}

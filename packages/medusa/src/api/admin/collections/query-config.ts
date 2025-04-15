export const defaultAdminCollectionFields = [
  "id",
  "title",
  "handle",
  "created_at",
  "updated_at",
  "metadata",
  "description",
  "is_active",
]

export const retrieveTransformQueryConfig = {
  defaults: defaultAdminCollectionFields,
  isList: false,
}

export const listTransformQueryConfig = {
  ...retrieveTransformQueryConfig,
  defaultLimit: 10,
  isList: true,
}

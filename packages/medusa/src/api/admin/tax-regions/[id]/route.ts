import {
  deleteTaxRegionsWorkflow,
  updateTaxRegionsWorkflow,
} from "@8medusa/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"
import { HttpTypes, RemoteQueryFunction } from "@8medusa/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@8medusa/framework/utils"
import { AdminUpdateTaxRegionType } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTaxRegionResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const filters = { id: req.params.id }
  const [taxRegion] = await remoteQuery(
    remoteQueryObjectFromString({
      entryPoint: "tax_region",
      variables: { filters },
      fields: req.queryConfig.fields,
    })
  )

  res.status(200).json({ tax_region: taxRegion })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminUpdateTaxRegionType>,
  res: MedusaResponse<HttpTypes.AdminTaxRegionResponse>
) => {
  const { id } = req.params
  const query = req.scope.resolve<RemoteQueryFunction>(
    ContainerRegistrationKeys.QUERY
  )

  await updateTaxRegionsWorkflow(req.scope).run({
    input: [
      {
        id,
        ...req.validatedBody,
      },
    ],
  })

  const {
    data: [tax_region],
  } = await query.graph(
    {
      entity: "tax_region",
      fields: req.queryConfig.fields,
      filters: { id },
    },
    { throwIfKeyNotFound: true }
  )

  return res.json({ tax_region })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminTaxRegionDeleteResponse>
) => {
  const id = req.params.id

  await deleteTaxRegionsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "tax_region",
    deleted: true,
  })
}

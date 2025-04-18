import { MiddlewareRoute } from "@8medusa/framework/http"
import { maybeApplyLinkFilter } from "@8medusa/framework/http"
import { validateAndTransformQuery } from "@8medusa/framework"
import * as QueryConfig from "./query-config"
import { AdminFulfillmentProvidersParams } from "./validators"

export const adminFulfillmentProvidersRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/fulfillment-providers",
    middlewares: [
      validateAndTransformQuery(
        AdminFulfillmentProvidersParams,
        QueryConfig.listTransformQueryConfig
      ),
      maybeApplyLinkFilter({
        entryPoint: "location_fulfillment_provider",
        resourceId: "fulfillment_provider_id",
        filterableField: "stock_location_id",
      }),
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/fulfillment-providers/:id/options",
    middlewares: [],
  },
]

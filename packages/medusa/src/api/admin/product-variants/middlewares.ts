import { MiddlewareRoute } from "@8medusa/framework/http"
import { validateAndTransformQuery } from "@8medusa/framework"
import * as QueryConfig from "./query-config"
import { AdminGetProductVariantsParams } from "./validators"

export const adminProductVariantRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/product-variants",
    middlewares: [
      validateAndTransformQuery(
        AdminGetProductVariantsParams,
        QueryConfig.listProductVariantQueryConfig
      ),
    ],
  },
]

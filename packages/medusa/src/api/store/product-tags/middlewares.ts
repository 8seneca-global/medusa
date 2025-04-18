import { MiddlewareRoute } from "@8medusa/framework/http"
import { validateAndTransformQuery } from "@8medusa/framework"
import * as QueryConfig from "./query-config"
import { StoreProductTagsParams, StoreProductTagParams } from "./validators"

export const storeProductTagRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/product-tags",
    middlewares: [
      validateAndTransformQuery(
        StoreProductTagsParams,
        QueryConfig.listProductTagConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/product-tags/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreProductTagParams,
        QueryConfig.retrieveProductTagConfig
      ),
    ],
  },
]

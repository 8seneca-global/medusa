import { MiddlewareRoute } from "@8medusa/framework/http"
import { validateAndTransformQuery } from "@8medusa/framework"
import * as QueryConfig from "./query-config"
import { StoreReturnReasonParams } from "./validators"

export const storeReturnReasonRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/return-reasons",
    middlewares: [
      validateAndTransformQuery(
        StoreReturnReasonParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
  },
  {
    method: ["GET"],
    matcher: "/store/return-reasons/:id",
    middlewares: [
      validateAndTransformQuery(
        StoreReturnReasonParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]

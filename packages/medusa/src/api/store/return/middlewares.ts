import { MiddlewareRoute } from "@8medusa/framework/http"
import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@8medusa/framework"
import * as QueryConfig from "./query-config"
import { ReturnsParams, StorePostReturnsReqSchema } from "./validators"

export const storeReturnRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/returns",
    middlewares: [
      validateAndTransformBody(StorePostReturnsReqSchema),
      validateAndTransformQuery(
        ReturnsParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]

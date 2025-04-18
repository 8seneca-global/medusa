import {
  CartCreditLineDTO,
  CreateCartCreditLineDTO,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@8medusa/framework/workflows-sdk"
import { createEntitiesStep } from "../../common/steps/create-entities"

export const createCartCreditLinesWorkflowId = "create-cart-credit-lines"
export const createCartCreditLinesWorkflow = createWorkflow(
  createCartCreditLinesWorkflowId,
  (
    input: WorkflowData<CreateCartCreditLineDTO[]>
  ): WorkflowResponse<CartCreditLineDTO[]> => {
    const creditLines = createEntitiesStep({
      moduleRegistrationName: Modules.CART,
      invokeMethod: "createCreditLines",
      compensateMethod: "deleteCreditLines",
      data: input,
    })

    return new WorkflowResponse(creditLines)
  }
)

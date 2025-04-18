import { Modules } from "@8medusa/framework/utils"
import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@8medusa/framework/workflows-sdk"
import { deleteEntitiesStep } from "../../common/steps/delete-entities"

export const deleteCartCreditLinesWorkflowId = "delete-cart-credit-lines"
export const deleteCartCreditLinesWorkflow = createWorkflow(
  deleteCartCreditLinesWorkflowId,
  (input: WorkflowData<{ id: string[] }>) => {
    deleteEntitiesStep({
      moduleRegistrationName: Modules.CART,
      invokeMethod: "softDeleteCreditLines",
      compensateMethod: "restoreCreditLines",
      data: input.id,
    })

    return new WorkflowResponse(void 0)
  }
)

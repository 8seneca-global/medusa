import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@8medusa/framework/http"

import {
  importProductsWorkflowId,
  waitConfirmationProductImportStepId,
} from "@8medusa/core-flows"
import { IWorkflowEngineService } from "@8medusa/framework/types"
import { Modules, TransactionHandlerType } from "@8medusa/framework/utils"
import { StepResponse } from "@8medusa/framework/workflows-sdk"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const workflowEngineService: IWorkflowEngineService = req.scope.resolve(
    Modules.WORKFLOW_ENGINE
  )
  const transactionId = req.params.transaction_id

  await workflowEngineService.setStepSuccess({
    idempotencyKey: {
      action: TransactionHandlerType.INVOKE,
      transactionId,
      stepId: waitConfirmationProductImportStepId,
      workflowId: importProductsWorkflowId,
    },
    stepResponse: new StepResponse(true),
  })

  res.status(202).json({})
}

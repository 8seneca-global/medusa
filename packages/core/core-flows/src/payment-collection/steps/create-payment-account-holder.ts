import {
  IPaymentModuleService,
  CreateAccountHolderDTO,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

export const createPaymentAccountHolderStepId = "create-payment-account-holder"
/**
 * This step creates the account holder in the payment provider.
 * 
 * @example
 * const accountHolder = createPaymentAccountHolderStep({
 *   provider_id: "pp_stripe_stripe",
 *   context: {
 *     customer: {
 *       id: "cus_123",
 *       email: "example@gmail.com"
 *     }
 *   }
 * })
 */
export const createPaymentAccountHolderStep = createStep(
  createPaymentAccountHolderStepId,
  async (data: CreateAccountHolderDTO, { container }) => {
    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)

    const accountHolder = await service.createAccountHolder(data)

    return new StepResponse(accountHolder, accountHolder)
  },
  async (createdAccountHolder, { container }) => {
    if (!createdAccountHolder) {
      return
    }

    const service = container.resolve<IPaymentModuleService>(Modules.PAYMENT)
    await service.deleteAccountHolder(createdAccountHolder.id)
  }
)

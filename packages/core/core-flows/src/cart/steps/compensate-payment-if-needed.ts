import { createStep, StepResponse } from "@8medusa/framework/workflows-sdk"
import {
  ContainerRegistrationKeys,
  PaymentSessionStatus,
} from "@8medusa/framework/utils"
import { Modules } from "@8medusa/framework/utils"
import { Logger } from "@8medusa/framework/types"
import { IPaymentModuleService } from "@8medusa/framework/types"

/**
 * The payment session's details for compensation.
 */
export interface CompensatePaymentIfNeededStepInput {
  /**
   * The payment to compensate.
   */
  payment_session_id: string
}

export const compensatePaymentIfNeededStepId = "compensate-payment-if-needed"
/**
 * Purpose of this step is to be the last compensation in cart completion workflow.
 * If the cart completion fails, this step tries to cancel or refund the payment.
 *
 * @example
 * const data = compensatePaymentIfNeededStep({
 *   payment_session_id: "pay_123"
 * })
 */
export const compensatePaymentIfNeededStep = createStep(
  compensatePaymentIfNeededStepId,
  async (data: CompensatePaymentIfNeededStepInput, { container }) => {
    const { payment_session_id } = data

    return new StepResponse(payment_session_id)
  },
  async (paymentSessionId, { container }) => {
    if (!paymentSessionId) {
      return
    }

    const logger = container.resolve<Logger>(ContainerRegistrationKeys.LOGGER)
    const paymentModule = container.resolve<IPaymentModuleService>(
      Modules.PAYMENT
    )

    const paymentSession = await paymentModule.retrievePaymentSession(
      paymentSessionId,
      {
        relations: ["payment"],
      }
    )

    if (paymentSession.status === PaymentSessionStatus.AUTHORIZED) {
      try {
        await paymentModule.cancelPayment(paymentSession.id)
      } catch (e) {
        logger.error(
          `Error was thrown trying to cancel payment session - ${paymentSession.id} - ${e}`
        )
      }
    }

    if (
      paymentSession.status === PaymentSessionStatus.CAPTURED &&
      paymentSession.payment?.id
    ) {
      try {
        await paymentModule.refundPayment({
          payment_id: paymentSession.payment.id,
          note: "Refunded due to cart completion failure",
        })
      } catch (e) {
        logger.error(
          `Error was thrown trying to refund payment - ${paymentSession.payment?.id} - ${e}`
        )
      }
    }
  }
)

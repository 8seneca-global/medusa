import {
  GroupCustomerPair,
  ICustomerModuleService,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

export const deleteCustomerGroupCustomersStepId =
  "delete-customer-group-customers"
/**
 * This step removes customers from groups.
 */
export const deleteCustomerGroupCustomersStep = createStep(
  deleteCustomerGroupCustomersStepId,
  async (data: GroupCustomerPair[], { container }) => {
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    await service.removeCustomerFromGroup(data)

    return new StepResponse(void 0, data)
  },
  async (groupPairs, { container }) => {
    if (!groupPairs?.length) {
      return
    }
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    await service.addCustomerToGroup(groupPairs)
  }
)

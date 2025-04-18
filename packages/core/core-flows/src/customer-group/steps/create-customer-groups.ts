import {
  CreateCustomerGroupDTO,
  ICustomerModuleService,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

/**
 * The data to create customer groups.
 */
export type CreateCustomerGroupsStepInput = CreateCustomerGroupDTO[]

export const createCustomerGroupsStepId = "create-customer-groups"
/**
 * This step creates one or more customer groups.
 */
export const createCustomerGroupsStep = createStep(
  createCustomerGroupsStepId,
  async (data: CreateCustomerGroupsStepInput, { container }) => {
    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    const createdCustomerGroups = await service.createCustomerGroups(data)

    return new StepResponse(
      createdCustomerGroups,
      createdCustomerGroups.map(
        (createdCustomerGroups) => createdCustomerGroups.id
      )
    )
  },
  async (createdCustomerGroupIds, { container }) => {
    if (!createdCustomerGroupIds?.length) {
      return
    }

    const service = container.resolve<ICustomerModuleService>(Modules.CUSTOMER)

    await service.deleteCustomers(createdCustomerGroupIds)
  }
)

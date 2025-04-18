import {
  CreateShippingProfileDTO,
  IFulfillmentModuleService,
} from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"
import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

/**
 * The shipping profiles to create.
 */
export type CreateShippingProfilesStepInput = CreateShippingProfileDTO[]

export const createShippingProfilesStepId = "create-shipping-profiles"
/**
 * This step creates one or more shipping profiles.
 */
export const createShippingProfilesStep = createStep(
  createShippingProfilesStepId,
  async (input: CreateShippingProfilesStepInput, { container }) => {
    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    const createdShippingProfiles = await service.createShippingProfiles(input)

    return new StepResponse(
      createdShippingProfiles,
      createdShippingProfiles.map((created) => created.id)
    )
  },
  async (createdShippingProfiles, { container }) => {
    if (!createdShippingProfiles?.length) {
      return
    }

    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.deleteShippingProfiles(createdShippingProfiles)
  }
)

import { StepResponse, createStep } from "@8medusa/framework/workflows-sdk"

import { IInventoryService } from "@8medusa/framework/types"
import { Modules } from "@8medusa/framework/utils"

/**
 * The IDs of the reservations to delete.
 */
export type DeleteReservationsStepInput = string[]

export const deleteReservationsStepId = "delete-reservations"
/**
 * This step deletes one or more reservations.
 */
export const deleteReservationsStep = createStep(
  deleteReservationsStepId,
  async (ids: DeleteReservationsStepInput, { container }) => {
    const service = container.resolve<IInventoryService>(Modules.INVENTORY)

    await service.softDeleteReservationItems(ids)

    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<IInventoryService>(Modules.INVENTORY)

    await service.restoreReservationItems(prevIds)
  }
)

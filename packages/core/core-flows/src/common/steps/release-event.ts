import { Modules } from "@8medusa/framework/utils"
import { createStep } from "@8medusa/framework/workflows-sdk"

export const releaseEventsStepId = "release-events-step"
export const releaseEventsStep = createStep(
  releaseEventsStepId,
  async (input: void, { container, eventGroupId }) => {
    const eventBusService = container.resolve(Modules.EVENT_BUS, {
      allowUnregistered: true,
    })
    if (!eventBusService || !eventGroupId) {
      return
    }

    await eventBusService.releaseGroupedEvents(eventGroupId)
  },
  async (data: void) => {}
)

import {
  CommonEvents,
  moduleEventBuilderFactory,
  Modules,
  NotificationEvents,
} from "@8medusa/framework/utils"

export const eventBuilders = {
  createdNotification: moduleEventBuilderFactory({
    source: Modules.NOTIFICATION,
    action: CommonEvents.CREATED,
    object: "notification",
    eventName: NotificationEvents.NOTIFICATION_CREATED,
  }),
}

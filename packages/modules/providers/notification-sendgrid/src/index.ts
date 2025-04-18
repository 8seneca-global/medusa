import { ModuleProvider, Modules } from "@8medusa/framework/utils"
import { SendgridNotificationService } from "./services/sendgrid"

const services = [SendgridNotificationService]

export default ModuleProvider(Modules.NOTIFICATION, {
  services,
})

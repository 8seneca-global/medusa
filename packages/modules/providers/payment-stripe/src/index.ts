import { ModuleProvider, Modules } from "@8medusa/framework/utils"
import {
  StripeBancontactService,
  StripeBlikService,
  StripeGiropayService,
  StripeIdealService,
  StripeProviderService,
  StripePrzelewy24Service,
} from "./services"

const services = [
  StripeBancontactService,
  StripeBlikService,
  StripeGiropayService,
  StripeIdealService,
  StripeProviderService,
  StripePrzelewy24Service,
]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})

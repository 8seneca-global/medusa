import { ModuleProvider, Modules } from "@8medusa/framework/utils"
import { GithubAuthService } from "./services/github"

const services = [GithubAuthService]

export default ModuleProvider(Modules.AUTH, {
  services,
})

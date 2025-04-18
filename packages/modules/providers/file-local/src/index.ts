import { ModuleProvider, Modules } from "@8medusa/framework/utils"
import { LocalFileService } from "./services/local-file"

const services = [LocalFileService]

export default ModuleProvider(Modules.FILE, {
  services,
})

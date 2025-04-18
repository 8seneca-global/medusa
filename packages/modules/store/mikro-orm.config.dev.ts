import * as entities from "./src/models"
import { defineMikroOrmCliConfig, Modules } from "@8medusa/framework/utils"

export default defineMikroOrmCliConfig(Modules.STORE, {
  entities: Object.values(entities),
})

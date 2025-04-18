import { defineMikroOrmCliConfig, Modules } from "@8medusa/framework/utils"
import * as entities from "./src/models"

export default defineMikroOrmCliConfig(Modules.REGION, {
  entities: Object.values(entities),
})

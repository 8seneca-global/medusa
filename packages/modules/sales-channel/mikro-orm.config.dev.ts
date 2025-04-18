import * as entities from "./src/models"
import { defineMikroOrmCliConfig, Modules } from "@8medusa/framework/utils"

export default defineMikroOrmCliConfig(Modules.SALES_CHANNEL, {
  entities: Object.values(entities),
})

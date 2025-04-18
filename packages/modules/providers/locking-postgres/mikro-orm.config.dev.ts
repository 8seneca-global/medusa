import * as entities from "./src/models"

import { defineMikroOrmCliConfig } from "@8medusa/framework/utils"

export default defineMikroOrmCliConfig("lockingPostgres", {
  entities: Object.values(entities),
})

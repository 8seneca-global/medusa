import { DALUtils } from "@8medusa/framework/utils"
import { Return } from "@models"
import { setFindMethods } from "../utils/base-repository-find"

export class ReturnRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  Return
) {}

setFindMethods(ReturnRepository, Return)

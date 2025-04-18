import { DALUtils } from "@8medusa/framework/utils"
import { Order } from "@models"
import { setFindMethods } from "../utils/base-repository-find"

export class OrderRepository extends DALUtils.mikroOrmBaseRepositoryFactory(
  Order
) {}

setFindMethods(OrderRepository, Order)

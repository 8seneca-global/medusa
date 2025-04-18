import { MedusaService, Module } from "@8medusa/framework/utils"

export default Module("module1", {
  service: class Module1Service extends MedusaService({}) {},
})

import { MedusaService, Module } from "@8medusa/framework/utils"

export const module1 = Module("module1", {
  service: class Module1Service extends MedusaService({}) {},
})

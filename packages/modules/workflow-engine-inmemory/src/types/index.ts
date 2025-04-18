import { ContainerLike } from "@8medusa/framework"
import { Logger } from "@8medusa/framework/types"
import { FlowCancelOptions } from "@8medusa/framework/workflows-sdk"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
}

export type WorkflowOrchestratorCancelOptions = Omit<
  FlowCancelOptions,
  "transaction" | "transactionId" | "container"
> & {
  transactionId: string
  container?: ContainerLike
}

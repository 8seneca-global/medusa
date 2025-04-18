import { SubscriberConfig } from "@8medusa/medusa"

const testEventPayloadHandlerMock = jest.fn()

export default testEventPayloadHandlerMock

export const config: SubscriberConfig = {
  event: "test-event-payload",
}

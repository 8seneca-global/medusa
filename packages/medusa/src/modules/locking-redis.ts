import RedisLockingProvider from "@8medusa/locking-redis"

export * from "@8medusa/locking-redis"

export default RedisLockingProvider
export const discoveryPath = require.resolve("@8medusa/locking-redis")

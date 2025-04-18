import PostgresLockingProvider from "@8medusa/locking-postgres"

export * from "@8medusa/locking-postgres"

export default PostgresLockingProvider
export const discoveryPath = require.resolve("@8medusa/locking-postgres")

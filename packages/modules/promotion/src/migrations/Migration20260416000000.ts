import { Migration } from "@mikro-orm/migrations"

export class Migration20260416000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "promotion" ADD COLUMN IF NOT EXISTS "is_tax_inclusive" boolean NOT NULL DEFAULT false;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(
      `ALTER TABLE IF EXISTS "promotion" DROP COLUMN IF EXISTS "is_tax_inclusive";`
    )
  }
}

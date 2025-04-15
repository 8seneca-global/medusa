import { Migration } from '@mikro-orm/migrations';

export class Migration20250415035045 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product_collection" add column if not exists "description" text not null, add column if not exists "is_active" boolean not null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product_collection" drop column if exists "description", drop column if exists "is_active";`);
  }

}

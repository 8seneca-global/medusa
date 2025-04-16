import { Migration } from '@mikro-orm/migrations';

export class Migration20250415063821 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "product" add column if not exists "collection_position" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "product" drop column if exists "collection_position";`);
  }

}
